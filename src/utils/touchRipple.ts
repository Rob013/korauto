/**
 * Touch ripple effect utility for interactive elements
 * Creates a bright light animation on touch/click
 */

export const initializeTouchRipple = () => {
  // Handle touch/click ripple on filter panel and interactive elements
  const handleInteraction = (e: MouseEvent | TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (!target) return;

    // Get touch/click coordinates
    let clientX: number, clientY: number;
    
    if (e instanceof TouchEvent && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    // Calculate position relative to element
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Set CSS custom properties for ripple position
    target.style.setProperty('--touch-x', `${x}%`);
    target.style.setProperty('--touch-y', `${y}%`);

    // Create ripple element for immediate feedback
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple-effect';
    ripple.style.left = `${clientX - rect.left}px`;
    ripple.style.top = `${clientY - rect.top}px`;
    
    target.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // Add listeners to filter panel
  const filterPanel = document.querySelector('[data-filter-panel]');
  if (filterPanel) {
    filterPanel.addEventListener('touchstart', handleInteraction as EventListener, { passive: true });
    filterPanel.addEventListener('mousedown', handleInteraction as EventListener);
  }

  // Add listeners to buttons and interactive elements
  const interactiveElements = document.querySelectorAll('button, a[role="button"], .interactive-element');
  interactiveElements.forEach(element => {
    element.addEventListener('touchstart', handleInteraction as EventListener, { passive: true });
    element.addEventListener('mousedown', handleInteraction as EventListener);
  });
};

/**
 * Cleanup touch ripple listeners
 */
export const cleanupTouchRipple = () => {
  const filterPanel = document.querySelector('[data-filter-panel]');
  if (filterPanel) {
    filterPanel.removeEventListener('touchstart', () => {});
    filterPanel.removeEventListener('mousedown', () => {});
  }

  const interactiveElements = document.querySelectorAll('button, a[role="button"], .interactive-element');
  interactiveElements.forEach(element => {
    element.removeEventListener('touchstart', () => {});
    element.removeEventListener('mousedown', () => {});
  });
};
