import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './App.tsx'
import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </HelmetProvider>,
)
