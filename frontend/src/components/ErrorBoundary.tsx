import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * App-wide error boundary. Without one, any throw during render takes down
 * the whole tree and leaves a blank white screen. This catches render-phase
 * errors (a component blowing up on unexpected data, a bad popup, etc.) and
 * shows a recoverable fallback instead. (Note: it can't catch errors thrown
 * at module-import time, before React mounts — those need to be prevented at
 * the source.)
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-md w-full bg-paper-light border border-ink shadow-stamp p-6 -rotate-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bridge-700">
            Something broke
          </span>
          <h1 className="font-display font-black text-3xl text-ink leading-tight mt-2">
            This page hit a snag.
          </h1>
          <p className="text-[14px] leading-snug text-ink-soft mt-3">
            Sorry — something went wrong rendering this view. Reloading usually
            fixes it. If it keeps happening, let us know on Discord.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto bg-paper border border-ink/20 p-2 font-mono text-[11px] text-ink-mute whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 bg-ink text-paper-light px-4 py-2 border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:bg-bridge-500 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
