/**
 * Touch interaction enhancements for mobile devices
 */

/**
 * Add haptic feedback for supported devices
 */
export const triggerHapticFeedback = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30
    };
    navigator.vibrate(patterns[style]);
  }
};

/**
 * Prevent double-tap zoom on mobile
 */
export const preventDoubleTapZoom = (element: HTMLElement) => {
  let lastTap = 0;
  
  element.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault();
    }
    
    lastTap = currentTime;
  }, { passive: false });
};

/**
 * Enhanced touch ripple effect
 */
export const createRippleEffect = (
  event: React.TouchEvent | React.MouseEvent,
  element: HTMLElement
) => {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  
  const size = Math.max(rect.width, rect.height);
  const x = clientX - rect.left - size / 2;
  const y = clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.classList.add('ripple-effect');

  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
};

/**
 * Optimize touch events for better performance
 */
export const optimizeTouchEvents = (element: HTMLElement) => {
  // Add passive event listeners for better scroll performance
  element.addEventListener('touchstart', () => {}, { passive: true });
  element.addEventListener('touchmove', () => {}, { passive: true });
  element.addEventListener('touchend', () => {}, { passive: true });
  
  // Prevent momentum scrolling interference
  (element.style as any).webkitOverflowScrolling = 'touch';
  
  // Optimize for touch
  element.style.touchAction = 'manipulation';
};

/**
 * Smooth button press animation
 */
export const addPressAnimation = (button: HTMLElement) => {
  button.addEventListener('touchstart', () => {
    button.style.transform = 'scale(0.96) translate3d(0, 0, 0)';
    button.style.transition = 'transform 0.1s cubic-bezier(0.22, 1, 0.36, 1)';
  }, { passive: true });

  button.addEventListener('touchend', () => {
    button.style.transform = 'scale(1) translate3d(0, 0, 0)';
  }, { passive: true });
};
