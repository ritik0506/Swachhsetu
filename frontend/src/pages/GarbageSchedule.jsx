import React, { useState } from "react";

const GarbageSchedule = () => {
  const [area, setArea] = useState("");
  const [schedule, setSchedule] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSchedule({
      route: "Sector 5 - Green Zone",
      nextPickup: "Tomorrow 8:00 AM",
      vehicleNo: "DL09 AB 2451",
    });
  };

  return (
    <div className="auth-container">
      <h2>Garbage Collection Schedule</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter your area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
        />
        <button type="submit">Check Schedule</button>
      </form>

      {schedule && (
        <div className="schedule-card">
          <h3>Route: {schedule.route}</h3>
          <p>Next Pickup: {schedule.nextPickup}</p>
          <p>Vehicle: {schedule.vehicleNo}</p>
        </div>
      )}
    </div>
  );
};

export default GarbageSchedule;
