import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { generateReality, generateFork } from './server/realityEngine.js';
import { adminAuth, adminDb } from './server/admin.js';
import Stripe from 'stripe';
import { DocumentReference, FieldValue } from 'firebase-admin/firestore';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PORT = Number(process.env.PORT || 3000);
const ANON_COOKIE = 'aura_anon_session';
const ANON_TTL_MS = 24 * 60 * 60 * 1000;

const LIMITS = {
  anonymous: Number(process.env.ANON_GENERATION_LIMIT || 2),
  free: Number(process.env.FREE_GENERATION_LIMIT || 5),
  pro: Number(process.env.PRO_GENERATION_LIMIT || 100),
};

const safeInteger = (value: number, fallback: number) => Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
LIMITS.anonymous = safeInteger(LIMITS.anonymous, 2);
LIMITS.free = safeInteger(LIMITS.free, 5);
LIMITS.pro = safeInteger(LIMITS.pro, 100);

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const stripeObjectId = (value: any): string | null => typeof value === 'string' ? value : value?.id || null;

function parseCookie(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    try { acc[key] = decodeURIComponent(value); } catch { acc[key] = value; }
    return acc;
  }, {} as Record<string, string>);
}

async function resolveStripeUserRef(customerId: string | null, userIdHint?: string | null) {
  if (userIdHint) {
    const ref = adminDb.collection('users').doc(userIdHint);
    const snap = await ref.get();
    if (snap.exists) return ref;
  }
  if (!customerId) return null;
  const users = await adminDb.collection('users').where('subscription.stripeCustomerId', '==', customerId).limit(1).get();
  return users.empty ? null : users.docs[0].ref;
}

