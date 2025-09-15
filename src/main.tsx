import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { useAuth } from './store/authStore'

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, []); // Remove dependency to prevent infinite calls

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppInitializer>
        <App />
      </AppInitializer>
    </BrowserRouter>
  </StrictMode>,
)
