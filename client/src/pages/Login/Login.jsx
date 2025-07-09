"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FaEnvelope, FaEye, FaEyeSlash, FaSpinner, FaUserGraduate, FaUserTie, FaExclamationTriangle, FaChalkboardTeacher, FaWrench, FaCog } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MPMA from "./MPMA.png"

import { login, checkServerStatus } from "@/services/authService"
import { studentLogin } from "@/services/studentAuthService"
import { lecturerLogin } from "@/services/lecturerAuthService"

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
  const [loginType, setLoginType] = useState("staff") // "staff", "student", or "lecturer"
  
  const navigate = useNavigate()

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

  const handleLoginTypeChange = (type) => {
    setLoginType(type)
    setError("") // Clear any errors when switching types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (loginType === "staff") {
        // Staff login
        const response = await login(email, password)
        if (response && response.success) {
          onLogin?.(response.user)
          // The main app will handle redirection for staff
        } else {
          setError("Login failed. Please check your credentials.")
        }
      } else if (loginType === "student") {
        // Student login
        try {
          const response = await studentLogin(email, password)
          console.log("Student login response:", response);
          
          if (response && response.token) {
            // Store token and user info
            localStorage.setItem("studentToken", response.token)
            localStorage.setItem("studentRefreshToken", response.refreshToken || "")
            localStorage.setItem("studentUser", JSON.stringify(response.user || {}))
            
            // Redirect based on temporary password status
            if (response.user?.is_temp_password) {
              navigate("/student-change-password")
            } else {
              navigate("/student-dashboard")
            }
          } else {
            // No token in the response
            setError("Authentication failed. Server did not return a valid token.")
          }
        } catch (err) {
          console.error("Student login error:", err)
          setError(err.message || "Invalid email or password")
        }
      } else if (loginType === "lecturer") {
        // Lecturer login
        try {
          const response = await lecturerLogin(email, password)
          console.log("Lecturer login response:", response);
          
          if (response && response.token) {
            // Store token and user info
            localStorage.setItem("lecturerToken", response.token)
            localStorage.setItem("lecturerRefreshToken", response.refreshToken || "")
            localStorage.setItem("lecturerUser", JSON.stringify(response.user || {}))
            
            // Redirect based on temporary password status
            if (response.user?.is_temp_password) {
              navigate("/lecturer-change-password")
            } else {
              navigate("/lecturer-dashboard")
            }
          } else {
            // No token in the response
            setError("Authentication failed. Server did not return a valid token.")
          }
        } catch (err) {
          console.error("Lecturer login error:", err)
          setError(err.message || "Invalid email or password")
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen during initial load
  if (initialLoading) {
    return <MPMALoadingScreen />
  }

  const loginTypeOptions = [
    { key: "staff", label: "Staff", icon: FaUserTie, color: "from-blue-600 to-indigo-600" },
    { key: "student", label: "Student", icon: FaUserGraduate, color: "from-green-600 to-emerald-600" },
    { key: "lecturer", label: "Lecturer", icon: FaChalkboardTeacher, color: "from-amber-600 to-orange-600" },
  ]

  return (
    <div className="h-screen w-full bg-gradient-to-b from-blue-900 to-sky-1800 flex flex-col fixed inset-0 overflow-hidden">
      {/* Main content with centered card */}
      <div className="flex-grow flex items-center justify-center px-4 pt-10 pb-16 ">
        <motion.div 
          className="w-full max-w-3xl shadow-xl rounded-lg overflow-hidden flex flex-col md:flex-row bg-white mb-8"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Left Column: Image and Logo */}
          <motion.div 
            className="hidden md:flex bg-slate-200 md:w-1/2 flex-col items-center justify-center py-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="text-center mb-8 ">
              <motion.div 
                className="w-85 h-98 mx-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src={MPMA || "/placeholder.svg"}
                  alt="Sri Lanka Ports Authority"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Login Form or Maintenance */}
          <motion.div 
            className="bg-stone-50 p-8 w-full md:w-1/2 flex flex-col justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="text-center mb-6">
              <motion.h1 
                className="text-2xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Welcome to BookingNET
              </motion.h1>
              <motion.p 
                className="text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Login to access the system
              </motion.p>
              
              {/* Enhanced Login Type Toggle with Animation */}
              <motion.div 
                className="flex justify-center mt-4 space-x-1 border-2 border-gray-200 rounded-xl p-1 bg-white shadow-inner"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {loginTypeOptions.map((option) => (
                  <motion.button
                    key={option.key}
                    onClick={() => handleLoginTypeChange(option.key)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm ${
                      loginType === option.key 
                        ? `bg-gradient-to-r ${option.color} text-white shadow-lg` 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    <motion.div
                      animate={{ 
                        rotate: loginType === option.key ? 360 : 0,
                        scale: loginType === option.key ? 1.1 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <option.icon className="text-base" />
                    </motion.div>
                    <span>{option.label}</span>
                    
                    {/* Active indicator */}
                    {loginType === option.key && (
                      <motion.div
                        className="absolute inset-0 rounded-lg border-2 border-white/30"
                        layoutId="activeTab"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {/* Login Form for all user types */}
              <motion.div
                  key="loginForm"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Server Status Alert */}
                  <AnimatePresence>
                    {serverStatus === false && (
                      <motion.div 
                        className="mb-4 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2">
                          <FaExclamationTriangle />
                          <span>Server appears to be offline. Please try again later.</span>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div 
                        className="mb-4 rounded-lg bg-red-100 border border-red-200 p-3 text-sm text-red-800"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-2">
                          <FaExclamationTriangle />
                          <span>{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Form */}
                  <motion.form 
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
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
                          className="pr-10 transition-all duration-200 focus:scale-[1.02]"
                          required
                        />
                        <FaEnvelope className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
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
                          className="pr-10 transition-all duration-200 focus:scale-[1.02]"
                          required
                        />
                        <motion.button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword((prev) => !prev)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </motion.button>
                      </div>
                      <div className="mt-2 text-right">
                        <a 
                          href={loginType === "student" ? "/student-forgot-password" : loginType === "lecturer" ? "/lecturer-forgot-password" : ""} 
                          className="text-sm text-blue-600 hover:underline transition-colors duration-200"
                        >
                          Forgot your password?
                        </a>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full transition-all duration-200 transform hover:scale-[1.02]" 
                        disabled={isLoading || serverStatus === false}
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <FaSpinner className="mr-2" />
                            </motion.div>
                            Logging in...
                          </>
                        ) : (
                          `Login as ${loginType === "staff" ? "Staff" : loginType === "student" ? "Student" : "Lecturer"}`
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>

                  <motion.div 
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-sm text-gray-500">
                      {loginType === "staff" ? (
                        <>
                          Don't have an account?{" "}
                          <a href="" className="text-blue-600 hover:underline transition-colors duration-200">
                            Request
                          </a>
                        </>
                      ) : (
                        <>
                          Need help with your account?{" "}
                          <a href="mailto:support@slpa.edu" className="text-blue-600 hover:underline transition-colors duration-200">
                            Contact support
                          </a>
                        </>
                      )}
                    </p>
                  </motion.div>
                </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* Copyright Footer - Completely transparent with no shadows */}
      <motion.footer 
        className="w-full text-center py-4 text-black text-sm font-medium fixed bottom-0 left-0 right-0 bg-transparent border-none shadow-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <div className="container mx-auto px-4">
          <p className="font-semibold text-shadow">
            &copy; {new Date().getFullYear()} Mahapola Ports & Maritime Academy | All rights reserved.
          </p>
          <p className="text-xs mt-1 opacity-90 text-shadow"></p>
        </div>
      </motion.footer>
    </div>
  )
}

export default Login
