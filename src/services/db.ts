import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Reality } from '../types';

export const dbService = {
  getReality: async (id: string): Promise<Reality | null> => {
    const docRef = doc(db, 'realities', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Reality;
    }
    return null;
  },
  
  getPublicRealities: async (max: number = 20): Promise<Reality[]> => {
    const q = query(
      collection(db, 'realities'),
      where('visibility', '==', 'public'),
      limit(max)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Reality).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  
  getUserRealities: async (userId: string): Promise<Reality[]> => {
    const q = query(
      collection(db, 'realities'),
      where('authorId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Reality).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getRealityChildren: async (parentId: string): Promise<Reality[]> => {
    const q = query(
      collection(db, 'realities'),
      where('parentRealityId', '==', parentId),
      where('visibility', '==', 'public')
    );
    const querySnapshot = await getDocs(q);
    
    // Also fetch current user's private children if logged in
    let userChildren: Reality[] = [];
    if (auth.currentUser) {
      const q2 = query(
        collection(db, 'realities'),
        where('parentRealityId', '==', parentId),
        where('authorId', '==', auth.currentUser.uid)
      );
      const snap2 = await getDocs(q2);
      userChildren = snap2.docs.map(d => d.data() as Reality);
    }
    
    const combined = new Map([...querySnapshot.docs.map(d => d.data() as Reality), ...userChildren].map(r => [r.id, r]));
    return Array.from(combined.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  
  saveReality: async (realityId: string): Promise<void> => {
    const { api } = await import('./api');
    await api.saveReality(realityId);
  },
  
  unsaveReality: async (realityId: string): Promise<void> => {
    const { api } = await import('./api');
    await api.unsaveReality(realityId);
  },
  
  getSavedRealities: async (userId: string): Promise<string[]> => {
    const savedCol = collection(db, `users/${userId}/saved`);
    const snap = await getDocs(savedCol);
    return snap.docs.map(d => d.id);
  },
  
  migrateLocalToCloud: async (data: { created: Reality[], forked: Reality[], savedIds: string[] }): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;
    
    const allToMigrate = [...data.created, ...data.forked];
    const uniqueToMigrate = Array.from(new Map(allToMigrate.map(r => [r.id, r])).values());

    const batch = uniqueToMigrate.map(async (r) => {
      const docRef = doc(db, 'realities', r.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const migratedReality = { 
          ...r, 
          authorId: user.uid,
          visibility: 'private',
          views: 0,
          forkCount: 0,
          savedCount: 0
        };
        await setDoc(docRef, migratedReality);
      }
    });
    
    await Promise.all(batch);

    if (data.savedIds && data.savedIds.length > 0) {
      const { api } = await import('./api');
      for (const id of data.savedIds) {
        try {
          await api.saveReality(id);
        } catch (e) {
          console.warn('Failed to migrate saved reality', id);
        }
      }
    }
  }
};
