'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  try {
    // Attempt to initialize via Firebase App Hosting environment variables
    firebaseApp = initializeApp();
  } catch (e) {
    // Only warn in production because it's normal to use the firebaseConfig to initialize
    // during development
    if (process.env.NODE_ENV === "production") {
      console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
    }
    
    // Guard against empty config during build phase
    if (firebaseConfig && firebaseConfig.apiKey) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      console.warn("Firebase initialization skipped: No configuration options provided.");
      return {
        firebaseApp: null as any,
        auth: null as any,
        firestore: null as any,
        storage: null as any
      };
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) return { firebaseApp: null as any, auth: null as any, firestore: null as any, storage: null as any };
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