async function updateSubscriptionFields(userRef: DocumentReference, fields: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) update[`subscription.${key}`] = value;
  }
  if (Object.keys(update).length) await userRef.update(update);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  // Stripe requires the untouched raw body for signature verification.
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req: any, res: any) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('Stripe not configured');

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).send('Invalid webhook signature');
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId || null;
        const customerId = stripeObjectId(session.customer);
        const subscriptionId = stripeObjectId(session.subscription);
        const userRef = await resolveStripeUserRef(customerId, userId);
        if (userRef) {
          await updateSubscriptionFields(userRef, {
            tier: 'pro',
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = stripeObjectId(subscription.customer);
        const userRef = await resolveStripeUserRef(customerId, subscription.metadata?.userId || null);
        if (userRef) {
          const status = subscription.status;
          const tier = (status === 'active' || status === 'trialing') ? 'pro' : 'free';
          await updateSubscriptionFields(userRef, {
            tier,
            status,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = stripeObjectId(subscription.customer);
        const userRef = await resolveStripeUserRef(customerId, subscription.metadata?.userId || null);
        if (userRef) {
          await updateSubscriptionFields(userRef, {
            tier: 'free',
            status: 'canceled',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = stripeObjectId(invoice.customer);
        const userRef = await resolveStripeUserRef(customerId, null);
        if (userRef) {
          await updateSubscriptionFields(userRef, {
            tier: 'free',
            status: 'past_due',
            stripeCustomerId: customerId,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook processing failed', error);
      res.status(500).send('Internal Error');
    }
  });

  app.use(express.json({ limit: '32kb' }));

  // A random HttpOnly cookie gives anonymous generations a stable owner for forking.
  app.use((req: any, res: any, next: any) => {
    const cookies = parseCookie(req.headers.cookie);
    let token = cookies[ANON_COOKIE];
    if (!token || token.length < 32) {
      token = crypto.randomBytes(32).toString('hex');
      res.cookie(ANON_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    req.anonSessionId = hash(token).slice(0, 40);
    next();
  });

  app.get('/api/config', (_req: any, res: any) => {
    res.json({
      billingConfigured: !!stripe && !!process.env.STRIPE_PRICE_ID_PRO,
      price: process.env.PRO_PRICE_DISPLAY || null,
      limits: LIMITS,
    });
  });

  // Optional auth: attaches a verified user when a Bearer token exists.
  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      req.user = await adminAuth.verifyIdToken(token);
      next();
    } catch {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' } });
    }
  };

  const requestIp = (req: any) => String(req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown');
  const quotaDate = () => new Date().toISOString().split('T')[0];
  const quotaLimit = (isAnonymous: boolean, isPro: boolean) => isAnonymous ? LIMITS.anonymous : (isPro ? LIMITS.pro : LIMITS.free);
  const quotaDoc = (userId: string, isAnonymous: boolean, ip: string) => {
    const date = quotaDate();
    const key = isAnonymous ? `anon_${hash(ip).slice(0, 32)}_${date}` : `${userId}_${date}`;
    return adminDb.collection('usage').doc(key);
  };

  const incrementQuota = async (userId: string, isAnonymous: boolean, isPro: boolean, ip: string) => {
    const usageRef = quotaDoc(userId, isAnonymous, ip);
    const limit = quotaLimit(isAnonymous, isPro);
    await adminDb.runTransaction(async (t) => {
      const doc = await t.get(usageRef);
      const generations = doc.exists ? Number(doc.data()?.generations || 0) : 0;
      if (generations >= limit) throw new Error('LIMIT_REACHED');
      t.set(usageRef, {
        generations: generations + 1,
        date: quotaDate(),
        kind: isAnonymous ? 'anonymous' : (isPro ? 'pro' : 'free'),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
  };

  const refundQuota = async (userId: string, isAnonymous: boolean, ip: string) => {
    const usageRef = quotaDoc(userId, isAnonymous, ip);
    await adminDb.runTransaction(async (t) => {
      const doc = await t.get(usageRef);
      if (!doc.exists) return;
      const generations = Math.max(0, Number(doc.data()?.generations || 0) - 1);
      t.set(usageRef, { generations, updatedAt: new Date().toISOString() }, { merge: true });
    });
  };

  const getQuotaStatus = async (userId: string, isAnonymous: boolean, isPro: boolean, ip: string) => {
    const snap = await quotaDoc(userId, isAnonymous, ip).get();
    const used = snap.exists ? Number(snap.data()?.generations || 0) : 0;
    const limit = quotaLimit(isAnonymous, isPro);
    return { used, limit, remaining: Math.max(0, limit - used), tier: isAnonymous ? 'anonymous' : (isPro ? 'pro' : 'free') };
  };

  const getProState = async (req: any) => {
    if (!req.user) return false;
    const userDoc = await adminDb.collection('users').doc(req.user.uid).get();
    return userDoc.data()?.subscription?.tier === 'pro' && ['active', 'trialing'].includes(userDoc.data()?.subscription?.status || 'active');
  };

  app.get('/api/usage', requireAuth, async (req: any, res: any) => {
    try {
      const isAnonymous = !req.user;
      const userId = req.user?.uid || 'anonymous';
      const isPro = await getProState(req);
      res.json(await getQuotaStatus(userId, isAnonymous, isPro, requestIp(req)));
    } catch {
      res.status(500).json({ error: { code: 'USAGE_UNAVAILABLE', message: 'Usage information is temporarily unavailable.' } });
    }
  });

  app.post('/api/billing/portal', requireAuth, async (req: any, res: any) => {
    if (!stripe || !req.user) return res.status(400).json({ error: { code: 'BILLING_UNAVAILABLE', message: 'Billing is unavailable.' } });
    try {
      const userDoc = await adminDb.collection('users').doc(req.user.uid).get();
      const customerId = userDoc.data()?.subscription?.stripeCustomerId;
      if (!customerId) return res.status(400).json({ error: { code: 'NO_CUSTOMER', message: 'No billing profile exists.' } });
      const baseUrl = process.env.APP_URL || req.headers.origin || `http://localhost:${PORT}`;
      const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${baseUrl}/settings` });
      res.json({ url: session.url });
    } catch (error) {
      console.error('Billing portal error', error);
      res.status(500).json({ error: { code: 'PORTAL_FAILED', message: 'Billing portal is temporarily unavailable.' } });
    }
  });

  app.post('/api/reality/generate', requireAuth, async (req: any, res: any) => {
    const isAnonymous = !req.user;
    const authorId = req.user?.uid || 'anonymous';
    let quotaIncremented = false;
    const ip = requestIp(req);
    try {
      const { prompt, mode } = req.body || {};
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '' || prompt.length > 500) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Prompt is required (max 500 characters).' } });
      }

      const isPro = await getProState(req);
      try {
        await incrementQuota(authorId, isAnonymous, isPro, ip);
        quotaIncremented = true;
      } catch (error: any) {
        if (error.message === 'LIMIT_REACHED') {
          return res.status(429).json({ error: { code: 'QUOTA_EXCEEDED', message: 'Your generation limit for this cycle has been reached.' } });
        }
        throw error;
      }

      const reality = await generateReality(prompt.trim(), mode || 'History', authorId);

      if (isAnonymous) {
        await adminDb.collection('anonymousRealities').doc(reality.id).set({
          ...reality,
          anonSessionId: req.anonSessionId,
          expiresAt: new Date(Date.now() + ANON_TTL_MS),
        });
      } else {
        await adminDb.collection('realities').doc(reality.id).set(reality);
      }

      res.json({ reality });
    } catch (error: any) {
      console.error('Generation Error', error?.message || error);
      if (quotaIncremented) await refundQuota(authorId, isAnonymous, ip).catch(() => undefined);
      const isProviderQuota = /\b429\b|quota|resource.?exhausted/i.test(error?.message || '');
      const isBusy = /\b503\b|high demand|unavailable/i.test(error?.message || '');
      const message = isProviderQuota
        ? 'The AI provider quota is temporarily exhausted. Your AURA Reality quota was not charged; try again shortly.'
        : isBusy
          ? 'The AI model is currently experiencing high demand. Please try again shortly.'
          : 'Failed to generate reality. Please try again.';
      res.status(isProviderQuota ? 503 : 500).json({ error: { code: isProviderQuota ? 'AI_PROVIDER_QUOTA' : 'GENERATION_FAILED', message } });
    }
  });

  app.post('/api/reality/fork', requireAuth, async (req: any, res: any) => {
    const isAnonymous = !req.user;
    const authorId = req.user?.uid || 'anonymous';
    let quotaIncremented = false;
    const ip = requestIp(req);
    try {
      const { parentRealityId, forkType, forkEventId, newPrompt } = req.body || {};
      if (!parentRealityId || !['root', 'event'].includes(forkType) || !newPrompt || typeof newPrompt !== 'string' || newPrompt.trim() === '' || newPrompt.length > 500) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid fork request.' } });
      }
      if (forkType === 'event' && (!forkEventId || typeof forkEventId !== 'string')) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'A valid fork event is required.' } });
      }

      // First look for a normal cloud Reality. Anonymous trial Realities live in a server-only collection.
      let parentRef = adminDb.collection('realities').doc(parentRealityId);
      let parentSnap = await parentRef.get();
      let parentIsAnonymousTrial = false;
      if (!parentSnap.exists) {
        parentRef = adminDb.collection('anonymousRealities').doc(parentRealityId);
        parentSnap = await parentRef.get();
        parentIsAnonymousTrial = parentSnap.exists;
      }
      if (!parentSnap.exists) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Parent reality not found.' } });
      }

      const parentReality = parentSnap.data() as any;

      // Authorization is enforced on the authoritative server copy.
      if (parentIsAnonymousTrial) {
        if (!isAnonymous || parentReality.anonSessionId !== req.anonSessionId) {
          return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this private reality.' } });
        }
      } else {
        const visibility = parentReality.visibility || (parentReality.isPublic ? 'public' : 'private');
        const isOwner = !!req.user && parentReality.authorId === req.user.uid;
        if (!isOwner && !['public', 'unlisted'].includes(visibility)) {
          return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this private reality.' } });
        }
      }

      let forkEvent = null;
      if (forkType === 'event') {
        forkEvent = Array.isArray(parentReality.events) ? parentReality.events.find((event: any) => event.id === forkEventId) : null;
        if (!forkEvent) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Fork event not found.' } });
      }

      const isPro = await getProState(req);
      try {
        await incrementQuota(authorId, isAnonymous, isPro, ip);
        quotaIncremented = true;
      } catch (error: any) {
        if (error.message === 'LIMIT_REACHED') {
          return res.status(429).json({ error: { code: 'QUOTA_EXCEEDED', message: 'Your generation limit for this cycle has been reached.' } });
        }
        throw error;
      }

      const reality = await generateFork(parentReality, forkType, forkEvent, newPrompt.trim(), authorId);

      if (isAnonymous) {
        await adminDb.collection('anonymousRealities').doc(reality.id).set({
          ...reality,
          anonSessionId: req.anonSessionId,
          expiresAt: new Date(Date.now() + ANON_TTL_MS),
        });
      } else {
        await adminDb.collection('realities').doc(reality.id).set(reality);
      }
      await parentRef.update({ forkCount: FieldValue.increment(1) });

      res.json({ reality });
    } catch (error: any) {
      console.error('Fork Error', error?.message || error);
      if (quotaIncremented) await refundQuota(authorId, isAnonymous, ip).catch(() => undefined);
      const isProviderQuota = /\b429\b|quota|resource.?exhausted/i.test(error?.message || '');
      const isBusy = /\b503\b|high demand|unavailable/i.test(error?.message || '');
      const message = isProviderQuota
        ? 'The AI provider quota is temporarily exhausted. Your AURA Reality quota was not charged; try again shortly.'
        : isBusy
          ? 'The AI model is currently experiencing high demand. Please try again shortly.'
          : 'Failed to generate fork. Please try again.';
      res.status(isProviderQuota ? 503 : 500).json({ error: { code: isProviderQuota ? 'AI_PROVIDER_QUOTA' : 'FORK_FAILED', message } });
    }
  });

  app.post('/api/reality/:id/save', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to save realities.' } });
      const userId = req.user.uid;
      const realityRef = adminDb.collection('realities').doc(id);
      const saveRef = adminDb.collection('users').doc(userId).collection('saved').doc(id);

      await adminDb.runTransaction(async (t) => {
        const realityDoc = await t.get(realityRef);
        if (!realityDoc.exists) throw new Error('NOT_FOUND');
        const data = realityDoc.data()!;
        const canRead = data.visibility === 'public' || data.visibility === 'unlisted' || data.authorId === userId;
        if (!canRead) throw new Error('FORBIDDEN');
        const saveDoc = await t.get(saveRef);
        if (!saveDoc.exists) {
          t.set(saveRef, { savedAt: new Date().toISOString() });
          t.update(realityRef, { savedCount: FieldValue.increment(1) });
        }
      });
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reality not found.' } });
      if (error.message === 'FORBIDDEN') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot save this private reality.' } });
      res.status(500).json({ error: { code: 'SAVE_FAILED', message: 'Failed to save reality.' } });
    }
  });

  app.post('/api/reality/:id/unsave', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to manage saved realities.' } });
      const realityRef = adminDb.collection('realities').doc(id);
      const saveRef = adminDb.collection('users').doc(req.user.uid).collection('saved').doc(id);
      await adminDb.runTransaction(async (t) => {
        const realityDoc = await t.get(realityRef);
        const saveDoc = await t.get(saveRef);
        if (saveDoc.exists) {
          t.delete(saveRef);
          if (realityDoc.exists && Number(realityDoc.data()?.savedCount || 0) > 0) {
            t.update(realityRef, { savedCount: FieldValue.increment(-1) });
          }
        }
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: { code: 'UNSAVE_FAILED', message: 'Failed to remove saved reality.' } });
    }
  });

  app.post('/api/reality/:id/publish', requireAuth, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { visibility } = req.body || {};
      if (!['public', 'unlisted', 'private'].includes(visibility)) {
        return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid visibility value.' } });
      }
      if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Must be logged in to publish.' } });
      const realityRef = adminDb.collection('realities').doc(id);
      const realitySnap = await realityRef.get();
      if (!realitySnap.exists) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reality not found.' } });
      if (realitySnap.data()?.authorId !== req.user.uid) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden.' } });
      await realityRef.update({ visibility, isPublic: visibility === 'public' });
      res.json({ success: true, visibility });
    } catch {
      res.status(500).json({ error: { code: 'PUBLISH_FAILED', message: 'Failed to publish reality.' } });
    }
  });

  app.post('/api/reality/:id/view', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const realityRef = adminDb.collection('realities').doc(id);
      const markerId = hash(`${id}:${req.anonSessionId}:${quotaDate()}`);
      const markerRef = adminDb.collection('viewDedupe').doc(markerId);
      await adminDb.runTransaction(async (t) => {
        const [realitySnap, markerSnap] = await Promise.all([t.get(realityRef), t.get(markerRef)]);
        if (!realitySnap.exists || markerSnap.exists) return;
        if (!['public', 'unlisted'].includes(realitySnap.data()?.visibility)) return;
        t.set(markerRef, { realityId: id, date: quotaDate(), createdAt: new Date().toISOString() });
        t.update(realityRef, { views: FieldValue.increment(1) });
      });
      res.json({ success: true });
    } catch {
      res.json({ success: false });
    }
  });

  app.post('/api/billing/create-checkout-session', requireAuth, async (req: any, res: any) => {
    if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to upgrade.' } });
    if (!stripe || !process.env.STRIPE_PRICE_ID_PRO) return res.status(503).json({ error: { code: 'STRIPE_NOT_CONFIGURED', message: 'Billing is currently unavailable.' } });

    try {
      const userRef = adminDb.collection('users').doc(req.user.uid);
      const userSnap = await userRef.get();
      const existingCustomerId = userSnap.data()?.subscription?.stripeCustomerId || null;
      const baseUrl = process.env.APP_URL || req.headers.origin || `http://localhost:${PORT}`;
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/settings?checkout=success`,
        cancel_url: `${baseUrl}/upgrade`,
        client_reference_id: req.user.uid,
        metadata: { userId: req.user.uid },
        subscription_data: { metadata: { userId: req.user.uid } },
      };
      if (existingCustomerId) params.customer = existingCustomerId;
      else if (req.user.email) params.customer_email = req.user.email;
      const session = await stripe.checkout.sessions.create(params);
      res.json({ url: session.url });
    } catch (error) {
      console.error('Checkout error', error);
      res.status(500).json({ error: { code: 'CHECKOUT_FAILED', message: 'Failed to create checkout session.' } });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
