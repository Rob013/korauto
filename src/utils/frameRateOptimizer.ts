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

    // Try to detect actual refresh rate using various methods
    if ('screen' in window) {
      // Method 1: Screen API (experimental)
      const screen = window.screen as any;
      if (screen.getDisplayMedia || screen.orientation?.angle !== undefined) {
        // Estimate based on typical high-refresh displays
        if (window.devicePixelRatio >= 2) {
          refreshRate = 120; // Assume high-refresh on high-DPI displays
          supportedRefreshRates = [60, 90, 120];
          supportsHighRefreshRate = true;
        }
      }
    }

    // Method 2: User agent detection for known high-refresh devices
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iPhone 13 Pro and later, iPad Pro with ProMotion
      if (userAgent.includes('iphone') && parseInt(userAgent.match(/os (\d+)/)?.[1] || '0') >= 15) {
        refreshRate = 120;
        supportedRefreshRates = [60, 120];
        supportsHighRefreshRate = true;
        isVariableRefreshRate = true; // ProMotion is adaptive
      }
    } else if (userAgent.includes('android')) {
      // Many modern Android devices support 90/120Hz
      refreshRate = 90; // Conservative estimate
      supportedRefreshRates = [60, 90, 120];
      supportsHighRefreshRate = true;
    }

    // Method 3: Performance-based estimation
    const startTime = performance.now();
    let frameCounter = 0;
    
    const measureFrameRate = () => {
      frameCounter++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= 100) { // 100ms sample
        const measuredFPS = Math.round((frameCounter * 1000) / (currentTime - startTime));
        if (measuredFPS > 60) {
          refreshRate = Math.min(measuredFPS, 120);
          supportsHighRefreshRate = true;
        }
        return;
      }
      
      if (frameCounter < 20) { // Limit measurement
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

    // Enhanced adaptive animations based on device capabilities
    this.applyAdaptiveAnimations();
  }

  private applyAdaptiveAnimations(): void {
    const root = document.documentElement;
    
    // Adaptive transition durations based on refresh rate and performance
    const baseDuration = this.config.targetFPS >= 120 ? 0.15 : 0.25;
    const fastDuration = this.config.targetFPS >= 120 ? 0.1 : 0.15;
    const slowDuration = this.config.targetFPS >= 120 ? 0.3 : 0.4;
    
    root.style.setProperty('--transition-fast', `${fastDuration}s`);
    root.style.setProperty('--transition-base', `${baseDuration}s`);
    root.style.setProperty('--transition-slow', `${slowDuration}s`);
    
    // Adaptive easing functions
    if (this.config.targetFPS >= 120) {
      root.style.setProperty('--ease-smooth', 'cubic-bezier(0.25, 0.46, 0.45, 0.94)');
      root.style.setProperty('--ease-bounce', 'cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    } else {
      root.style.setProperty('--ease-smooth', 'cubic-bezier(0.4, 0, 0.2, 1)');
      root.style.setProperty('--ease-bounce', 'cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    }
    
    // Performance-based animation complexity
    if (this.config.performanceMode === 'high') {
      root.style.setProperty('--animation-complexity', '1');
    } else if (this.config.performanceMode === 'power-saver') {
      root.style.setProperty('--animation-complexity', '0.5');
    } else {
      root.style.setProperty('--animation-complexity', '0.75');
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
    reducedMotionQuery.addEventListener('change', (e) => {
      this.config.reducedMotion = e.matches;
      this.applyOptimizations();
    });
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