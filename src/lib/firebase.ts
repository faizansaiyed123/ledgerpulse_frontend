import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

// The public website and browser-local demo must remain usable without Firebase.
// Real account sign-in is enabled only when the complete web configuration exists.
export const app: FirebaseApp | null = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

function requireAuth(instance: Auth | null): Auth {
  if (!instance) {
    throw new Error(
      "Firebase Authentication is not configured. Configure the Firebase web settings to use account sign-in, or launch the browser-local demo.",
    );
  }
  return instance;
}

export function onAuthStateChanged(
  instance: Auth | null,
  next: (user: FirebaseUser | null) => void,
): () => void {
  if (!instance) {
    next(null);
    return () => undefined;
  }
  return firebaseOnAuthStateChanged(instance, next);
}

export function fbSignOut(instance: Auth | null): Promise<void> {
  return instance ? firebaseSignOut(instance) : Promise.resolve();
}

export function createUserWithEmailAndPassword(
  instance: Auth | null,
  email: string,
  password: string,
): Promise<UserCredential> {
  return firebaseCreateUserWithEmailAndPassword(
    requireAuth(instance),
    email,
    password,
  );
}

export function signInWithEmailAndPassword(
  instance: Auth | null,
  email: string,
  password: string,
): Promise<UserCredential> {
  return firebaseSignInWithEmailAndPassword(
    requireAuth(instance),
    email,
    password,
  );
}

export function signInWithPopup(
  instance: Auth | null,
  provider: GoogleAuthProvider,
): Promise<UserCredential> {
  return firebaseSignInWithPopup(requireAuth(instance), provider);
}

export { updateProfile };
export type { FirebaseUser };
