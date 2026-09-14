import { Reality, RealityEvent } from '../types';
import { auth } from '../lib/firebase';

const getHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {


  getUsage: async (): Promise<{ used: number; limit: number; remaining: number; tier: 'anonymous' | 'free' | 'pro' }> => {
    const response = await fetch('/api/usage', { headers: await getHeaders() });
    if (!response.ok) throw new Error('Failed to load usage');
    return response.json();
  },

  saveReality: async (id: string): Promise<void> => {
    const response = await fetch(`/api/reality/${id}/save`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to save reality');
  },
  unsaveReality: async (id: string): Promise<void> => {
    const response = await fetch(`/api/reality/${id}/unsave`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to unsave reality');
  },
  generateReality: async (prompt: string, mode: string): Promise<Reality> => {
    const response = await fetch('/api/reality/generate', {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ prompt, mode })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Generation failed');
    }

    const data = await response.json();
    return data.reality;
  },

  generateFork: async (parentRealityId: string, forkType: 'root' | 'event', forkEventId: string | undefined, newPrompt: string): Promise<Reality> => {
    const response = await fetch('/api/reality/fork', {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ parentRealityId, forkType, forkEventId, newPrompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Fork generation failed');
    }

    const data = await response.json();
    return data.reality;
  },
  
  publishReality: async (id: string, visibility: 'public' | 'unlisted' | 'private'): Promise<{ success: boolean, visibility: string }> => {
    const response = await fetch(`/api/reality/${id}/publish`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ visibility })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to publish');
    }
    
    return response.json();
  },
  
  createPortalSession: async (): Promise<{ url: string }> => {
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to create portal session');
    return response.json();
  },
  createCheckoutSession: async (): Promise<{ url: string }> => {
    const response = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: await getHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Checkout failed');
    }
    
    return response.json();
  }
};

export const recordView = async (id: string) => {
  try {
    const sessionKey = `viewed_${id}`;
    if (sessionStorage.getItem(sessionKey)) return;
    
    await fetch(`/api/reality/${id}/view`, { method: 'POST' });
    sessionStorage.setItem(sessionKey, '1');
  } catch (e) {
    // Ignore analytics errors
  }
};
