// backend/friendService.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Search users by username ────────────────────────────────────────────────
export async function searchUsersByUsername(usernameQuery) {
  if (!usernameQuery || usernameQuery.length < 2) return [];
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '>=', usernameQuery.toLowerCase()),
      where('username', '<=', usernameQuery.toLowerCase() + '\uf8ff'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    return [];
  }
}

// ─── Send a friend request ────────────────────────────────────────────────────
export async function sendFriendRequest(senderId, receiverId) {
  const existing = query(
    collection(db, 'friendRequests'),
    where('senderId', '==', senderId),
    where('receiverId', '==', receiverId)
  );
  const snap = await getDocs(existing);
  if (!snap.empty) throw new Error('Request already sent');

  return addDoc(collection(db, 'friendRequests'), {
    senderId,
    receiverId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

// ─── Accept a friend request ──────────────────────────────────────────────────
export async function acceptFriendRequest(requestId, senderId, receiverId) {
  const ref = doc(db, 'friendRequests', requestId);
  await updateDoc(ref, { status: 'accepted' });

  const userIds = [senderId, receiverId].sort();
  await addDoc(collection(db, 'friendships'), {
    userIds,
    user1: userIds[0],
    user2: userIds[1],
    createdAt: serverTimestamp(),
  });
}

// ─── Reject / cancel a friend request ────────────────────────────────────────
export async function rejectFriendRequest(requestId) {
  return deleteDoc(doc(db, 'friendRequests', requestId));
}

// ─── Remove a friend ──────────────────────────────────────────────────────────
export async function removeFriend(userId, friendId) {
  const userIds = [userId, friendId].sort();
  const q = query(
    collection(db, 'friendships'),
    where('user1', '==', userIds[0]),
    where('user2', '==', userIds[1])
  );
  const snap = await getDocs(q);
  snap.forEach((d) => deleteDoc(d.ref));
}

// ─── Live friend IDs for a user ───────────────────────────────────────────────
export function subscribeFriendIds(userId, callback) {
  if (!userId || userId === 'guest') {
    callback([]);
    return () => {};
  }
  try {
    const q1 = query(collection(db, 'friendships'), where('user1', '==', userId));
    const q2 = query(collection(db, 'friendships'), where('user2', '==', userId));

    let set1 = [], set2 = [];
    const merge = () => callback([...new Set([...set1, ...set2])]);

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        set1 = snap.docs.map((d) => (d.data().user1 === userId ? d.data().user2 : d.data().user1));
        merge();
      },
      () => callback([])
    );
    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        set2 = snap.docs.map((d) => (d.data().user1 === userId ? d.data().user2 : d.data().user1));
        merge();
      },
      () => callback([])
    );

    return () => { unsub1(); unsub2(); };
  } catch (err) {
    callback([]);
    return () => {};
  }
}

// ─── Live incoming requests ───────────────────────────────────────────────────
export function subscribeIncomingRequests(userId, callback) {
  if (!userId || userId === 'guest') {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => callback([])
    );
  } catch (err) {
    callback([]);
    return () => {};
  }
}

// ─── Live outgoing requests ───────────────────────────────────────────────────
export function subscribeOutgoingRequests(userId, callback) {
  if (!userId || userId === 'guest') {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', userId),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => callback([])
    );
  } catch (err) {
    callback([]);
    return () => {};
  }
}

// ─── Get user profile by UID ──────────────────────────────────────────────────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
  } catch (err) {
    return null;
  }
}
