import React, { useState } from "react";

const ToiletFinder = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([
    { name: "MG Road Public Toilet", rating: 4.2, distance: "500m" },
    { name: "Central Park Restroom", rating: 3.8, distance: "1.2km" },
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching:", search);
  };

  return (
    <div className="auth-container">
      <h2>Public Toilet Finder</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter your location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div className="result-list">
        {results.map((item, idx) => (
          <div key={idx} className="report-card">
            <h3>{item.name}</h3>
            <p>Rating: ⭐ {item.rating}</p>
            <p>Distance: {item.distance}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToiletFinder;
