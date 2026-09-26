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
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regCompanyRegNo, setRegCompanyRegNo] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateFileName, setCertificateFileName] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Validation Errors
  const [loginErrors, setLoginErrors] = useState({});
  const [regErrors, setRegErrors] = useState({});
  const [forgotErrors, setForgotErrors] = useState({});

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

  // ── Validation Helpers ──────────────────────────────────────────────────────
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidPhone = (val) => /^[0-9]{10}$/.test(val.trim());
  const isValidName  = (val) => /^[A-Za-z\s.'-]{2,}$/.test(val.trim());

  // ── Login Submit ─────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginEmail.trim()) errs.email = "Email is required.";
    else if (!isValidEmail(loginEmail)) errs.email = "Enter a valid email address.";
    if (!loginPassword) errs.password = "Password is required.";
    else if (loginPassword.length < 6) errs.password = "Password must be at least 6 characters.";
    if (Object.keys(errs).length) { setLoginErrors(errs); return; }
    setLoginErrors({});
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

  // ── Register Submit ───────────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!regName.trim()) errs.name = "Contact / Recruiter name is required.";
    else if (!isValidName(regName)) errs.name = "Name must contain only letters, spaces, or dots (min 2 chars).";
    
    if (regRole === "Employer") {
      if (!regCompanyName.trim()) {
        errs.companyName = "Official company name is required.";
      }
      if (!regCompanyRegNo.trim()) {
        errs.companyRegNo = "Govt Registration / CIN / Tax ID is required.";
      }
      if (!certificateFile) {
        errs.certificate = "Company registration certificate is required.";
      }
    }

    if (!regEmail.trim()) errs.email = "Email address is required.";
    else if (!isValidEmail(regEmail)) errs.email = "Enter a valid email address.";
    if (!regPhone.trim()) errs.phone = "Phone number is required.";
    else if (!isValidPhone(regPhone)) errs.phone = "Phone must be exactly 10 digits (numbers only).";
    if (!regPassword) errs.password = "Password is required.";
    else if (regPassword.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!agreeTerms) errs.terms = "You must agree to the Terms of Service & Privacy Policy.";
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", regName);
      formData.append("phone", regPhone);
      formData.append("email", regEmail);
      formData.append("role", regRole);
      formData.append("password", regPassword);

      if (regRole === "Employer") {
        formData.append("companyName", regCompanyName.trim() || regName.trim());
        formData.append("companyRegistrationNumber", regCompanyRegNo.trim());
        if (certificateFile) {
          formData.append("companyCertificate", certificateFile);
        }
      }

      const { data } = await axios.post(
        `${API_BASE}/user/register`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (regRole === "Employer") {
        toast.success("Registration submitted! Your company certificate is sent for Admin Verification.");
      } else {
        toast.success(data.message || "Account registered successfully!");
      }

      setRegName("");
      setRegCompanyName("");
      setRegCompanyRegNo("");
      setCertificateFile(null);
      setCertificateFileName("");
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

  // ── Forgot Password Submit ────────────────────────────────────────────────────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!forgotEmail.trim()) errs.email = "Email is required.";
    else if (!isValidEmail(forgotEmail)) errs.email = "Enter a valid email address.";
    if (!newPassword) errs.newPassword = "New password is required.";
    else if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match!";
    if (Object.keys(errs).length) { setForgotErrors(errs); return; }
    setForgotErrors({});
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
                    <div className={`auth-input-wrapper ${loginErrors.email ? "auth-input-error" : ""}`}>
                      <MdOutlineMailOutline className="auth-input-icon" />
                      <input
                        id="login-email"
                        type="email"
                        placeholder="you@gmail.com"
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: "" })); }}
                        className="auth-input-control"
                      />
                    </div>
                    {loginErrors.email && <p className="auth-field-error">{loginErrors.email}</p>}
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
                    <div className={`auth-input-wrapper ${loginErrors.password ? "auth-input-error" : ""}`}>
                      <AiOutlineLock className="auth-input-icon" />
                      <input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: "" })); }}
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
                    {loginErrors.password && <p className="auth-field-error">{loginErrors.password}</p>}
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
                      {regRole === "Job Seeker" ? "Full Name" : "Recruiter / Contact Person Name"}
                    </label>
                    <div className={`auth-input-wrapper ${regErrors.name ? "auth-input-error" : ""}`}>
                      <FaRegUser className="auth-input-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder={regRole === "Job Seeker" ? "e.g. Dharmesh Pambhar" : "e.g. John Doe (HR Lead)"}
                        value={regName}
                        onChange={(e) => {
                          // Block digits and special characters from name field
                          const val = e.target.value;
                          if (/[^A-Za-z\s.'\-]/.test(val)) return;
                          setRegName(val);
                          setRegErrors((p) => ({ ...p, name: "" }));
                        }}
                        className="auth-input-control"
                      />
                    </div>
                    {regErrors.name && <p className="auth-field-error">{regErrors.name}</p>}
                  </div>

                  {/* Employer Specific: Company Name & CIN/Reg No */}
                  {regRole === "Employer" && (
                    <>
                      <div className="auth-field-group">
                        <label className="auth-field-label" htmlFor="reg-company-name">
                          Official Company / Enterprise Name
                        </label>
                        <div className={`auth-input-wrapper ${regErrors.companyName ? "auth-input-error" : ""}`}>
                          <FaBuilding className="auth-input-icon" />
                          <input
                            id="reg-company-name"
                            type="text"
                            placeholder="e.g. Google, Microsoft, TechCorp Solutions"
                            value={regCompanyName}
                            onChange={(e) => {
                              setRegCompanyName(e.target.value);
                              setRegErrors((p) => ({ ...p, companyName: "" }));
                            }}
                            className="auth-input-control"
                          />
                        </div>
                        {regErrors.companyName && <p className="auth-field-error">{regErrors.companyName}</p>}
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-field-label" htmlFor="reg-company-regno">
                          Govt Registration / CIN / Tax ID
                        </label>
                        <div className={`auth-input-wrapper ${regErrors.companyRegNo ? "auth-input-error" : ""}`}>
                          <FaBriefcase className="auth-input-icon" />
                          <input
                            id="reg-company-regno"
                            type="text"
                            placeholder="e.g. CIN: U72200MH2019PTC123456 / GSTIN"
                            value={regCompanyRegNo}
                            onChange={(e) => {
                              setRegCompanyRegNo(e.target.value);
                              setRegErrors((p) => ({ ...p, companyRegNo: "" }));
                            }}
                            className="auth-input-control"
                          />
                        </div>
                        {regErrors.companyRegNo && <p className="auth-field-error">{regErrors.companyRegNo}</p>}
                      </div>

                      {/* Certificate Upload Field */}
                      <div className="auth-field-group">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label className="auth-field-label" style={{ margin: 0 }}>
                            Company Registration Certificate / Document
                          </label>
                          <span style={{ fontSize: "0.72rem", color: "#0ea5e9", fontWeight: 600 }}>
                            🛡️ Required for Verification
                          </span>
                        </div>

                        <div
                          style={{
                            border: regErrors.certificate ? "1.5px dashed #ef4444" : "1.5px dashed #cbd5e1",
                            borderRadius: "10px",
                            padding: "14px",
                            background: certificateFile ? "#f8fafc" : "#ffffff",
                            textAlign: "center",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <input
                            type="file"
                            id="reg-certificate"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setCertificateFile(file);
                                setCertificateFileName(file.name);
                                setRegErrors((p) => ({ ...p, certificate: "" }));
                              }
                            }}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                          {certificateFile ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                              <FaCheck style={{ color: "#10b981", fontSize: "1.1rem" }} />
                              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>
                                {certificateFileName}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCertificateFile(null);
                                  setCertificateFileName("");
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#475569" }}>
                                📄 Click or drag to upload Company Certificate (PDF, PNG, JPG)
                              </div>
                              <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: "2px" }}>
                                Official incorporation certificate, GST doc, or business license
                              </div>
                            </div>
                          )}
                        </div>
                        {regErrors.certificate && <p className="auth-field-error">{regErrors.certificate}</p>}

                        {/* Verification Notice */}
                        <p
                          style={{
                            margin: "6px 0 0 0",
                            fontSize: "0.78rem",
                            color: "#64748b",
                            lineHeight: 1.4,
                          }}
                        >
                          Submitted company documents and credentials are typically reviewed within 24–48 hours.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Email & Phone Split Row */}
                  <div className="auth-fields-split-row">
                    <div className="auth-field-group">
                      <label className="auth-field-label" htmlFor="reg-email">
                        Email Address
                      </label>
                      <div className={`auth-input-wrapper ${regErrors.email ? "auth-input-error" : ""}`}>
                        <MdOutlineMailOutline className="auth-input-icon" />
                        <input
                          id="reg-email"
                          type="email"
                          placeholder="name@gmail.com"
                          value={regEmail}
                          onChange={(e) => { setRegEmail(e.target.value); setRegErrors((p) => ({ ...p, email: "" })); }}
                          className="auth-input-control"
                        />
                      </div>
                      {regErrors.email && <p className="auth-field-error">{regErrors.email}</p>}
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label" htmlFor="reg-phone">
                        Phone Number
                      </label>
                      <div className={`auth-input-wrapper ${regErrors.phone ? "auth-input-error" : ""}`}>
                        <FaPhoneFlip className="auth-input-icon" />
                        <input
                          id="reg-phone"
                          type="tel"
                          placeholder="10-digit phone"
                          value={regPhone}
                          maxLength={10}
                          onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, arrow keys, home, end
                            const allowed = ["Backspace","Delete","Tab","Escape","ArrowLeft","ArrowRight","Home","End"];
                            if (allowed.includes(e.key)) return;
                            // Block anything that is not a digit
                            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setRegPhone(digits);
                            setRegErrors((p) => ({ ...p, phone: "" }));
                          }}
                          className="auth-input-control"
                        />
                      </div>
                      {regErrors.phone && <p className="auth-field-error">{regErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="auth-field-group">
                    <label className="auth-field-label" htmlFor="reg-password">
                      Create Password
                    </label>
                    <div className={`auth-input-wrapper ${regErrors.password ? "auth-input-error" : ""}`}>
                      <AiOutlineLock className="auth-input-icon" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => { setRegPassword(e.target.value); setRegErrors((p) => ({ ...p, password: "" })); }}
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
                    {regErrors.password && <p className="auth-field-error">{regErrors.password}</p>}

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
                  <div className="auth-options-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => { setAgreeTerms(e.target.checked); setRegErrors((p) => ({ ...p, terms: "" })); }}
                        className="auth-custom-checkbox"
                      />
                      <span>
                        I agree to the <span className="auth-link-highlight">Terms of Service</span> and{" "}
                        <span className="auth-link-highlight">Privacy Policy</span>
                      </span>
                    </label>
                    {regErrors.terms && <p className="auth-field-error" style={{ marginTop: 0 }}>{regErrors.terms}</p>}
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
                <div className={`auth-input-wrapper ${forgotErrors.email ? "auth-input-error" : ""}`}>
                  <MdOutlineMailOutline className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotErrors((p) => ({ ...p, email: "" })); }}
                    className="auth-input-control"
                  />
                </div>
                {forgotErrors.email && <p className="auth-field-error">{forgotErrors.email}</p>}
              </div>

              {/* New Password */}
              <div className="auth-field-group">
                <label className="auth-field-label">New Password</label>
                <div className={`auth-input-wrapper ${forgotErrors.newPassword ? "auth-input-error" : ""}`}>
                  <AiOutlineLock className="auth-input-icon" />
                  <input
                    type={showForgotPass ? "text" : "password"}
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setForgotErrors((p) => ({ ...p, newPassword: "" })); }}
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
                {forgotErrors.newPassword && <p className="auth-field-error">{forgotErrors.newPassword}</p>}
              </div>

              {/* Confirm New Password */}
              <div className="auth-field-group">
                <label className="auth-field-label">Confirm New Password</label>
                <div className={`auth-input-wrapper ${forgotErrors.confirmPassword ? "auth-input-error" : ""}`}>
                  <AiOutlineLock className="auth-input-icon" />
                  <input
                    type={showForgotPass ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setForgotErrors((p) => ({ ...p, confirmPassword: "" })); }}
                    className="auth-input-control"
                  />
                </div>
                {forgotErrors.confirmPassword && <p className="auth-field-error">{forgotErrors.confirmPassword}</p>}
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
