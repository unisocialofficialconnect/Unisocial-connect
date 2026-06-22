import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        try {
          const userRef = doc(db, 'users', currUser.uid);
          
          unsubscribeProfile = onSnapshot(userRef, async (snap) => {
            if (snap.exists()) {
              setProfile(snap.data());
            } else {
              // Create profile
              const newProfile = {
                id: currUser.uid,
                name: currUser.displayName || 'Usuário',
                handle: `@${(currUser.displayName || 'user').toLowerCase().replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`,
                avatar: currUser.photoURL || `https://i.pravatar.cc/150?u=${currUser.uid}`,
                verified: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              await setDoc(userRef, newProfile);
            }
          }, (error) => {
             handleFirestoreError(error, OperationType.GET, 'users');
          });
          
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
