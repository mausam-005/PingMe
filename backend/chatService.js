// backend/chatService.js
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Local in-memory store for guest / offline preview
const LOCAL_CHATS = {
  'demo-1': [
    {
      id: 'm-1',
      senderId: 'u1',
      senderName: 'Host',
      type: 'text',
      text: 'Heading to the cafe in 5 mins. Anyone need anything?',
      timeLabel: 'Just now',
    },
  ],
};

const chatListeners = new Set();
function notifyChatListeners(pingId) {
  chatListeners.forEach((fn) => fn(pingId));
}

function formatNow() {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export async function sendChatMessage(pingId, {
  senderId,
  senderName,
  type = 'text', // 'text' | 'image' | 'file'
  text = '',
  mediaUri = null,
  fileName = null,
  fileSize = null,
}) {
  const payload = {
    senderId: senderId || 'guest',
    senderName: senderName || 'You',
    type,
    text,
    mediaUri,
    fileName,
    fileSize,
    timeLabel: formatNow(),
    createdAt: serverTimestamp(),
  };

  try {
    return await addDoc(collection(db, 'pings', pingId, 'messages'), payload);
  } catch (err) {
    if (!LOCAL_CHATS[pingId]) LOCAL_CHATS[pingId] = [];
    const id = 'm-' + Date.now();
    LOCAL_CHATS[pingId].push({ id, ...payload });
    notifyChatListeners(pingId);
    return { id };
  }
}

export function subscribePingChat(pingId, callback) {
  const pushLocal = () => {
    callback([...(LOCAL_CHATS[pingId] || [])]);
  };
  const listener = (changedId) => {
    if (changedId === pingId) pushLocal();
  };
  chatListeners.add(listener);

  try {
    const q = query(
      collection(db, 'pings', pingId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
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
      chatListeners.delete(listener);
      unsub();
    };
  } catch (err) {
    pushLocal();
    return () => {
      chatListeners.delete(listener);
    };
  }
}
