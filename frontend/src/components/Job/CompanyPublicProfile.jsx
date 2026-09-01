import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
} from "react-icons/hi";
import { fetchEmployerProfile } from "../../apiService";

const CompanyPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [id, navigate]);

  // Accordion open state — must be declared before any conditional returns (Rules of Hooks)
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq((prev) => (prev === i ? null : i));

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

  const initial = companyName.charAt(0).toUpperCase();

  // getColor and other derived values

  const getColor = (name) => {
    const palette = [
      ["#1e40af", "#3b82f6"],
      ["#065f46", "#10b981"],
      ["#7c2d12", "#f97316"],
      ["#4c1d95", "#8b5cf6"],
      ["#831843", "#ec4899"],
      ["#164e63", "#0ea5e9"],
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return palette[sum % palette.length];
  };

  const [darkColor, lightColor] = getColor(companyName);

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
      <div
        className="cpp-hero"
        style={{ background: `linear-gradient(135deg, ${darkColor} 0%, ${lightColor} 100%)` }}
      >
        <div className="cpp-hero-inner">
          <Link to="/job/getall" className="cpp-back-btn">
            <FiArrowLeft /> Back to Jobs
          </Link>

          <div className="cpp-hero-body">
            <div className="cpp-hero-logo" style={{ background: `rgba(255,255,255,0.15)`, border: `2px solid rgba(255,255,255,0.3)`, overflow: "hidden" }}>
              {employer?.profilePicture?.url ? (
                <img
                  src={employer?.profilePicture?.url}
                  alt={companyName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initial
              )}
            </div>
            <div className="cpp-hero-text">
              <h1>{companyName}</h1>
              <p className="cpp-tagline">{tagline}</p>
              <div className="cpp-hero-chips">
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

          {/* LEFT: About + Perks + Contact */}
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

            {/* Contact Card (2nd position) */}
            <div className="cpp-card cpp-contact-card">
              <div className="cpp-card-header">
                <FiMail className="cpp-card-icon" />
                <h2>Hiring Contact</h2>
              </div>
              <div className="cpp-contact-row">
                <div
                  className="cpp-contact-avatar"
                  style={{ background: `linear-gradient(135deg, ${darkColor}, ${lightColor})` }}
                >
                  {employer.name?.charAt(0).toUpperCase() || "H"}
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
                    <Link to={`/job/${job._id}`} key={job._id} className="cpp-job-card">
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
