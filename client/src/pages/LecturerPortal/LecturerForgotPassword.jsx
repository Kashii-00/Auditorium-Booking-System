import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

const LecturerForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }
    
    setIsLoading(true);
    setApiError("");
    
    try {
      const response = await axios.post(
        "http://localhost:5003/api/lecturer-auth/forgot-password",
        { email }
      );
      
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setApiError(
        error.response?.data?.error || "Failed to process request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-green-100 mt-1">SLPA Training Institute - Lecturer Portal</p>
          </div>

          {/* Form */}
          <div className="p-6">
            {!success ? (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Forgot your password?
                </h2>
                <p className="text-slate-600 mb-6">
                  Enter your lecturer email address and we'll send you instructions to reset your password.
                </p>

                {apiError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md flex items-start">
                    <AlertCircle className="text-red-500 mr-2 shrink-0 mt-0.5" size={18} />
                    <span className="text-red-700 text-sm">{apiError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Lecturer Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          emailError ? "border-red-300" : "border-slate-300"
                        } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all pl-10`}
                        placeholder="Enter your lecturer email"
                        disabled={isLoading}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
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
                        Send Reset Instructions
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Check your email</h2>
                <p className="text-slate-600 mb-4">
                  We've sent instructions to reset your password to
                </p>
                <p className="font-semibold text-green-600 mb-4">{email}</p>
                <p className="text-slate-600 text-sm mb-6">
                  Please check your inbox and follow the link in the email.
                </p>
                <p className="text-slate-500 text-sm">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            )}
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
    </div>
  );
};

export default LecturerForgotPassword; 