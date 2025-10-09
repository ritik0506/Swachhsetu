import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportIssue from "./pages/ReportIssue";
import Dashboard from "./pages/Dashboard";
import ToiletFinder from "./pages/ToiletFinder";
import WasteReport from "./pages/WasteReport";
import RestaurantHygiene from "./pages/RestaurantHygiene";
import GarbageSchedule from "./pages/GarbageSchedule";
import HealthGuide from "./pages/HealthGuide";

const App = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/toilets" element={<ToiletFinder />} />
          <Route path="/waste-report" element={<WasteReport />} />
          <Route path="/restaurant" element={<RestaurantHygiene />} />
          <Route path="/garbage" element={<GarbageSchedule />} />
          <Route path="/health-guide" element={<HealthGuide />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;
