import { useEffect } from 'react';
import { iosNative } from '@/utils/iosNative';
import { useIOS } from '@/hooks/useIOS';

/**
 * Component that enhances the app with iOS-specific features
 */
export const IOSEnhancer = () => {
  const { isIOSNative } = useIOS();

  useEffect(() => {
    if (!isIOSNative) return;

    // Hide splash screen after app is loaded
    const timer = setTimeout(() => {
      iosNative.splash.hide();
    }, 500);

    // Set up status bar based on theme
    const updateStatusBar = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        iosNative.statusBar.setLight();
      } else {
        iosNative.statusBar.setDark();
      }
    };

    updateStatusBar();

    // Listen for theme changes
    const observer = new MutationObserver(updateStatusBar);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Handle app state changes
    let removeStateListener = () => {};
    iosNative.app.addStateChangeListener((state) => {
      if (state.isActive) {
        console.log('App became active');
      } else {
        console.log('App went to background');
      }
    }).then(remove => {
      removeStateListener = remove;
    });

    // Keyboard management - hide keyboard when tapping outside inputs
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;
      
      if (!isInput) {
        iosNative.keyboard.hide();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      removeStateListener();
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isIOSNative]);

  return null;
};
