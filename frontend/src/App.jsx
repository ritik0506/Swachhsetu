import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportIssue from "./pages/ReportIssue";
import EnhancedReportIssue from "./pages/EnhancedReportIssue";
import Dashboard from "./pages/Dashboard";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ToiletFinder from "./pages/ToiletFinder";
import WasteReport from "./pages/WasteReport";
import RestaurantHygiene from "./pages/RestaurantHygiene";
import GarbageSchedule from "./pages/GarbageSchedule";
import HealthGuide from "./pages/HealthGuide";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 160px)' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/report" element={<ReportIssue />} />
              <Route 
                path="/report-issue" 
                element={
                  <ProtectedRoute>
                    <EnhancedReportIssue />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <EnhancedDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/toilets" element={<ToiletFinder />} />
              <Route path="/waste-report" element={<WasteReport />} />
              <Route path="/restaurant" element={<RestaurantHygiene />} />
              <Route path="/garbage" element={<GarbageSchedule />} />
              <Route path="/health-guide" element={<HealthGuide />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
