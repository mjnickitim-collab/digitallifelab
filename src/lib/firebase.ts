import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from 'firebase/firestore';
// User's custom Firebase configuration for project 'blog-5ba51'
const customFirebaseConfig = {
  apiKey: "AIzaSyDdJyzOX3NxoPTHB7OYK2xCnaz9hhNLPNs",
  authDomain: "blog-5ba51.firebaseapp.com",
  projectId: "blog-5ba51",
  storageBucket: "blog-5ba51.firebasestorage.app",
  messagingSenderId: "590374245089",
  appId: "1:590374245089:web:f516eac6ac9b9af9161da0",
  measurementId: "G-3YEQ4Q5H5L"
};

// Initialize Firebase with blog-5ba51 configuration
const app = getApps().length > 0 ? getApp() : initializeApp(customFirebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore (default database for blog-5ba51)
export const db = getFirestore(app);

export const loginWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export {
  onAuthStateChanged,
  type User,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
};

