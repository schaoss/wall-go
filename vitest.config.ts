import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
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
})
