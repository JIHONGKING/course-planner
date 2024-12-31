import { useState, useCallback, useEffect } from 'react';
import type { UserPreferences } from '@/src/types/course';

const LOCAL_STORAGE_KEY = 'user-preferences';

const defaultPreferences: UserPreferences = {
  school: '',
  major: '',
  classStanding: '',
  graduationYear: '',
  planningStrategy: 'GPA'
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultPreferences, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved preferences:', e);
      }
    }
    return defaultPreferences;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
}