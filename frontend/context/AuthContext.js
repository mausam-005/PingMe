import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../../backend/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { registerForPushNotifications } from '../../backend/notificationService';

const AuthContext = createContext(null);

const DEMO_USER = {
  uid: 'guest',
  displayName: 'Guest',
  email: 'guest@pingme.app',
};

const DEMO_PROFILE = {
  uid: 'guest',
  name: 'Guest',
  username: 'guest',
  email: 'guest@pingme.app',
  bio: '',
  photoURL: null,
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isGuestRef            = useRef(false);

  const loadProfile = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const data = snap.exists() ? snap.data() : null;
      setProfile(data);
      return data;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const fallbackTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1200);

    let unsub = () => {};
    try {
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return;
        if (firebaseUser) {
          isGuestRef.current = false;
          setUser(firebaseUser);
          await loadProfile(firebaseUser.uid);
          registerForPushNotifications(firebaseUser.uid);
        } else if (!isGuestRef.current) {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    } catch (err) {
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      unsub();
    };
  }, []);

  const loginAsDemo = () => {
    isGuestRef.current = true;
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setLoading(false);
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    isGuestRef.current = false;
    await loadProfile(cred.user.uid);
    registerForPushNotifications(cred.user.uid);
    return cred;
  };

  const register = async (email, password, name, username) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    isGuestRef.current = false;
    await updateProfile(cred.user, { displayName: name });

    const userDoc = {
      uid: cred.user.uid,
      name,
      username: username.toLowerCase(),
      email,
      photoURL: null,
      bio: '',
      expoPushToken: null,
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), userDoc);
    } catch (e) {}
    setProfile(userDoc);
    registerForPushNotifications(cred.user.uid);
    return cred;
  };

  const logout = async () => {
    isGuestRef.current = false;
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setProfile(null);
  };

  const updateLocalProfile = (updates) => {
    setProfile((prev) => ({ ...(prev || DEMO_PROFILE), ...updates }));
  };

  const refreshProfile = () => {
    if (user?.uid && user.uid !== 'guest') {
      loadProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      register,
      logout,
      loginAsDemo,
      refreshProfile,
      updateLocalProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
