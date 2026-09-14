import { Reality } from '../../types';
import { Target } from 'lucide-react';

export function RealityOverview({ reality }: { reality: Reality }) {
  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)] mb-6 flex items-center gap-2">
        <Target className="w-4 h-4" />
        Core Divergence Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reality.overview.map((point, index) => (
          <div 
            key={index} 
            className="p-5 rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] flex items-start gap-4"
          >
            <div className="w-6 h-6 shrink-0 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border-focus)] flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]">
              {index + 1}
            </div>
            <p className="text-[var(--color-text-primary)] font-light leading-relaxed">
              {point}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
