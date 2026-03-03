/**
 * Safe Firebase wrapper to handle null Firebase instances gracefully
 * This ensures the app works even when Firebase is not properly configured
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  setDoc,
  serverTimestamp,
  startAfter,
  increment
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Type-safe wrapper functions
export const safeCollection = (path: string, ...pathSegments: string[]) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return collection(db, path, ...pathSegments);
};

export const safeDoc = (path: string, ...pathSegments: string[]) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return doc(db, path, ...pathSegments);
};

export const safeGetDocs = async (queryRef: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return getDocs(queryRef);
};

export const safeGetDoc = async (docRef: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return getDoc(docRef);
};

export const safeAddDoc = async (collectionRef: any, data: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return addDoc(collectionRef, data);
};

export const safeUpdateDoc = async (docRef: any, data: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return updateDoc(docRef, data);
};

export const safeDeleteDoc = async (docRef: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return deleteDoc(docRef);
};

export const safeSetDoc = async (docRef: any, data: any, options?: any) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return setDoc(docRef, data, options);
};

export const safeOnSnapshot = (queryRef: any, callback: any) => {
  if (!db) {
    console.warn('Firebase not available - onSnapshot not active');
    return () => {}; // Return empty unsubscribe function
  }
  return onSnapshot(queryRef, callback);
};

export const safeQuery = (collectionRef: any, ...constraints: any[]) => {
  if (!db) {
    throw new Error('Firebase not available - running in demo mode');
  }
  return query(collectionRef, ...constraints);
};

// Storage wrappers
export const safeStorageRef = (path: string) => {
  if (!storage) {
    throw new Error('Firebase Storage not available - running in demo mode');
  }
  return ref(storage, path);
};

export const safeUploadBytesResumable = (storageRef: any, file: any, metadata?: any) => {
  if (!storage) {
    throw new Error('Firebase Storage not available - running in demo mode');
  }
  return uploadBytesResumable(storageRef, file, metadata);
};

export const safeGetDownloadURL = async (storageRef: any) => {
  if (!storage) {
    throw new Error('Firebase Storage not available - running in demo mode');
  }
  return getDownloadURL(storageRef);
};

export const safeDeleteObject = async (storageRef: any) => {
  if (!storage) {
    throw new Error('Firebase Storage not available - running in demo mode');
  }
  return deleteObject(storageRef);
};

// Re-export Firestore functions for convenience
export { 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  startAfter, 
  increment 
};

// Check if Firebase is available
export const isFirebaseAvailable = () => {
  return !!(db && storage);
};

// Mock data generators for demo mode
export const generateMockData = <T>(generator: () => T, count: number = 5): T[] => {
  return Array.from({ length: count }, generator);
};

export const createMockQueryResult = <T>(data: T[]) => {
  return {
    docs: data.map((item, index) => ({
      id: `mock_${index}`,
      data: () => item,
      exists: true,
      ref: { id: `mock_${index}` }
    })),
    empty: data.length === 0,
    size: data.length
  };
}; 