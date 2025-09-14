import React, { useEffect, useRef, forwardRef } from 'react';
import { getHighRefreshRateManager } from '@/utils/highRefreshRate';
import { useHighRefreshRateSettings } from '@/hooks/useHighRefreshRate';

/**
 * Higher Order Component that optimizes any component for high refresh rates
 */
export function withHighRefreshRate<T extends React.ComponentType<any>>(
  WrappedComponent: T,
  options: {
    enableAutoOptimization?: boolean;
    priority?: 'low' | 'medium' | 'high';
    animationTypes?: ('hover' | 'scroll' | 'transition' | 'transform')[];
  } = {}
): T {
  const {
    enableAutoOptimization = true,
    priority = 'medium',
    animationTypes = ['hover', 'transition']
  } = options;

  const OptimizedComponent = forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const elementRef = useRef<HTMLElement>(null);
    const { settings } = useHighRefreshRateSettings();
    
    useEffect(() => {
      if (!enableAutoOptimization || !settings.enabled) return;
      
      const element = elementRef.current;
      if (!element) return;
      
      // Apply high refresh rate optimizations
      const applyOptimizations = async () => {
        try {
          const manager = await getHighRefreshRateManager();
          const stats = manager.getStats();
          
          if (stats.targetFrameRate > 60) {
            // Add high refresh rate CSS classes
            element.classList.add('high-refresh-rate-optimized');
            
            if (animationTypes.includes('hover')) {
              element.classList.add('high-refresh-hover');
            }
            
            if (animationTypes.includes('transition')) {
              element.classList.add('high-refresh-transition');
            }
            
            if (animationTypes.includes('transform')) {
              element.classList.add('force-gpu-acceleration');
            }
            
            // Set CSS custom properties for this specific element
            element.style.setProperty('--target-fps', stats.targetFrameRate.toString());
            element.style.setProperty('--frame-time', `${1000 / stats.targetFrameRate}ms`);
            
            // Apply priority-based optimizations
            switch (priority) {
              case 'high':
                element.classList.add('ultra-smooth-transition');
                element.style.setProperty('will-change', 'transform, opacity, filter');
                break;
              case 'medium':
                element.classList.add('high-refresh-transition');
                element.style.setProperty('will-change', 'transform, opacity');
                break;
              case 'low':
                element.style.setProperty('will-change', 'auto');
                break;
            }
          }
        } catch (error) {
          console.warn('Failed to apply high refresh rate optimizations:', error);
        }
      };
      
      applyOptimizations();
      
      // Cleanup function
      return () => {
        if (element) {
          element.classList.remove(
            'high-refresh-rate-optimized',
            'high-refresh-hover',
            'high-refresh-transition',
            'ultra-smooth-transition',
            'force-gpu-acceleration'
          );
          element.style.removeProperty('--target-fps');
          element.style.removeProperty('--frame-time');
          element.style.removeProperty('will-change');
        }
      };
    }, [settings.enabled, settings.targetFrameRate]);
    
    // Merge refs
    const mergedRef = (node: HTMLElement) => {
      elementRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };
    
    return <WrappedComponent {...props} ref={mergedRef} />;
  });
  
  OptimizedComponent.displayName = `withHighRefreshRate(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return OptimizedComponent as T;
}

/**
 * React component that applies high refresh rate optimizations to its children
 */
interface HighRefreshRateContainerProps {
  children: React.ReactNode;
  priority?: 'low' | 'medium' | 'high';
  animationTypes?: ('hover' | 'scroll' | 'transition' | 'transform')[];
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

export const HighRefreshRateContainer: React.FC<HighRefreshRateContainerProps> = ({
  children,
  priority = 'medium',
  animationTypes = ['hover', 'transition'],
  className = '',
  tag: Tag = 'div'
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const { settings } = useHighRefreshRateSettings();
  
  useEffect(() => {
    if (!settings.enabled) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const applyContainerOptimizations = async () => {
      try {
        const manager = await getHighRefreshRateManager();
        const stats = manager.getStats();
        
        if (stats.targetFrameRate > 60) {
          // Apply container-level optimizations
          container.classList.add('high-refresh-container');
          
          // Set CSS custom properties
          container.style.setProperty('--screen-refresh-rate', stats.targetFrameRate.toString());
          container.style.setProperty('--frame-time', `${1000 / stats.targetFrameRate}ms`);
          
          // Apply to all child elements
          const applyToChildren = (element: Element) => {
            if (element instanceof HTMLElement) {
              element.classList.add('high-refresh-rate-optimized');
              
              if (animationTypes.includes('hover')) {
                element.classList.add('high-refresh-hover');
              }
              
              if (animationTypes.includes('transition')) {
                element.classList.add('high-refresh-transition');
              }
              
              // Recursively apply to children
              Array.from(element.children).forEach(applyToChildren);
            }
          };
          
          Array.from(container.children).forEach(applyToChildren);
        }
      } catch (error) {
        console.warn('Failed to apply container optimizations:', error);
      }
    };
    
    applyContainerOptimizations();
    
    // Cleanup
    return () => {
      if (container) {
        container.classList.remove('high-refresh-container');
        container.style.removeProperty('--screen-refresh-rate');
        container.style.removeProperty('--frame-time');
        
        // Remove from all descendants
        const removeFromChildren = (element: Element) => {
          if (element instanceof HTMLElement) {
            element.classList.remove(
              'high-refresh-rate-optimized',
              'high-refresh-hover',
              'high-refresh-transition'
            );
            Array.from(element.children).forEach(removeFromChildren);
          }
        };
        
        Array.from(container.children).forEach(removeFromChildren);
      }
    };
  }, [settings.enabled, settings.targetFrameRate, animationTypes]);
  
  const combinedClassName = `${className} ${settings.enabled && settings.targetFrameRate > 60 ? 'high-refresh-enabled' : ''}`.trim();
  
  return (
    <Tag ref={containerRef} className={combinedClassName}>
      {children}
    </Tag>
  );
};

/**
 * Hook for automatically optimizing component animations for high refresh rates
 */
export const useHighRefreshRateOptimization = (
  elementRef: React.RefObject<HTMLElement>,
  options: {
    animationTypes?: ('hover' | 'scroll' | 'transition' | 'transform')[];
    priority?: 'low' | 'medium' | 'high';
  } = {}
) => {
  const { animationTypes = ['hover', 'transition'], priority = 'medium' } = options;
  const { settings } = useHighRefreshRateSettings();
  
  useEffect(() => {
    if (!settings.enabled || !elementRef.current) return;
    
    const element = elementRef.current;
    
    const optimize = async () => {
      try {
        const manager = await getHighRefreshRateManager();
        const stats = manager.getStats();
        
        if (stats.targetFrameRate > 60) {
          // Apply optimizations based on target frame rate
          const frameTime = 1000 / stats.targetFrameRate;
          
          element.style.setProperty('--target-fps', stats.targetFrameRate.toString());
          element.style.setProperty('--frame-time', `${frameTime}ms`);
          element.style.setProperty('--optimal-transition-duration', `${frameTime * 0.5}ms`);
          
          // Apply CSS classes
          element.classList.add('high-refresh-rate-optimized');
          
          if (animationTypes.includes('hover')) {
            element.classList.add('high-refresh-hover');
          }
          
          if (animationTypes.includes('transition')) {
            element.classList.add('high-refresh-transition');
          }
          
          if (animationTypes.includes('transform')) {
            element.classList.add('force-gpu-acceleration');
          }
          
          // Priority-based will-change optimization
          switch (priority) {
            case 'high':
              element.style.setProperty('will-change', 'transform, opacity, filter');
              break;
            case 'medium':
              element.style.setProperty('will-change', 'transform, opacity');
              break;
            case 'low':
              element.style.setProperty('will-change', 'auto');
              break;
          }
        }
      } catch (error) {
        console.warn('Failed to optimize element for high refresh rate:', error);
      }
    };
    
    optimize();
    
    return () => {
      // Cleanup
      element.classList.remove(
        'high-refresh-rate-optimized',
        'high-refresh-hover',
        'high-refresh-transition',
        'force-gpu-acceleration'
      );
      element.style.removeProperty('--target-fps');
      element.style.removeProperty('--frame-time');
      element.style.removeProperty('--optimal-transition-duration');
      element.style.removeProperty('will-change');
    };
  }, [settings.enabled, settings.targetFrameRate, elementRef, animationTypes, priority]);
  
  return {
    isHighRefreshEnabled: settings.enabled && settings.targetFrameRate > 60,
    targetFrameRate: settings.targetFrameRate
  };
};

/**
 * Utility component for optimizing specific animations
 */
interface HighRefreshRateAnimationProps {
  children: React.ReactNode;
  animationType: 'fade' | 'slide' | 'scale' | 'spin' | 'bounce';
  duration?: number;
  className?: string;
}

export const HighRefreshRateAnimation: React.FC<HighRefreshRateAnimationProps> = ({
  children,
  animationType,
  duration = 300,
  className = ''
}) => {
  const { settings } = useHighRefreshRateSettings();
  
  const getAnimationClass = () => {
    const baseClass = settings.enabled && settings.targetFrameRate > 60 ? 'high-refresh-' : '';
    
    switch (animationType) {
      case 'fade':
        return `${baseClass}fade-in`;
      case 'slide':
        return `animate-slide-in-left`;
      case 'scale':
        return `animate-scale-in`;
      case 'spin':
        return `${baseClass}spinner`;
      case 'bounce':
        return `animate-bounce-in`;
      default:
        return '';
    }
  };
  
  const optimizedDuration = settings.enabled && settings.targetFrameRate > 60 
    ? duration * (60 / settings.targetFrameRate) 
    : duration;
  
  const style = {
    '--animation-duration': `${optimizedDuration}ms`
  } as React.CSSProperties;
  
  return (
    <div 
      className={`${getAnimationClass()} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
};

export default {
  withHighRefreshRate,
  HighRefreshRateContainer,
  useHighRefreshRateOptimization,
  HighRefreshRateAnimation
};