# 120fps High Refresh Rate Support

## Overview

KORAUTO now supports 120fps high refresh rate displays for smoother animations and enhanced performance. The system automatically detects device capabilities and optimizes animations accordingly.

## Features

### 🚀 Automatic Device Detection
- Detects display refresh rate capabilities (60fps, 90fps, 120fps)
- Identifies device type and performance characteristics
- Automatically selects optimal frame rate settings

### ⚡ Performance Optimizations
- GPU-accelerated animations using CSS `transform3d`
- Adaptive frame rate management based on performance
- Battery-aware optimizations for mobile devices
- Reduced motion support for accessibility

### 🎛️ User Controls
- Enable/disable high refresh rate mode
- Target frame rate selection (60fps, 90fps, 120fps)
- Performance mode selection (Auto, Performance, Battery Saver)
- Adaptive frame rate toggle

### 📊 Real-time Monitoring
- Live frame rate display
- Performance metrics tracking
- Dropped frame detection
- Optimization recommendations

## How to Use

### 1. Access Settings
Visit `/high-refresh-rate` or use the floating performance widget to access 120fps settings.

### 2. Demo Page
Visit `/120fps-demo` to see interactive demonstrations of high refresh rate animations.

### 3. Automatic Optimization
The system automatically applies optimizations to supported components like:
- Car cards with smooth hover animations
- Navigation transitions
- Image loading animations
- Scroll performance

## Technical Implementation

### Core Components

1. **High Refresh Rate Manager** (`src/utils/highRefreshRate.ts`)
   - Device capability detection
   - Animation frame management
   - Performance monitoring

2. **React Hooks** (`src/hooks/useHighRefreshRate.ts`)
   - `useHighRefreshRateCapabilities()` - Device detection
   - `useHighRefreshRateSettings()` - Settings management
   - `useHighRefreshRateAnimation()` - Animation callbacks
   - `useHighRefreshRatePerformance()` - Performance monitoring

3. **Optimization Components** (`src/components/HighRefreshRateOptimizer.tsx`)
   - `withHighRefreshRate()` - HOC for component optimization
   - `HighRefreshRateContainer` - Container-level optimizations
   - `useHighRefreshRateOptimization()` - Manual optimization hook

### CSS Optimizations

The system includes specialized CSS classes for high refresh rate displays:

```css
/* High refresh rate optimizations */
.high-refresh-rate-optimized {
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}

/* 120fps specific animations */
.fps-120-optimized {
  transition-duration: 8ms;
  transition-timing-function: linear;
}

/* Adaptive frame rate support */
.adaptive-frame-rate {
  animation-duration: calc(1000ms / var(--screen-refresh-rate, 60));
}
```

### Device Support

#### Supported Devices
- iPhone Pro models (120Hz ProMotion)
- iPad Pro models (120Hz)
- Android devices with high refresh rate displays
- Desktop monitors with 120Hz+ capability

#### Performance Requirements
- Minimum 4GB RAM
- 4+ CPU cores
- Modern browser with ES6 support

## Usage Examples

### Basic Component Optimization

```tsx
import { withHighRefreshRate } from '@/components/HighRefreshRateOptimizer';

const OptimizedCard = withHighRefreshRate(Card, {
  priority: 'high',
  animationTypes: ['hover', 'transition']
});
```

### Manual Optimization

```tsx
import { useHighRefreshRateOptimization } from '@/components/HighRefreshRateOptimizer';

const MyComponent = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { isHighRefreshEnabled } = useHighRefreshRateOptimization(
    elementRef,
    { priority: 'medium' }
  );
  
  return (
    <div 
      ref={elementRef}
      className={isHighRefreshEnabled ? 'high-refresh-card' : ''}
    >
      Content
    </div>
  );
};
```

### Container-level Optimization

```tsx
import { HighRefreshRateContainer } from '@/components/HighRefreshRateOptimizer';

const MyPage = () => (
  <HighRefreshRateContainer priority="high">
    <div>All children will be optimized automatically</div>
  </HighRefreshRateContainer>
);
```

## Performance Metrics

The system tracks several key metrics:

- **Frame Rate**: Current fps achieved
- **Frame Time**: Time per frame in milliseconds
- **Dropped Frames**: Number of missed frames
- **Target vs Actual**: Comparison of target and achieved frame rates

## Browser Compatibility

### Supported Browsers
- Chrome 63+ (full support)
- Firefox 60+ (full support)
- Safari 11.1+ (full support)
- Edge 79+ (full support)

### Fallback Behavior
- Devices without high refresh rate support automatically use 60fps optimizations
- Older browsers gracefully degrade to standard animations
- Battery saver mode automatically reduces frame rates

## Best Practices

### For Developers

1. **Use the HOC for new components**:
   ```tsx
   const OptimizedComponent = withHighRefreshRate(YourComponent);
   ```

2. **Apply container optimization for page-level improvements**:
   ```tsx
   <HighRefreshRateContainer priority="medium">
     <YourPageContent />
   </HighRefreshRateContainer>
   ```

3. **Monitor performance with the floating widget**:
   - Enable in development mode
   - Check for dropped frames
   - Verify optimal performance

4. **Respect user preferences**:
   - Honor `prefers-reduced-motion`
   - Provide battery saver options
   - Allow manual frame rate control

### For Users

1. **Enable high refresh rate mode** in settings for smoother animations
2. **Use adaptive frame rate** for automatic performance optimization
3. **Enable battery saver mode** on mobile devices to preserve battery life
4. **Monitor performance** using the floating widget to ensure optimal experience

## Troubleshooting

### Common Issues

**Q: 120fps mode is not available**
- Check if your device supports high refresh rates
- Ensure you're using a compatible browser
- Verify hardware acceleration is enabled

**Q: Poor performance with high frame rates**
- Enable adaptive frame rate mode
- Reduce target frame rate to 90fps or 60fps
- Enable battery saver mode
- Close other applications

**Q: Animations appear choppy**
- Check for dropped frames in the performance monitor
- Verify GPU acceleration is working
- Reduce animation complexity

### Performance Optimization Tips

1. **Use transform instead of changing layout properties**
2. **Enable GPU acceleration with `transform3d(0,0,0)`**
3. **Limit the number of concurrent animations**
4. **Use `will-change` property judiciously**
5. **Profile performance regularly with the built-in tools**

## Future Enhancements

- Variable refresh rate support
- ML-based performance prediction
- Advanced battery optimization
- Cross-platform native app support
- WebGL-based animations for complex effects

## Links

- [Demo Page](/120fps-demo)
- [Settings](/high-refresh-rate)
- [Performance Dashboard](/performance)
- [GitHub Repository](https://github.com/Rob013/korauto)

---

*This feature requires a modern device with high refresh rate display support. The system automatically detects capabilities and provides the best possible experience on your device.*