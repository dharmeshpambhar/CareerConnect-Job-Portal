import React, { useState, useContext } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { MdOutlineMailOutline, MdSecurity } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLock } from "react-icons/ai";
import { FaShieldAlt } from "react-icons/fa";
import { FaArrowRight, FaCheck } from "react-icons/fa6";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../main";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const Login = () => {
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please fill in both email and password!");
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/admin/auth/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message || "Successfully logged in as Admin!");
      setUser(data.user);
      setIsAuthorized(true);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Admin Credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-master-wrapper">
      {/* Dynamic Background Glows */}
      <div className="auth-ambient-glow auth-glow-1" />
      <div className="auth-ambient-glow auth-glow-2" />
      <div className="auth-ambient-glow auth-glow-3" />

      <div className="auth-container-card">
        <div className="auth-form-column">
          {/* Brand Header */}
          <div className="auth-brand-header">
            <Link to="/" className="auth-logo-link">
              <span className="auth-logo-text">CareerConnect</span>
            </Link>
            <div className="auth-badge-pill">
              <span className="auth-badge-dot" />
              <span>ADMIN ACCESS</span>
            </div>
          </div>

          {/* Heading Intro */}
          <div className="auth-title-group">
            <h1 className="auth-main-heading">
              Admin Portal<span className="auth-heading-accent">.</span>
            </h1>
            <p className="auth-sub-heading">
              Enter your master administrator credentials to access the control center.
            </p>
          </div>

          {/* Role Indicator Card */}
          <div className="auth-field-group" style={{ marginBottom: "16px" }}>
            <label className="auth-field-label">Portal Authorization</label>
            <div className="auth-role-card selected" style={{ cursor: "default" }}>
              <div className="role-card-icon-wrap" style={{ background: "#6366f1", color: "#ffffff", borderColor: "#6366f1" }}>
                <FaShieldAlt />
              </div>
              <div className="role-card-text">
                <span className="role-card-title">System Administrator</span>
                <span className="role-card-desc">Master Security & Platform Management</span>
              </div>
              <FaCheck className="role-check-badge" style={{ color: "#6366f1", background: "#ede9fe" }} />
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="auth-form-body">
            {/* Email Field */}
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="admin-email">
                Admin Email Address
              </label>
              <div className="auth-input-wrapper">
                <MdOutlineMailOutline className="auth-input-icon" />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input-control"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="auth-field-group">
              <label className="auth-field-label" htmlFor="admin-password">
                Master Password
              </label>
              <div className="auth-input-wrapper">
                <AiOutlineLock className="auth-input-icon" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input-control"
                />
                <button
                  type="button"
                  className="auth-eye-action-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
            </div>

            {/* Options Row */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-custom-checkbox"
                />
                <span>Remember this session securely</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-submit-primary-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading-content">
                  <span className="auth-btn-spinner" />
                  Authenticating...
                </span>
              ) : (
                <span className="btn-normal-content">
                  Access Control Center <FaArrowRight className="btn-arrow-icon" />
                </span>
              )}
            </button>

            {/* Footer Trust Note */}
            <div className="auth-security-footer-note">
              <MdSecurity style={{ fontSize: "1.1rem", color: "#6366f1" }} />
              <span>Authorized administrator personnel only. All access attempts are logged.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
