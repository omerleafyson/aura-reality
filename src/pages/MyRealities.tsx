import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Bookmark, GitFork, Sparkles, Folder, Loader2 } from 'lucide-react';
import { storage } from '../services/storage';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Reality } from '../types';

const tabs = [
  { id: 'created', label: 'Created' },
  { id: 'saved', label: 'Saved' },
  { id: 'forked', label: 'Forked' },
];

export function MyRealities() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('created');
  const [realities, setRealities] = useState<Reality[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRealities() {
      if (authLoading) return;
      setLoading(true);

      try {
        if (currentUser) {
          if (activeTab === 'created') {
            const result = await dbService.getUserRealities(currentUser.uid);
            // filter for original (no parent)
            setRealities(result.filter(r => !r.parentRealityId));
          } else if (activeTab === 'forked') {
            const result = await dbService.getUserRealities(currentUser.uid);
            // filter for forks
            setRealities(result.filter(r => r.parentRealityId));
          } else if (activeTab === 'saved') {
            const savedIds = await dbService.getSavedRealities(currentUser.uid);
            const savedRealities = await Promise.all(savedIds.map(id => dbService.getReality(id)));
            setRealities(savedRealities.filter((r): r is Reality => r !== null));
          }
        } else {
          // Fallback to local storage
          switch(activeTab) {
            case 'created':
              setRealities(storage.getCreatedRealities());
              break;
            case 'saved':
              setRealities(storage.getSavedRealities());
              break;
            case 'forked':
              setRealities(storage.getForkedRealities());
              break;
          }
        }
      } catch (e) {
        console.error('Failed to load realities', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRealities();
  }, [activeTab, currentUser, authLoading]);

  return (
    <div className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-medium tracking-tight text-[var(--color-text-primary)]">
          My Library
        </h1>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-text-primary)] text-[var(--color-background-primary)] text-sm font-medium hover:bg-white transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          New Reality
        </Link>
      </div>

      <div className="flex border-b border-[var(--color-border-subtle)] mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-[var(--color-accent-tertiary)] text-[var(--color-text-primary)]" 
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-focus)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-32 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-secondary)]" />
        </div>
      ) : realities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {realities.map(reality => (
            <Link 
              to={`/reality/${reality.id}`} 
              key={reality.id}
              className="flex flex-col p-5 bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] rounded-2xl hover:border-[var(--color-border-focus)] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2 py-1 rounded-sm">
                    {reality.categories[0]}
                  </span>
                </div>
                <div className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  {activeTab === 'saved' ? <Bookmark className="w-4 h-4 fill-current" /> : (activeTab === 'forked' ? <GitFork className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                </div>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                {reality.title}
              </h3>
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>{new Date(reality.createdAt).toLocaleDateString()}</span>
                <span>{reality.forkCount} forks</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-6">
            <Folder className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
            No {activeTab} realities yet
          </h3>
          <p className="text-[var(--color-text-secondary)] font-light max-w-sm mb-8">
            When you generate or interact with realities, they will appear here in your library.
          </p>
          <Link 
            to="/" 
            className="px-6 py-2 rounded-full border border-[var(--color-border-focus)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
          >
            Go Explore
          </Link>
        </div>
      )}
    </div>
  );
}
