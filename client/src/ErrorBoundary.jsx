"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now(), // Unique ID for this error instance
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error("Error caught by boundary:", error, errorInfo)

    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(error, errorInfo)
    }
  }

  handleReload = () => {
    // Reset error state and reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
    window.location.reload()
  }

  handleGoBack = () => {
    // Reset error state and go back
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
    window.history.back()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Something went wrong</CardTitle>
              <CardDescription className="text-gray-600">
                We're sorry, but something unexpected happened while loading this page.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Details for Development */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    Error Details (Development Mode)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <strong className="text-sm font-medium text-gray-700">Error:</strong>
                      <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded mt-1">
                        {this.state.error.toString()}
                      </p>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-sm font-medium text-gray-700">Component Stack:</strong>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button variant="outline" onClick={this.handleGoBack} className="flex-1 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </div>

              {/* Additional Help */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support or try refreshing the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
