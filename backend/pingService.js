import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// In-memory store for offline/guest mode (starts empty; created live)
export const SAMPLE_PINGS = [];

// Local listeners so guest / offline mutations immediately reflect in UI
const localListeners = new Set();
function notifyLocalListeners() {
  localListeners.forEach((fn) => fn());
}

// ─── Create a Ping ───────────────────────────────────────────────────────────
export async function createPing({
  ownerId,
  activity,
  emoji,
  description,
  scheduledAt,
  expiresAt,
  timeWindow,
  locationText,
  maxParticipants,
}) {
  const startDate = scheduledAt instanceof Date ? scheduledAt : new Date();
  // Default expiration is 24h if not explicitly provided (no 6h cap)
  const endDate =
    expiresAt instanceof Date
      ? expiresAt
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

  const displayTime = timeWindow || 'Now';

  const newPing = {
    ownerId,
    activity,
    emoji,
    description,
    scheduledAt: Timestamp.fromDate(startDate),
    locationText: locationText || '',
    maxParticipants: maxParticipants || 4,
    participantIds: [ownerId],
    participantNames: ['Host'],
    participantCount: 1,
    time: displayTime,
    timeWindow: displayTime,
    status: 'active',
    expiresAt: Timestamp.fromDate(endDate),
    createdAt: serverTimestamp(),
  };

  try {
    return await addDoc(collection(db, 'pings'), newPing);
  } catch (err) {
    const id = 'p-' + Date.now();
    SAMPLE_PINGS.unshift({ id, ...newPing });
    notifyLocalListeners();
    return { id };
  }
}

// ─── Join a Ping (atomic) ─────────────────────────────────────────────────────
export async function joinPing(pingId, userId) {
  try {
    const ref = doc(db, 'pings', pingId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Ping not found');
      const data = snap.data();
      if (data.participantIds?.includes(userId)) throw new Error('Already joined');
      if (data.participantCount >= data.maxParticipants) throw new Error('Activity is full');
      if (data.status !== 'active') throw new Error('Activity is not active');

      const newCount = (data.participantCount || 0) + 1;
      tx.update(ref, {
        participantIds: arrayUnion(userId),
        participantNames: arrayUnion('You'),
        participantCount: newCount,
        status: newCount >= data.maxParticipants ? 'full' : 'active',
      });
    });
  } catch (err) {
    const local = SAMPLE_PINGS.find((p) => p.id === pingId);
    if (local) {
      if (local.participantIds.includes(userId)) throw new Error('Already joined');
      if (local.participantCount >= local.maxParticipants) throw new Error('Activity is full');
      local.participantIds.push(userId);
      local.participantNames = local.participantNames || [];
      local.participantNames.push('You');
      local.participantCount += 1;
      if (local.participantCount >= local.maxParticipants) local.status = 'full';
      notifyLocalListeners();
      return;
    }
    throw err;
  }
}

// ─── Leave a Ping ─────────────────────────────────────────────────────────────
export async function leavePing(pingId, userId) {
  try {
    const ref = doc(db, 'pings', pingId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Ping not found');
      const data = snap.data();
      if (data.ownerId === userId) throw new Error('Creator cannot leave');
      tx.update(ref, {
        participantIds: arrayRemove(userId),
        participantNames: arrayRemove('You'),
        participantCount: increment(-1),
        status: 'active',
      });
    });
  } catch (err) {
    const local = SAMPLE_PINGS.find((p) => p.id === pingId);
    if (local) {
      local.participantIds = local.participantIds.filter((id) => id !== userId);
      local.participantNames = (local.participantNames || []).filter((n) => n !== 'You');
      local.participantCount = Math.max(1, local.participantCount - 1);
      local.status = 'active';
      notifyLocalListeners();
    }
  }
}

// ─── Close a Ping ─────────────────────────────────────────────────────────────
export async function closePing(pingId) {
  try {
    const ref = doc(db, 'pings', pingId);
    return await updateDoc(ref, { status: 'closed' });
  } catch (err) {
    const local = SAMPLE_PINGS.find((p) => p.id === pingId);
    if (local) {
      local.status = 'closed';
      notifyLocalListeners();
    }
  }
}

// ─── Live feed — active pings ─────────────────────────────────────────────────
export function subscribeFriendsFeed(friendIds, callback) {
  const pushLocal = () =>
    callback([...SAMPLE_PINGS.filter((p) => p.status !== 'closed')]);
  localListeners.add(pushLocal);

  try {
    const q = query(
      collection(db, 'pings'),
      where('status', 'in', ['active', 'full']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          pushLocal();
        } else {
          callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      },
      () => {
        pushLocal();
      }
    );
    return () => {
      localListeners.delete(pushLocal);
      unsub();
    };
  } catch (err) {
    pushLocal();
    return () => {
      localListeners.delete(pushLocal);
    };
  }
}

// ─── My Pings ─────────────────────────────────────────────────────────────────
export function subscribeMyPings(userId, callback) {
  const pushLocal = () => {
    const mine = SAMPLE_PINGS.filter((p) => p.ownerId === userId);
    callback([...mine]);
  };
  localListeners.add(pushLocal);

  try {
    const q = query(
      collection(db, 'pings'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(docs);
      },
      () => {
        pushLocal();
      }
    );
    return () => {
      localListeners.delete(pushLocal);
      unsub();
    };
  } catch (err) {
    pushLocal();
    return () => {
      localListeners.delete(pushLocal);
    };
  }
}

// ─── Pings I joined ───────────────────────────────────────────────────────────
export function subscribeJoinedPings(userId, callback) {
  const pushLocal = () => {
    const joined = SAMPLE_PINGS.filter((p) => p.participantIds?.includes(userId));
    callback([...joined]);
  };
  localListeners.add(pushLocal);

  try {
    const q = query(
      collection(db, 'pings'),
      where('participantIds', 'array-contains', userId),
      limit(20)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(docs);
      },
      () => {
        pushLocal();
      }
    );
    return () => {
      localListeners.delete(pushLocal);
      unsub();
    };
  } catch (err) {
    pushLocal();
    return () => {
      localListeners.delete(pushLocal);
    };
  }
}
