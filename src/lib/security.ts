// Security utility functions

/**
 * Escape HTML to prevent XSS attacks
 */
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Validate URL to prevent open redirect attacks
 */
export const isValidUrl = (url: string, allowedDomains: string[] = ['wa.me']): boolean => {
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

/**
 * Generate secure random ID for CSRF protection
 */
export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Simple XSS protection for text content
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&#x27;';
        case '"': return '&quot;';
        default: return char;
      }
    });
};

/**
 * Content Security Policy helper
 */
export const setCSPHeaders = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://wa.me; font-src 'self'; object-src 'none';";
  document.head.appendChild(meta);
};

/**
 * Prevent clickjacking
 */
export const preventClickjacking = () => {
  if (window.top !== window.self) {
    window.top!.location = window.self.location;
  }
};

/**
 * Initialize security measures
 */
export const initSecurity = () => {
  // Prevent clickjacking
  preventClickjacking();
  
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable F12 and common developer shortcuts in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
};