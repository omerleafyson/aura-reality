import { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import { dbService } from '../services/db';
import { Reality } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function Search() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [cloudRealities, setCloudRealities] = useState<Reality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.getElementById('global-search')?.focus();
    
    async function loadSearchableRealities() {
      setLoading(true);
      try {
        const publicR = await dbService.getPublicRealities(100);
        let userR: Reality[] = [];
        if (currentUser) {
          userR = await dbService.getUserRealities(currentUser.uid);
        }
        
        const map = new Map<string, Reality>();
        [...publicR, ...userR].forEach(r => map.set(r.id, r));
        setCloudRealities(Array.from(map.values()));
      } catch (e) {
        console.error('Failed to load searchable realities', e);
      } finally {
        setLoading(false);
      }
    }
    loadSearchableRealities();
  }, [currentUser]);

  const allRealities = useMemo(() => {
    const local = storage.getAllRealities();
    const localMap = new Map(local.map(r => [r.id, r]));
    const cloudMap = new Map(cloudRealities.map(r => [r.id, r]));
    return Array.from(new Map([...localMap, ...cloudMap]).values());
  }, [cloudRealities]);

  const results = query.trim() 
    ? allRealities.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) || 
        r.summary.toLowerCase().includes(query.toLowerCase()) ||
        r.prompt.toLowerCase().includes(query.toLowerCase()) ||
        r.entities.some(e => e.name.toLowerCase().includes(query.toLowerCase())) ||
        r.categories.some(c => c.toLowerCase().includes(query.toLowerCase())) ||
        r.events.some(e => e.title.toLowerCase().includes(query.toLowerCase()) || e.explanation.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="w-full flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative mb-12">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-text-tertiary)]" />
        <input 
          id="global-search"
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scenarios, events, timeline..." 
          className="w-full bg-transparent border-b-2 border-[var(--color-border-subtle)] pl-14 pr-4 py-6 text-2xl md:text-4xl text-[var(--color-text-primary)] font-light focus:outline-none focus:border-[var(--color-accent-tertiary)] transition-colors placeholder-[var(--color-text-tertiary)]/50"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-text-tertiary)] animate-spin" />}
      </div>

      {!query.trim() && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-secondary)]">
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {['mars landing', 'roman empire', 'artificial intelligence', 'no internet'].map(term => (
              <button 
                key={term}
                onClick={() => setQuery(term)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-primary)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-focus)] transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {query.trim() && results.length > 0 && (
        <div className="space-y-4">
          {results.map(reality => (
            <Link 
              to={`/reality/${reality.id}`} 
              key={reality.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--color-surface-primary)] border border-transparent hover:border-[var(--color-border-subtle)] group transition-all"
            >
              <div>
                <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent-tertiary)] transition-colors">
                  {reality.title}
                </h4>
                <div className="flex gap-2">
                  {reality.categories.slice(0, 2).map(cat => (
                    <span key={cat} className="text-xs text-[var(--color-text-secondary)]">{cat}</span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && !loading && (
        <div className="py-12 text-center">
          <p className="text-[var(--color-text-secondary)] font-light">
            No realities found for "{query}". 
          </p>
          <button 
            onClick={() => navigate('/', { state: { initialPrompt: query } })}
            className="mt-4 text-[var(--color-accent-tertiary)] font-medium hover:underline"
          >
            Generate this reality instead &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
