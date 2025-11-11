/**
 * Frame Rate Optimizer for 120fps support
 * Detects display capabilities and optimizes animations accordingly
 */

export interface DisplayCapabilities {
  refreshRate: number;
  supportedRefreshRates: number[];
  supportsHighRefreshRate: boolean;
  isVariableRefreshRate: boolean;
}

export interface FrameRateConfig {
  targetFPS: number;
  adaptiveAnimations: boolean;
  reducedMotion: boolean;
  performanceMode: 'auto' | 'high' | 'balanced' | 'power-saver';
}

export class FrameRateOptimizer {
  private static instance: FrameRateOptimizer;
  private config: FrameRateConfig;
  private capabilities: DisplayCapabilities;
  private rafId: number | null = null;
  private frameCount = 0;
  private lastTime = 0;
  private currentFPS = 60;

  private constructor() {
    this.capabilities = this.detectDisplayCapabilities();
    this.config = this.getOptimalConfig();
    this.init();
  }

  public static getInstance(): FrameRateOptimizer {
    if (!FrameRateOptimizer.instance) {
      FrameRateOptimizer.instance = new FrameRateOptimizer();
    }
    return FrameRateOptimizer.instance;
  }

  private detectDisplayCapabilities(): DisplayCapabilities {
    // Default capabilities
    let refreshRate = 60;
    let supportedRefreshRates = [60];
    let supportsHighRefreshRate = false;
    let isVariableRefreshRate = false;

    // Method 1: User agent detection for known high-refresh devices
    const userAgent = navigator.userAgent.toLowerCase();
    
    // iOS devices with ProMotion
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      const iosVersion = parseInt(userAgent.match(/os (\d+)/)?.[1] || '0');
      // iPhone 13 Pro and later, iPad Pro (2017+) support 120Hz
      if (iosVersion >= 15 || userAgent.includes('ipad pro')) {
        refreshRate = 120;
        supportedRefreshRates = [60, 120];
        supportsHighRefreshRate = true;
        isVariableRefreshRate = true; // ProMotion is adaptive
      }
    } 
    // Android devices
    else if (userAgent.includes('android')) {
      // Many modern Android devices support 90/120Hz
      refreshRate = 90; // Conservative estimate
      supportedRefreshRates = [60, 90, 120];
      supportsHighRefreshRate = true;
    }
    // Desktop browsers
    else if (window.devicePixelRatio >= 2) {
      // High-DPI displays often support higher refresh rates
      refreshRate = 120;
      supportedRefreshRates = [60, 90, 120];
      supportsHighRefreshRate = true;
    }

    // Method 2: Measure actual frame rate more accurately
    let measuredRefreshRate = 60;
    const startTime = performance.now();
    let frameCounter = 0;
    let lastFrameTime = startTime;
    const frameTimes: number[] = [];
    
    const measureFrameRate = (currentTime: number) => {
      frameCounter++;
      
      // Calculate time between frames
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime > 0) {
        frameTimes.push(deltaTime);
      }
      lastFrameTime = currentTime;
      
      // Sample for 200ms for better accuracy
      if (currentTime - startTime >= 200 && frameTimes.length > 10) {
        // Calculate average frame time
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        measuredRefreshRate = Math.round(1000 / avgFrameTime);
        
        // Update refresh rate if measured is higher
        if (measuredRefreshRate > refreshRate && measuredRefreshRate <= 144) {
          refreshRate = measuredRefreshRate;
          supportsHighRefreshRate = measuredRefreshRate > 60;
          if (!supportedRefreshRates.includes(measuredRefreshRate)) {
            supportedRefreshRates.push(measuredRefreshRate);
            supportedRefreshRates.sort((a, b) => a - b);
          }
        }
        return;
      }
      
