import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`Subscribed with: ${email}`);
    setEmail("");
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section about">
          <h3>SwachhSetu</h3>
          <p>
            Citizen-driven hygiene platform empowering communities to maintain
            cleanliness and report issues in public spaces.
          </p>
          <div className="contact-info">
            <p>Email: support@swachhsetu.com</p>
            <p>Phone: +91 9876543210</p>
            <p>Address: jp nagar Benagalur, India</p>
          </div>
        </div>

        {/* Quick Links */}
<div className="footer-section links">
  <h4>Quick Links</h4>
  <div className="links-columns">
    <ul>
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="/toilet-finder">Toilet Finder</Link>
      </li>
      <li>
        <Link to="/hygiene-finder">Hygiene Finder</Link>
      </li>
      <li>
        <Link to="/garbage-schedule">Garbage Schedule</Link>
      </li>
    </ul>
    <ul>
      <li>
        <Link to="/report-issue">Report Issue</Link>
      </li>
      <li>
        <Link to="/waste-report">Waste Report</Link>
      </li>
      <li>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li>
        <Link to="/health-guide">Health Guide</Link>
      </li>
    </ul>
  </div>
</div>

        {/* Subscribe & Social */}
        <div className="footer-section subscribe">
          <h4>Subscribe to Updates</h4>
          <form onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe</button>
          </form>

          <div className="social-icons">
            <a href="#" target="_blank" rel="noreferrer">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" target="_blank" rel="noreferrer">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" target="_blank" rel="noreferrer">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © 2025 SwachhSetu | <Link to="/privacy">Privacy Policy</Link> |{" "}
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
