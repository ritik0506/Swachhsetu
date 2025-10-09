import React from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">SwachhSetu</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/report">Report Issue</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/toilets">Toilet Finder</Link></li>
        <li><Link to="/restaurant">Hygiene Finder</Link></li>
        <li><Link to="/garbage">Garbage Schedule</Link></li>
        <li><Link to="/health-guide">Health Guide</Link></li>
        <li><Link to="/login">Login</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
