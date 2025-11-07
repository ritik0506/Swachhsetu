import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Shield, 
  LogOut, 
  Home, 
  LayoutDashboard, 
  BarChart3, 
  AlertCircle, 
  FileText, 
  MapPin,
  Sparkles,
  User,
  ChevronDown,
  Trophy
} from "lucide-react";
import "../styles/Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Enhanced Logo */}
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <div className="logo-icon">
            <Sparkles size={24} />
          </div>
          <div className="logo-text">
            <span className="logo-primary">Swachh</span>
            <span className="logo-secondary">Setu</span>
          </div>
          {user && <span className="brand-badge">{user.role}</span>}
        </div>

        {/* Mobile Hamburger */}
        <div
          className={`navbar-toggle ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Enhanced Menu */}
        <ul className={`navbar-menu ${menuOpen ? "open" : ""}`}>
          <li>
            <Link 
              to="/" 
              className={isActive('/') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <Home size={18} />
              <span>Home</span>
            </Link>
          </li>
          
          {user && (
            <>
              <li>
                <Link 
                  to="/dashboard" 
                  className={isActive('/dashboard') ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/analytics" 
                  className={isActive('/analytics') ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  <BarChart3 size={18} />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/report-issue" 
                  className={`report-link ${isActive('/report-issue') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <AlertCircle size={18} />
                  <span>Report Issue</span>
                </Link>
              </li>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <li>
                  <Link 
                    to="/admin" 
                    className={`admin-link ${isActive('/admin') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Shield size={18} />
                    <span>Admin Panel</span>
                  </Link>
                </li>
              )}
            </>
          )}
          
          <li>
            <Link 
              to="/waste-report" 
              className={isActive('/waste-report') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <FileText size={18} />
              <span>Waste Report</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/toilets" 
              className={isActive('/toilets') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <MapPin size={18} />
              <span>Toilet Finder</span>
            </Link>
          </li>
          
          {/* Enhanced Auth Section */}
          {user ? (
            <li className="auth-section">
              <div className="user-profile">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-points">
                    <Trophy size={14} />
                    {user.points} pts
                  </span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </li>
          ) : (
            <li className="auth-section">
              <button
                className="login-btn"
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
              >
                <User size={18} />
                <span>Login</span>
              </button>
              <button
                className="register-btn"
                onClick={() => {
                  navigate("/register");
                  setMenuOpen(false);
                }}
              >
                <span>Sign Up</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
