import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth.store';

// Per-user key so the dismissal doesn't bleed across accounts on the same device.
function nudgeKey(userId: string) {
  return `neovot.profile_nudge_dismissed.${userId}`;
}

export function useProfileNudge() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  // Start hidden to avoid a flash before we've read AsyncStorage.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(nudgeKey(userId)).then((v) => {
      if (v !== 'true') setVisible(true);
    });
  }, [userId]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    if (userId) await AsyncStorage.setItem(nudgeKey(userId), 'true');
  }, [userId]);

  // Called by the profile edit screen once the user has saved their full profile.
  const clearDismissal = useCallback(async () => {
    if (userId) {
      await AsyncStorage.removeItem(nudgeKey(userId));
      setVisible(true);
    }
  }, [userId]);

  return { visible, dismiss, clearDismissal };
}
