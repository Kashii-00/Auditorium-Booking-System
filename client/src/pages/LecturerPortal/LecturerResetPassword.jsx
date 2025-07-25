import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Save, AlertCircle, CheckCircle, KeyRound, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const LecturerResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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
  const [tokenValid, setTokenValid] = useState(true);

  // Password strength criteria
  const strengthChecks = [
    { regex: /.{8,}/, message: "At least 8 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  // Check for token on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setApiError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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

  const validateForm = () => {
    const newErrors = {};
    
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
      const response = await axios.post(
        "http://localhost:5003/api/lecturer-auth/reset-password",
        {
          token: token,
          newPassword: formData.newPassword,
        }
      );
      
      if (response.data.success) {
        setSuccessMessage("Password reset successfully! Redirecting to login...");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/?type=lecturer");
        }, 3000);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setApiError(
        error.response?.data?.error || "Failed to reset password. Please try again."
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

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-red-600 to-red-600 p-6 text-white text-center">
              <h1 className="text-2xl font-bold">Invalid Reset Link</h1>
              <p className="text-red-100 mt-1">SLPA Training Institute - Lecturer Portal</p>
            </div>
            <div className="p-6 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                {apiError || "The password reset link is invalid or has expired. Please request a new one."}
              </p>
              <Link
                to="/lecturer-forgot-password"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02]"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Link
                to="/?type=lecturer"
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <KeyRound className="h-12 w-12 text-white/90" />
              <div className="w-6 h-6"></div>
            </div>
            <h1 className="text-2xl font-bold text-center">Reset Your Password</h1>
            <p className="text-green-100 mt-1 text-center">
              Create a new secure password
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

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all pr-10`}
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
                    } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all pr-10`}
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
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link to="/?type=lecturer" className="text-sm text-slate-600 hover:text-green-600 font-medium flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default LecturerResetPassword; 