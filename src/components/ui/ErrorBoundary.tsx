import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import GameButton from './GameButton'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
      <div className="mb-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-red-600 dark:text-red-400">
          {t('error.somethingWentWrong')}
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">{t('error.unexpectedError')}</p>
      </div>

      {error && (
        <details className="mb-4 max-w-md overflow-auto rounded bg-gray-100 p-4 text-left text-sm dark:bg-gray-700">
          <summary className="cursor-pointer font-semibold text-gray-800 dark:text-gray-200">
            {t('error.details')}
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-300">
            {error.toString()}
          </pre>
        </details>
      )}

      <GameButton onClick={onReset} variant="primary">
        {t('error.tryAgain')}
      </GameButton>
    </div>
  )
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryComponent fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryComponent>
  )
}
