import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * iOS native utilities for status bar, splash screen, keyboard, and more
 */

export const iosNative = {
  /**
   * Status Bar Management
   */
  statusBar: {
    async setLight() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.warn('Status bar not available');
      }
    },
    
    async setDark() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (e) {
        console.warn('Status bar not available');
      }
    },
    
    async hide() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.hide();
      } catch (e) {
        console.warn('Status bar not available');
      }
    },
    
    async show() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.show();
      } catch (e) {
        console.warn('Status bar not available');
      }
    },
  },

  /**
   * Splash Screen Management
   */
  splash: {
    async hide() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.warn('Splash screen not available');
      }
    },
    
    async show() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await SplashScreen.show();
      } catch (e) {
        console.warn('Splash screen not available');
      }
    },
  },

  /**
   * Keyboard Management
   */
  keyboard: {
    async show() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await Keyboard.show();
      } catch (e) {
        console.warn('Keyboard not available');
      }
    },
    
    async hide() {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await Keyboard.hide();
      } catch (e) {
        console.warn('Keyboard not available');
      }
    },
    
    async addWillShowListener(callback: () => void) {
      if (!Capacitor.isNativePlatform()) return () => {};
      try {
        const listener = await Keyboard.addListener('keyboardWillShow', callback);
        return () => listener.remove();
      } catch (e) {
        console.warn('Keyboard not available');
        return () => {};
      }
    },
    
    async addWillHideListener(callback: () => void) {
      if (!Capacitor.isNativePlatform()) return () => {};
      try {
        const listener = await Keyboard.addListener('keyboardWillHide', callback);
        return () => listener.remove();
      } catch (e) {
        console.warn('Keyboard not available');
        return () => {};
      }
    },
  },

  /**
   * Share functionality
   */
  async share(options: { title?: string; text?: string; url?: string }) {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to Web Share API
      if (navigator.share) {
        try {
          await navigator.share(options);
        } catch (e) {
          console.warn('Share failed:', e);
        }
      }
      return;
    }
    
    try {
      await Share.share(options);
    } catch (e) {
      console.warn('Share not available');
    }
  },

  /**
   * App lifecycle
   */
  app: {
    async addStateChangeListener(callback: (state: { isActive: boolean }) => void) {
      if (!Capacitor.isNativePlatform()) return () => {};
      try {
        const listener = await App.addListener('appStateChange', callback);
        return () => listener.remove();
      } catch (e) {
        console.warn('App lifecycle not available');
        return () => {};
      }
    },
    
    async getInfo() {
      if (!Capacitor.isNativePlatform()) return null;
      try {
        return await App.getInfo();
      } catch (e) {
        console.warn('App info not available');
        return null;
      }
    },
  },
};
