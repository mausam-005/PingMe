// src/services/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize app safely (avoid re-initialization on fast refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Clean universal AsyncStorage persistence for React Native without dual-module conflicts
const createAsyncStoragePersistence = (storage) => {
  return class {
    static type = 'LOCAL';
    type = 'LOCAL';
    async _isAvailable() {
      if (!storage) return false;
      try {
        await storage.setItem('firebase:available', '1');
        await storage.removeItem('firebase:available');
        return true;
      } catch {
        return false;
      }
    }
    _set(key, value) {
      return storage.setItem(key, JSON.stringify(value));
    }
    async _get(key) {
      const val = await storage.getItem(key);
      return val ? JSON.parse(val) : null;
    }
    _remove(key) {
      return storage.removeItem(key);
    }
    _addListener() {}
    _removeListener() {}
  };
};

let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: createAsyncStoragePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }
} catch (e) {
  try {
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase Auth fallback initialized:', err?.message);
  }
}

export const db = getFirestore(app);
export { auth };
export default app;
