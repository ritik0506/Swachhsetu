import React from "react";
import HeroSection from "../components/HeroSection";

const Home = () => {
  return (
    <div>
      <HeroSection />
      <section className="info-section">
        <h2>Our Mission</h2>
        <p>
          SwachhSetu connects citizens and municipal authorities to ensure
          real-time hygiene monitoring and waste management.
        </p>
      </section>
    </div>
  );
};

export default Home;
