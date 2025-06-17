import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from "lucide-react";

const StudentLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  
  const navigate = useNavigate();

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
    
    // Clear login error when user modifies form
    if (loginError) {
      setLoginError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
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
        "http://localhost:5003/api/student-auth/login",
        formData
      );
      
      if (response.data.token) {
        // Store token and user info in localStorage
        localStorage.setItem("studentToken", response.data.token);
        localStorage.setItem("studentRefreshToken", response.data.refreshToken);
        localStorage.setItem("studentUser", JSON.stringify(response.data.user));
        
        setLoginSuccess("Login successful. Redirecting to your dashboard...");
        
        // Redirect based on temporary password status
        setTimeout(() => {
          if (response.data.user.is_temp_password) {
            navigate("/student-change-password");
          } else {
            navigate("/student-dashboard");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        error.response?.data?.error || "Failed to login. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">Student Portal</h1>
            <p className="text-blue-100 mt-1">SLPA Training Institute</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Log in to your account
            </h2>

            {loginError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex items-start">
                <AlertCircle className="text-red-500 mr-2 shrink-0 mt-0.5" size={18} />
                <span className="text-red-700 text-sm">{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md flex items-start">
                <CheckCircle className="text-green-500 mr-2 shrink-0 mt-0.5" size={18} />
                <span className="text-green-700 text-sm">{loginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email ? "border-red-300" : "border-slate-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.password ? "border-red-300" : "border-slate-300"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link 
                  to="/student-forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </div>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Log In
                  </>
                )}
              </button>
            </form>

            {/* Contact support */}
            <div className="mt-8 text-center text-sm text-slate-600">
              Having trouble logging in?{" "}
              <a href="mailto:support@slpa.edu" className="text-blue-600 hover:text-blue-800 font-medium">
                Contact support
              </a>
            </div>
          </div>
        </div>

        {/* Back to main site */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-600 hover:text-blue-600 font-medium">
            ← Back to main website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
