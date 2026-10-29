/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // React loads its production build (which has no act) if the shell has NODE_ENV=production.
    env: { NODE_ENV: 'test' },
  },
});
