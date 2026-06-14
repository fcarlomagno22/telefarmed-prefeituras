import { Component, type ErrorInfo, type ReactNode } from 'react'

type RouteErrorBoundaryProps = {
  children: ReactNode
  title?: string
}

type RouteErrorBoundaryState = {
  error: Error | null
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-gray-900">
          {this.props.title ?? 'Não foi possível carregar esta página'}
        </h1>
        <p className="mt-2 max-w-lg text-sm text-gray-600">
          Ocorreu um erro inesperado ao renderizar o conteúdo. Tente recarregar ou volte ao menu
          anterior.
        </p>
        <p className="mt-4 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-xs text-red-800">
          {error.message}
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Tentar novamente
        </button>
      </div>
    )
  }
}
