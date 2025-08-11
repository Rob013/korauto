/**
 * React Hook for Cookie Management
 * 
 * Provides React-friendly interface for cookie operations with automatic re-rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { CookieManager, CookieStats } from '../utils/cookieManager';

export interface UseCookieResult {
  value: string | null;
  setValue: (value: string, maxAge?: number) => boolean;
  remove: () => void;
  loading: boolean;
}

/**
 * Hook for managing individual cookies
 */
export function useCookie(name: string, defaultValue?: string): UseCookieResult {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieValue = CookieManager.getCookie(name);
    setValue(cookieValue || defaultValue || null);
    setLoading(false);
  }, [name, defaultValue]);

  const setCookieValue = useCallback((newValue: string, maxAge?: number) => {
    const success = CookieManager.setCookie(name, newValue, {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
      maxAge: maxAge || 7 * 24 * 60 * 60 // Default 7 days
    });
    
    if (success) {
      setValue(newValue);
    }
    
    return success;
  }, [name]);

  const removeCookie = useCallback(() => {
    CookieManager.deleteCookie(name);
    setValue(null);
  }, [name]);

  return {
    value,
    setValue: setCookieValue,
    remove: removeCookie,
    loading
  };
}

/**
 * Hook for managing session ID
 */
export function useSessionId() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = CookieManager.getSessionId();
    setSessionId(id);
    setLoading(false);
  }, []);

  const setSession = useCallback((id: string) => {
    const success = CookieManager.setSessionId(id);
    if (success) {
      setSessionId(id);
    }
    return success;
  }, []);

  const clearSession = useCallback(() => {
    CookieManager.clearSession();
    setSessionId(null);
  }, []);

  const generateSession = useCallback(() => {
    // Generate a secure session ID
    const sessionId = crypto.randomUUID ? 
      crypto.randomUUID() : 
      'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    return setSession(sessionId);
  }, [setSession]);

  return {
    sessionId,
    setSession,
    clearSession,
    generateSession,
    loading
  };
}

/**
 * Hook for managing user preferences
 */
export function usePreferences<T = Record<string, any>>(defaultPreferences?: T) {
  const [preferences, setPreferences] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefs = CookieManager.getPreferences<T>();
    setPreferences(prefs || defaultPreferences || null);
    setLoading(false);
  }, [defaultPreferences]);

  const updatePreferences = useCallback((updates: Partial<T>) => {
    const success = CookieManager.updatePreferences(updates);
    if (success) {
      const newPrefs = { ...(preferences || {} as T), ...updates };
      setPreferences(newPrefs);
    }
    return success;
  }, [preferences]);

  const setAllPreferences = useCallback((newPreferences: T) => {
    const success = CookieManager.setPreferences(newPreferences);
    if (success) {
      setPreferences(newPreferences);
    }
    return success;
  }, []);

  const clearPreferences = useCallback(() => {
    CookieManager.deleteCookie('user_preferences');
    setPreferences(null);
  }, []);

  return {
    preferences,
    updatePreferences,
    setPreferences: setAllPreferences,
    clearPreferences,
    loading
  };
}

/**
 * Hook for monitoring cookie usage
 */
export function useCookieMonitor() {
  const [stats, setStats] = useState<CookieStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(() => {
    const newStats = CookieManager.getCookieStats();
    setStats(newStats);
    return newStats;
  }, []);

  useEffect(() => {
    refreshStats();
    setLoading(false);

    // Monitor cookie changes periodically
    const interval = setInterval(() => {
      refreshStats();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [refreshStats]);

  const optimize = useCallback(() => {
    CookieManager.optimizeCookies();
    refreshStats();
  }, [refreshStats]);

  const clearAll = useCallback(() => {
    CookieManager.clearAllCookies();
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    optimize,
    clearAll,
    loading
  };
}

/**
 * Hook for sidebar state with cookie persistence (replaces existing sidebar cookie logic)
 */
export function useSidebarState(defaultOpen = true) {
  const SIDEBAR_COOKIE_NAME = 'sidebar:state';
  const { value, setValue, loading } = useCookie(SIDEBAR_COOKIE_NAME);
  
  const isOpen = value === 'true' || (value === null && defaultOpen);
  
  const setOpen = useCallback((open: boolean) => {
    return setValue(open.toString(), 7 * 24 * 60 * 60); // 7 days
  }, [setValue]);

  const toggle = useCallback(() => {
    return setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return {
    isOpen,
    setOpen,
    toggle,
    loading
  };
}