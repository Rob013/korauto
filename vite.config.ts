import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'lovable-uploads/**/*'],
      manifest: {
        name: 'KORAUTO - Premium Cars from South Korea',
        short_name: 'KORAUTO',
        description: 'Find your perfect car from South Korea with best price and quality',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/7a3e2aa4-2a3b-4320-b33c-72d3d7721cfd.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/iyezkczshcgbcgpswpyg\.supabase\.co\/rest\/v1\/cars.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cars-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/iyezkczshcgbcgpswpyg\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 2 // 2 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      }
    })
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
          // Core React libraries
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
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
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
