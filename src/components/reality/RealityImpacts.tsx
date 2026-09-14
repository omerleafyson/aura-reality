import { ImpactCategory } from '../../types';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, Maximize2 } from 'lucide-react';

export function RealityImpacts({ impacts }: { impacts: ImpactCategory[] }) {
  const getIcon = (direction: string) => {
    switch (direction) {
      case 'positive': return <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
      case 'negative': return <ArrowDownRight className="w-5 h-5 text-rose-400" />;
      case 'transformative': return <Maximize2 className="w-5 h-5 text-[var(--color-accent-tertiary)]" />;
      default: return <Minus className="w-5 h-5 text-[var(--color-text-tertiary)]" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'extreme': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]';
    }
  };

  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)] mb-6">
        Domain Impact Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {impacts.map(impact => (
          <div key={impact.id} className="p-5 rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getIcon(impact.direction)}
                <span className="font-medium text-[var(--color-text-primary)]">{impact.domain}</span>
              </div>
              <span className={cn("text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-sm border", getLevelColor(impact.level))}>
                {impact.level} impact
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-light leading-relaxed mt-auto">
              {impact.explanation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
