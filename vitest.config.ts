import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vitest uses the Vite resolver under the hood, but some setups need explicit alias
// mapping in vitest config to align with tsconfig paths. Ensure '@' resolves to src.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
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
