import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PerformanceProvider } from './lib/performance'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PerformanceProvider>
      <App />
    </PerformanceProvider>
  </StrictMode>,
)
