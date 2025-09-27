import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable gzip compression and optimize chunks
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Ensure ES module format for better compatibility
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          // Core React libraries - keep together to prevent multiple instances
          vendor: ['react', 'react-dom'],
          // Router in separate chunk for better caching
          router: ['react-router-dom'],
          // UI libraries split into smaller chunks
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'ui-tabs': ['@radix-ui/react-tabs', '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog'],
          'ui-form': ['@radix-ui/react-label', '@radix-ui/react-checkbox', '@radix-ui/react-radio-group'],
          // Backend and data fetching
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          // Utility libraries
          utils: ['clsx', 'tailwind-merge', 'date-fns', 'zod'],
          // Charts and visualization (if used heavily)
          charts: ['recharts'],
        },
      },
      // Add external dependencies that should not be bundled
      external: [],
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
    },
    // Target more compatible browsers to avoid ES module import errors
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari12'],
    // Enable source maps for production debugging
    sourcemap: mode !== 'production',
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
    // Force single React instance to prevent dispatcher issues
    force: true,
    // Add polyfills for better browser compatibility
    esbuildOptions: {
      target: 'es2015',
    },
  },
  // Add polyfill configuration for legacy browsers
  define: {
    global: 'globalThis',
  },
}));
