"use client"

import { useState, useEffect } from "react"
import { FaEnvelope, FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MPMA from "./MPMA.png"

import { login, checkServerStatus } from "../../services/authService"

// MPMA Loading Animation Component
const MPMALoadingScreen = () => {
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
        {/* MPMA Letters Animation */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          {["M", "P", "M", "A"].map((letter, index) => (
            <div
              key={index}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg animate-bounce"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: "1.5s",
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Rotating Ring Animation */}
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin"></div>
          <div
            className="absolute inset-2 w-12 h-12 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1s" }}
          ></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-2">
            Mahapola Ports & Maritime Academy
          </h2>
          <p className="text-slate-600 text-lg mb-4">Initializing BookingNET System</p>

          {/* Loading Dots */}
          <div className="flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-80 h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: "100%",
              animation: "progressFill 3s ease-out forwards",
            }}
          ></div>
        </div>

      </div>

      <style jsx>{`
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const checkServer = async () => {
      const status = await checkServerStatus()
      setServerStatus(status)
    }
    checkServer()
  }, [])

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 3000) // 3 seconds loading time

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await login(email, password)
      if (response && response.success) {
        onLogin?.(response.user)
      } else {
        setError("Login failed. Please check your credentials.")
      }
    } catch (err) {
      console.error(err)
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen during initial load
  if (initialLoading) {
    return <MPMALoadingScreen />
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-blue-600 via-orange-400 to-sky-600 flex flex-col fixed inset-0 overflow-hidden">
      {/* Main content with centered card */}
      <div className="flex-grow flex items-center justify-center px-4 pt-10 pb-16 ">
        <div className="w-full max-w-3xl shadow-xl rounded-lg overflow-hidden  flex flex-col md:flex-row bg-white transform transition-transform duration-300 hover:scale-[1.02] mb-8">
          {/* Left Column: Image and Logo */}
          <div className="hidden md:flex bg-slate-200 md:w-1/2 flex-col items-center justify-center py-10 ">
            <div className="text-center mb-8 ">
              <div className="w-85 h-98 mx-auto">
                <img
                  src={MPMA || "/placeholder.svg"}
                  alt="Sri Lanka Ports Authority"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Login Form */}
          <div className="bg-stone-50 p-8 w-full md:w-1/2 flex flex-col justify-center">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-gray-500">Login to your BookingNET account</p>
            </div>

            {serverStatus === false && (
              <div className="mb-4 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
                Server appears to be offline. Please try again later.
              </div>
            )}

            {error && <div className="mb-4 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    className="pr-10"
                    required
                  />
                  <FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <a href="" className="text-sm text-blue-600 hover:underline">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || serverStatus === false}>
                {isLoading ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <a href="" className="text-blue-600 hover:underline">
                  Request
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer - Completely transparent with no shadows */}
      <footer className="w-full text-center py-4 text-black text-sm font-medium fixed bottom-0 left-0 right-0 bg-transparent border-none shadow-none">
        <div className="container mx-auto px-4">
          <p className="font-semibold text-shadow">
            &copy; {new Date().getFullYear()} Mahapola Ports & Maritime Academy | All rights reserved.
          </p>
          <p className="text-xs mt-1 opacity-90 text-shadow"></p>
        </div>
      </footer>
    </div>
  )
}

export default Login
