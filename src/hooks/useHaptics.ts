import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Hook for haptic feedback on iOS
 */
export const useHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) return;
    
    try {
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const notification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) return;
    
    try {
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionStart = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionEnd = useCallback(async () => {
    if (!isNative) return;
    
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  return {
    impact,
    notification,
    selectionStart,
    selectionChanged,
    selectionEnd,
  };
};
