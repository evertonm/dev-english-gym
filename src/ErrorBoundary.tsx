import { Component, type ReactNode } from 'react'

// A crash anywhere (for example a server function missing for a moment during a deploy)
// must never leave a blank page: reload once automatically, then offer a button.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error(error)
    try {
      const last = Number(sessionStorage.getItem('devenglish-autoreload') || 0)
      if (Date.now() - last > 30_000) {
        sessionStorage.setItem('devenglish-autoreload', String(Date.now()))
        setTimeout(() => window.location.reload(), 1200)
      }
    } catch {
      /* storage unavailable */
    }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="crash">
        <p className="crash-t">Ops, algo travou.</p>
        <p>Seu progresso está salvo. Recarregue para continuar.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </div>
    )
  }
}
