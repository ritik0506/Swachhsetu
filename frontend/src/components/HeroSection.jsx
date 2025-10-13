import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HeroSection.css";
import heroImage from "../assets/hero-clean-city.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-container">
        {/* Text Section */}
        <div className="hero-text">
          <h1 className="fade-in-left">Welcome to SwachhSetu</h1>
          <p className="fade-in-left delay-1">
            SwachhSetu is a citizen-driven hygiene platform empowering
            communities to maintain cleanliness and report public issues in
            real-time. Join us in building cleaner and healthier cities.
          </p>
          <div className="hero-buttons fade-in-left delay-2">
            <button onClick={() => navigate("/report-issue")}>
              Report an Issue
            </button>
            <button
              className="learn-btn"
              onClick={() => navigate("/dashboard")}
            >
              Explore Dashboard
            </button>
          </div>
        </div>

        {/* Image Section */}
        <div className="hero-image fade-in-right">
          <img src={heroImage} alt="Clean City Illustration" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
