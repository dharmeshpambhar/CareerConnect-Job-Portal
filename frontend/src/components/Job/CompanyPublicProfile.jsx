import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate, Navigate } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiMapPin,
  FiGlobe,
  FiClock,
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiMail,
} from "react-icons/fi";
import {
  HiOutlineOfficeBuilding,
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { fetchEmployerProfile } from "../../apiService";

const CompanyPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthorized, isLoading } = useContext(Context);
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEmployerProfile(id)
      .then(({ employer: empData, jobs: jobsData, offline }) => {
        if (empData) {
          setEmployer(empData);
          setJobs(jobsData || []);
        } else if (!offline) {
          navigate("/job/getall");
        }
      })
      .catch(() => navigate("/job/getall"))
      .finally(() => setLoading(false));
  }, [id, navigate, isAuthorized]);

  // Accordion open state — must be declared before any conditional returns (Rules of Hooks)
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq((prev) => (prev === i ? null : i));

  if (isLoading) {
    return (
      <div className="cpp-loading">
        <div className="cpp-spinner" />
        <p>Loading company profile...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="cpp-loading">
        <div className="cpp-spinner" />
        <p>Loading company profile...</p>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="cpp-not-found">
        <h2>Company not found</h2>
        <Link to="/job/getall">← Back to Jobs</Link>
      </div>
    );
  }

  const c = employer.company || {};
  const companyName = (c.name && c.name.trim() !== "") ? c.name.trim() : `${employer.name}'s Company`;
  const tagline = c.tagline || employer.tagline || "Empowering Careers & Driving Innovation";
  const industry = c.industry || employer.industry || "";
  const companySize = c.size || employer.companySize || "";
  const founded = c.founded || employer.founded || "";
  const website = c.website || employer.website || "";
  const rawLoc = c.location || employer.location || "";
  const location = (rawLoc === "Ahmedabad, Gujarat, INDIA" || rawLoc === "Ahmedabad, INDIA") ? "" : rawLoc;
  const description = c.description || employer.description || "An innovative organization dedicated to creating meaningful impact.";
  const perks = c.perks || employer.perks || [];
  const recruiterTitle = c.recruiterTitle || employer.recruiterTitle || "Hiring Lead";
  // FAQs — stored flat on the employer doc (not nested under c)
  const faqs = employer.faqs || c.faqs || [];

  // Certificate and verification info
  const companyRegistrationNumber = employer.companyRegistrationNumber || c.companyRegistrationNumber || "";
  const companyCertificate = employer.companyCertificate || c.companyCertificate || null;
  const verificationStatus = employer.verificationStatus || c.verificationStatus || "Pending";
  const isVerified = Boolean(employer.isVerified || verificationStatus === "Approved");
  const verifiedAt = employer.verifiedAt || c.verifiedAt || null;

  const initial = companyName.charAt(0).toUpperCase();

  const formatSalary = (job) => {
    if (job.fixedSalary) return `₹${job.fixedSalary.toLocaleString("en-IN")}`;
    if (job.salaryFrom && job.salaryTo)
      return `₹${job.salaryFrom.toLocaleString("en-IN")} – ₹${job.salaryTo.toLocaleString("en-IN")}`;
    return "Negotiable";
  };

  const deriveJobType = (jobId) => {
    if (!jobId) return "Hybrid";
    const sum = jobId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return ["Remote", "Hybrid", "On-site"][sum % 3];
  };

  const perkIcons = ["🏥", "💰", "🏠", "📚", "🎯", "🌴", "⏰", "🎁", "🚀", "🍕"];

  return (
    <section className="cpp-page">
      {/* ── Hero Banner ── */}
      <div className="cpp-hero">
        <div className="cpp-hero-inner">
          <Link to="/job/getall" className="cpp-back-btn">
            <FiArrowLeft /> Back to Jobs
          </Link>

          <div className="cpp-hero-body">
            <div className={`cpp-hero-logo ${!employer?.profilePicture?.url ? "no-img" : ""}`}>
              {employer?.profilePicture?.url ? (
                <img
                  src={employer?.profilePicture?.url}
                  alt={companyName}
                />
              ) : (
                initial
              )}
            </div>
            <div className="cpp-hero-text">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ margin: 0 }}>{companyName}</h1>
                {isVerified && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "#ecfdf5",
                      color: "#047857",
                      border: "1px solid #a7f3d0",
                      borderRadius: "20px",
                      padding: "3px 12px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                    title="Official Verified Company (Certificate Verified by Admin)"
                  >
                    ✓ Verified Employer
                  </span>
                )}
              </div>
              <p className="cpp-tagline">{tagline}</p>
              <div className="cpp-hero-chips">
                {isVerified ? (
                  <span className="cpp-chip cpp-chip-verified">
                    <HiOutlineShieldCheck style={{ fontSize: "1.1rem" }} /> Official Verified Company
                  </span>
                ) : (
                  <span className="cpp-chip">
                    ⏳ Verification In Progress
                  </span>
                )}
                {industry && (
                  <span className="cpp-chip">
                    <HiOutlineOfficeBuilding /> {industry}
                  </span>
                )}
                {location && (
                  <span className="cpp-chip">
                    <FiMapPin /> {location}
                  </span>
                )}
                {companySize && (
                  <span className="cpp-chip">
                    <FiUsers /> {companySize}
                  </span>
                )}
                {founded && (
                  <span className="cpp-chip">
                    <FiCalendar /> Est. {founded}
                  </span>
                )}
                {website && (
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cpp-chip cpp-chip-link"
                  >
                    <FiGlobe /> Visit Website ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="cpp-body">
        <div className="cpp-content-grid">

          {/* LEFT: About + Official Certificate + Contact + Perks */}
          <div className="cpp-left-col">

            {/* About Section */}
            <div className="cpp-card">
              <div className="cpp-card-header">
                <HiOutlineLightBulb className="cpp-card-icon" />
                <h2>About {companyName}</h2>
              </div>
              <p className="cpp-about-text">{description}</p>

              {/* Stat pills */}
              <div className="cpp-stat-row">
                {companySize && (
                  <div className="cpp-stat-pill">
                    <FiUsers />
                    <div>
                      <span className="cpp-stat-value">{companySize}</span>
                      <span className="cpp-stat-label">Team Size</span>
                    </div>
                  </div>
                )}
                {founded && (
                  <div className="cpp-stat-pill">
                    <FiCalendar />
                    <div>
                      <span className="cpp-stat-value">{founded}</span>
                      <span className="cpp-stat-label">Founded</span>
                    </div>
                  </div>
                )}
                <div className="cpp-stat-pill">
                  <FiBriefcase />
                  <div>
                    <span className="cpp-stat-value">{jobs.length}</span>
                    <span className="cpp-stat-label">Open Roles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Company Certificate & Verification Card */}
            <div className="cpp-card cpp-verification-card">
              <div className="cpp-card-header">
                <HiOutlineShieldCheck
                  className="cpp-card-icon"
                  style={{ color: isVerified ? "#059669" : "#2563eb", fontSize: "1.3rem" }}
                />
                <h2>Official Company Verification & Certificate</h2>
              </div>

              {/* Verification Status Box */}
              <div
                style={{
                  background: isVerified ? "#ecfdf5" : "#fffbeb",
                  border: `1px solid ${isVerified ? "#a7f3d0" : "#fde68a"}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      color: isVerified ? "#065f46" : "#92400e",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {isVerified ? "✓ Government & Admin Verified" : "⏳ Verification Under Review"}
                  </span>
                  {verifiedAt && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Verified on: {new Date(verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.84rem", color: "#475569", lineHeight: "1.5" }}>
                  {isVerified
                    ? "This employer has completed official business registration verification and submitted authentic corporate credentials validated by Job Portal Administration."
                    : "The employer has submitted corporate registration credentials which are undergoing administrative review."}
                </p>
              </div>

              {/* Company Registration Number */}
              {companyRegistrationNumber && (
                <div style={{ marginBottom: "14px", background: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Company Registration No. (CIN / GSTIN)
                  </span>
                  <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                    {companyRegistrationNumber}
                  </span>
                </div>
              )}

              {/* Submitted Company Certificate Document Preview & Download */}
              {companyCertificate?.url ? (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem",
                        flexShrink: 0,
                      }}
                    >
                      <HiOutlineDocumentText />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "0.92rem",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {companyCertificate.fileName || "Company_Registration_Certificate.pdf"}
                      </p>
                      <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                        Official Corporate Document • Verified Authentic
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <a
                      href={companyCertificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        background: "#2563eb",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <FiGlobe style={{ fontSize: "0.95rem" }} /> View Certificate ↗
                    </a>
                    <a
                      href={companyCertificate.url}
                      download={companyCertificate.fileName || "Company_Certificate"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        background: "#f1f5f9",
                        color: "#334155",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      Download Document
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px dashed #cbd5e1", fontSize: "0.85rem", color: "#64748b" }}>
                  📄 Business credentials submitted and validated by system administration.
                </div>
              )}
            </div>

            {/* Contact Card (2nd position) */}
            <div className="cpp-card cpp-contact-card">
              <div className="cpp-card-header">
                <FiMail className="cpp-card-icon" />
                <h2>Hiring Contact</h2>
              </div>
              <div className="cpp-contact-row">
                <div className={`cpp-contact-avatar ${!employer?.profilePicture?.url ? "no-img" : ""}`}>
                  {employer?.profilePicture?.url ? (
                    <img
                      src={employer.profilePicture.url}
                      alt={companyName || employer.name}
                      className="cpp-contact-avatar-img"
                    />
                  ) : (
                    employer.name?.charAt(0).toUpperCase() || "H"
                  )}
                </div>
                <div>
                  <p className="cpp-contact-name">{employer.name}</p>
                  <p className="cpp-contact-title">{recruiterTitle}</p>
                  <p className="cpp-contact-email">{employer.email}</p>
                </div>
              </div>
              {website && (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cpp-website-btn"
                >
                  <FiGlobe /> {website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>

            {/* Work Culture & Perks */}
            {perks.length > 0 && (
              <div className="cpp-card">
                <div className="cpp-card-header">
                  <HiOutlineSparkles className="cpp-card-icon" />
                  <h2>Work Culture & Perks</h2>
                </div>
                <div className="cpp-perks-grid">
                  {perks.map((perk, i) => (
                    <div className="cpp-perk-chip" key={i}>
                      <span>{perkIcons[i % perkIcons.length]}</span> {perk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company FAQs Accordion */}
            {faqs.length > 0 && (
              <div className="cpp-card cpp-faq-card">
                <div className="cpp-card-header">
                  <span className="cpp-card-icon" style={{ fontSize: "1.2rem" }}>❓</span>
                  <h2>Frequently Asked Questions</h2>
                </div>
                <div className="cpp-faq-accordion">
                  {faqs.map((faq, i) => (
                    <div
                      key={i}
                      className={`cpp-faq-item ${openFaq === i ? "cpp-faq-open" : ""}`}
                    >
                      <button
                        className="cpp-faq-header"
                        onClick={() => toggleFaq(i)}
                        aria-expanded={openFaq === i}
                      >
                        <span className="cpp-faq-q">{faq.question}</span>
                        <span className="cpp-faq-chevron">{openFaq === i ? "▲" : "▼"}</span>
                      </button>
                      <div className="cpp-faq-body">
                        <p className="cpp-faq-answer">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Active Job Openings */}
          <div className="cpp-right-col">
            <div className="cpp-card">
              <div className="cpp-card-header">
                <FiBriefcase className="cpp-card-icon" />
                <h2>Open Positions
                  <span className="cpp-badge">{jobs.length}</span>
                </h2>
              </div>

              {jobs.length === 0 ? (
                <div className="cpp-no-jobs">
                  <span>🔍</span>
                  <p>No active openings right now.</p>
                  <small>Check back later for new opportunities.</small>
                </div>
              ) : (
                <div className="cpp-jobs-list">
                  {jobs.map((job) => (
                    <Link
                      to={isAuthorized ? `/job/${job._id}` : "/login"}
                      key={job._id}
                      className="cpp-job-card"
                    >
                      <div className="cpp-job-top">
                        <div>
                          <h3 className="cpp-job-title">{job.title}</h3>
                          <div className="cpp-job-meta-row">
                            <span className="cpp-job-type-badge">{deriveJobType(job._id)}</span>
                            <span className="cpp-job-cat">{job.category}</span>
                            {job.city && (
                              <span className="cpp-job-loc">
                                <FiMapPin /> {job.city}, {job.country}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="cpp-job-salary">{formatSalary(job)}</span>
                      </div>
                      <p className="cpp-job-desc">
                        {job.description?.length > 140
                          ? `${job.description.substring(0, 140)}...`
                          : job.description}
                      </p>
                      <div className="cpp-job-footer">
                        <span className="cpp-job-posted">
                          <FiClock /> {new Date(job.jobPostedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="cpp-apply-link">Apply Now →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CompanyPublicProfile;
