/**
 * React Hook for Frame Rate Optimization and 120fps Support
 */

import { useEffect, useState, useCallback } from 'react';
import FrameRateOptimizer, { DisplayCapabilities, FrameRateConfig, inject120FPSStyles } from '@/utils/frameRateOptimizer';

export interface UseFrameRateReturn {
  currentFPS: number;
  targetFPS: number;
  capabilities: DisplayCapabilities;
  config: FrameRateConfig;
  supportsHighRefreshRate: boolean;
  updateConfig: (newConfig: Partial<FrameRateConfig>) => void;
  isOptimizedForDevice: boolean;
}

export const useFrameRate = (): UseFrameRateReturn => {
  const [currentFPS, setCurrentFPS] = useState(60);
  const [optimizer] = useState(() => FrameRateOptimizer.getInstance());

  const capabilities = optimizer.getCapabilities();
  const config = optimizer.getConfig();

  const updateConfig = useCallback((newConfig: Partial<FrameRateConfig>) => {
    optimizer.updateConfig(newConfig);
  }, [optimizer]);

  const isOptimizedForDevice = config.targetFPS === capabilities.refreshRate || 
    (config.performanceMode === 'power-saver' && config.targetFPS <= 30);

  useEffect(() => {
    // Inject 120fps styles
    inject120FPSStyles();

    // Listen for FPS updates
    const handleFPSUpdate = (event: CustomEvent) => {
      setCurrentFPS(event.detail.fps);
    };

    window.addEventListener('fpsUpdate', handleFPSUpdate as EventListener);

    return () => {
      window.removeEventListener('fpsUpdate', handleFPSUpdate as EventListener);
    };
  }, []);

  return {
    currentFPS,
    targetFPS: config.targetFPS,
    capabilities,
    config,
    supportsHighRefreshRate: capabilities.supportsHighRefreshRate,
    updateConfig,
    isOptimizedForDevice
  };
};

export default useFrameRate;