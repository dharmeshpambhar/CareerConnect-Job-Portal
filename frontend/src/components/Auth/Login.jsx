import React, { useContext, useState, useMemo } from "react";
import { MdOutlineMailOutline, MdSecurity } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLock, AiOutlineCheck } from "react-icons/ai";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { FaRegUser, FaPencilAlt, FaKey, FaBuilding, FaUserTie, FaBriefcase } from "react-icons/fa";
import { FaPhoneFlip, FaArrowRight, FaCheck } from "react-icons/fa6";
import { HiX, HiSparkles } from "react-icons/hi";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { resetPasswordApi } from "../../apiService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginMode = location.pathname === "/login";

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState("Job Seeker");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("Job Seeker");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password Modal States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotRole, setForgotRole] = useState("Job Seeker");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const { isAuthorized, setIsAuthorized, setUser } = useContext(Context);

  // Password strength calculation for Registration
  const passwordStrength = useMemo(() => {
    if (!regPassword) return { score: 0, text: "", color: "" };
    let score = 0;
    if (regPassword.length >= 6) score += 1;
    if (regPassword.length >= 9) score += 1;
    if (/[A-Z]/.test(regPassword)) score += 1;
    if (/[0-9]/.test(regPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(regPassword)) score += 1;

    if (score <= 2) return { score: 1, text: "Weak", color: "#ef4444", width: "33%" };
    if (score <= 3) return { score: 2, text: "Medium", color: "#f59e0b", width: "66%" };
    return { score: 3, text: "Strong", color: "#10b981", width: "100%" };
  }, [regPassword]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/user/login`,
        { email: loginEmail, password: loginPassword, role: loginRole },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message || "Successfully logged in!");
      setLoginEmail("");
      setLoginPassword("");
      setUser(data.user);
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please agree to the Terms of Service & Privacy Policy.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/user/register`,
        { name: regName, phone: regPhone, email: regEmail, role: regRole, password: regPassword },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message || "Account registered successfully!");
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setUser(data.user);
      setIsAuthorized(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }
    setForgotLoading(true);
    const res = await resetPasswordApi({
      email: forgotEmail,
      role: forgotRole,
      newPassword,
    });
    setForgotLoading(false);
    if (res.success) {
      toast.success(res.message);
      setForgotModalOpen(false);
      setForgotEmail("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.message);
    }
  };

  if (isAuthorized) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="auth-master-wrapper">
      {/* Dynamic Background Glows */}
      <div className="auth-ambient-glow auth-glow-1" />
      <div className="auth-ambient-glow auth-glow-2" />
      <div className="auth-ambient-glow auth-glow-3" />

      <div className="auth-container-card">
        {/* LEFT COLUMN: AUTH FORM CONTAINER */}
        <div className="auth-form-column">
          {/* Header Brand */}
          <div className="auth-brand-header">
            <Link to="/" className="auth-logo-link">
              <img src="/careerconnect-black.png" alt="CareerConnect Logo" className="auth-logo-img" />
            </Link>
            <div className="auth-badge-pill">
              <span className="auth-badge-dot" />
              <span>CAREER PLATFORM</span>
            </div>
          </div>

          {/* Heading Intro */}
          <div className="auth-title-group">
            <h1 className="auth-main-heading">
              {isLoginMode ? "Welcome Back" : "Create Account"}
              <span className="auth-heading-accent">.</span>
            </h1>
            <p className="auth-sub-heading">
              {isLoginMode
                ? "Enter your credentials to access your job dashboard & saved applications."
                : "Join thousands of job seekers and verified recruiters today. 100% free."}
            </p>
          </div>

          {/* Sliding Pill Switcher */}
          <div className="auth-nav-toggle">
            <div className={`auth-nav-pill-bg ${!isLoginMode ? "is-register" : ""}`} />
            <button
              type="button"
              className={`auth-nav-btn ${isLoginMode ? "active" : ""}`}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-nav-btn ${!isLoginMode ? "active" : ""}`}
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>

          {/* Forms Viewport */}
          <div className="auth-content-viewport">
            <div
              className="auth-content-slider"
              style={{ transform: isLoginMode ? "translateX(0%)" : "translateX(-50%)" }}
            >
              {/* ────────────────── LOGIN FORM ────────────────── */}
              <div className="auth-pane-box">
                <form onSubmit={handleLoginSubmit} className="auth-form-body">
                  {/* Visual Role Selector */}
                  <div className="auth-field-group">
                    <label className="auth-field-label">Select Account Type</label>
                    <div className="auth-role-grid">
                      <button
                        type="button"
                        className={`auth-role-card ${loginRole === "Job Seeker" ? "selected" : ""}`}
                        onClick={() => setLoginRole("Job Seeker")}
                      >
                        <div className="role-card-icon-wrap">
                          <FaUserTie />
                        </div>
                        <div className="role-card-text">
                          <span className="role-card-title">Job Seeker</span>
                          <span className="role-card-desc">Find jobs</span>
                        </div>
                        {loginRole === "Job Seeker" && <FaCheck className="role-check-badge" />}
                      </button>

                      <button
                        type="button"
                        className={`auth-role-card ${loginRole === "Employer" ? "selected" : ""}`}
                        onClick={() => setLoginRole("Employer")}
                      >
                        <div className="role-card-icon-wrap">
                          <FaBuilding />
                        </div>
                        <div className="role-card-text">
                          <span className="role-card-title">Employer</span>
                          <span className="role-card-desc">Hire talent</span>
                        </div>
                        {loginRole === "Employer" && <FaCheck className="role-check-badge" />}
                      </button>
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="login-email">
                      Work / Personal Email
                    </label>
                    <div className="auth-input-wrapper">
                      <MdOutlineMailOutline className="auth-input-icon" />
                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required={isLoginMode}
                        className="auth-input-control"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="auth-field-group">
                    <div className="auth-field-header-row">
                      <label className="auth-field-label" htmlFor="login-password">
                        Password
                      </label>
                      <button
                        type="button"
                        className="auth-forgot-link-btn"
                        onClick={() => {
                          setForgotRole(loginRole);
                          setForgotEmail(loginEmail);
                          setForgotModalOpen(true);
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="auth-input-wrapper">
                      <AiOutlineLock className="auth-input-icon" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required={isLoginMode}
                        className="auth-input-control"
                      />
                      <button
                        type="button"
                        className="auth-eye-action-btn"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="auth-options-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="auth-custom-checkbox"
                      />
                      <span>Keep me signed in on this device</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="auth-submit-primary-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading-content">
                        <span className="auth-btn-spinner" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="btn-normal-content">
                        Sign In to Account <FaArrowRight className="btn-arrow-icon" />
                      </span>
                    )}
                  </button>

                  <div className="auth-switch-prompt">
                    <span>Don't have an account yet?</span>{" "}
                    <button
                      type="button"
                      className="auth-inline-switch-btn"
                      onClick={() => navigate("/register")}
                    >
                      Create free account
                    </button>
                  </div>
                </form>
              </div>

              {/* ────────────────── REGISTER FORM ────────────────── */}
              <div className="auth-pane-box">
                <form onSubmit={handleRegisterSubmit} className="auth-form-body">
                  {/* Visual Role Selector */}
                  <div className="auth-field-group">
                    <label className="auth-field-label">I want to register as</label>
                    <div className="auth-role-grid">
                      <button
                        type="button"
                        className={`auth-role-card ${regRole === "Job Seeker" ? "selected" : ""}`}
                        onClick={() => setRegRole("Job Seeker")}
                      >
                        <div className="role-card-icon-wrap">
                          <FaUserTie />
                        </div>
                        <div className="role-card-text">
                          <span className="role-card-title">Job Seeker</span>
                          <span className="role-card-desc">Find jobs & track apps</span>
                        </div>
                        {regRole === "Job Seeker" && <FaCheck className="role-check-badge" />}
                      </button>

                      <button
                        type="button"
                        className={`auth-role-card ${regRole === "Employer" ? "selected" : ""}`}
                        onClick={() => setRegRole("Employer")}
                      >
                        <div className="role-card-icon-wrap">
                          <FaBuilding />
                        </div>
                        <div className="role-card-text">
                          <span className="role-card-title">Employer</span>
                          <span className="role-card-desc">Post jobs & hire talent</span>
                        </div>
                        {regRole === "Employer" && <FaCheck className="role-check-badge" />}
                      </button>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="reg-name">
                      Full Name / Company Name
                    </label>
                    <div className="auth-input-wrapper">
                      <FaRegUser className="auth-input-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder={regRole === "Job Seeker" ? "e.g. Dharmesh Pambhar" : "e.g. Acme Corporation"}
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required={!isLoginMode}
                        className="auth-input-control"
                      />
                    </div>
                  </div>

                  {/* Email & Phone Split Row */}
                  <div className="auth-fields-split-row">
                    <div className="auth-field-group">
                      <label className="auth-field-label" htmlFor="reg-email">
                        Email Address
                      </label>
                      <div className="auth-input-wrapper">
                        <MdOutlineMailOutline className="auth-input-icon" />
                        <input
                          id="reg-email"
                          type="email"
                          placeholder="name@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required={!isLoginMode}
                          className="auth-input-control"
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label" htmlFor="reg-phone">
                        Phone Number
                      </label>
                      <div className="auth-input-wrapper">
                        <FaPhoneFlip className="auth-input-icon" />
                        <input
                          id="reg-phone"
                          type="tel"
                          placeholder="10-digit phone"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          required={!isLoginMode}
                          className="auth-input-control"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="reg-password">
                      Create Password
                    </label>
                    <div className="auth-input-wrapper">
                      <AiOutlineLock className="auth-input-icon" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required={!isLoginMode}
                        className="auth-input-control"
                      />
                      <button
                        type="button"
                        className="auth-eye-action-btn"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        aria-label={showRegPassword ? "Hide password" : "Show password"}
                      >
                        {showRegPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword.length > 0 && (
                      <div className="auth-strength-container">
                        <div className="auth-strength-meter">
                          <div
                            className="auth-strength-bar"
                            style={{
                              width: passwordStrength.width,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>
                        <div className="auth-strength-label-row">
                          <span className="strength-text" style={{ color: passwordStrength.color }}>
                            Strength: {passwordStrength.text}
                          </span>
                          <span className="strength-hint">Min. 6 chars recommended</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="auth-options-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="auth-custom-checkbox"
                        required
                      />
                      <span>
                        I agree to the <span className="auth-link-highlight">Terms of Service</span> and{" "}
                        <span className="auth-link-highlight">Privacy Policy</span>
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="auth-submit-primary-btn" disabled={loading}>
                    {loading ? (
                      <span className="btn-loading-content">
                        <span className="auth-btn-spinner" />
                        Creating your account...
                      </span>
                    ) : (
                      <span className="btn-normal-content">
                        Create Free Account <FaArrowRight className="btn-arrow-icon" />
                      </span>
                    )}
                  </button>

                  <div className="auth-switch-prompt">
                    <span>Already have an account?</span>{" "}
                    <button
                      type="button"
                      className="auth-inline-switch-btn"
                      onClick={() => navigate("/login")}
                    >
                      Sign in here
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── FORGOT PASSWORD MODAL OVERLAY ────────────────── */}
      {forgotModalOpen && (
        <div className="auth-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div className="auth-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <div className="auth-modal-header-info">
                <div className="modal-header-icon-wrap">
                  <FaKey />
                </div>
                <div>
                  <h3 className="auth-modal-title">Reset Your Password</h3>
                  <p className="auth-modal-subtitle">
                    Enter your registered email address and define a new secure password.
                  </p>
                </div>
              </div>
              <button
                className="auth-modal-close-btn"
                onClick={() => setForgotModalOpen(false)}
                aria-label="Close modal"
              >
                <HiX />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="auth-modal-form">
              {/* Account Role Selector */}
              <div className="auth-field-group">
                <label className="auth-field-label">Account Role</label>
                <div className="auth-role-grid modal-role-grid">
                  <button
                    type="button"
                    className={`auth-role-card ${forgotRole === "Job Seeker" ? "selected" : ""}`}
                    onClick={() => setForgotRole("Job Seeker")}
                  >
                    <FaUserTie />
                    <span>Job Seeker</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-role-card ${forgotRole === "Employer" ? "selected" : ""}`}
                    onClick={() => setForgotRole("Employer")}
                  >
                    <FaBuilding />
                    <span>Employer</span>
                  </button>
                </div>
              </div>

              {/* Registered Email */}
              <div className="auth-field-group">
                <label className="auth-field-label">Registered Email</label>
                <div className="auth-input-wrapper">
                  <MdOutlineMailOutline className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="auth-input-control"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="auth-field-group">
                <label className="auth-field-label">New Password</label>
                <div className="auth-input-wrapper">
                  <AiOutlineLock className="auth-input-icon" />
                  <input
                    type={showForgotPass ? "text" : "password"}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="auth-input-control"
                  />
                  <button
                    type="button"
                    className="auth-eye-action-btn"
                    onClick={() => setShowForgotPass((prev) => !prev)}
                  >
                    {showForgotPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="auth-field-group">
                <label className="auth-field-label">Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <AiOutlineLock className="auth-input-icon" />
                  <input
                    type={showForgotPass ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="auth-input-control"
                  />
                </div>
              </div>

              <div className="auth-modal-action-bar">
                <button
                  type="button"
                  className="auth-modal-cancel-btn"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="auth-modal-confirm-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
