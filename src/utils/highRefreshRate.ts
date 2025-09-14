// High refresh rate detection and management utility for 120fps support
export interface RefreshRateCapabilities {
  maxRefreshRate: number;
  supports120fps: boolean;
  supports90fps: boolean;
  supports60fps: boolean;
  isHighRefreshSupported: boolean;
  devicePixelRatio: number;
  preferredFrameRate: number;
}

export interface HighRefreshRateSettings {
  enabled: boolean;
  targetFrameRate: number;
  adaptiveFrameRate: boolean;
  batterySaver: boolean;
  performanceMode: 'auto' | 'performance' | 'battery';
}

/**
 * Detects device refresh rate capabilities
 */
export const detectRefreshRateCapabilities = async (): Promise<RefreshRateCapabilities> => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Try to detect actual refresh rate using requestAnimationFrame timing
  const detectedFrameRate = await measureActualFrameRate();
  
  // Check for high refresh rate hints
  const supports120fps = detectedFrameRate > 100 || isLikelyHighRefreshDevice();
  const supports90fps = detectedFrameRate > 80 || supports120fps;
  const supports60fps = true; // All modern devices support 60fps
  
  const maxRefreshRate = supports120fps ? 120 : supports90fps ? 90 : 60;
  const isHighRefreshSupported = maxRefreshRate > 60;
  
  // Determine preferred frame rate based on device capabilities and performance
  let preferredFrameRate = 60; // Default to 60fps
  if (supports120fps && isPerformanceCapable()) {
    preferredFrameRate = 120;
  } else if (supports90fps && isPerformanceCapable()) {
    preferredFrameRate = 90;
  }
  
  return {
    maxRefreshRate,
    supports120fps,
    supports90fps,
    supports60fps,
    isHighRefreshSupported,
    devicePixelRatio,
    preferredFrameRate
  };
};

/**
 * Measure actual frame rate by timing requestAnimationFrame calls
 */
const measureActualFrameRate = async (): Promise<number> => {
  return new Promise((resolve) => {
    let frameCount = 0;
    let startTime = performance.now();
    let lastTime = startTime;
    
    const measureFrame = (currentTime: number) => {
      frameCount++;
      
      // Measure for 1 second
      if (currentTime - startTime >= 1000) {
        const actualFrameRate = Math.round((frameCount * 1000) / (currentTime - startTime));
        resolve(Math.min(actualFrameRate, 144)); // Cap at 144fps for sanity
        return;
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  });
};

/**
 * Check if device is likely to support high refresh rates
 */
const isLikelyHighRefreshDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Check for common high refresh rate device indicators
  const highRefreshIndicators = [
    // iPhone Pro models (120Hz ProMotion)
    /iphone.*pro/,
    // iPad Pro models
    /ipad.*pro/,
    // Android devices with high refresh rate
    /oneplus|galaxy.*s2[0-9]|pixel.*[67]|xiaomi.*pro/,
    // Gaming devices
    /rog.*phone|black.*shark|gaming/
  ];
  
  // Check screen properties that might indicate high refresh
  const hasHighDPI = window.devicePixelRatio >= 2;
  const hasLargeScreen = window.screen.width >= 1920 || window.screen.height >= 1920;
  
  return highRefreshIndicators.some(pattern => pattern.test(userAgent)) || 
         (hasHighDPI && hasLargeScreen);
};

/**
 * Check if device has sufficient performance for high refresh rates
 */
const isPerformanceCapable = (): boolean => {
  // Check available memory (if supported)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) {
    return false; // Less than 4GB RAM might struggle with 120fps
  }
  
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  if (cores < 4) {
    return false; // Less than 4 cores might struggle
  }
  
  // Check if running on battery
  const battery = (navigator as any).getBattery?.();
  if (battery && !battery.charging && battery.level < 0.5) {
    return false; // Low battery, prefer efficiency
  }
  
  return true;
};

/**
 * High refresh rate animation frame manager
 */
export class HighRefreshRateManager {
  private settings: HighRefreshRateSettings;
  private capabilities: RefreshRateCapabilities | null = null;
  private animationCallbacks: Map<number, Function> = new Map();
  private lastCallbackId = 0;
  private isRunning = false;
  private actualFrameRate = 60;
  private frameInterval = 16.67; // 60fps default
  private lastFrameTime = 0;
  private frameTimeTarget = 16.67;
  
  constructor(settings?: Partial<HighRefreshRateSettings>) {
    this.settings = {
      enabled: true,
      targetFrameRate: 120,
      adaptiveFrameRate: true,
      batterySaver: false,
      performanceMode: 'auto',
      ...settings
    };
  }
  
  /**
   * Initialize the manager and detect capabilities
   */
  async init(): Promise<void> {
    this.capabilities = await detectRefreshRateCapabilities();
    
    // Adjust settings based on capabilities
    if (!this.capabilities.isHighRefreshSupported) {
      this.settings.targetFrameRate = 60;
    } else if (this.settings.targetFrameRate > this.capabilities.maxRefreshRate) {
      this.settings.targetFrameRate = this.capabilities.maxRefreshRate;
    }
    
    // Set frame interval based on target frame rate
    this.updateFrameInterval();
    
    // Start the animation loop
    this.start();
    
    // Monitor performance and adjust frame rate if needed
    if (this.settings.adaptiveFrameRate) {
      this.startPerformanceMonitoring();
    }
  }
  
  /**
   * Update frame interval based on target frame rate
   */
  private updateFrameInterval(): void {
    this.frameInterval = 1000 / this.settings.targetFrameRate;
    this.frameTimeTarget = this.frameInterval;
  }
  
