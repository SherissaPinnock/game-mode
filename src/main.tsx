import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PerformanceProvider } from './lib/performance'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PerformanceProvider>
        <App />
      </PerformanceProvider>
    </BrowserRouter>
  </StrictMode>,
)
