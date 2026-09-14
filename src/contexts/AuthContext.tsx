import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, SubscriptionState } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data() as User);
        } else {
          // Initialize new user
          const refCode = sessionStorage.getItem('referral_code');
          const newUser: User = {
            id: user.uid,
            name: user.displayName || 'Anonymous User',
            email: user.email || '',
            avatarUrl: user.photoURL || undefined,
          };
          
          const dbData = {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          if (refCode) {
            (dbData as any).referredBy = refCode;
            sessionStorage.removeItem('referral_code');
          }

          await setDoc(userRef, dbData);
          setUserData(newUser);
        }
        
        // Migrate local realities if any
        try {
          const { storage } = await import('../services/storage');
          const { dbService } = await import('../services/db');
          
          const localCreated = storage.getCreatedRealities();
          const localForked = storage.getForkedRealities();
          const savedIds = storage.getSavedIds();
          
          if (localCreated.length > 0 || localForked.length > 0 || savedIds.length > 0) {
            await dbService.migrateLocalToCloud({ created: localCreated, forked: localForked, savedIds });
            // Only clear the ownership lists after every migration operation has completed.
            // Saved IDs remain cached locally as a fallback.
            storage.clearMigratedLists();
          }
        } catch (e) {
          console.error('Migration failed:', e);
        }
        
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const { signInWithGoogle } = await import('../lib/firebase');
    await signInWithGoogle();
  };

  const signOutUser = async () => {
    const { logOut } = await import('../lib/firebase');
    await logOut();
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
