import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://10.70.4.34:5007/api/auth/login", {
        email,
        password,
      }); 
      if (response.data.success) {
        const { user, token } = response.data;
        // Save token and userId in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem("userName", user.name);


        onLogin(user);
        navigate("/calendar");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>ʟᴏɢɪɴ</h1>
          <p className="login-subtitle">ꜱɪɢɴ ɪɴ ᴛᴏ ʏᴏᴜʀ ᴀᴄᴄᴏᴜɴᴛ</p>
        </div>
        {error && (
          <div className="error-container">
            <p className="error-msg">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">ᴇᴍᴀɪʟ</label>
            <div className="input-container">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">ᴘᴀꜱꜱᴡᴏʀᴅ</label>
            </div>
            <div className="input-container">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          <button style={{fontSize:'20px'}} className="submit-button" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "ꜱɪɢɴ ɪɴ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
