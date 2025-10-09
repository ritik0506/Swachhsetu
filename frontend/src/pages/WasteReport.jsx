import React from "react";
import ReportCard from "../components/ReportCard";

const WasteReport = () => {
  const wasteSpots = [
    { title: "Near City Bus Stand", description: "Uncollected garbage for 3 days", image: "/images/waste1.jpg" },
    { title: "Market Street Corner", description: "Overflowing waste bin", image: "/images/waste2.jpg" },
  ];

  return (
    <div className="auth-container">
      <h2>Waste Dump Reports</h2>
      <div className="report-list">
        {wasteSpots.map((spot, idx) => (
          <ReportCard key={idx} {...spot} />
        ))}
      </div>
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Reports fetched dynamically from backend in future.
      </p>
    </div>
  );
};

export default WasteReport;
