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
    // Enhanced CSS code splitting for better caching
    cssCodeSplit: true,
    // Advanced chunk splitting for optimal loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries - most stable, cache longest
          vendor: ['react', 'react-dom'],
          // Router in separate chunk for better caching
          router: ['react-router-dom'],
          // UI libraries split for better tree shaking
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'ui-tabs': ['@radix-ui/react-tabs', '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog'],
          'ui-form': ['@radix-ui/react-label', '@radix-ui/react-checkbox', '@radix-ui/react-radio-group'],
          // Backend and data fetching
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          // Utility libraries
          utils: ['clsx', 'tailwind-merge', 'date-fns', 'zod'],
          // Charts and visualization
          charts: ['recharts'],
          // Performance monitoring utilities
          performance: ['@/utils/performanceAudit', '@/utils/accessibility', '@/utils/imageOptimization']
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/${chunkInfo.name || facadeModuleId}-[hash].js`;
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        }
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enhanced minification for maximum compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        passes: 3, // More passes for better compression
        pure_funcs: ['console.log', 'console.warn'], // Remove specific console calls
        unsafe_comps: true, // Unsafe optimizations for better compression
        unsafe_math: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
        properties: {
          // Mangle property names for better compression
          regex: /^_/, // Only mangle properties starting with _
        },
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Target modern browsers for better optimization
    target: ['es2020', 'chrome80', 'firefox78', 'safari14', 'edge88'],
    // Enable source maps only in development
    sourcemap: mode === 'development',
    // Optimize CSS
    cssMinify: true,
    // Enable build performance reporting
    reportCompressedSize: true,
  },
  // Enhanced dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'clsx',
      'tailwind-merge',
      'lucide-react',
    ],
    // Force pre-bundling of these dependencies
    force: mode === 'development',
  },
  // Enhanced CSS optimization
  css: {
    postcss: {
      plugins: [
        // Add CSS optimization plugins if needed
      ],
    },
    // Enable CSS modules optimization
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Performance optimizations
  define: {
    // Remove development-only code in production
    __DEV__: mode === 'development',
  },
  // Enhanced asset handling
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
}));
