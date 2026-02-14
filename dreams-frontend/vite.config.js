/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  console.log('VITE_DISABLE_HMR:', env.VITE_DISABLE_HMR);

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        babel: {
          plugins: []
        }
      })
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
      port: parseInt(env.VITE_DEV_SERVER_PORT || '3000', 10),
      host: '127.0.0.1', // Use 127.0.0.1 instead of localhost for better Windows compatibility
      strictPort: false,
      // Allow ngrok and other proxy hosts
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.ngrok-free.dev',
        '.ngrok.io'
      ],
      // Properly configure HMR: use explicit config when enabled, false when disabled
      hmr: env.VITE_DISABLE_HMR === 'true' ? false : {
        protocol: 'ws',
        host: '127.0.0.1',
        port: parseInt(env.VITE_DEV_SERVER_PORT || '3000', 10),
      },
      watch: {
        usePolling: env.VITE_USE_POLLING === 'true',
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
      proxy: {
        '/api': {
          // ALWAYS proxy to local backend directly - never through ngrok
          // Ngrok is only for EXTERNAL access; local dev should use localhost
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          ws: false,
          // Timeout settings to prevent socket hang up errors
          timeout: 30000,
          proxyTimeout: 30000,
          // Configure error handling to avoid crashing on transient errors
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              console.warn('[Proxy Error]', err.message);
              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Backend server is not responding. Make sure php artisan serve is running on port 8000.' }));
              }
            });
          },
        }
      },
      // Headers for the main entry file (index.html)
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
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
  };
});
