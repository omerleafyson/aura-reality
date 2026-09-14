import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { GenerationSequence } from './GenerationSequence';

const placeholders = [
  "What if humans landed on Mars in 1999?",
  "What if the internet had never been invented?",
  "What if the Roman Empire had never fallen?",
  "What if Apple never created the iPhone?"
];

interface Props {
  mode?: string;
}

export function Composer({ mode = 'History' }: Props) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
    setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    
    try {
      const reality = await api.generateReality(prompt.trim(), mode);
      storage.saveRealityResult(reality, 'created');
      navigate(`/reality/${reality.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Reality generation failed. Try again.');
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-[var(--color-text-primary)] mb-8 text-center balance-text">
        What reality do you want to explore?
      </h1>

      <div className="w-full relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-surface-secondary)] via-[var(--color-border-subtle)] to-[var(--color-surface-secondary)] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-[var(--color-surface-primary)] border border-[var(--color-border-focus)] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all focus-within:border-[var(--color-accent-tertiary)]/50 focus-within:ring-1 focus-within:ring-[var(--color-accent-tertiary)]/50">
          
          <div className="relative p-4 md:p-6 pb-2 min-h-[120px]">
            {/* Animated Placeholder overlay */}
            <AnimatePresence mode="wait">
              {!prompt && (
                <motion.div
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-x-4 md:inset-x-6 top-4 md:top-6 text-[var(--color-text-tertiary)] text-lg md:text-xl pointer-events-none font-light"
                >
                  {placeholders[placeholderIndex]}
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              className="w-full bg-transparent text-[var(--color-text-primary)] text-lg md:text-xl resize-none outline-none overflow-y-auto z-10 relative font-light"
              rows={2}
              style={{ minHeight: '60px' }}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 md:p-4 bg-[var(--color-surface-primary)]/50 border-t border-[var(--color-border-subtle)]/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-tertiary)] font-medium tracking-wide uppercase">
                Aura Reality Engine
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300",
                prompt.trim() && !isGenerating
                  ? "bg-[var(--color-text-primary)] text-[var(--color-background-primary)] hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
                  : "bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Reality
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {isGenerating && (
        <GenerationSequence />
      )}
    </div>
  );
}
