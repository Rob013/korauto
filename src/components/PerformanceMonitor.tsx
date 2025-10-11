import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/useSmoothAnimations';
import { FrameRateOptimizer } from '@/utils/frameRateOptimizer';
import { getDeviceCapabilities } from '@/utils/performanceOptimizer';

interface PerformanceMonitorProps {
  show?: boolean;
  showDetails?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ show = false, showDetails = true }) => {
  const { metrics } = usePerformanceMonitor();
  const [optimizer] = useState(() => FrameRateOptimizer.getInstance());
  const [capabilities] = useState(() => getDeviceCapabilities());
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/60 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div>FPS: <span className={metrics.fps >= 55 ? 'text-green-400' : 'text-yellow-400'}>{metrics.fps}</span></div>
        <div>Memory: <span className={metrics.memoryUsage < 100 ? 'text-green-400' : 'text-yellow-400'}>{metrics.memoryUsage.toFixed(1)}MB</span></div>
        <div>Render: <span className={metrics.renderTime < 16 ? 'text-green-400' : 'text-yellow-400'}>{metrics.renderTime.toFixed(1)}ms</span></div>
        
        <div className="border-t border-white/20 pt-1 mt-2">
          <div>Refresh Rate: {optimizer.getCapabilities().refreshRate}Hz</div>
          <div>High Refresh: {capabilities.isHighRefreshRate ? 'Yes' : 'No'}</div>
          <div>Low Power: {capabilities.isLowPowerMode ? 'Yes' : 'No'}</div>
          <div>Reduced Motion: {capabilities.prefersReducedMotion ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div className="text-white/60 text-xs mt-2">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;