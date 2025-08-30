/**
 * Hook for managing remembered login information
 * 
 * Provides functionality to remember and retrieve user email addresses
 * for devices that have been logged in before.
 */

import { useState, useEffect, useCallback } from 'react';
import { CookieManager } from '@/utils/cookieManager';

interface RememberedLoginInfo {
  email: string;
  lastLoginDate: string;
  deviceFingerprint: string;
}

export function useRememberLogin() {
  const [rememberedEmail, setRememberedEmail] = useState<string>('');
  const [isRemembered, setIsRemembered] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const REMEMBER_LOGIN_COOKIE = 'remembered_login';
  const COOKIE_EXPIRY_DAYS = 30; // Remember for 30 days

  // Generate a simple device fingerprint
  const generateDeviceFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }, []);

  // Load remembered login info on component mount
  useEffect(() => {
    try {
      const storedInfo = CookieManager.getCookie(REMEMBER_LOGIN_COOKIE);
      
      if (storedInfo) {
        const loginInfo: RememberedLoginInfo = JSON.parse(storedInfo);
        const currentFingerprint = generateDeviceFingerprint();
        
        // Verify this is the same device
        if (loginInfo.deviceFingerprint === currentFingerprint) {
          setRememberedEmail(loginInfo.email);
          setIsRemembered(true);
        } else {
          // Different device, clear the cookie
          CookieManager.deleteCookie(REMEMBER_LOGIN_COOKIE);
        }
      }
    } catch (error) {
      console.error('Error loading remembered login info:', error);
      // Clear invalid cookie
      CookieManager.deleteCookie(REMEMBER_LOGIN_COOKIE);
    } finally {
      setLoading(false);
    }
  }, [generateDeviceFingerprint]);

  // Save login info to be remembered
  const rememberLogin = useCallback((email: string, shouldRemember: boolean = true) => {
    try {
      if (shouldRemember && email) {
        const loginInfo: RememberedLoginInfo = {
          email: email.toLowerCase().trim(),
          lastLoginDate: new Date().toISOString(),
          deviceFingerprint: generateDeviceFingerprint()
        };

        const success = CookieManager.setCookie(
          REMEMBER_LOGIN_COOKIE, 
          JSON.stringify(loginInfo),
          {
            secure: window.location.protocol === 'https:',
            sameSite: 'lax',
            path: '/',
            maxAge: COOKIE_EXPIRY_DAYS * 24 * 60 * 60 // 30 days in seconds
          }
        );

        if (success) {
          setRememberedEmail(email);
          setIsRemembered(true);
          console.log('Login info saved for future visits');
        } else {
          console.warn('Failed to save login info');
        }

        return success;
      } else {
        // User chose not to remember or email is empty
        forgetLogin();
        return true;
      }
    } catch (error) {
      console.error('Error saving login info:', error);
      return false;
    }
  }, [generateDeviceFingerprint]);

  // Clear remembered login info
  const forgetLogin = useCallback(() => {
    CookieManager.deleteCookie(REMEMBER_LOGIN_COOKIE);
    setRememberedEmail('');
    setIsRemembered(false);
    console.log('Login info cleared');
  }, []);

  // Check if a specific email is remembered
  const isEmailRemembered = useCallback((email: string) => {
    return isRemembered && rememberedEmail.toLowerCase() === email.toLowerCase().trim();
  }, [isRemembered, rememberedEmail]);

  // Get all remembered emails (for future multi-account support)
  const getRememberedEmails = useCallback(() => {
    return isRemembered ? [rememberedEmail] : [];
  }, [isRemembered, rememberedEmail]);

  return {
    rememberedEmail,
    isRemembered,
    loading,
    rememberLogin,
    forgetLogin,
    isEmailRemembered,
    getRememberedEmails
  };
}