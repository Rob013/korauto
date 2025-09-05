/**
 * Debug utility to help identify module loading issues
 */

console.log('🔧 Debug module loaded');

// Check if we're in development mode
export const isDev = process.env.NODE_ENV === 'development';

// Log module loading
export const logModuleLoad = (moduleName: string) => {
  if (isDev) {
    console.log(`📦 Module loaded: ${moduleName}`);
  }
};

// Log component render
export const logComponentRender = (componentName: string) => {
  if (isDev) {
    console.log(`🎨 Component rendered: ${componentName}`);
  }
};

// Export check
if (typeof window !== 'undefined') {
  console.log('✅ Debug module available in browser');
}