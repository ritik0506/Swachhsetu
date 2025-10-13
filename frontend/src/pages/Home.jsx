import React from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import "../styles/home.css";

const Home = () => {
  const navigate = useNavigate();

  // Dummy statistics and latest reports
  const stats = [
    { title: "Total Reports", value: 1250 },
    { title: "Issues Solved", value: 980 },
    { title: "Safe Public Spaces", value: 320 },
  ];

  const latestReports = [
    { title: "Unclean Public Toilet", location: "Sector 5 Park" },
    { title: "Garbage Overflow", location: "Main Street, City Center" },
    { title: "Dirty Restaurant Area", location: "Sunrise Plaza" },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Quick Access</h2>
        <p className="section-subtitle">
          Explore main features and keep your city clean and safe
        </p>
        <div className="features-grid">
          <div
            className="feature-card"
            onClick={() => navigate("/toilet-finder")}
          >
            <h3>Toilet Finder</h3>
            <p>Locate nearby public toilets with cleanliness ratings.</p>
          </div>

          <div
            className="feature-card"
            onClick={() => navigate("/hygiene-finder")}
          >
            <h3>Hygiene Finder</h3>
            <p>Check hygiene scores for restaurants and public spaces.</p>
          </div>

          <div
            className="feature-card"
            onClick={() => navigate("/garbage-schedule")}
          >
            <h3>Garbage Schedule</h3>
            <p>Know local waste collection timings and routes.</p>
          </div>

          <div
            className="feature-card"
            onClick={() => navigate("/report-issue")}
          >
            <h3>Report Issue</h3>
            <p>Submit complaints for unclean public areas with ease.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2 className="section-title">About SwachhSetu</h2>
        <p>
          SwachhSetu is a citizen-driven hygiene platform aimed at empowering
          communities to take charge of public cleanliness. From reporting
          unhygienic areas to finding safe and clean public spaces, we
          encourage active participation in building healthier cities.
        </p>
        <button onClick={() => navigate("/dashboard")}>
          Explore Dashboard
        </button>
      </section>

      {/* Latest Reports & Statistics */}
      <section className="stats-section">
        <h2 className="section-title">Latest Reports & Stats</h2>
        <p className="section-subtitle">Stay updated with city cleanliness</p>

        {/* Statistics Cards */}
        <div className="stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Latest Reports */}
        <div className="latest-reports">
          {latestReports.map((report, idx) => (
            <div key={idx} className="report-card">
              <h4>{report.title}</h4>
              <p>{report.location}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
