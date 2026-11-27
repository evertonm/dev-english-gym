import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import App from './App'
import { CertificatePage } from './features/CertificatePage'
import { Landing } from './features/Landing'
import { ErrorBoundary } from './ErrorBoundary'
import { APP_HOME, legacyAppPath } from '../shared/routes'
import './gym/gym.css'

const legacyPath = legacyAppPath(location.pathname)
const returningFromLogin = location.pathname === '/' && new URLSearchParams(location.search).has('code')
if (legacyPath || returningFromLogin) {
  history.replaceState(history.state, '', (legacyPath ?? APP_HOME) + location.search + location.hash)
}

const showLanding = location.pathname === '/'
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
const convex = !showLanding && convexUrl ? new ConvexReactClient(convexUrl) : null

function Entry() {
  if (showLanding) {
    return (
      <div className="gym">
        <Landing
          onStart={() => location.assign(APP_HOME)}
          onLogin={() => location.assign(APP_HOME + '?entrar=1')}
        />
      </div>
    )
  }

  if (!convex) throw new Error('Defina VITE_CONVEX_URL (veja o README).')
  const certCode = /^\/certificado\/([a-z0-9]{10})\/?$/.exec(location.pathname)?.[1]
  return (
    <ConvexAuthProvider client={convex}>
      {certCode ? <CertificatePage code={certCode} /> : <App />}
    </ConvexAuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Entry />
    </ErrorBoundary>
  </StrictMode>,
)
