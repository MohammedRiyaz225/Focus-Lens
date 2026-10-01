import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { SettingsData } from '../lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (updated: Partial<SettingsData>) => {
    setIsSaving(true);
    setMessage(null);
    try {
      await api.updateSettings(updated);
      setSettings((prev) => (prev ? { ...prev, ...updated } : null));
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllData = async () => {
    try {
      const res = await api.deleteAllData();
      await loadSettings();
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    message,
    updateSettings,
    deleteAllData,
    reload: loadSettings,
  };
}
