// backend/profileService.js
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from './firebase';

// ─── Update user profile in Firestore + Firebase Auth ────────────────────────
export async function updateUserProfile(uid, { name, username, bio, photoURL }) {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (username !== undefined) updates.username = username.toLowerCase();
  if (bio !== undefined) updates.bio = bio;
  if (photoURL !== undefined) updates.photoURL = photoURL;

  if (uid === 'guest' || !auth?.currentUser) {
    return updates;
  }

  try {
    await updateDoc(doc(db, 'users', uid), updates);
    if ((name || photoURL) && auth?.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: name || auth.currentUser.displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });
    }
  } catch (err) {
    console.warn('Profile sync skipped:', err?.message);
  }
  return updates;
}

// ─── Get a user's profile ─────────────────────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
  } catch (err) {
    return null;
  }
}
