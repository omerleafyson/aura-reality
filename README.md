# AURA REALITY

AURA REALITY is a React/TypeScript + Express web application that generates structured speculative realities with Gemini, stores signed-in user data in Firebase/Firestore, and supports branching Reality Forks.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` (or configure the same variables in your host).
3. Configure the AURA REALITY Firebase project and `GEMINI_API_KEY`.
4. Start development:
   ```bash
   npm run dev
   ```

## Important environment notes

- `GEMINI_API_KEY` is server-side only. Never expose it through `VITE_*` variables or Vite `define`.
- For the standard Firestore database, use `(default)` for the database ID. The client uses the normal default Firestore instance in that case.
- Stripe is optional. Leave all Stripe variables empty to keep billing disabled without blocking the app.
- Generation limits are configurable with `ANON_GENERATION_LIMIT`, `FREE_GENERATION_LIMIT`, and `PRO_GENERATION_LIMIT`.
- The server uses `GEMINI_MODEL` plus `GEMINI_FALLBACK_MODELS`. If the primary Gemini model is capacity/quota limited, configured fallback models are tried before the request fails.

## Build

```bash
npm run lint
npm run build
```

## Security behavior

- Private realities can only be read/forked by their owner.
- Public and unlisted realities can be forked from their authoritative server copy.
- Anonymous trial realities are held in a server-only Firestore collection and bound to an HttpOnly anonymous session cookie so the same visitor can fork them without exposing them publicly.
- Application generation quota is refunded when Gemini/provider generation fails.
- Provider quota errors are reported separately from the user's AURA REALITY quota.
- Subscription entitlements are written only by trusted server/Stripe webhook code.
