import { Link } from 'react-router-dom';
import { mockRealities } from '../lib/mockData';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

export function QuickStart() {
  return (
    <section className="w-full mt-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-medium text-[var(--color-text-primary)]">
          Explore Scenarios
        </h2>
        <Link to="/explore" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRealities.map((reality, index) => (
          <Link 
            to={`/reality/${reality.id}`} 
            key={reality.id}
            className="group relative flex flex-col h-full bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden hover:border-[var(--color-border-focus)] transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--color-accent-primary)]/5"
          >
            {/* Visual Header Placeholder */}
            <div className="h-32 w-full bg-gradient-to-br from-[var(--color-surface-secondary)] to-[var(--color-background-tertiary)] relative overflow-hidden">
               <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
               {/* Abstract subtle shape */}
               <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[var(--color-accent-primary)]/10 blur-3xl group-hover:bg-[var(--color-accent-primary)]/20 transition-all duration-700"></div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                {reality.categories.slice(0,2).map(cat => (
                  <span key={cat} className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] px-2 py-1 rounded-sm">
                    {cat}
                  </span>
                ))}
              </div>
              
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-accent-tertiary)] transition-colors">
                {reality.title}
              </h3>
              
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 font-light mt-auto">
                {reality.summary}
              </p>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-[var(--color-text-primary)] bg-[var(--color-background-primary)]/50 backdrop-blur p-2 rounded-full">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
