import React, { useContext, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import { Context } from "./main";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Accounts from "./components/Accounts";
import Jobs from "./components/Jobs";
import Applications from "./components/Applications";
import FraudReports from "./components/FraudReports";
import Login from "./components/Login";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { isAuthorized, user, isLoading } = useContext(Context);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#fff" }}>
        <div className="spinner">Loading Admin Panel...</div>
      </div>
    );
  }

  if (!isAuthorized || user.role !== "Admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, isLoading, setIsLoading } = useContext(Context);

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/admin/auth/me`,
          {
            withCredentials: true,
          }
        );
        
        if (data.user && data.user.role === "Admin") {
          setUser(data.user);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setUser({});
        }
      } catch (error) {
        setIsAuthorized(false);
        setUser({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminUser();
  }, [setIsAuthorized, setUser, setIsLoading]);

  return (
    <>
      <BrowserRouter>
        <div className="app-container">
          {isAuthorized && <Sidebar />}
          <main className="main-content" style={!isAuthorized ? { marginLeft: 0, padding: 0 } : {}}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute>
                    <Accounts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs" 
                element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/fraud-reports" 
                element={
                  <ProtectedRoute>
                    <FraudReports />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }
        }} />
      </BrowserRouter>
    </>
  );
};

export default App;
