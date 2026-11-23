// src/hooks/useFriends.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeFriendIds,
  subscribeIncomingRequests,
  subscribeOutgoingRequests,
  getUserProfile,
} from '../../backend/friendService';

export function useFriendIds() {
  const { user } = useAuth();
  const [friendIds, setFriendIds] = useState([]);
  useEffect(() => {
    if (!user) return;
    return subscribeFriendIds(user.uid, setFriendIds);
  }, [user]);
  return friendIds;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    return subscribeFriendIds(user.uid, async (ids) => {
      const profiles = await Promise.all(ids.map((id) => getUserProfile(id)));
      setFriends(profiles.filter(Boolean));
      setLoading(false);
    });
  }, [user]);

  return { friends, loading };
}

export function useIncomingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    if (!user) return;
    return subscribeIncomingRequests(user.uid, setRequests);
  }, [user]);
  return requests;
}

export function useOutgoingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    if (!user) return;
    return subscribeOutgoingRequests(user.uid, setRequests);
  }, [user]);
  return requests;
}
