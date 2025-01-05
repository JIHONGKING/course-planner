// src/hooks/useUserSettings.ts

import { useState, useCallback } from 'react';

const defaultSettings: UserSettings = {
  preferredTerms: [],
  maxCreditsPerTerm: 15,
  preferredDepartments: []
};


interface UserSettings {
    preferredTerms: string[];
    maxCreditsPerTerm: number;
    preferredDepartments: string[];
  }
  
  export function useUserSettings() {
    const [settings, setSettings] = useState<UserSettings>(() => {
      const saved = localStorage.getItem('userSettings');
      return saved ? JSON.parse(saved) : defaultSettings;
    });
  
    const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem('userSettings', JSON.stringify(updated));
        return updated;
      });
    }, []);
  
    return { settings, updateSettings };
  }