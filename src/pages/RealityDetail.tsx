import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RealityHeader } from '../components/reality/RealityHeader';
import { RealityOverview } from '../components/reality/RealityOverview';
import { RealityTimeline } from '../components/reality/RealityTimeline';
import { RealityImpacts } from '../components/reality/RealityImpacts';
import { RealityEntities } from '../components/reality/RealityEntities';
import { RealityTreePreview } from '../components/reality/RealityTreePreview';
import { ForkModal } from '../components/reality/ForkModal';
import { RealityEvent, Reality } from '../types';
import { storage } from '../services/storage';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Search, Lock } from 'lucide-react';
import { api, recordView } from '../services/api';

export function RealityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [reality, setReality] = useState<Reality | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [forkEvent, setForkEvent] = useState<RealityEvent | null>(null);
  const [isForkingOriginal, setIsForkingOriginal] = useState(false);

  useEffect(() => {
    async function loadReality() {
      if (!id || authLoading) return;
      
      try {
        setLoading(true);
        setAccessDenied(false);
        // Try Cloud DB first
        const cloudReality = await dbService.getReality(id).catch(() => null);
        
        if (cloudReality) {
          setReality(cloudReality);
          document.title = `${cloudReality.title} - Aura Reality`;
          if (cloudReality.visibility !== 'private') {
            recordView(cloudReality.id);
          }
        } else {
          const localReality = storage.getReality(id);
          if (localReality) {
            setReality(localReality);
            document.title = `${localReality.title} - Aura Reality`;
          } else {
            setAccessDenied(true);
          }
        }
      } catch (err: any) {
        console.error('Error loading reality', err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    }
    
    loadReality();
    window.scrollTo(0, 0);
  }, [id, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">Loading reality...</div>
      </div>
    );
  }

  if (accessDenied || !reality) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-6">
          {accessDenied ? (
            <Lock className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          ) : (
            <Search className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          )}
        </div>
        <h2 className="text-2xl font-medium text-[var(--color-text-primary)] mb-2">
          {accessDenied ? 'Private Reality' : 'Reality Not Found'}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
          {accessDenied 
            ? 'This reality is private or you do not have permission to view it.' 
            : 'The requested reality could not be found. It may have been removed or never existed.'}
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-full border border-[var(--color-border-focus)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleForkGenerated = (newRealityId: string) => {
    setForkEvent(null);
    setIsForkingOriginal(false);
    navigate(`/reality/${newRealityId}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
    >
      <RealityHeader 
        reality={reality} 
        onFork={() => setIsForkingOriginal(true)} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2">
          <RealityOverview reality={reality} />
          <RealityTimeline 
            events={reality.events} 
            onForkEvent={(evt) => setForkEvent(evt)} 
          />
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-12">
          <RealityTreePreview reality={reality} />
          <RealityImpacts impacts={reality.impacts} />
          <RealityEntities entities={reality.entities} />
        </div>
      </div>

      {/* Fork Modal for specific event */}
      {forkEvent && (
        <ForkModal
          reality={reality}
          forkType="event"
          event={forkEvent}
          onClose={() => setForkEvent(null)}
          onGenerated={handleForkGenerated}
        />
      )}

      {/* Fork Modal for the base/root reality. No synthetic event ID is used. */}
      {isForkingOriginal && (
        <ForkModal
          reality={reality}
          forkType="root"
          onClose={() => setIsForkingOriginal(false)}
          onGenerated={handleForkGenerated}
        />
      )}

    </motion.div>
  );
}
