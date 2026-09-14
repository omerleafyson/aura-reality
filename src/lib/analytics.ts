type EventName = 'app_opened' | 'signup_started' | 'signup_completed' | 'reality_generation_started' | 'reality_generated' | 'reality_generation_failed' | 'reality_saved' | 'reality_unsaved' | 'reality_published' | 'reality_shared' | 'fork_started' | 'fork_generated' | 'upgrade_viewed' | 'checkout_started' | 'subscription_started';

export const analytics = {
  track: (eventName: EventName, properties?: Record<string, any>) => {
    // No-op by default unless a provider is configured
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      console.log(`[Analytics] ${eventName}`, properties);
    }
  }
};
