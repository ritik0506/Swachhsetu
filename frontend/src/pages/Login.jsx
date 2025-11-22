import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";
import { Eye, EyeOff, Shield, User } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const testAccounts = [
    {
      role: "Admin",
      email: "admin@swachhsetu.com",
      password: "admin123",
      icon: Shield,
      color: "#8b5cf6",
      description: "Full access to admin panel & management"
    },
    {
      role: "User",
      email: "Register new account",
      password: "Your password",
      icon: User,
      color: "#3b82f6",
      description: "Report issues and earn rewards"
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill all fields.");
        setLoading(false);
        return;
      }

      const result = await login(email, password);
      
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">Sign in to Your Account</h2>
        <p className="login-subtitle">Access your personalized dashboard</p>

        {/* Test Accounts Section */}
        <div className="test-accounts-section">
          <p className="test-accounts-title">Quick Login (Test Accounts)</p>
          <div className="test-accounts-grid">
            {testAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <div
                  key={account.role}
                  className="test-account-card"
                  onClick={() => account.email !== "Register new account" && quickLogin(account.email, account.password)}
                  style={{ 
                    borderColor: account.color,
                    cursor: account.email !== "Register new account" ? "pointer" : "default"
                  }}
                >
                  <Icon size={24} color={account.color} />
                  <div className="test-account-info">
                    <h4 style={{ color: account.color }}>{account.role}</h4>
                    <p>{account.description}</p>
                    {account.email !== "Register new account" && (
                      <span className="test-account-hint">Click to auto-fill</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="divider">
          <span>Or enter credentials</span>
        </div>

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
                autoComplete="current-password"
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="form-footer">
            <p className="signup-prompt">
              Don't have an account?
            </p>
            <button 
              type="button"
              className="signup-btn"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
