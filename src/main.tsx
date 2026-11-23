import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import './gym/gym.css'

const url = import.meta.env.VITE_CONVEX_URL as string | undefined
if (!url) {
  throw new Error('Defina VITE_CONVEX_URL (veja o README).')
}
const convex = new ConvexReactClient(url)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
