// src/hooks/usePings.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeFriendsFeed, subscribeMyPings, subscribeJoinedPings } from '../../backend/pingService';

export function useFriendsFeed(friendIds) {
  const [pings, setPings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = Array.isArray(friendIds) && friendIds.length > 0 ? friendIds : [];
    const unsub = subscribeFriendsFeed(ids, (data) => {
      setPings(data);
      setLoading(false);
    });
    return unsub;
  }, [JSON.stringify(friendIds)]);

  return { pings, loading };
}

export function useMyPings() {
  const { user } = useAuth();
  const [pings, setPings] = useState([]);
  useEffect(() => {
    if (!user) return;
    return subscribeMyPings(user.uid, setPings);
  }, [user]);
  return pings;
}

export function useJoinedPings() {
  const { user } = useAuth();
  const [pings, setPings] = useState([]);
  useEffect(() => {
    if (!user) return;
    return subscribeJoinedPings(user.uid, setPings);
  }, [user]);
  return pings;
}
