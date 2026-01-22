import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: isProd ? '/wall-go/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    // Use an absolute path resolved from the project directory.
    // Avoid leading '/' string which can be interpreted as filesystem root in some environments.
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
