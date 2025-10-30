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
        manualChunks: (id) => {
          // More aggressive code splitting for reduced main thread work
          if (id.includes('node_modules')) {
            // Core React - keep together for optimal loading
            if (id.includes('react') && !id.includes('react-router')) {
              return 'vendor-react';
            }
            // Router separate for route-based lazy loading
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Split Radix UI by functionality
            if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu')) {
              return 'ui-overlay';
            }
            if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-tabs')) {
              return 'ui-interactive';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-base';
            }
            // Backend libs
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Icons separate (large)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Charts separate (large)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // Utilities
            if (id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
            // Other node_modules
            return 'vendor-misc';
          }
          
          // Split pages by route for better lazy loading
          if (id.includes('src/pages/')) {
            const pageName = id.split('src/pages/')[1].split('.')[0].toLowerCase();
            return `page-${pageName}`;
          }
          
          // Split large components
          if (id.includes('src/components/') && id.includes('Catalog')) {
            return 'comp-catalog';
          }
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
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
    exclude: ['lucide-react'], // Exclude large icon library - lazy load instead
    esbuildOptions: {
      target: 'es2020', // Modern target for better performance
    },
  },
  // Add polyfill configuration for legacy browsers
  define: {
    global: 'globalThis',
  },
}));
