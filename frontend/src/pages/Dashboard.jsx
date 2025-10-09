import React from "react";
import DashboardCard from "../components/DashboardCard";

const Dashboard = () => {
  const stats = [
    { title: "Total Reports", count: 128 },
    { title: "Resolved Issues", count: 85 },
    { title: "Pending Issues", count: 43 },
    { title: "Average Response Time (hrs)", count: 5.2 },
  ];

  return (
    <div className="dashboard">
      <h2>Municipal Dashboard</h2>
      <div className="dashboard-grid">
        {stats.map((item, idx) => (
          <DashboardCard key={idx} title={item.title} count={item.count} />
        ))}
      </div>
      <p style={{ textAlign: "center", marginTop: "20px" }}>
        Data updated dynamically from backend in future integration.
      </p>
    </div>
  );
};

export default Dashboard;
