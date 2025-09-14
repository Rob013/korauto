import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  HighRefreshRateManager, 
  getHighRefreshRateManager, 
  RefreshRateCapabilities,
  HighRefreshRateSettings,
  loadHighRefreshRatePreferences,
  saveHighRefreshRatePreferences
} from '@/utils/highRefreshRate';

/**
 * Hook for detecting and using high refresh rate capabilities
 */
export const useHighRefreshRateCapabilities = () => {
  const [capabilities, setCapabilities] = useState<RefreshRateCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const initCapabilities = async () => {
      try {
        const manager = await getHighRefreshRateManager();
        const stats = manager.getStats();
        setCapabilities(stats.capabilities);
      } catch (error) {
        console.error('Failed to initialize high refresh rate capabilities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initCapabilities();
  }, []);
  
  return { capabilities, isLoading };
};

/**
 * Hook for managing high refresh rate settings
 */
export const useHighRefreshRateSettings = () => {
  const [settings, setSettings] = useState<HighRefreshRateSettings>(() => ({
    enabled: true,
    targetFrameRate: 120,
    adaptiveFrameRate: true,
    batterySaver: false,
    performanceMode: 'auto',
    ...loadHighRefreshRatePreferences()
  }));
  
  const [manager, setManager] = useState<HighRefreshRateManager | null>(null);
  
  useEffect(() => {
    const initManager = async () => {
      const hrManager = await getHighRefreshRateManager(settings);
      setManager(hrManager);
    };
    
    initManager();
  }, []);
  
  const updateSettings = useCallback((newSettings: Partial<HighRefreshRateSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveHighRefreshRatePreferences(updatedSettings);
    
    if (manager) {
      manager.updateSettings(newSettings);
    }
  }, [settings, manager]);
  
  const getPerformanceStats = useCallback(() => {
    return manager?.getStats() || null;
  }, [manager]);
  
  return {
    settings,
    updateSettings,
    getPerformanceStats,
    manager
  };
};

/**
 * Hook for registering high refresh rate animation callbacks
 */
export const useHighRefreshRateAnimation = (
  callback: (currentTime: number, deltaTime: number) => void,
  deps: any[] = [],
  enabled = true
) => {
  const callbackId = useRef<number | null>(null);
  const managerRef = useRef<HighRefreshRateManager | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    const initAnimation = async () => {
      try {
        managerRef.current = await getHighRefreshRateManager();
        
        // Unregister previous callback if exists
        if (callbackId.current !== null) {
          managerRef.current.unregisterCallback(callbackId.current);
        }
        
        // Register new callback
        callbackId.current = managerRef.current.registerCallback(callback);
        
        // Update stats
        setStats(managerRef.current.getStats());
      } catch (error) {
        console.error('Failed to register high refresh rate animation:', error);
      }
    };
    
    initAnimation();
    
    return () => {
      if (managerRef.current && callbackId.current !== null) {
        managerRef.current.unregisterCallback(callbackId.current);
        callbackId.current = null;
      }
    };
  }, [...deps, enabled]);
  
  // Update stats periodically
  useEffect(() => {
    if (!enabled || !managerRef.current) return;
    
    const interval = setInterval(() => {
      if (managerRef.current) {
        setStats(managerRef.current.getStats());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [enabled]);
  
  return stats;
};

/**
 * Hook for smooth scroll with high refresh rate support
 */
export const useHighRefreshRateScroll = (elementRef: React.RefObject<HTMLElement>) => {
  const animationRef = useRef<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const smoothScrollTo = useCallback(async (targetPosition: number, duration = 500) => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    const startPosition = element.scrollTop;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    
    setIsScrolling(true);
    
    // Cancel any existing animation
    if (animationRef.current) {
      const manager = await getHighRefreshRateManager();
      manager.unregisterCallback(animationRef.current);
    }
    
    const manager = await getHighRefreshRateManager();
    
    animationRef.current = manager.registerCallback((currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t: number): number => 
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      
      const currentPosition = startPosition + distance * easeInOutCubic(progress);
      element.scrollTop = currentPosition;
      
      if (progress >= 1) {
        manager.unregisterCallback(animationRef.current!);
        animationRef.current = null;
        setIsScrolling(false);
      }
    });
  }, [elementRef]);
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        getHighRefreshRateManager().then(manager => {
          manager.unregisterCallback(animationRef.current!);
        });
      }
    };
  }, []);
  
  return { smoothScrollTo, isScrolling };
};

