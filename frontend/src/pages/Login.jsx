import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (!email || !password) {
        setError("Please fill all fields.");
        return;
      }

      if (role === "client") navigate("/client-dashboard");
      else navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Sign in to Your Account</h2>
        <p className="login-subtitle">Access your personalized dashboard</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Login as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="role-select"
            >
              <option value="user">User</option>
              <option value="client">Client</option>
            </select>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          <div className="form-links">
            <a href="/forgot-password" className="link">
              Forgot Password?
            </a>
            <a href="/register" className="link">
              Create Account
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
