import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Default to node for Server Actions, Models, Services
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
    alias: [
      { find: 'next/server', replacement: 'next/server.js' },
      { find: '@/auth.config', replacement: path.resolve(import.meta.dirname, './auth.config.ts') },
      { find: '@/auth', replacement: path.resolve(import.meta.dirname, './auth.ts') },
      { find: '@', replacement: path.resolve(import.meta.dirname, './src') }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'tests/**',
        'scripts/**',
        '*.config.*',
        'proxy.ts'
      ]
    }
  }
});
