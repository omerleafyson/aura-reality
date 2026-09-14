import { useState, useEffect } from 'react';
import { RealityEvent, Reality } from '../../types';
import { X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../services/api';
import { storage } from '../../services/storage';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationSequence } from '../GenerationSequence';

interface Props {
  event?: RealityEvent | null;
  forkType: 'root' | 'event';
  reality: Reality;
  onClose: () => void;
  onGenerated: (newRealityId: string) => void;
}

export function ForkModal({ event, forkType, reality, onClose, onGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || (forkType === 'event' && !event)) return;
    setIsGenerating(true);
    setError(null);
    try {
      const newReality = await api.generateFork(
        reality.id,
        forkType,
        forkType === 'event' ? event!.id : undefined,
        prompt.trim(),
      );
      storage.saveRealityResult(newReality, 'forked');
      onGenerated(newReality.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fork reality.');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isGenerating, onClose]);

  const sourceYear = forkType === 'root' ? (reality.events[0]?.year || 'Start') : event?.year;
  const sourceTitle = forkType === 'root' ? 'Base Reality' : event?.title;
  const sourceExplanation = forkType === 'root' ? reality.prompt : event?.explanation;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[var(--color-background-primary)]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50">
          <span id="modal-title" className="text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)]">
            {forkType === 'root' ? 'Create Root Reality Fork' : 'Create Reality Fork'}
          </span>
          <button
            onClick={onClose}
            aria-label="Close modal"
            disabled={isGenerating}
            className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 relative">
          {isGenerating && <div className="absolute inset-0 z-20"><GenerationSequence /></div>}

          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-text-tertiary)] font-medium mb-1 uppercase tracking-wide">
              {forkType === 'root' ? 'Original Reality' : `Original Event (${sourceYear})`}
            </div>
            <div className="text-[var(--color-text-primary)] font-medium mb-1">{sourceTitle}</div>
            <div className="text-sm text-[var(--color-text-secondary)] font-light">{sourceExplanation}</div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--color-text-primary)]">What happens instead?</label>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              disabled={isGenerating}
              maxLength={500}
              placeholder={forkType === 'root'
                ? 'e.g. What if the original divergence happened differently?'
                : 'e.g. What if reusable rockets failed and governments continued using expendable launch systems?'}
              className="w-full h-32 p-4 bg-[var(--color-background-primary)] border border-[var(--color-border-focus)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] resize-none focus:outline-none focus:border-[var(--color-accent-tertiary)] focus:ring-1 focus:ring-[var(--color-accent-tertiary)] transition-all font-light"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300 font-light leading-relaxed">
              {forkType === 'root'
                ? 'This creates a new branch from the base scenario while keeping the original Reality unchanged.'
                : 'This branches the timeline at the selected event. Earlier events remain unchanged; later events are regenerated.'}
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)]/50 flex justify-end gap-3">
          <button onClick={onClose} disabled={isGenerating} className="px-4 py-2 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || (forkType === 'event' && !event)}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all',
              prompt.trim() && !isGenerating
                ? 'bg-[var(--color-text-primary)] text-[var(--color-background-primary)] hover:bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] cursor-not-allowed',
            )}
          >
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Simulating Fork...</> : <><Sparkles className="w-4 h-4" />Create New Reality</>}
          </button>
        </div>
      </div>
    </div>
  );
}
