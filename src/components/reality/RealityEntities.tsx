import { RealityEntity } from '../../types';
import { Building2, Globe2, Cpu, User } from 'lucide-react';

export function RealityEntities({ entities }: { entities: RealityEntity[] }) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'organization': return <Building2 className="w-4 h-4 text-[var(--color-text-tertiary)]" />;
      case 'region': return <Globe2 className="w-4 h-4 text-[var(--color-text-tertiary)]" />;
      case 'person': return <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />;
      case 'technology': return <Cpu className="w-4 h-4 text-[var(--color-text-tertiary)]" />;
      default: return null;
    }
  };

  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)] mb-6">
        Affected Entities
      </h2>
      <div className="flex flex-col gap-3">
        {entities.map(entity => (
          <div key={entity.id} className="group flex flex-col md:flex-row md:items-center gap-2 md:gap-6 p-4 rounded-xl hover:bg-[var(--color-surface-primary)] border border-transparent hover:border-[var(--color-border-subtle)] transition-colors">
            <div className="flex items-center gap-3 w-48 shrink-0">
              {getIcon(entity.type)}
              <span className="font-medium text-[var(--color-text-primary)]">{entity.name}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-light leading-relaxed">
              {entity.impactDescription}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
