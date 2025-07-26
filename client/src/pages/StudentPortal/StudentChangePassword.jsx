import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, ShieldCheck, Mail, KeyRound, ArrowLeft, GraduationCap, Bell, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StudentSidebar from "@/components/StudentSidebar";
import LoadingScreen from "@/pages/LoadingScreen/LoadingScreen";

const StudentChangePassword = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP & Set Password
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [studentData, setStudentData] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navigate = useNavigate();

  // Helper function to get initials
  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  };

  // Helper function for logout
  const handleLogout = () => {
    localStorage.removeItem("studentToken")
    localStorage.removeItem("studentRefreshToken")
    localStorage.removeItem("studentUser")
    navigate("/student-login")
  };

  // Password strength criteria
  const strengthChecks = [
    { regex: /.{8,}/, message: "At least 8 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  // Check for authentication on component mount
  useEffect(() => {
    const studentToken = localStorage.getItem("studentToken");
    const studentUser = localStorage.getItem("studentUser");
    
    if (!studentToken || !studentUser) {
      navigate("/student-login");
      return;
    }
    
    try {
      const userData = JSON.parse(studentUser);
      setStudentData(userData);
    } catch (error) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentUser");
      navigate("/student-login");
    }
  }, [navigate]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Calculate password strength when new password changes
  useEffect(() => {
    if (formData.newPassword) {
      let strength = 0;
      strengthChecks.forEach(check => {
        if (check.regex.test(formData.newPassword)) {
          strength += 1;
        }
      });
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.newPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for OTP field - only allow numbers
    if (name === 'otp') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear API error when user modifies form
    if (apiError) {
      setApiError("");
    }
  };

  const requestOTP = async () => {
    setIsLoading(true);
    setApiError("");
    
    try {
      const token = localStorage.getItem("studentToken");
      const response = await axios.post(
        "http://localhost:5003/api/student-auth/request-password-change-otp",
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage("Verification code sent to your email!");
        setStep(2);
        setOtpTimer(600); // 10 minutes timer
        // Clear any previous form data
        setFormData({ otp: "", newPassword: "", confirmPassword: "" });
        setErrors({});
      }
    } catch (error) {
      console.error("Request OTP error:", error);
      setApiError(
        error.response?.data?.error || "Failed to send verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.otp) {
      newErrors.otp = "Verification code is required";
    } else if (formData.otp.length !== 6) {
      newErrors.otp = "Verification code must be 6 digits";
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    } else if (passwordStrength < 3) {
      newErrors.newPassword = "Password is too weak";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem("studentToken");
      const response = await axios.post(
        "http://localhost:5003/api/student-auth/verify-otp-change-password",
        {
          otp: formData.otp,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage("Password changed successfully! Redirecting to dashboard...");
        
        // Update student user data in localStorage if needed
        if (studentData?.is_temp_password) {
        const updatedUser = { ...studentData, is_temp_password: false };
        localStorage.setItem("studentUser", JSON.stringify(updatedUser));
        }
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/student-dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Change password error:", error);
      setApiError(
        error.response?.data?.error || "Failed to change password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    const getStrengthText = () => {
      if (passwordStrength === 0) return "";
      if (passwordStrength < 3) return "Weak";
      if (passwordStrength < 5) return "Medium";
      return "Strong";
    };
    
    const getStrengthColor = () => {
      if (passwordStrength === 0) return "bg-slate-200";
      if (passwordStrength < 3) return "bg-red-500";
      if (passwordStrength < 5) return "bg-yellow-500";
      return "bg-green-500";
    };
    
    return (
      <div className="mt-3">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600">Password Strength</span>
          <span className={`font-medium ${passwordStrength < 3 ? 'text-red-600' : passwordStrength < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
        </div>
        <div className="space-y-1">
          {strengthChecks.map((check, index) => (
            <div key={index} className="flex items-center text-xs">
              {check.regex.test(formData.newPassword) ? (
                <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
              ) : (
                <div className="w-3 h-3 border border-slate-300 rounded-full mr-2"></div>
              )}
              <span className={check.regex.test(formData.newPassword) ? 'text-green-600' : 'text-slate-500'}>
                {check.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!studentData) {
    return <LoadingScreen message="Loading change password..." type="users" />;
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background glass texture */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.05)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      {/* Enhanced Glassy Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 backdrop-blur-2xl border-b border-white/30 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5"></div>
          {/* Noise texture overlay for premium feel */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        </div>

        {/* Content Layer */}
        <div className="relative container mx-auto px-6 py-4">
          <div className="flex justify-between items-center ml-[-75px]">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/80 to-indigo-600/80 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20">
                  <GraduationCap className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 w-10 h-10 bg-gradient-to-br from-blue-400/40 to-indigo-500/40 rounded-xl blur-md -z-10"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm">
                  Student Portal MPMA
                </h1>
                <p className="text-sm text-slate-600/80 font-medium">Change Password</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-3 mr-[-80px]">
              <motion.div
                className="hidden md:flex items-center space-x-3 bg-white/40 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-lg border border-white/30"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8 ring-2 ring-white/50 shadow-md">
                    <AvatarImage src={studentData.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white text-sm font-semibold backdrop-blur-sm">
                      {getInitials(studentData.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Avatar glow */}
                  <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-sm -z-10"></div>
                </div>
                <div className="text">
                  <p className="font-semibold text-slate-800/90 text-sm drop-shadow-sm">{studentData.full_name}</p>
                  <p className="text-xs text-slate-600/80">{studentData.email}</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative bg-white/30 backdrop-blur-xl hover:bg-white/40 rounded-2xl border border-white/30 shadow-lg transition-all duration-300"
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                  {/* Button glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="bg-white/30 backdrop-blur-xl hover:bg-red-500/20 hover:text-red-600 transition-all duration-300 rounded-2xl border border-white/30 shadow-lg group"
                >
                  <LogOut className="w-5 h-5 transition-colors duration-300" />
                  {/* Logout button glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-2xl blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Scroll Progress Indicator */}
      <motion.div
        className="fixed top-[73px] left-0 right-0 h-0.5 z-40 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-full bg-gradient-to-r from-transparent via-blue-500/60 to-transparent backdrop-blur-sm"></div>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 origin-left shadow-lg"
          initial={{ scaleX: 0 }}
        />
        {/* Progress glow */}
        <motion.div
          className="absolute top-0 h-full bg-gradient-to-r from-blue-400/50 via-indigo-500/50 to-purple-500/50 origin-left blur-sm"
        />
      </motion.div>
      
      {/* Student Sidebar */}
      <StudentSidebar
        student={studentData}
        activeTab="overview"
        onTabChange={(tab) => {
          if (tab !== "overview") {
            navigate("/student-dashboard");
          }
        }}
        onChangePassword={() => {}}
        onSidebarToggle={setSidebarOpen}
      />

      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-80' : 'lg:pl-20'
      }`}>
        <div className="min-h-screen pt-24 pb-8 flex items-center justify-center">
          <div className="w-full max-w-md px-4 sm:px-6">
            <div className="w-full max-w-md mx-auto">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => navigate('/student-dashboard')}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>
              <ShieldCheck className="h-12 w-12 text-white/90" />
                    <div className="w-6 h-6"></div>
            </div>
            <h1 className="text-2xl font-bold text-center">Change Your Password</h1>
            <p className="text-blue-100 mt-1 text-center">
                    Secure your account with a new password
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex items-start">
                <AlertCircle className="text-red-500 mr-2 shrink-0 mt-0.5" size={18} />
                <span className="text-red-700 text-sm">{apiError}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md flex items-start">
                <CheckCircle className="text-green-500 mr-2 shrink-0 mt-0.5" size={18} />
                <span className="text-green-700 text-sm">{successMessage}</span>
              </div>
            )}

                  {step === 1 && (
                    <div className="text-center">
                      <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">Verify Your Identity</h2>
                      <p className="text-gray-600 mb-6">
                        We'll send a verification code to your registered email address: 
                        <span className="font-medium block mt-1">{studentData.email}</span>
                      </p>
                      
                      <button
                        onClick={requestOTP}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Mail className="mr-2 h-5 w-5" />
                            Send Verification Code
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
                      {/* OTP Timer */}
                      {otpTimer > 0 ? (
                        <div className="text-center text-sm text-gray-600 mb-4">
                          Code expires in: <span className="font-medium text-blue-600">{formatTime(otpTimer)}</span>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">
                          ⚠️ Your verification code has expired. Please request a new one.
                        </div>
                      )}

                      {/* OTP Input */}
              <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                          Verification Code
                </label>
                <div className="relative">
                  <input
                            type="text"
                            id="otp"
                            name="otp"
                            value={formData.otp}
                    onChange={handleChange}
                            maxLength={6}
                    className={`w-full px-4 py-3 rounded-lg border ${
                              errors.otp ? "border-red-300" : "border-slate-300"
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-2xl font-semibold tracking-widest ${
                              otpTimer <= 0 ? 'bg-red-50' : ''
                            }`}
                            placeholder="000000"
                            disabled={isLoading || otpTimer <= 0}
                          />
                          <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                </div>
                        {errors.otp && (
                          <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
                        <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to your email</p>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.newPassword ? "border-red-300" : "border-slate-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10`}
                    placeholder="Enter new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex="-1"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {renderPasswordStrength()}
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.confirmPassword ? "border-red-300" : "border-slate-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10`}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                        disabled={isLoading || otpTimer <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                        ) : otpTimer <= 0 ? (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            Code Expired - Get New Code Below
                          </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Change Password
                  </>
                )}
              </button>

                      {/* Get New Code Button - Show prominently when expired */}
                      {otpTimer <= 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            setFormData({ otp: "", newPassword: "", confirmPassword: "" });
                            setErrors({});
                            setApiError("");
                            setSuccessMessage("");
                            
                            try {
                              setIsLoading(true);
                              const token = localStorage.getItem("studentToken");
                              const response = await axios.post(
                                "http://localhost:5003/api/student-auth/request-password-change-otp",
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              
                              if (response.data.success) {
                                setSuccessMessage("New verification code sent to your email!");
                                setOtpTimer(600);
                              }
                            } catch (error) {
                              console.error("Request new OTP error:", error);
                              setApiError(error.response?.data?.error || "Failed to send new verification code");
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </div>
                          ) : (
                            <>
                              <Mail className="mr-2 h-5 w-5" />
                              Get New Verification Code
                            </>
                          )}
                        </button>
                      )}
            </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentChangePassword;
