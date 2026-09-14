import { useState } from 'react';
import { Composer } from '../components/Composer';
import { QuickStart } from '../components/QuickStart';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const modes = ['History', 'Future', 'Technology', 'Society', 'Business', 'Science', 'Personal'];

export function Home() {
  const [activeMode, setActiveMode] = useState('History');

  return (
    <div className="w-full flex-1 flex flex-col items-center pt-16 md:pt-24 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Composer mode={activeMode} />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
      >
        {modes.map(mode => (
          <button 
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={cn(
              "text-xs font-medium px-4 py-2 rounded-full border transition-all",
              activeMode === mode
                ? "bg-[var(--color-text-primary)] text-[var(--color-background-primary)] border-[var(--color-text-primary)]"
                : "border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-focus)]"
            )}
          >
            {mode}
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full"
      >
        <QuickStart />
      </motion.div>
    </div>
  );
}
