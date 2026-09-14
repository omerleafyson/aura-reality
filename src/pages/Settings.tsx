import { User, Shield, Moon, Monitor, Bell, Sparkles, LogOut, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function Settings() {
  const [billingConfigured, setBillingConfigured] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number; tier: 'anonymous' | 'free' | 'pro' } | null>(null);
  const { currentUser, userData, signIn, signOut } = useAuth();

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setBillingConfigured(d.billingConfigured))
      .catch(() => setBillingConfigured(false));
  }, []);

  useEffect(() => {
    api.getUsage().then(setUsage).catch(() => setUsage(null));
  }, [currentUser?.uid]);

  return (
    <div className="w-full flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-medium tracking-tight text-[var(--color-text-primary)] mb-10">
        Settings
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-2 border-r border-[var(--color-border-subtle)] pr-6">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-sm font-medium">
            <User className="w-4 h-4" /> Account
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium transition-colors">
            <Moon className="w-4 h-4" /> Appearance
          </button>
          <button disabled className="opacity-50 cursor-not-allowed flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium transition-colors">
            <Shield className="w-4 h-4" /> Privacy
          </button>
          <button disabled className="opacity-50 cursor-not-allowed flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-12 pb-24">
          
          <section>
            <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-6">Profile</h2>
            {!currentUser ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)]">
                <p className="text-[var(--color-text-secondary)] mb-6">Sign in to save your realities, sync across devices, and manage your subscription.</p>
                <button 
                  onClick={signIn}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-text-primary)] text-[var(--color-background-primary)] font-medium hover:bg-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in with Google
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 text-center sm:text-left">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-20 h-20 rounded-full border border-[var(--color-border-subtle)]" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-background-tertiary)] flex items-center justify-center text-2xl font-semibold text-white">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">{currentUser.displayName || 'User'}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-4">{currentUser.email}</p>
                </div>
              </div>
            )}
          </section>

          {currentUser && (
            <section>
              <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-6">Subscription</h2>
              <div className="p-6 rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-medium text-[var(--color-text-primary)] uppercase tracking-wider">
                        Aura Reality {userData?.subscription?.tier || 'Free'}
                      </h3>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      You have {usage?.remaining ?? '—'} of {usage?.limit ?? '—'} generations remaining today.
                    </p>
                  </div>
                  {userData?.subscription?.tier === 'pro' ? (
                    billingConfigured ? (
                      <button 
                        onClick={async () => {
                          try {
                            const { api } = await import('../services/api');
                            const { url } = await api.createPortalSession();
                            if (url) window.location.href = url;
                          } catch (e) {
                            alert('Failed to load portal');
                          }
                        }}
                        className="flex items-center gap-2 px-5 py-2 rounded-full border border-[var(--color-border-focus)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-surface-secondary)] transition-colors"
                      >
                        Manage Plan
                      </button>
                    ) : null
                  ) : (
                    <Link to="/upgrade" className="flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-background-primary)] text-sm font-medium hover:bg-white transition-colors">
                      <Sparkles className="w-4 h-4" />
                      Upgrade
                    </Link>
                  )}
                </div>
                <div className="w-full bg-[var(--color-background-primary)] h-2 rounded-full mt-4 overflow-hidden">
                   <div className="bg-[var(--color-accent-primary)] h-full transition-all" style={{ width: usage && usage.limit > 0 ? `${Math.min(100, (usage.used / usage.limit) * 100)}%` : '0%' }}></div>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-medium text-[var(--color-text-primary)] mb-6">Appearance</h2>
            <div className="flex gap-4">
              <button className="flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-[var(--color-accent-tertiary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]">
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Dark Mode</span>
              </button>
              <button disabled className="flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] opacity-50 cursor-not-allowed">
                <Monitor className="w-6 h-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </section>

          {currentUser && (
            <div className="pt-8 border-t border-[var(--color-border-subtle)]">
              <button 
                onClick={signOut}
                className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