/**
 * Hook for high refresh rate image loading and animations
 */
export const useHighRefreshRateImageLoader = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const animationCallbacks = useRef<Map<string, number>>(new Map());
  
  const loadImageWithAnimation = useCallback(async (
    src: string,
    onProgress?: (progress: number) => void,
    animationDuration = 300
  ) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = async () => {
        setLoadedImages(prev => new Set([...prev, src]));
        
        if (onProgress) {
          // Animate progress from 0 to 100 using high refresh rate
          const manager = await getHighRefreshRateManager();
          const startTime = performance.now();
          
          const animationId = manager.registerCallback((currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1) * 100;
            
            onProgress(progress);
            
            if (progress >= 100) {
              manager.unregisterCallback(animationId);
              animationCallbacks.current.delete(src);
            }
          });
          
          animationCallbacks.current.set(src, animationId);
        }
        
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }, []);
  
  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);
  
  useEffect(() => {
    return () => {
      // Cleanup animation callbacks
      getHighRefreshRateManager().then(manager => {
        animationCallbacks.current.forEach(callbackId => {
          manager.unregisterCallback(callbackId);
        });
      });
    };
  }, []);
  
  return { loadImageWithAnimation, isImageLoaded };
};

/**
 * Hook for performance monitoring with high refresh rate awareness
 */
export const useHighRefreshRatePerformance = () => {
  const [performanceData, setPerformanceData] = useState({
    frameRate: 60,
    frameTime: 16.67,
    droppedFrames: 0,
    isOptimal: true
  });
  
  const monitoringRef = useRef<number | null>(null);
  
  useEffect(() => {
    const startMonitoring = async () => {
      const manager = await getHighRefreshRateManager();
      let frameCount = 0;
      let lastTime = performance.now();
      let droppedFrames = 0;
      
      monitoringRef.current = manager.registerCallback((currentTime, deltaTime) => {
        frameCount++;
        
        // Update stats every second
        if (currentTime - lastTime >= 1000) {
          const actualFrameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
          const targetFrameRate = manager.getStats().targetFrameRate;
          const isOptimal = actualFrameRate >= targetFrameRate * 0.9;
          
          if (actualFrameRate < targetFrameRate * 0.9) {
            droppedFrames++;
          }
          
          setPerformanceData({
            frameRate: actualFrameRate,
            frameTime: deltaTime,
            droppedFrames,
            isOptimal
          });
          
          frameCount = 0;
          lastTime = currentTime;
        }
      });
    };
    
    startMonitoring();
    
    return () => {
      if (monitoringRef.current) {
        getHighRefreshRateManager().then(manager => {
          manager.unregisterCallback(monitoringRef.current!);
        });
      }
    };
  }, []);
  
  return performanceData;
};

/**
 * Hook for adaptive quality based on high refresh rate performance
 */
export const useAdaptiveQuality = () => {
  const performance = useHighRefreshRatePerformance();
  const [qualityLevel, setQualityLevel] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    if (performance.frameRate >= 90 && performance.isOptimal) {
      setQualityLevel('high');
    } else if (performance.frameRate >= 60) {
      setQualityLevel('medium');
    } else {
      setQualityLevel('low');
    }
  }, [performance]);
  
  const getOptimalImageQuality = useCallback(() => {
    switch (qualityLevel) {
      case 'high': return 90;
      case 'medium': return 75;
      case 'low': return 60;
      default: return 75;
    }
  }, [qualityLevel]);
  
  const getOptimalAnimationDuration = useCallback((baseDuration: number) => {
    switch (qualityLevel) {
      case 'high': return baseDuration;
      case 'medium': return baseDuration * 1.2;
      case 'low': return baseDuration * 1.5;
      default: return baseDuration;
    }
  }, [qualityLevel]);
  
  const shouldUseReducedMotion = useCallback(() => {
    return qualityLevel === 'low' || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [qualityLevel]);
  
  return {
    qualityLevel,
    getOptimalImageQuality,
    getOptimalAnimationDuration,
    shouldUseReducedMotion,
    performance
  };
};

export default {
  useHighRefreshRateCapabilities,
  useHighRefreshRateSettings,
  useHighRefreshRateAnimation,
  useHighRefreshRateScroll,
  useHighRefreshRateImageLoader,
  useHighRefreshRatePerformance,
  useAdaptiveQuality
};