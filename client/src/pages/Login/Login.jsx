import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './styles/Login.css';
import { login } from "../../services/authService";
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login(email, password);
      if (response && response.success) {
        onLogin(response.user);
        setTimeout(() => {
          navigate("/calendar");
        }, 600);
      } else {
        setError("Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid email or password");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img src="/rounded_alpa.png" alt="BookingNet Logo" />
            </div>
            <h1>Welcome to BookingNet</h1>
            <p className="login-subtitle">Sign in to access the reservation system</p>
          </div>
          {error && (
            <div className="error-container">
              <p className="error-msg">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-container">
                <FaEnvelope className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  style={{ paddingLeft: "2.5rem", paddingRight: "1rem" }} // <-- fix left padding
                />
              </div>
            </div>
            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
              </div>
              <div className="input-container" style={{ position: "relative" }}>
                <FaLock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} // <-- fix left/right padding
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6b7280",
                    padding: 0,
                  }}
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button
              className={`submit-button ${isLoading ? "loading" : ""}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="login-footer">
        <p>&copy; {new Date().getFullYear()} SLPA. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
