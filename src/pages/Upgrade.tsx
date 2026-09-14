import { Check, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Upgrade() {
  const [loading, setLoading] = useState(false);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (!currentUser) {
      navigate('/settings'); // Prompt to login
      return;
    }
    
    setLoading(true);
    try {
      const { url } = await api.createCheckoutSession();
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error(e);
      alert('Checkout is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const isPro = userData?.subscription?.tier === 'pro';
  const [billingConfigured, setBillingConfigured] = useState<boolean | null>(null);
  const [limits, setLimits] = useState<{ free: number; pro: number } | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { setBillingConfigured(d.billingConfigured); setLimits(d.limits ? { free: d.limits.free, pro: d.limits.pro } : null); })
      .catch(() => setBillingConfigured(false));
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      
      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[var(--color-text-primary)] mb-4 balance-text">
          Explore infinite realities.
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] font-light">
          Upgrade to Aura Reality Pro to unlock deep simulations, larger reality trees, and up to {limits?.pro ?? 100} scenario generations per day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        
        {/* Free Tier */}
        <div className="flex flex-col p-8 rounded-3xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)]">
          <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">Aura Basic</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">For casual exploration.</p>
          <div className="text-3xl font-medium text-[var(--color-text-primary)] mb-8">Free</div>
          
          <ul className="space-y-4 mb-8 flex-1">
            {[`${limits?.free ?? 5} generations per day`, 'Basic reality overviews', 'Short timeline simulations', 'Standard reality tree'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3 text-[var(--color-text-secondary)] text-sm">
                <Check className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          
          <button 
            disabled={loading || isPro || billingConfigured === false}
            onClick={handleUpgrade}
            className="relative z-10 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--color-text-primary)] text-[var(--color-background-primary)] font-medium text-sm hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPro ? 'Current Plan' : billingConfigured === false ? 'Currently Unavailable' : 'Upgrade to Pro'}
          </button>
        </div>

      </div>
    </div>
  );
}
