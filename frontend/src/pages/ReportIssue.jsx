import React, { useState } from "react";

const ReportIssue = () => {
  const [form, setForm] = useState({
    category: "",
    description: "",
    image: null,
    location: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Report submitted:", form);
  };

  return (
    <div className="auth-container">
      <h2>Report Hygiene Issue</h2>
      <form onSubmit={handleSubmit}>
        <select name="category" onChange={handleChange} required>
          <option value="">Select Category</option>
          <option value="toilet">Public Toilet</option>
          <option value="waste">Waste Dump</option>
          <option value="restaurant">Restaurant Hygiene</option>
          <option value="beach">Beach/River</option>
        </select>

        <textarea
          name="description"
          placeholder="Describe the issue..."
          onChange={handleChange}
          required
        ></textarea>

        <input type="text" name="location" placeholder="Location" onChange={handleChange} required />
        <input type="file" name="image" accept="image/*" onChange={handleChange} />
        <button type="submit">Submit Report</button>
      </form>
    </div>
  );
};

export default ReportIssue;
