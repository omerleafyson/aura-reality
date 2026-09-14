import { Reality } from '../types';
import { mockRealities } from '../lib/mockData';

const STORAGE_KEYS = {
  REALITIES: 'aura_realities',
  SAVED: 'aura_saved',
  CREATED: 'aura_created',
  FORKED: 'aura_forked',
  PREFERENCES: 'aura_preferences',
};

// Initialize with mock data if empty
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.REALITIES)) {
    const realitiesMap = mockRealities.reduce((acc, reality) => {
      acc[reality.id] = reality;
      return acc;
    }, {} as Record<string, Reality>);
    localStorage.setItem(STORAGE_KEYS.REALITIES, JSON.stringify(realitiesMap));
    
    // Add mock saved realities
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(mockRealities.map(r => r.id)));
  }
};

export const storage = {
  init: initializeStorage,

  getAllRealities: (): Reality[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REALITIES);
    if (!data) return [];
    return Object.values(JSON.parse(data));
  },

  getReality: (id: string): Reality | null => {
    const data = localStorage.getItem(STORAGE_KEYS.REALITIES);
    if (!data) return null;
    const realities = JSON.parse(data);
    return realities[id] || null;
  },

  saveRealityResult: (reality: Reality, type: 'created' | 'forked' = 'created') => {
    const data = localStorage.getItem(STORAGE_KEYS.REALITIES);
    const realities = data ? JSON.parse(data) : {};
    realities[reality.id] = reality;
    localStorage.setItem(STORAGE_KEYS.REALITIES, JSON.stringify(realities));

    // Add to specific list
    const listKey = type === 'created' ? STORAGE_KEYS.CREATED : STORAGE_KEYS.FORKED;
    const listData = localStorage.getItem(listKey);
    const list = listData ? JSON.parse(listData) : [];
    if (!list.includes(reality.id)) {
      list.unshift(reality.id);
      localStorage.setItem(listKey, JSON.stringify(list));
    }
  },

  toggleSaveReality: (id: string): boolean => {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED);
    let saved = data ? JSON.parse(data) : [];
    const isSaved = saved.includes(id);
    
    if (isSaved) {
      saved = saved.filter((savedId: string) => savedId !== id);
    } else {
      saved.unshift(id);
    }
    
    localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(saved));
    return !isSaved;
  },

  isSaved: (id: string): boolean => {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED);
    const saved = data ? JSON.parse(data) : [];
    return saved.includes(id);
  },

  getSavedRealities: (): Reality[] => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED) || '[]');
    const all = storage.getAllRealities();
    return saved.map((id: string) => all.find(r => r.id === id)).filter(Boolean);
  },

  getSavedIds: (): string[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED) || '[]');
  },

  getCreatedRealities: (): Reality[] => {
    const created = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREATED) || '[]');
    const all = storage.getAllRealities();
    return created.map((id: string) => all.find(r => r.id === id)).filter(Boolean);
  },

  getForkedRealities: (): Reality[] => {
    const forked = JSON.parse(localStorage.getItem(STORAGE_KEYS.FORKED) || '[]');
    const all = storage.getAllRealities();
    return forked.map((id: string) => all.find(r => r.id === id)).filter(Boolean);
  },

  clearMigratedLists: () => {
    localStorage.removeItem(STORAGE_KEYS.CREATED);
    localStorage.removeItem(STORAGE_KEYS.FORKED);
  },

  clearAllRealities: () => {
    localStorage.removeItem(STORAGE_KEYS.REALITIES);
    localStorage.removeItem(STORAGE_KEYS.CREATED);
    localStorage.removeItem(STORAGE_KEYS.FORKED);
    localStorage.removeItem(STORAGE_KEYS.SAVED);
  }
};
