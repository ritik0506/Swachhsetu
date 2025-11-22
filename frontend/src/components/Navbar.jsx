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
  const [servicesOpen, setServicesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
    setUserMenuOpen(false);
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
          
          {/* Services Dropdown */}
          <li className="dropdown" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <div className={`dropdown-trigger ${['/waste-report', '/toilets', '/restaurant', '/garbage', '/health'].some(path => isActive(path)) ? 'active' : ''}`}>
              <Sparkles size={18} />
              <span>Services</span>
              <ChevronDown size={16} className={`chevron ${servicesOpen ? 'open' : ''}`} />
            </div>
            <ul className={`dropdown-menu ${servicesOpen ? 'show' : ''}`}>
              <li>
                <Link to="/waste-report" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                  <FileText size={16} />
                  <div>
                    <span className="menu-title">Waste Reports</span>
                    <span className="menu-desc">View waste dump locations</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link to="/toilets" onClick={() => { setMenuOpen(false); setServicesOpen(false); }}>
                  <MapPin size={16} />
                  <div>
                    <span className="menu-title">Toilet Finder</span>
                    <span className="menu-desc">Find nearby facilities</span>
                  </div>
                </Link>
              </li>
            </ul>
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
                  to="/report-issue" 
                  className={`report-link ${isActive('/report-issue') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <AlertCircle size={18} />
                  <span>Report Issue</span>
                </Link>
              </li>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <>
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
                      to="/admin" 
                      className={`admin-link ${isActive('/admin') ? 'active' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield size={18} />
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                </>
              )}
            </>
          )}
          
          <li className="mobile-only">
            <Link 
              to="/waste-report" 
              className={isActive('/waste-report') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <FileText size={18} />
              <span>Waste Report</span>
            </Link>
          </li>
          <li className="mobile-only">
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
            <li className="auth-section user-menu-container">
              <div 
                className="user-profile-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
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
                <ChevronDown size={18} className={`chevron-icon ${userMenuOpen ? 'open' : ''}`} />
              </div>
              
              {/* User Dropdown Menu */}
              <div className={`user-dropdown-menu ${userMenuOpen ? 'show' : ''}`}>
                <div className="user-menu-header">
                  <div className="user-avatar-large">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-menu">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                    <span className="role-badge-menu">{user.role}</span>
                  </div>
                </div>
                
                <div className="user-menu-divider"></div>
                
                <div className="user-menu-items">
                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <User size={18} />
                    <span>View Profile</span>
                  </button>
                  
                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      navigate('/dashboard');
                      setUserMenuOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <LayoutDashboard size={18} />
                    <span>My Dashboard</span>
                  </button>
                  
                  <button 
                    className="user-menu-item"
                    onClick={() => {
                      navigate('/report-issue');
                      setUserMenuOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>Report Issue</span>
                  </button>
                  
                  <div className="user-menu-stats">
                    <div className="stat-item-menu">
                      <Trophy size={16} />
                      <div>
                        <span className="stat-value">{user.points || 0}</span>
                        <span className="stat-label">Points</span>
                      </div>
                    </div>
                    <div className="stat-item-menu">
                      <FileText size={16} />
                      <div>
                        <span className="stat-value">{user.reportsCount || 0}</span>
                        <span className="stat-label">Reports</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="user-menu-divider"></div>
                
                <button 
                  className="user-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
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
