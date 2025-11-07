import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  MapPin, 
  AlertCircle, 
  Award, 
  TrendingUp,
  Users,
  CheckCircle,
  Calendar,
  Shield,
  Sparkles
} from "lucide-react";
import HeroSection from "../components/HeroSection";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    { 
      icon: AlertCircle, 
      title: "Total Reports", 
      value: "1,250+", 
      color: "#3b82f6",
      trend: "+12%" 
    },
    { 
      icon: CheckCircle, 
      title: "Issues Resolved", 
      value: "980+", 
      color: "#10b981",
      trend: "+8%" 
    },
    { 
      icon: Users, 
      title: "Active Citizens", 
      value: "5,420+", 
      color: "#f59e0b",
      trend: "+25%" 
    },
    { 
      icon: MapPin, 
      title: "Clean Zones", 
      value: "320+", 
      color: "#8b5cf6",
      trend: "+15%" 
    },
  ];

  const features = [
    {
      icon: MapPin,
      title: "Report Issues",
      description: "Submit civic hygiene issues with photos and location",
      path: "/report-issue",
      color: "#ef4444",
      highlight: true
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Manage reports and monitor city cleanliness",
      path: "/admin",
      color: "#8b5cf6",
      adminOnly: true
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      description: "View trends and insights with interactive charts",
      path: "/analytics",
      color: "#3b82f6",
      protected: true
    },
    {
      icon: Award,
      title: "Leaderboard",
      description: "Compete with citizens and earn rewards",
      path: "/dashboard",
      color: "#f59e0b",
      protected: true
    },
    {
      icon: MapPin,
      title: "Toilet Finder",
      description: "Locate nearby public toilets with ratings",
      path: "/toilets",
      color: "#10b981"
    },
    {
      icon: Calendar,
      title: "Garbage Schedule",
      description: "Check waste collection timings in your area",
      path: "/garbage",
      color: "#06b6d4"
    },
  ];

  const handleFeatureClick = (feature) => {
    if (feature.adminOnly && (!user || (user.role !== 'admin' && user.role !== 'moderator'))) {
      return;
    }
    if (feature.protected && !user) {
      navigate('/login');
      return;
    }
    navigate(feature.path);
  };

  const filteredFeatures = features.filter(feature => {
    if (feature.adminOnly && (!user || (user.role !== 'admin' && user.role !== 'moderator'))) {
      return false;
    }
    return true;
  });

  return (
    <div className="home-page">
      <HeroSection />

      {/* Statistics Section */}
      <section className="stats-showcase">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="stat-card-modern">
                  <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                    <Icon size={28} />
                  </div>
                  <div className="stat-content">
                    <h3>{stat.value}</h3>
                    <p>{stat.title}</p>
                    <span className="stat-trend" style={{ color: stat.color }}>
                      <TrendingUp size={14} />
                      {stat.trend}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-modern">
        <div className="container">
          <div className="section-header">
            <Sparkles className="section-icon" />
            <h2>Explore Features</h2>
            <p>Everything you need to keep your city clean and healthy</p>
          </div>
          <div className="features-grid-modern">
            {filteredFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx} 
                  className={`feature-card-modern ${feature.highlight ? 'highlight' : ''}`}
                  onClick={() => handleFeatureClick(feature)}
                >
                  <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                    <Icon size={32} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  {feature.protected && !user && (
                    <span className="feature-badge">Login Required</span>
                  )}
                  {feature.adminOnly && (
                    <span className="feature-badge admin">Admin Only</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of citizens working together for cleaner cities</p>
            <div className="cta-buttons">
              {!user ? (
                <>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                    Get Started
                  </button>
                  <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/report-issue')}>
                    Report Issue
                  </button>
                  <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>
                    View Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-modern">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>About SwachhSetu</h2>
              <p>
                SwachhSetu is a revolutionary civic hygiene platform that empowers citizens 
                to actively participate in maintaining public cleanliness. Through our 
                gamification system, community engagement, and real-time monitoring, we're 
                building healthier and cleaner cities together.
              </p>
              <div className="about-features">
                <div className="about-feature">
                  <CheckCircle size={20} />
                  <span>Real-time issue reporting</span>
                </div>
                <div className="about-feature">
                  <CheckCircle size={20} />
                  <span>Gamification & rewards</span>
                </div>
                <div className="about-feature">
                  <CheckCircle size={20} />
                  <span>Admin dashboard</span>
                </div>
                <div className="about-feature">
                  <CheckCircle size={20} />
                  <span>Community leaderboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
