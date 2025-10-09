import React, { useState } from "react";

const RestaurantHygiene = () => {
  const [restaurants] = useState([
    { name: "Spice Villa", hygieneScore: 92 },
    { name: "Urban Eatery", hygieneScore: 78 },
    { name: "Green Leaf Café", hygieneScore: 85 },
  ]);

  return (
    <div className="auth-container">
      <h2>Restaurant Hygiene Checker</h2>
      <div className="report-list">
        {restaurants.map((res, idx) => (
          <div key={idx} className="report-card">
            <h3>{res.name}</h3>
            <p>Hygiene Score: {res.hygieneScore}%</p>
            <p>Status: {res.hygieneScore > 80 ? "✅ Clean" : "⚠️ Needs Inspection"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantHygiene;
