/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force a single React instance - use absolute paths
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      // Ensure jsx-runtime also resolves correctly
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime")
    },
    // Prevent multiple React instances
    dedupe: ['react', 'react-dom'],
    // Ensure proper module resolution
    preserveSymlinks: false
  },
  server: {
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '3000', 10),
    host: 'localhost',
    strictPort: false,
    hmr: false, // WebSocket/HMR disabled
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
      interval: 1000,
      // Ignore patterns to prevent unnecessary restarts
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.vite/**',
        '**/coverage/**',
        '**/.storybook/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}'
      ]
    },
    ...(process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_BASE_URL ? {
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_BASE_URL.replace('/api', ''),
          changeOrigin: true,
          secure: false,
          ws: false, // WebSocket disabled
        }
      }
    } : {})
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: id => {
          // CRITICAL: Keep React and React Router in the main bundle to prevent loading issues
          // DO NOT split React into a separate chunk - it must be available immediately
          // This prevents "Cannot read properties of null (reading 'useState')" and "useContext" errors
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react/jsx-runtime') || 
              id.includes('node_modules/react/jsx-dev-runtime') ||
              id.includes('node_modules/react-router-dom')) {
            // Return undefined to keep React and React Router in the main bundle
            return undefined;
          }
          // Simplified chunking strategy to avoid circular dependencies
          // Only chunk large, independent libraries
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-chart';
          }
          // Let Vite automatically handle all other node_modules chunking
          // This prevents circular dependency warnings
        }
      },
      // Ensure React is never externalized
      external: []
    },
    // Enable minification (use esbuild for better compatibility)
    minify: 'esbuild',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps for production (set to false for smaller bundles)
    sourcemap: false
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'react/jsx-dev-runtime', 
      'react-router-dom',
      'react-router-dom/dist/index.js',
      'axios'
    ],
    // Force resolution to prevent multiple React instances
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    // Force pre-bundling of React and React Router to ensure they're always available
    esbuildOptions: {
      jsx: 'automatic'
    },
    // Exclude React from being excluded (ensure it's always included)
    exclude: [],
    // Force re-optimization to ensure React is properly bundled
    // This ensures React is available before lazy-loaded components try to use it
    force: false,
    // Hold the server until dependencies are scanned
    holdUntilCrawlEnd: true
  },
  // Ensure commonjs interop for React
  ssr: {
    noExternal: ['react', 'react-dom']
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.js']
      }
    }]
  }
});