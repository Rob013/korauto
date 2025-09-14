# KORAUTO 120fps Performance & Accessibility Guide

## Overview

KORAUTO now includes comprehensive performance optimizations targeting 120fps support on capable devices while maintaining full accessibility compliance. This guide explains how to use and benefit from these enhancements.

## 🚀 120fps Performance Features

### Automatic Device Detection

The system automatically detects your device's capabilities:

- **Refresh Rate Detection**: Identifies 60Hz, 90Hz, 120Hz displays
- **Performance Mode**: Automatically selects optimal settings
- **Adaptive Animations**: Adjusts animation speed for smooth 120fps
- **Memory Management**: Optimizes for device memory constraints

### Performance Modes

1. **High Performance** (120fps capable devices)
   - Targets 120fps for ultra-smooth animations
   - GPU-accelerated transitions
   - Enhanced touch responsiveness

2. **Balanced** (Standard devices)
   - Targets 60fps with optimized performance
   - Balanced battery usage
   - Smooth user experience

3. **Power Saver** (Low-end devices)
   - Targets 30fps to preserve battery
   - Reduced animations
   - Optimized for efficiency

### Visual Indicators

- **Performance Monitor**: Bottom-right corner shows real-time FPS
- **High Refresh Badge**: Displays when 120fps mode is active
- **Efficiency Rating**: Shows performance optimization status

## ♿ Accessibility Features

### Keyboard Navigation

- **Skip Links**: Press Tab to access skip navigation
- **Arrow Keys**: Navigate card grids with arrow keys
- **Escape Key**: Close modals and dropdowns
- **Alt+M**: Jump to main content
- **Ctrl/Cmd+K**: Focus search

### Screen Reader Support

- **Dynamic Announcements**: Status updates announced automatically
- **Semantic Markup**: Proper ARIA labels and roles
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Descriptive alt text for all images

### Reduced Motion

- **Automatic Detection**: Respects `prefers-reduced-motion`
- **Minimal Animations**: Reduced motion for vestibular disorders
- **Instant Transitions**: No motion when preferred

## 📱 Mobile Optimizations

### Touch Enhancements

- **44px Touch Targets**: Meets accessibility guidelines
- **120fps Touch**: Ultra-responsive on high refresh displays
- **Haptic Feedback**: Enhanced touch feedback (where supported)
- **Gesture Optimization**: Smooth swipes and scrolling

### Layout Stability

- **Content Visibility**: Off-screen content optimized
- **Layout Containment**: Prevents layout shifts
- **Fixed Dimensions**: Stable card layouts
- **Safe Area Support**: iPhone notch compatibility

## 🔧 Developer Features

### Performance Monitoring

Access the performance dashboard at `/performance` or through the floating monitor:

```tsx
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

// Show detailed performance dashboard
<PerformanceMonitor showDetails={true} />
```

### Frame Rate Hook

Monitor and control frame rate in components:

```tsx
import { useFrameRate } from '@/hooks/useFrameRate';

function MyComponent() {
  const { 
    currentFPS, 
    targetFPS, 
    supportsHighRefreshRate 
  } = useFrameRate();
  
  return (
    <div>
      Current: {currentFPS}fps / Target: {targetFPS}fps
      {supportsHighRefreshRate && <Badge>120fps Ready</Badge>}
    </div>
  );
}
```

### Frame Rate Optimizer

Direct control over performance settings:

```tsx
import FrameRateOptimizer from '@/utils/frameRateOptimizer';

const optimizer = FrameRateOptimizer.getInstance();

// Update performance mode
optimizer.updateConfig({
  targetFPS: 90,
  performanceMode: 'high'
});

// Get device capabilities
const capabilities = optimizer.getCapabilities();
console.log('Refresh rate:', capabilities.refreshRate);
```

### Accessibility Enhancer

Enhance accessibility programmatically:

```tsx
import { AccessibilityEnhancer } from '@/utils/accessibilityEnhancer';

const enhancer = AccessibilityEnhancer.getInstance();

// Add announcements
enhancer.announce('Page loaded successfully', 'polite');

// Initialize enhancements
enhancer.init();
```

## 🎨 CSS Classes

### Performance Classes

```css
/* GPU-accelerated animations */
.animation-120fps {
  will-change: transform, opacity;
  transform: translateZ(0);
}

/* Performance-optimized cards */
.performance-card {
  contain: layout style paint;
  will-change: transform, opacity;
}

/* Layout stability */
.layout-stable {
  contain: size layout;
}
```

### Device-Specific Styles

```css
/* High refresh rate displays */
[data-high-refresh="true"] .smooth-animation {
  transition-duration: 8.33ms; /* 120fps timing */
}

/* Reduced motion users */
[data-reduced-motion="true"] * {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

## 🛠️ Configuration

### CSS Custom Properties

Automatically set based on device capabilities:

```css
:root {
  --target-fps: 60; /* Auto-detected */
  --frame-duration: 16.67ms; /* Calculated */
  --animation-speed-multiplier: 1; /* Performance scaling */
}
```

### Service Worker Caching

Performance-critical assets are cached with priority:

- **Frame Rate Optimizer**: Immediate cache response
- **UI Components**: Optimized caching strategy
- **Images**: Stale-while-revalidate for smooth loading

## 📊 Performance Metrics

The system tracks and displays:

- **Frame Rate**: Real-time FPS monitoring
- **Memory Usage**: JavaScript heap utilization
- **Layout Shifts**: Cumulative layout shift score
- **Load Times**: Asset loading performance
- **Energy Efficiency**: Battery optimization rating

## 🔍 Debugging

### Development Tools

1. **Performance Monitor**: Real-time metrics display
2. **Console Logging**: Device capability information
3. **CSS Classes**: Visual debugging with data attributes
4. **Test Suite**: Comprehensive performance tests

### Common Issues

**Low FPS on High Refresh Displays:**
- Check device memory constraints
- Verify GPU acceleration is enabled
- Review complex animations

**Accessibility Issues:**
- Ensure proper ARIA labels
- Test keyboard navigation
- Verify screen reader compatibility

## 🧪 Testing

Run performance tests:

```bash
npm run test src/tests/performance.test.ts
```

Test coverage includes:
- Frame rate optimization
- Accessibility compliance
- Service worker functionality
- CSS performance classes

## 🌟 Best Practices

1. **Use Provided Classes**: Leverage performance-optimized CSS classes
2. **Monitor Performance**: Check the performance dashboard regularly
3. **Test on Devices**: Verify on actual high refresh rate devices
4. **Accessibility First**: Ensure all features work with assistive technology
5. **Progressive Enhancement**: Features degrade gracefully on older devices

## 📈 Results

Expected improvements:
- **120fps**: Smooth animations on capable devices
- **Reduced Jank**: Stable 60fps minimum on all devices
- **Better Accessibility**: WCAG 2.1 AA compliance
- **Faster Loading**: Optimized caching and asset delivery
- **Mobile Experience**: Enhanced touch responsiveness

---

*This optimization maintains 100% of existing functionality while adding significant performance and accessibility improvements.*