  /**
   * Start the high refresh rate animation loop
   */
  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationLoop();
  }
  
  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Main animation loop optimized for high refresh rates
   */
  private animationLoop = (currentTime: number = performance.now()): void => {
    if (!this.isRunning) return;
    
    // Calculate time since last frame
    const deltaTime = currentTime - this.lastFrameTime;
    
    // Only execute callbacks if enough time has passed for target frame rate
    if (deltaTime >= this.frameTimeTarget) {
      // Calculate actual frame rate
      this.actualFrameRate = 1000 / deltaTime;
      
      // Execute all registered callbacks
      this.animationCallbacks.forEach((callback) => {
        try {
          callback(currentTime, deltaTime);
        } catch (error) {
          console.warn('Error in animation callback:', error);
        }
      });
      
      this.lastFrameTime = currentTime;
    }
    
    // Continue the loop
    requestAnimationFrame(this.animationLoop);
  };
  
  /**
   * Register an animation callback
   */
  registerCallback(callback: (currentTime: number, deltaTime: number) => void): number {
    const id = ++this.lastCallbackId;
    this.animationCallbacks.set(id, callback);
    return id;
  }
  
  /**
   * Unregister an animation callback
   */
  unregisterCallback(id: number): void {
    this.animationCallbacks.delete(id);
  }
  
  /**
   * Update settings and adjust performance accordingly
   */
  updateSettings(newSettings: Partial<HighRefreshRateSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updateFrameInterval();
    
    // Restart if settings significantly changed
    if (newSettings.targetFrameRate || newSettings.enabled !== undefined) {
      this.stop();
      if (this.settings.enabled) {
        this.start();
      }
    }
  }
  
  /**
   * Monitor performance and adjust frame rate adaptively
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      if (!this.settings.adaptiveFrameRate) return;
      
      // If we're not hitting our target frame rate consistently, reduce it
      const targetFrameRate = this.settings.targetFrameRate;
      const actualFrameRate = this.actualFrameRate;
      
      if (actualFrameRate < targetFrameRate * 0.9) {
        // We're missing frames, reduce target
        if (targetFrameRate > 60) {
          const newTarget = targetFrameRate === 120 ? 90 : 60;
          console.log(`Reducing frame rate from ${targetFrameRate} to ${newTarget} due to performance`);
          this.updateSettings({ targetFrameRate: newTarget });
        }
      } else if (actualFrameRate > targetFrameRate * 1.1 && targetFrameRate < 120) {
        // We have headroom, potentially increase target
        if (this.capabilities?.supports120fps && targetFrameRate < 120) {
          const newTarget = targetFrameRate === 60 ? 90 : 120;
          console.log(`Increasing frame rate from ${targetFrameRate} to ${newTarget} due to good performance`);
          this.updateSettings({ targetFrameRate: newTarget });
        }
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Get current performance stats
   */
  getStats() {
    return {
      targetFrameRate: this.settings.targetFrameRate,
      actualFrameRate: this.actualFrameRate,
      frameInterval: this.frameInterval,
      activeCallbacks: this.animationCallbacks.size,
      isRunning: this.isRunning,
      capabilities: this.capabilities
    };
  }
}

/**
 * Global high refresh rate manager instance
 */
let globalManager: HighRefreshRateManager | null = null;

/**
 * Get or create the global high refresh rate manager
 */
export const getHighRefreshRateManager = async (settings?: Partial<HighRefreshRateSettings>): Promise<HighRefreshRateManager> => {
  if (!globalManager) {
    globalManager = new HighRefreshRateManager(settings);
    await globalManager.init();
  }
  return globalManager;
};

/**
 * Hook for components to use high refresh rate animations
 */
export const useHighRefreshRate = (callback: (currentTime: number, deltaTime: number) => void, deps: any[] = []) => {
  const callbackId = useRef<number | null>(null);
  const managerRef = useRef<HighRefreshRateManager | null>(null);
  
  useEffect(() => {
    const initManager = async () => {
      managerRef.current = await getHighRefreshRateManager();
      
      if (callbackId.current !== null) {
        managerRef.current.unregisterCallback(callbackId.current);
      }
      
      callbackId.current = managerRef.current.registerCallback(callback);
    };
    
    initManager();
    
    return () => {
      if (managerRef.current && callbackId.current !== null) {
        managerRef.current.unregisterCallback(callbackId.current);
      }
    };
  }, deps);
  
  return managerRef.current?.getStats();
};

// Add required imports
import { useEffect, useRef } from 'react';

/**
 * Utility to create smooth CSS animations optimized for high refresh rates
 */
export const createHighRefreshRateAnimation = (
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions & { preferHighRefreshRate?: boolean } = {}
): Animation => {
  const { preferHighRefreshRate = true, ...animationOptions } = options;
  
  // Adjust duration for high refresh rate if supported and preferred
  if (preferHighRefreshRate && globalManager?.getStats().targetFrameRate > 60) {
    const frameRateMultiplier = globalManager.getStats().targetFrameRate / 60;
    if (animationOptions.duration && typeof animationOptions.duration === 'number') {
      // Slightly increase duration for smoother appearance at high frame rates
      animationOptions.duration = animationOptions.duration * Math.min(frameRateMultiplier * 0.1 + 1, 1.2);
    }
  }
  
  // Create the animation
  const animation = element.animate(keyframes, animationOptions);
  
  return animation;
};

/**
 * Save and load user preferences for high refresh rate
 */
export const saveHighRefreshRatePreferences = (settings: HighRefreshRateSettings): void => {
  try {
    localStorage.setItem('highRefreshRateSettings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save high refresh rate preferences:', error);
  }
};

export const loadHighRefreshRatePreferences = (): Partial<HighRefreshRateSettings> => {
  try {
    const stored = localStorage.getItem('highRefreshRateSettings');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to load high refresh rate preferences:', error);
    return {};
  }
};

export default HighRefreshRateManager;