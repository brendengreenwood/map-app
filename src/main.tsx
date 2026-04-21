import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserProvider } from '@/hooks/use-users'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </UserProvider>
  </StrictMode>,
)
