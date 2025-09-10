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
        manualChunks: (id) => {
          // Enhanced chunk splitting strategy
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Router 
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // UI libraries 
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Backend and data fetching
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'vendor-data';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns') || id.includes('zod')) {
              return 'vendor-utils';
            }
            // Charts and icons
            if (id.includes('recharts') || id.includes('lucide')) {
              return 'vendor-icons';
            }
            // Window virtualization
            if (id.includes('react-window')) {
              return 'vendor-virtual';
            }
            // Everything else
            return 'vendor-misc';
          }
          
          // App chunks
          if (id.includes('/hooks/')) {
            return 'app-hooks';
          }
          if (id.includes('/components/ui/')) {
            return 'app-ui-components';
          }
          if (id.includes('/components/')) {
            return 'app-components';
          }
          if (id.includes('/utils/')) {
            return 'app-utils';
          }
          if (id.includes('/pages/')) {
            return 'app-pages';
          }
        },
        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return `assets/js/[name]-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? [];
          const extType = info[info.length - 1];
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name ?? '')) {
            return 'assets/img/[name]-[hash].[ext]';
          }
          if (/\.(css)$/i.test(assetInfo.name ?? '')) {
            return 'assets/css/[name]-[hash].[ext]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/i.test(assetInfo.name ?? '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          
          return `assets/${extType}/[name]-[hash].[ext]`;
        }
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 800,
    // Enable advanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        arguments: true,
        drop_console: mode === 'production',
        drop_debugger: true,
        passes: 3, // More passes for better compression
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
      },
      mangle: {
        safari10: true,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
      },
    },
    // Target modern browsers for better optimization
    target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
    // Enable source maps only for development
    sourcemap: mode === 'development',
    // Optimize CSS
    cssMinify: true,
    // Enable module preload
    modulePreload: {
      polyfill: false
    },
    // Improve build performance
    reportCompressedSize: false,
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
  },
}));
