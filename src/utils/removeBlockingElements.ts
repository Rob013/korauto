/**
 * Utility to remove any elements that might be blocking user interaction
 * This runs on page load to ensure the page is always interactive
 */

export const removeBlockingElements = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => removeBlockingElements());
    return;
  }

  console.log('🔍 Checking for blocking elements...');

  // 1. Remove any full-screen overlays that shouldn't be there
  const suspiciousOverlays = document.querySelectorAll('[style*="position: fixed"][style*="inset: 0"], [style*="position: absolute"][style*="inset: 0"]');
  suspiciousOverlays.forEach((el) => {
    const element = el as HTMLElement;
    const zIndex = parseInt(window.getComputedStyle(element).zIndex || '0');
    const opacity = parseFloat(window.getComputedStyle(element).opacity || '1');
    const pointerEvents = window.getComputedStyle(element).pointerEvents;
    
    // If it's a high z-index overlay with no content, it might be blocking
    if (zIndex > 1000 && (!element.children.length || opacity === 0) && pointerEvents !== 'none') {
      console.warn('⚠️ Found suspicious blocking overlay:', element);
      element.style.pointerEvents = 'none';
    }
  });

  // 2. Force pointer-events: auto on body and root
  document.body.style.pointerEvents = 'auto';
  document.body.style.touchAction = 'auto';
  const root = document.getElementById('root');
  if (root) {
    root.style.pointerEvents = 'auto';
    root.style.touchAction = 'auto';
  }
  document.documentElement.style.pointerEvents = 'auto';
  document.documentElement.style.touchAction = 'auto';

  // 3. Check for any elements with pointer-events: none on body
  const bodyPointerEvents = window.getComputedStyle(document.body).pointerEvents;
  if (bodyPointerEvents === 'none') {
    console.error('❌ FOUND ISSUE: Body has pointer-events: none!');
    document.body.style.setProperty('pointer-events', 'auto', 'important');
  }

  // 4. Find all fixed position elements and log them
  const fixedElements = document.querySelectorAll('*');
  const blockingElements: HTMLElement[] = [];
  
  fixedElements.forEach((el) => {
    const element = el as HTMLElement;
    const style = window.getComputedStyle(element);
    
    if (style.position === 'fixed' || style.position === 'absolute') {
      const rect = element.getBoundingClientRect();
      const zIndex = parseInt(style.zIndex || '0');
      
      // If it covers most of the screen and has high z-index
      if (rect.width > window.innerWidth * 0.8 && 
          rect.height > window.innerHeight * 0.8 && 
          zIndex > 100) {
        blockingElements.push(element);
      }
    }
  });

  if (blockingElements.length > 0) {
    console.warn('⚠️ Found potential blocking elements:', blockingElements);
    blockingElements.forEach(el => {
      console.log('Element:', el.tagName, el.className, el.id, {
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        opacity: window.getComputedStyle(el).opacity,
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility
      });
    });
  }

  // 5. Ensure all buttons and links are interactive
  const buttons = document.querySelectorAll('button, a, [role="button"]');
  buttons.forEach(btn => {
    const element = btn as HTMLElement;
    if (window.getComputedStyle(element).pointerEvents === 'none') {
      console.warn('⚠️ Found non-interactive button/link:', element);
      element.style.pointerEvents = 'auto';
    }
  });

  console.log('✅ Blocking elements check complete');
};

// Auto-run on import
if (typeof window !== 'undefined') {
  removeBlockingElements();
  
  // Also run after a short delay to catch any dynamic elements
  setTimeout(removeBlockingElements, 1000);
  setTimeout(removeBlockingElements, 3000);
}
