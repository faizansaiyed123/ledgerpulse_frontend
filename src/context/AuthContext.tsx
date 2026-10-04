import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  fbSignOut,
  googleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type FirebaseUser,
} from '../lib/firebase.ts';
import { UserProfile } from '../types/index.ts';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAsDemo: (role?: 'owner' | 'accountant' | 'staff') => void;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<'owner' | 'accountant' | 'staff', UserProfile> = {
  owner: {
    uid: 'demo_user_owner',
    email: 'alex.founder@apexcloud.io',
    displayName: 'Alex Morgan (Owner)',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  accountant: {
    uid: 'usr_sarah_cfo',
    email: 'sarah.cfo@apexcloud.io',
    displayName: 'Sarah Jenkins (Accountant)',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  staff: {
    uid: 'usr_david_dev',
    email: 'david.lead@apexcloud.io',
    displayName: 'David Miller (Staff)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

function profileFromFirebaseUser(user: FirebaseUser): UserProfile {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoUrl: user.photoURL || undefined,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

function friendlyAuthError(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/user-not-found': 'No account was found for this email address.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists with this email address.',
    'auth/weak-password': 'Please choose a stronger password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
  };
  return map[code] || (error instanceof Error ? error.message : fallback);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsDemo(false);
        setCurrentUser(profileFromFirebaseUser(user));
      } else if (!isDemo) {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isDemo]);

  const signInWithGoogle = async () => {
    setError(null);
    setIsDemo(false);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setCurrentUser(profileFromFirebaseUser(result.user));
    } catch (err) {
      const message = friendlyAuthError(err, 'Failed to sign in with Google.');
      setError(message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setIsDemo(false);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setCurrentUser(profileFromFirebaseUser(result.user));
    } catch (err) {
      const message = friendlyAuthError(err, 'Invalid email or password.');
      setError(message);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    setIsDemo(false);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) await updateProfile(result.user, { displayName: name.trim() });
      setCurrentUser(profileFromFirebaseUser(result.user));
    } catch (err) {
      const message = friendlyAuthError(err, 'Failed to create the account.');
      setError(message);
      throw err;
    }
  };

  const signInAsDemo = (role: 'owner' | 'accountant' | 'staff' = 'owner') => {
    setError(null);
    void fbSignOut(auth).catch(() => undefined);
    setIsDemo(true);
    setCurrentUser(DEMO_USERS[role]);
  };

  const signOut = async () => {
    setError(null);
    try {
      await fbSignOut(auth);
    } finally {
      setIsDemo(false);
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      isDemo,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInAsDemo,
      signOut,
      error,
      clearError: () => setError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
