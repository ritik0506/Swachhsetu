import React from "react";

const DashboardCard = ({ title, count }) => {
  return (
    <div className="dashboard-card">
      <h2>{title}</h2>
      <p>{count}</p>
    </div>
  );
};

export default DashboardCard;
