import { Reality } from '../../types';
import { Bookmark, Share, GitFork, Globe, Lock, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { dbService } from '../../services/db';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  reality: Reality;
  onFork: () => void;
}

export function RealityHeader({ reality, onFork }: Props) {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [visibility, setVisibility] = useState(reality.visibility || 'private');
  
  const isOwner = currentUser?.uid === reality.authorId;

  useEffect(() => {
    async function checkSaved() {
      if (currentUser) {
        const savedIds = await dbService.getSavedRealities(currentUser.uid);
        setSaved(savedIds.includes(reality.id));
      } else {
        setSaved(storage.isSaved(reality.id));
      }
    }
    checkSaved();
  }, [reality.id, currentUser]);

  const handleSave = async () => {
    try {
      if (currentUser) {
        if (saved) {
          await dbService.unsaveReality(reality.id);
          setSaved(false);
        } else {
          await dbService.saveReality(reality.id);
          setSaved(true);
        }
      } else {
        const isNowSaved = storage.toggleSaveReality(reality.id);
        setSaved(isNowSaved);
      }
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const handlePublish = async (newVisibility: string) => {
    if (!isOwner || isPublishing) return;
    setIsPublishing(true);
    try {
      const result = await api.publishReality(reality.id, newVisibility as any);
      setVisibility(result.visibility as 'public' | 'private' | 'unlisted');
    } catch (e) {
      console.error('Failed to publish', e);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: reality.title,
          text: reality.summary,
          url: url,
        });
      } catch (err) {
        await copyToClipboard(url);
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="w-full border-b border-[var(--color-border-subtle)] pb-8 mb-8 pt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold tracking-wider uppercase text-[var(--color-accent-tertiary)] bg-[var(--color-accent-primary)]/10 px-2 py-1 rounded-sm border border-[var(--color-accent-primary)]/20">
          AI-generated speculative reality
        </span>
        {reality.categories.map(cat => (
          <span key={cat} className="text-xs font-medium tracking-wide text-[var(--color-text-secondary)]">
            • {cat}
          </span>
        ))}
        {isOwner && (
          <select 
            value={visibility}
            onChange={(e) => handlePublish(e.target.value)}
            disabled={isPublishing}
            className="ml-auto text-xs flex items-center gap-1 font-medium px-2 py-1 rounded-sm border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] bg-transparent outline-none cursor-pointer focus:border-[var(--color-border-focus)] disabled:opacity-50"
          >
            <option value="private">🔒 Private</option>
            <option value="unlisted">🔗 Unlisted</option>
            <option value="public">🌍 Public</option>
          </select>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-[var(--color-text-primary)] leading-tight balance-text mb-4">
            {reality.title}
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] font-light leading-relaxed max-w-3xl">
            {reality.summary}
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleSave}
            aria-label={saved ? "Unsave Reality" : "Save Reality"}
            className={cn(
              "p-3 rounded-full border transition-all duration-200",
              saved 
                ? "bg-[var(--color-surface-secondary)] border-[var(--color-text-primary)] text-[var(--color-text-primary)]" 
                : "bg-transparent border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-focus)]"
            )}
          >
            <Bookmark className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={handleShare}
            aria-label="Share Reality"
            className="p-3 rounded-full border border-[var(--color-border-subtle)] bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-focus)] transition-all duration-200"
          >
            {shared ? <Check className="w-5 h-5 text-green-500" /> : <Share className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={onFork}
            className="flex items-center gap-2 px-4 py-3 rounded-full border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-tertiary)] hover:bg-[var(--color-accent-primary)]/20 transition-all duration-200 font-medium text-sm"
          >
            <GitFork className="w-5 h-5" />
            Create Fork
          </button>
        </div>
      </div>
    </div>
  );
}
