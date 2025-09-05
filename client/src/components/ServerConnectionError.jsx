"use client"

import { useState, useEffect } from "react"

const ServerConnectionError = ({ onRetry }) => {
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    const interval = setInterval(() => {
      setConnectionAttempt((prev) => prev + 1)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
      if (onRetry) {
        onRetry()
      } else {
        window.location.reload()
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors duration-1000">
      <div
        className={`max-w-lg w-full transform transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        {/* Main Card */}
        <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 text-center relative overflow-hidden">
          {/* Subtle background animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent animate-pulse"></div>

          {/* Icon Section */}
          <div className="relative mb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center animate-gentle-shake">
                  <svg className="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 2v3m6.364.636l-2.12 2.12M21 12h-3m-.636 6.364l-2.12-2.12M12 21v-3m-6.364-.636l2.12-2.12M3 12h3m.636-6.364l2.12 2.12"
                    />
                  </svg>
                </div>

                {/* Ripple effects */}
                <div className="absolute inset-0 border-2 border-destructive/20 rounded-full animate-ping"></div>
                <div
                  className="absolute inset-0 border border-destructive/10 rounded-full animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="relative z-10 space-y-6">
            <div
              className={`space-y-4 transform transition-all duration-700 delay-300 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <h1 className="text-3xl font-bold text-foreground">Connection Lost</h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                We're having trouble connecting to our servers. Please check your internet connection and try again.
              </p>
            </div>

            {/* Status Indicator */}
            <div
              className={`transform transition-all duration-700 delay-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mx-auto max-w-xs">
                <div className="flex items-center justify-center gap-3 text-destructive">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">Server Offline</span>
                </div>
              </div>
            </div>


            {/* Additional Info */}
            <div
              className={`text-sm text-muted-foreground space-y-1 pt-6 border-t border-border transform transition-all duration-700 delay-900 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <p>Our technical team has been notified and is working to resolve this issue</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gentle-shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        @keyframes bounce-in {
          0% { 
            transform: scale(0.8); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
        
        .animate-gentle-shake {
          animation: gentle-shake 2s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
          animation-delay: 0.8s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  )
}

export default ServerConnectionError
