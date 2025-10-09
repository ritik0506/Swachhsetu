import React from "react";

const ReportCard = ({ title, description, image }) => {
  return (
    <div className="report-card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default ReportCard;