      // Limit measurement iterations
      if (frameCounter < 30) {
        requestAnimationFrame(measureFrameRate);
      }
    };
    
    requestAnimationFrame(measureFrameRate);

    return {
      refreshRate,
      supportedRefreshRates,
      supportsHighRefreshRate,
      isVariableRefreshRate
    };
  }

  private getOptimalConfig(): FrameRateConfig {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for power saving mode or low-end device
    const isLowPowerMode = this.isLowPowerDevice();
    
    let targetFPS = 60;
    let performanceMode: FrameRateConfig['performanceMode'] = 'balanced';

    if (this.capabilities.supportsHighRefreshRate && !isLowPowerMode && !prefersReducedMotion) {
      targetFPS = this.capabilities.refreshRate;
      performanceMode = 'high';
    } else if (isLowPowerMode) {
      targetFPS = 30;
      performanceMode = 'power-saver';
    }

    return {
      targetFPS,
      adaptiveAnimations: this.capabilities.isVariableRefreshRate,
      reducedMotion: prefersReducedMotion,
      performanceMode
    };
  }

  private isLowPowerDevice(): boolean {
    // Check various indicators of low-power devices
    const navigator = window.navigator as any;
    
    // Check for device memory API
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }
    
    // Check for hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    // Check connection type for mobile indicators
    if (navigator.connection) {
      const connection = navigator.connection;
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        return true;
      }
    }
    
    return false;
  }

  private init(): void {
    this.applyOptimizations();
    this.startFrameRateMonitoring();
    this.setupAdaptiveListeners();
  }

  private applyOptimizations(): void {
    // Apply CSS custom properties for frame rate aware animations
    document.documentElement.style.setProperty('--target-fps', this.config.targetFPS.toString());
    document.documentElement.style.setProperty('--frame-duration', `${1000 / this.config.targetFPS}ms`);
    
    // Set animation duration multipliers based on refresh rate
    const multiplier = this.config.targetFPS / 60;
    document.documentElement.style.setProperty('--animation-speed-multiplier', multiplier.toString());
    
    // Apply performance mode classes
    document.documentElement.setAttribute('data-performance-mode', this.config.performanceMode);
    document.documentElement.setAttribute('data-high-refresh', this.capabilities.supportsHighRefreshRate.toString());
    
    if (this.config.reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    }
  }

  private startFrameRateMonitoring(): void {
    let frames = 0;
    let lastMeasureTime = performance.now();
    
    const monitor = (currentTime: number) => {
      frames++;
      
      if (currentTime - lastMeasureTime >= 1000) {
        this.currentFPS = Math.round((frames * 1000) / (currentTime - lastMeasureTime));
        frames = 0;
        lastMeasureTime = currentTime;
        
        // Dispatch custom event with FPS data
        window.dispatchEvent(new CustomEvent('fpsUpdate', {
          detail: { fps: this.currentFPS, target: this.config.targetFPS }
        }));
      }
      
      this.rafId = requestAnimationFrame(monitor);
    };
    
    this.rafId = requestAnimationFrame(monitor);
  }

  private setupAdaptiveListeners(): void {
    // Listen for visibility changes to pause/resume monitoring
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      } else {
        if (!this.rafId) {
          this.startFrameRateMonitoring();
        }
      }
    });

    // Listen for reduced motion preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in event ? event.matches : reducedMotionQuery.matches;
      this.config.reducedMotion = matches;
      this.applyOptimizations();
    };

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  public getCapabilities(): DisplayCapabilities {
    return { ...this.capabilities };
  }

  public getConfig(): FrameRateConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<FrameRateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyOptimizations();
  }

  public destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// CSS Custom Properties for 120fps support
export const inject120FPSStyles = () => {
  const style = document.createElement('style');
  style.id = 'fps-optimization-styles';
  style.textContent = `
    :root {
      --target-fps: 60;
      --frame-duration: 16.67ms;
      --animation-speed-multiplier: 1;
    }

    /* High refresh rate optimizations */
    [data-high-refresh="true"] {
      --target-fps: 120;
      --frame-duration: 8.33ms;
      --animation-speed-multiplier: 2;
    }

    /* Performance mode specific optimizations */
    [data-performance-mode="high"] .transition-smooth {
      transition-duration: calc(var(--frame-duration) * 20);
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    [data-performance-mode="high"] .hover-lift:hover {
      transition-duration: calc(var(--frame-duration) * 12);
    }

    [data-performance-mode="high"] .animate-fade-in-up {
      animation-duration: calc(var(--frame-duration) * 36);
    }

    /* Reduced motion optimizations */
    [data-reduced-motion="true"] * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    /* GPU acceleration for high frame rate animations */
    [data-high-refresh="true"] .glass-card,
    [data-high-refresh="true"] .card-hover,
    [data-high-refresh="true"] .hover-lift {
      will-change: transform, opacity, box-shadow;
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000px;
    }

    /* Smooth 120fps animations */
    @keyframes smooth120fps-fadeIn {
      from { opacity: 0; transform: translateY(20px) translateZ(0); }
      to { opacity: 1; transform: translateY(0) translateZ(0); }
    }

    @keyframes smooth120fps-slideIn {
      from { transform: translateX(-100%) translateZ(0); }
      to { transform: translateX(0) translateZ(0); }
    }

    [data-high-refresh="true"] .stagger-animation > * {
      animation: smooth120fps-fadeIn calc(var(--frame-duration) * 36) cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    /* Optimized hover states for 120fps */
    [data-high-refresh="true"] .glass-card:hover {
      transition: 
        transform calc(var(--frame-duration) * 12) cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow calc(var(--frame-duration) * 12) cubic-bezier(0.4, 0, 0.2, 1),
        background-color calc(var(--frame-duration) * 12) cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Optimized scrolling for high refresh rates */
    [data-high-refresh="true"] .smooth-scroll {
      scroll-behavior: smooth;
      scroll-snap-type: y proximity;
      overscroll-behavior: contain;
    }

    /* Content visibility optimizations */
    [data-performance-mode="high"] .optimized-image {
      content-visibility: auto;
      contain-intrinsic-size: 280px 160px;
    }

    [data-performance-mode="high"] .car-card {
      contain: layout style paint;
    }

    /* Touch optimization for high refresh displays */
    @media (pointer: coarse) and (min-resolution: 2dppx) {
      [data-high-refresh="true"] button,
      [data-high-refresh="true"] [role="button"] {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      [data-high-refresh="true"] .touch-target {
        min-height: 48px;
        min-width: 48px;
      }
    }
  `;
  
  if (!document.head.querySelector('#fps-optimization-styles')) {
    document.head.appendChild(style);
  }
};

export default FrameRateOptimizer;