import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function GenerationSequence() {
  const [step, setStep] = useState(0);
  const steps = [
    "Understanding your scenario...",
    "Identifying divergence point...",
    "Mapping causal effects...",
    "Simulating timeline consequences...",
    "Building interactive reality..."
  ];

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStep(currentStep);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background-primary)]/90 backdrop-blur-xl">
      <div className="flex flex-col items-center max-w-md w-full px-6">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 rounded-full border border-[var(--color-border-focus)] animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
           <div className="absolute inset-4 rounded-full border border-[var(--color-accent-secondary)] opacity-50 animate-pulse"></div>
           <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-[var(--color-accent-primary)] to-[var(--color-accent-tertiary)] animate-pulse blur-md"></div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium text-[var(--color-text-primary)] tracking-wide text-center"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
        <div className="w-full bg-[var(--color-surface-secondary)] h-1 rounded-full mt-8 overflow-hidden">
           <motion.div 
              className="h-full bg-[var(--color-accent-secondary)] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.6 }}
           />
        </div>
      </div>
    </div>
  );
}
