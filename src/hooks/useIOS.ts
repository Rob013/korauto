import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect iOS platform and device characteristics
 */
export const useIOS = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const native = Capacitor.isNativePlatform();
    
    setIsIOS(platform === 'ios');
    setIsNative(native);

    // Get safe area insets for notch/island devices
    if (native && platform === 'ios') {
      const style = getComputedStyle(document.documentElement);
      setSafeAreaInsets({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      });
    }
  }, []);

  return {
    isIOS,
    isNative,
    isIOSNative: isIOS && isNative,
    safeAreaInsets,
  };
};
