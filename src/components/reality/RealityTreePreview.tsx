import { GitFork, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { Reality } from '../../types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../../services/db';
import { cn } from '../../lib/utils';

function TreeNode({ realityId, currentRealityId, isRoot = false }: { key?: any, realityId: string, currentRealityId: string, isRoot?: boolean }) {
  const [reality, setReality] = useState<Reality | null>(null);
  const [children, setChildren] = useState<Reality[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(realityId === currentRealityId || isRoot);

  useEffect(() => {
    async function load() {
      try {
        const r = await dbService.getReality(realityId);
        setReality(r);
        if (expanded) {
          const c = await dbService.getRealityChildren(realityId);
          setChildren(c);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [realityId, expanded]);

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-tertiary)]" />;
  if (!reality) return <div className="text-xs text-[var(--color-text-tertiary)]">Private/Inaccessible</div>;

  const isCurrent = reality.id === currentRealityId;

  return (
    <div className="flex flex-col items-start w-full relative">
      <div className="flex items-center gap-2 py-2 w-full group">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="p-1 hover:bg-[var(--color-surface-secondary)] rounded shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <Link 
          to={`/reality/${reality.id}`}
          className={cn(
            "text-sm font-medium transition-colors px-3 py-1.5 rounded-md border flex-1 text-left truncate",
            isCurrent 
              ? "bg-[var(--color-surface-secondary)] border-[var(--color-border-focus)] text-[var(--color-text-primary)]" 
              : "border-transparent hover:border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          )}
        >
          {reality.title}
        </Link>
      </div>
      
      {expanded && (
        <div className="pl-6 ml-2.5 border-l border-[var(--color-border-subtle)] w-full flex flex-col gap-1">
          {children.length === 0 && !loading && (
             <div className="text-xs text-[var(--color-text-tertiary)] py-1 pl-3 italic">No public forks</div>
          )}
          {children.map(child => (
            <TreeNode key={child.id} realityId={child.id} currentRealityId={currentRealityId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RealityTreePreview({ reality }: { reality: Reality }) {
  const [rootId, setRootId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function findRoot() {
      let current = reality;
      try {
        while (current.parentRealityId) {
          const parent = await dbService.getReality(current.parentRealityId);
          if (!parent) break;
          current = parent;
        }
        setRootId(current.id);
      } catch (e) {
        setRootId(reality.id); // fallback
      } finally {
        setLoading(false);
      }
    }
    findRoot();
  }, [reality]);

  return (
    <section className="mb-16">
      <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)] mb-6">
        Reality Tree
      </h2>
      <div className="p-6 rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-subtle)] overflow-hidden">
        {loading || !rootId ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-tertiary)]" /></div>
        ) : (
          <TreeNode realityId={rootId} currentRealityId={reality.id} isRoot={true} />
        )}
      </div>
    </section>
  );
}
