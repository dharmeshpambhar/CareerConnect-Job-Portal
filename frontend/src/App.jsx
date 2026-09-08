import React, { useContext, useEffect, lazy, Suspense } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/Auth/Login";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Home from "./components/Home/Home";
import NotFound from "./components/NotFound/NotFound";

// Code-split heavy routes for rapid on-demand loading
const Jobs = lazy(() => import("./components/Job/Jobs"));
const JobDetails = lazy(() => import("./components/Job/JobDetails"));
const Application = lazy(() => import("./components/Application/Application"));
const MyApplications = lazy(() => import("./components/Application/MyApplications"));
const PostJob = lazy(() => import("./components/Job/PostJob"));
const MyJobs = lazy(() => import("./components/Job/MyJobs"));
const Wishlist = lazy(() => import("./components/Job/Wishlist"));
const CompanyProfile = lazy(() => import("./components/Job/CompanyProfile"));
const CompanyPublicProfile = lazy(() => import("./components/Job/CompanyPublicProfile"));
const JobseekerProfile = lazy(() => import("./components/Job/JobseekerProfile"));
const AboutUs = lazy(() => import("./components/Layout/AboutUs"));

const RouteLoader = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: "40px", height: "40px", border: "3px solid #e2e8f0", borderTop: "3px solid #0ea5e9", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
  </div>
);

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, isLoading, setIsLoading } = useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/getuser`,
          {
            withCredentials: true,
          }
        );
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
        setUser({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="/forgot-password" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/job/getall" element={<Jobs />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/application/:id" element={<Application />} />
            <Route path="/applications/me" element={<MyApplications />} />
            <Route path="/job/post" element={<PostJob />} />
            <Route path="/job/me" element={<MyJobs />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/company/view/:id" element={<CompanyPublicProfile />} />
            <Route path="/jobseeker/profile" element={<JobseekerProfile />} />
            <Route path="/profile" element={<JobseekerProfile />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </>
  );
};

export default App;
