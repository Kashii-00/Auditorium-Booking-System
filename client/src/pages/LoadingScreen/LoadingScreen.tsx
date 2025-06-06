"use client"

import { Calendar, Bus, Users, Building } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  type?: "default" | "calendar" | "bus" | "users" | "bookings"
}

const LoadingScreen = ({ message = "Loading...", type = "default" }: LoadingScreenProps) => {
  const getIcon = () => {
    switch (type) {
      case "calendar":
        return <Calendar className="w-12 h-12 text-blue-600" />
      case "bus":
        return <Bus className="w-12 h-12 text-blue-600" />
      case "users":
        return <Users className="w-12 h-12 text-blue-600" />
      case "bookings":
        return <Building className="w-12 h-12 text-blue-600" />
      default:
        return <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e0e7ff' fillOpacity='0.4'%3E%3Ccircle cx='40' cy='40' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        ></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          {/* Outer Ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-blue-200 rounded-full animate-spin"></div>

          {/* Inner Ring */}
          <div
            className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1s" }}
          ></div>

          {/* Icon */}
          <div className="flex items-center justify-center w-24 h-24">
            <div className="animate-pulse">{getIcon()}</div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
            {message}
          </h2>
          <p className="text-slate-600 text-lg">Please wait while we load your data</p>

          {/* Loading Dots */}
          <div className="flex justify-center items-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
