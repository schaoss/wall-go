import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        { browser: 'chromium' },
      ],
    },
    globals: true,
    setupFiles: [],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/assets/*',
        '**/*.test.{ts,tsx}',
        '**/types.ts',
      ],
    },
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
