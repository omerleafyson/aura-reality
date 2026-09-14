import { RealityEvent } from '../../types';
import { GitFork, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface Props {
  events: RealityEvent[];
  onForkEvent: (event: RealityEvent) => void;
}

export function RealityTimeline({ events, onForkEvent }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)] mb-8">
        Timeline of Events
      </h2>
      <div className="relative border-l border-[var(--color-border-subtle)] ml-4 md:ml-6 space-y-8 pb-4">
        {events.map((event, index) => {
          const isSelected = selectedId === event.id;
          return (
            <div 
              key={event.id} 
              className="relative pl-8 md:pl-12 group cursor-pointer"
              onClick={() => setSelectedId(isSelected ? null : event.id)}
            >
              {/* Timeline Dot */}
              <div className={cn(
                "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full transition-all duration-300 ring-4 ring-[var(--color-background-primary)]",
                isSelected 
                  ? "bg-[var(--color-accent-tertiary)] scale-125 shadow-[0_0_10px_rgba(84,163,255,0.5)]" 
                  : "bg-[var(--color-border-focus)] group-hover:bg-[var(--color-text-secondary)]"
              )}></div>

              <div className={cn(
                "p-5 rounded-2xl border transition-all duration-300",
                isSelected
                  ? "bg-[var(--color-surface-secondary)] border-[var(--color-border-focus)]"
                  : "bg-transparent border-transparent hover:bg-[var(--color-surface-primary)] hover:border-[var(--color-border-subtle)]"
              )}>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-2">
                  <span className="text-xl font-medium text-[var(--color-accent-tertiary)] shrink-0 font-mono tracking-tight">
                    {event.year}
                  </span>
                  <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                    {event.title}
                  </h3>
                </div>
                
                <p className="text-[var(--color-text-secondary)] font-light leading-relaxed mb-4">
                  {event.explanation}
                </p>

                {event.impactIndicators.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.impactIndicators.map(ind => (
                      <span key={ind} className="text-xs font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] px-2 py-1 rounded-sm">
                        {ind}
                      </span>
                    ))}
                  </div>
                )}

                {/* Fork Action (Visible when selected) */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isSelected ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0"
                )}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onForkEvent(event);
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-surface-hover)] border border-[var(--color-border-focus)] px-4 py-2 rounded-full hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background-primary)] transition-all"
                  >
                    <GitFork className="w-4 h-4" />
                    Fork from this moment
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
