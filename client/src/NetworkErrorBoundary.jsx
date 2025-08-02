"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react"

class NetworkErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasNetworkError: false,
      isOnline: navigator.onLine,
      retryCount: 0,
      maxRetries: 3,
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline)
    window.addEventListener("offline", this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.handleOnline)
    window.removeEventListener("offline", this.handleOffline)
  }

  handleOnline = () => {
    this.setState({ isOnline: true, hasNetworkError: false })
  }

  handleOffline = () => {
    this.setState({ isOnline: false, hasNetworkError: true })
  }

  static getDerivedStateFromError(error) {
    // Check if it's a network-related error
    if (error.name === "AxiosError" && error.code === "ERR_NETWORK") {
      return { hasNetworkError: true }
    }
    return null
  }

  componentDidCatch(error, errorInfo) {
    if (error.name === "AxiosError" && error.code === "ERR_NETWORK") {
      console.error("Network error caught:", error)
    }
  }

  handleRetry = () => {
    const { retryCount, maxRetries } = this.state

    if (retryCount < maxRetries) {
      this.setState({
        hasNetworkError: false,
        retryCount: retryCount + 1,
      })

      // Attempt to reload the component
      if (this.props.onRetry) {
        this.props.onRetry()
      } else {
        window.location.reload()
      }
    }
  }

  render() {
    const { hasNetworkError, isOnline, retryCount, maxRetries } = this.state

    if (hasNetworkError || !isOnline) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Connection Problem</CardTitle>
              <CardDescription className="text-gray-600">
                {!isOnline
                  ? "You appear to be offline. Please check your internet connection."
                  : "Unable to connect to the server. Please try again."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!isOnline && (
                <Alert>
                  <Wifi className="h-4 w-4" />
                  <AlertDescription>Waiting for internet connection to be restored...</AlertDescription>
                </Alert>
              )}

              {retryCount >= maxRetries && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum retry attempts reached. Please check your connection and refresh the page.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={this.handleRetry}
                  disabled={retryCount >= maxRetries || !isOnline}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryCount >= maxRetries ? "Max Retries Reached" : `Retry (${retryCount}/${maxRetries})`}
                </Button>

                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Refresh Page
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">Status: {isOnline ? "Online" : "Offline"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default NetworkErrorBoundary
