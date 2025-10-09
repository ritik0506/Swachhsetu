import React from "react";

const HealthGuide = () => {
  const tips = [
    { title: "Dispose Waste Properly", desc: "Use segregated bins for dry and wet waste." },
    { title: "Avoid Littering", desc: "Keep your surroundings clean and encourage others to do the same." },
    { title: "Report Hygiene Issues", desc: "Use SwachhSetu app to report unclean areas." },
    { title: "Personal Hygiene", desc: "Wash hands frequently and use clean toilets." },
  ];

  return (
    <div className="auth-container">
      <h2>Public Health & Hygiene Guide</h2>
      <ul>
        {tips.map((tip, idx) => (
          <li key={idx}>
            <strong>{tip.title}:</strong> {tip.desc}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HealthGuide;
