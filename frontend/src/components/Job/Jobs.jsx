import React, { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FiSearch, FiFilter, FiMapPin, FiBriefcase, FiClock, FiUsers, FiLayers, FiX, FiZap } from "react-icons/fi";
import { FaRupeeSign, FaStar } from "react-icons/fa";
import { fetchAllJobs, toggleWishlist, fetchWishlist, fetchAiMatchRecommendations } from "../../apiService";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const { isAuthorized, user } = useContext(Context);
  const [searchParams] = useSearchParams();

  // Filter States — pre-seeded from hero search bar URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("loc") || "All");
  const [selectedExperience, setSelectedExperience] = useState("All");
  const [selectedJobType, setSelectedJobType] = useState("All");
  const [selectedSalary, setSelectedSalary] = useState("All");

  // AI Recommendations State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiProfileName, setAiProfileName] = useState("");
  const [aiTotalAnalyzed, setAiTotalAnalyzed] = useState(0);
  const [aiError, setAiError] = useState("");
  const [aiCandidateSkills, setAiCandidateSkills] = useState([]);
  const [aiNoSkills, setAiNoSkills] = useState(false);

  useEffect(() => {
    fetchAllJobs().then(({ jobs: data }) => {
      setJobs(data || []);
    });
  }, []);

  // Load saved job IDs from the wishlist collection
  useEffect(() => {
    if (isAuthorized && user?.role === "Job Seeker") {
      fetchWishlist().then(({ wishlist }) => {
        const ids = new Set((wishlist || []).map((item) => item.job?._id?.toString()));
        setSavedJobIds(ids);
      });
    } else {
      setSavedJobIds(new Set());
    }
  }, [isAuthorized, user]);

  const handleWishlistToggle = async (jobId) => {
    if (!jobId) return;
    if (!isAuthorized) {
      toast.error("Please login to bookmark jobs!");
      return;
    }
    try {
      const result = await toggleWishlist(jobId);
      toast.success(result.message);
      // Update local saved IDs optimistically
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (result.saved) {
          next.add(jobId.toString());
        } else {
          next.delete(jobId.toString());
        }
        return next;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const isWishlisted = (jobId) => {
    if (!jobId) return false;
    return savedJobIds.has(jobId.toString());
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedLocation("All");
    setSelectedExperience("All");
    setSelectedJobType("All");
    setSelectedSalary("All");
  };

  // ── AI Match Handler ──────────────────────────────────────────────────────
  const handleAiMatch = async () => {
    if (!isAuthorized) {
      toast.error("Please login to use AI Match Recommendations!");
      return;
    }
    if (user?.role !== "Job Seeker") {
      toast.error("AI Match Recommendations are only available for Job Seekers.");
      return;
    }

    setAiModalOpen(true);
    setAiLoading(true);
    setAiError("");
    setAiRecommendations([]);
    setAiCandidateSkills([]);
    setAiNoSkills(false);

    try {
      const result = await fetchAiMatchRecommendations();
      setAiRecommendations(result.recommendations || []);
      setAiProfileName(result.profileName || "");
      setAiTotalAnalyzed(result.totalAnalyzed || 0);
      setAiCandidateSkills(result.candidateSkills || []);
      setAiNoSkills(result.noSkills || false);
    } catch (err) {
      setAiError(err.message || "AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const closeAiModal = () => {
    setAiModalOpen(false);
    setAiError("");
    setAiNoSkills(false);
    setAiCandidateSkills([]);
  };

  // Dynamic derivations based on fields to enrich UI visually
  const deriveExperience = (jobId) => {
    const charCodeSum = jobId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = charCodeSum % 3;
    if (mod === 0) return "Entry Level";
    if (mod === 1) return "2+ Years";
    return "5+ Years";
  };

  const deriveJobType = (jobId) => {
    const charCodeSum = jobId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = charCodeSum % 3;
    if (mod === 0) return "Remote";
    if (mod === 1) return "Hybrid";
    return "Onsite";
  };

  const deriveSkills = (category = "", title = "") => {
    const cat = (category || "").toLowerCase();
    const t = (title || "").toLowerCase();

    if (t.includes("front") || cat.includes("front")) {
      return ["React", "JavaScript", "HTML5", "CSS3", "Redux"];
    }
    if (t.includes("back") || cat.includes("back")) {
      return ["Node.js", "Python", "SQL", "Express", "REST APIs"];
    }
    if (t.includes("mern") || cat.includes("mern") || t.includes("full stack") || cat.includes("full stack")) {
      return ["React", "Node.js", "Express", "MongoDB", "JavaScript"];
    }
    if (t.includes("architect") || cat.includes("architect")) {
      return ["Software Architecture", "System Design", "Microservices", "Cloud Infrastructure"];
    }
    if (t.includes("ai") || t.includes("ml") || cat.includes("ai") || cat.includes("machine")) {
      return ["Python", "Machine Learning", "Deep Learning", "TensorFlow"];
    }
    if (cat.includes("design") || cat.includes("graphic") || cat.includes("ui") || cat.includes("ux") || t.includes("design") || t.includes("ui")) {
      return ["Figma", "UI/UX", "Adobe Suite", "Interaction", "Prototyping"];
    }
    if (cat.includes("market") || cat.includes("seo") || cat.includes("ad") || t.includes("seo") || t.includes("market")) {
      return ["Google Analytics", "SEO", "Copywriting", "Social Media", "Campaigns"];
    }
    if (t.includes("mobile") || cat.includes("mobile") || t.includes("flutter") || t.includes("react native") || t.includes("android") || t.includes("ios")) {
      return ["React Native", "Flutter", "iOS", "Android"];
    }
    if (t.includes("data") || cat.includes("data")) {
      return ["SQL", "Python", "Data Analysis", "Power BI", "Tableau"];
    }
    if (cat.includes("web") || cat.includes("developer")) {
      return ["React", "Node.js", "Express", "MongoDB", "JavaScript"];
    }
    return ["Collaboration", "Problem Solving", "Agile", "Communication"];
  };

  const getCompanyColor = (companyName) => {
    const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];
    const charSum = companyName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const formatSalary = (element) => {
    if (element.fixedSalary) {
      return `₹${element.fixedSalary.toLocaleString("en-IN")}`;
    }
    if (element.salaryFrom && element.salaryTo) {
      return `₹${element.salaryFrom.toLocaleString("en-IN")} - ₹${element.salaryTo.toLocaleString("en-IN")}`;
    }
    return "Negotiable";
  };

  const getSalaryVal = (element) => {
    if (element.fixedSalary) return element.fixedSalary;
    if (element.salaryTo) return element.salaryTo;
    if (element.salaryFrom) return element.salaryFrom;
    return 0;
  };

  const getCompanyName = (item) => {
    if (item?.postedBy?.companyName && item.postedBy.companyName.trim() !== "") {
      return item.postedBy.companyName.trim();
    }
    if (item?.postedBy?.company?.name && item.postedBy.company.name.trim() !== "") {
      return item.postedBy.company.name.trim();
    }
    if (item?.postedBy?.name && item.postedBy.name.trim() !== "") {
      return item.postedBy.name.trim();
    }
    return "Verified Employer";
  };

  const getEmployerId = (item) => {
    if (!item?.postedBy) return null;
    return typeof item.postedBy === "object" ? item.postedBy._id : item.postedBy;
  };

  // Match score color for Light Theme
  const getMatchColor = (score) => {
    if (score >= 80) return "#059669"; // emerald
    if (score >= 65) return "#0284c7"; // sky blue
    return "#0d9488"; // teal
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Strong Match";
    if (score >= 55) return "Good Match";
    return "Relevant Match";
  };

  // Get unique locations/countries for select list
  const uniqueLocations = Array.from(new Set(jobs.map((job) => job.country))).filter(Boolean);

  // Filter Jobs Array in React
  const filteredJobs = jobs.filter((job) => {
    const q = (searchQuery || "").trim().toLowerCase();

    // Search Query Check — matches job title, company name, category, city, country, or description
    const company = getCompanyName(job).toLowerCase();
    const titleMatch = (job.title || "").toLowerCase().includes(q);
    const catMatch = (job.category || "").toLowerCase().includes(q);
    const countryMatch = (job.country || "").toLowerCase().includes(q);
    const cityMatch = (job.city || "").toLowerCase().includes(q);
    const companyMatch = company.includes(q);
    const descMatch = (job.description || "").toLowerCase().includes(q);
    const matchesSearch = !q || titleMatch || catMatch || countryMatch || cityMatch || companyMatch || descMatch;

    // Location Check — exact from dropdown, partial match for URL params
    const matchesLocation =
      selectedLocation === "All" ||
      job.country === selectedLocation ||
      job.country.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      (job.city && job.city.toLowerCase().includes(selectedLocation.toLowerCase()));

    // Experience Check
    const expVal = job.experience || deriveExperience(job._id);
    const matchesExperience = selectedExperience === "All" ||
      expVal === selectedExperience ||
      expVal.toLowerCase().includes(selectedExperience.toLowerCase()) ||
      selectedExperience.toLowerCase().includes(expVal.toLowerCase());

    // Job Type Check
    const typeVal = job.jobType || deriveJobType(job._id);
    const matchesJobType = selectedJobType === "All" ||
      typeVal === selectedJobType ||
      typeVal.toLowerCase().includes(selectedJobType.toLowerCase()) ||
      selectedJobType.toLowerCase().includes(typeVal.toLowerCase());

    // Salary Check
    const salVal = getSalaryVal(job);
    let matchesSalary = true;
    if (selectedSalary === "Under ₹3 Lakhs") {
      matchesSalary = salVal < 30000 || (salVal >= 150000 && salVal < 300000);
    } else if (selectedSalary === "₹3 Lakhs - ₹6 Lakhs") {
      matchesSalary = (salVal >= 30000 && salVal <= 60000) || (salVal >= 300000 && salVal <= 600000);
    } else if (selectedSalary === "₹6 Lakhs - ₹12 Lakhs") {
      matchesSalary = (salVal >= 60000 && salVal <= 100000) || (salVal >= 600000 && salVal <= 1200000);
    } else if (selectedSalary === "Over ₹12 Lakhs") {
      matchesSalary = salVal > 100000 || salVal > 1200000;
    }

    return matchesSearch && matchesLocation && matchesExperience && matchesJobType && matchesSalary;
  });

  return (
    <section className="jobs-page-v2">
      <div className="container">
        {/* Header Block */}
        <div className="jobs-v2-header">
          <div className="jobs-v2-header-text">
            <h1>Available Positions</h1>
            <p>Discover, review and apply for jobs suited for your stack.</p>
          </div>
          <button className="ai-match-btn" onClick={handleAiMatch}>
            <span style={{ fontSize: "1.1rem" }}>✦</span> AI Match Recommendations
          </button>
        </div>

        {/* Sidebar + List Container Grid */}
        <div className="jobs-v2-grid">
          {/* Sidebar Filter Panel */}
          <aside className="filters-sidebar">
            <div className="filters-sidebar-header">
              <h3>
                <FiFilter /> Job Filters
              </h3>
              <button onClick={resetFilters}>Reset All</button>
            </div>

            <div className="filter-group">
              <label>Search Query</label>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  placeholder="Job title, company name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FiSearch />
              </div>
            </div>

            <div className="filter-group">
              <label>Location</label>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                <option value="All">All Locations</option>
                {uniqueLocations.map((loc, idx) => (
                  <option key={idx} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Experience Requirement</label>
              <select value={selectedExperience} onChange={(e) => setSelectedExperience(e.target.value)}>
                <option value="All">All Experience</option>
                <option value="Entry Level">Entry Level</option>
                <option value="2+ Years">2+ Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Job Type</label>
              <select value={selectedJobType} onChange={(e) => setSelectedJobType(e.target.value)}>
                <option value="All">All Job Types</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Min Salary</label>
              <select value={selectedSalary} onChange={(e) => setSelectedSalary(e.target.value)}>
                <option value="All">All Salaries</option>
                <option value="Under ₹3 Lakhs">Under ₹3 Lakhs</option>
                <option value="₹3 Lakhs - ₹6 Lakhs">₹3 Lakhs - ₹6 Lakhs</option>
                <option value="₹6 Lakhs - ₹12 Lakhs">₹6 Lakhs - ₹12 Lakhs</option>
                <option value="Over ₹12 Lakhs">Over ₹12 Lakhs</option>
              </select>
            </div>
          </aside>

          {/* Jobs List Panel */}
          <main className="jobs-v2-list">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((element) => {
                const experience = element.experience || deriveExperience(element._id);
                const jobType = element.jobType || deriveJobType(element._id);
                const skills = (element.skills && Array.isArray(element.skills) && element.skills.length > 0)
                  ? element.skills
                  : (typeof element.skills === "string" && element.skills.trim())
                  ? element.skills.split(",").map((s) => s.trim()).filter(Boolean)
                  : deriveSkills(element.category, element.title);
                const comColor = getCompanyColor(element.category || "Job");
                const companyTitleName = getCompanyName(element);
                const initial = (companyTitleName || element.category || "J").trim().charAt(0).toUpperCase();

                return (
                  <div className="job-card-v2" key={element._id}>
                    <div className="job-card-v2-top">
                      {/* Logo Initial Badge */}
                      {getEmployerId(element) ? (
                        <Link to={`/company/view/${getEmployerId(element)}`} style={{ textDecoration: "none" }} title="Click to view company profile">
                          <div className="job-company-logo" style={{ backgroundColor: comColor, cursor: "pointer", overflow: "hidden" }}>
                            {element.postedBy?.profilePicture?.url ? (
                              <img
                                src={element.postedBy?.profilePicture?.url}
                                alt={companyTitleName}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              initial
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="job-company-logo" style={{ backgroundColor: comColor, overflow: "hidden" }}>
                          {element.postedBy?.profilePicture?.url ? (
                            <img
                              src={element.postedBy?.profilePicture?.url}
                              alt={companyTitleName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            initial
                          )}
                        </div>
                      )}

                      {/* Header info */}
                      <div className="job-card-v2-info">
                        <h2>{element.title}</h2>
                        <p>
                          {getEmployerId(element) ? (
                            <Link to={`/company/view/${getEmployerId(element)}`} className="job-card-company-link" title="Click to view company details">
                              {companyTitleName} ↗
                            </Link>
                          ) : (
                            <span>{companyTitleName}</span>
                          )}
                          {` • ${element.city}, ${element.country}`}
                        </p>
                      </div>

                      {/* Actions (Bookmark + View Role) */}
                      <div className="job-card-v2-actions">
                        {user && user.role === "Job Seeker" && (
                          <button
                            className="bookmark-btn"
                            onClick={() => handleWishlistToggle(element._id)}
                            style={{ color: isWishlisted(element._id) ? "#ef4444" : "#94a3b8" }}
                          >
                            {isWishlisted(element._id) ? (
                              <FaBookmark style={{ fontSize: "1.2rem" }} />
                            ) : (
                              <FaRegBookmark style={{ fontSize: "1.2rem" }} />
                            )}
                          </button>
                        )}
                        <Link to={`/job/${element._id}`} className="view-role-btn">
                          View Role
                        </Link>
                      </div>
                    </div>

                    {/* Middle description */}
                    <div className="job-card-v2-desc">
                      {element.description.length > 180
                        ? `${element.description.substring(0, 180)}...`
                        : element.description}
                    </div>

                    {/* Skill Pill tags */}
                    <div className="job-card-v2-tags">
                      {skills.slice(0, 4).map((skill, index) => (
                        <span className="job-tag" key={index}>
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="job-tag-more">+{skills.length - 4} more</span>
                      )}
                    </div>

                    {/* Vacancies + Applied count badges */}
                    <div className="job-card-v2-vacancies">
                      <span className="job-vacancy-badge">
                        <FiLayers />
                        {element.vacancies ?? 1} {(element.vacancies ?? 1) === 1 ? "Vacancy" : "Vacancies"}
                      </span>
                      <span className="job-applied-badge">
                        <FiUsers />
                        {element.appliedCount ?? 0} Applied
                      </span>
                    </div>

                    {/* Footer Meta bar */}
                    <div className="job-card-v2-bottom">
                      <div className="job-meta-left">
                        <div className="job-meta-item">
                          <FaRupeeSign /> {formatSalary(element)}
                        </div>
                        <div className="job-meta-item">
                          <FiMapPin /> {jobType}
                        </div>
                        <div className="job-meta-item">
                          <FiBriefcase /> {experience}
                        </div>
                      </div>
                      <div className="job-meta-posted">
                        <FiClock /> {`Posted: ${new Date(element.jobPostedOn).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px",
                  background: "#fff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                }}
              >
                No jobs match your filter criteria. Try resetting or adjusting the options.
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── AI Match Recommendations Modal ─────────────────────────────────── */}
      {aiModalOpen && (
        <div className="ai-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAiModal()}>
          <div className="ai-modal-panel">
            {/* Modal Header */}
            <div className="ai-modal-header">
              <div className="ai-modal-title-group">
                <div className="ai-sparkle-icon">✦</div>
                <div>
                  <h2 className="ai-modal-title">AI Job Match</h2>
                  {aiProfileName && (
                    <p className="ai-modal-subtitle">
                      Personalized for <strong>{aiProfileName}</strong>
                      {aiTotalAnalyzed > 0 && ` · Analyzed ${aiTotalAnalyzed} jobs`}
                    </p>
                  )}
                </div>
              </div>
              <button className="ai-modal-close" onClick={closeAiModal}>
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="ai-modal-body">
              {/* Loading State */}
              {aiLoading && (
                <div className="ai-loading-state">
                  <div className="ai-loading-simple-icon">
                    <FiZap style={{ fontSize: "2rem", color: "#0ea5e9" }} />
                  </div>
                  <p className="ai-loading-text">AI is analyzing your profile...</p>
                  <p className="ai-loading-sub">Matching your skills &amp; experience against all active jobs</p>
                </div>
              )}

              {/* Error State */}
              {!aiLoading && aiError && (
                <div className="ai-error-state">
                  <div className="ai-error-icon">⚠</div>
                  <p className="ai-error-message">{aiError}</p>
                  <button className="ai-retry-btn" onClick={handleAiMatch}>
                    Try Again
                  </button>
                </div>
              )}

              {/* ── No Skills Warning State ────────────────────────────────── */}
              {!aiLoading && !aiError && aiNoSkills && (
                <div className="ai-empty-state" style={{ padding: "2.5rem 1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧠</div>
                  <h3 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.1rem", fontWeight: 700 }}>
                    No skills found in your profile
                  </h3>
                  <p style={{ margin: "0 0 1.5rem", color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    The AI match engine reads your <strong>Key Skills</strong> and <strong>IT Skills</strong> from
                    your profile to find relevant jobs. Add at least one skill to get personalized recommendations.
                  </p>
                  <div style={{
                    background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: "10px",
                    padding: "1rem 1.25rem", marginBottom: "1.5rem", textAlign: "left",
                  }}>
                    <p style={{ margin: "0 0 0.5rem", fontWeight: 700, color: "#92400e", fontSize: "0.85rem" }}>
                      📋 How to add your skills:
                    </p>
                    <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "#78350f", fontSize: "0.84rem", lineHeight: 1.8 }}>
                      <li>Go to your <strong>Profile</strong></li>
                      <li>Open the <strong>"Key Skills"</strong> section and add your skills</li>
                      <li>Optionally add <strong>IT / Technical Skills</strong> for better matches</li>
                      <li>Come back here and click <strong>"AI Match Recommendations"</strong> again</li>
                    </ol>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link
                      to="/jobseeker/profile"
                      onClick={closeAiModal}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#fff", fontWeight: 600, fontSize: "0.9rem",
                        padding: "0.65rem 1.4rem", borderRadius: "50px",
                        textDecoration: "none",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                      }}
                    >
                      ✏️ Go to My Profile
                    </Link>
                    <button
                      onClick={closeAiModal}
                      style={{
                        background: "#f1f5f9", color: "#475569", fontWeight: 600,
                        fontSize: "0.9rem", padding: "0.65rem 1.4rem",
                        borderRadius: "50px", border: "none", cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* ── Empty Results State (has skills but no matching jobs) ──── */}
              {!aiLoading && !aiError && !aiNoSkills && aiRecommendations.length === 0 && (
                <div className="ai-empty-state" style={{ padding: "2.5rem 1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                  <h3 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.1rem", fontWeight: 700 }}>
                    No matching jobs found
                  </h3>
                  {aiCandidateSkills.length > 0 && (
                    <div style={{
                      background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px",
                      padding: "0.75rem 1rem", margin: "0.75rem 0 1rem",
                    }}>
                      <p style={{ margin: "0 0 0.5rem", color: "#166534", fontSize: "0.8rem", fontWeight: 700 }}>Your skills used for matching:</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {aiCandidateSkills.slice(0, 8).map((sk, i) => (
                          <span key={i} style={{
                            background: "#dcfce7", color: "#166534", fontSize: "0.75rem",
                            fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "50px",
                          }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p style={{ margin: "0 0 1.25rem", color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    We couldn't find active jobs that match your current skill set.
                    Try adding more skills to your profile or check back later as new jobs are posted.
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <Link
                      to="/jobseeker/profile"
                      onClick={closeAiModal}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.4rem",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#fff", fontWeight: 600, fontSize: "0.9rem",
                        padding: "0.65rem 1.4rem", borderRadius: "50px",
                        textDecoration: "none",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                      }}
                    >
                      ✏️ Update My Skills
                    </Link>
                    <button
                      onClick={closeAiModal}
                      style={{
                        background: "#f1f5f9", color: "#475569", fontWeight: 600,
                        fontSize: "0.9rem", padding: "0.65rem 1.4rem",
                        borderRadius: "50px", border: "none", cursor: "pointer",
                      }}
                    >
                      Browse All Jobs
                    </button>
                  </div>
                </div>
              )}

              {/* Recommendations List */}
              {!aiLoading && !aiError && aiRecommendations.length > 0 && (
                <>
                  {/* Skills used for matching — always visible */}
                  {aiCandidateSkills.length > 0 && (
                    <div style={{
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      border: "1.5px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      marginBottom: "1rem",
                    }}>
                      <p style={{ margin: "0 0 0.5rem", color: "#166534", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                        🎯 Skills used for matching
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {aiCandidateSkills.map((sk, i) => (
                          <span key={i} style={{
                            background: "#fff", color: "#15803d", fontSize: "0.75rem",
                            fontWeight: 600, padding: "0.2rem 0.65rem",
                            borderRadius: "50px", border: "1.5px solid #86efac",
                          }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="ai-results-info">
                    <FiZap style={{ color: "#0ea5e9" }} />
                    Found <strong>{aiRecommendations.length}</strong> personalized job matches ranked by AI
                  </p>
                  <div className="ai-recommendations-list">
                    {aiRecommendations.map((rec, index) => {
                      const matchColor = getMatchColor(rec.matchScore);
                      const matchLabel = getMatchLabel(rec.matchScore);
                      const compName = rec.job?.companyName ||
                        rec.job?.postedBy?.companyName ||
                        rec.job?.postedBy?.name ||
                        "Verified Employer";
                      
                      // Employer's exact required skills for this job (same-to-same)
                      const employerRequiredSkills = (rec.job?.skills && Array.isArray(rec.job.skills) && rec.job.skills.length > 0)
                        ? rec.job.skills
                        : (typeof rec.job?.skills === "string" && rec.job.skills.trim())
                        ? rec.job.skills.split(",").map((s) => s.trim()).filter(Boolean)
                        : deriveSkills(rec.job?.category, rec.job?.title);
                      
                      let reasonText = rec.reason || "";
                      reasonText = reasonText.replace(/Software Development, Location Alignment/gi, employerRequiredSkills.slice(0, 2).join(", "));
                      reasonText = reasonText.replace(/Software Development/gi, employerRequiredSkills[0] || "core skills");
                      reasonText = reasonText.replace(/Location Alignment/gi, employerRequiredSkills[1] || "technical requirements");

                      const employerLogoUrl = rec.job?.postedBy?.profilePicture?.url || rec.job?.profilePicture?.url;
                      const initial = (compName || rec.job?.category || "J").trim().charAt(0).toUpperCase();

                      return (
                        <div className="ai-rec-card" key={rec.job._id}>
                          {/* Card Top Meta Bar (Rank + Match Score Pill) */}
                          <div className="ai-rec-topbar">
                            <div className="ai-rank-badge">
                              <FaStar style={{ fontSize: "0.65rem" }} /> #{index + 1} Best Match
                            </div>
                            <div className="ai-match-pill" style={{ background: `${matchColor}15`, color: matchColor, borderColor: `${matchColor}35` }}>
                              <span className="ai-match-pill-num">{rec.matchScore}%</span>
                              <span className="ai-match-pill-text">Match</span>
                            </div>
                          </div>

                          {/* Card Header (Logo + Title & Company) */}
                          <div className="ai-rec-card-header">
                            {getEmployerId(rec.job) ? (
                              <Link to={`/company/view/${getEmployerId(rec.job)}`} onClick={closeAiModal} title={`View ${compName}'s profile`} style={{ textDecoration: "none" }}>
                                <div className="ai-rec-company-logo" style={{ background: getCompanyColor(rec.job.category || "Job"), overflow: "hidden", cursor: "pointer" }}>
                                  {employerLogoUrl ? (
                                    <img
                                      src={employerLogoUrl}
                                      alt={compName}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  ) : (
                                    initial
                                  )}
                                </div>
                              </Link>
                            ) : (
                              <div className="ai-rec-company-logo" style={{ background: getCompanyColor(rec.job.category || "Job"), overflow: "hidden" }}>
                                {employerLogoUrl ? (
                                  <img
                                    src={employerLogoUrl}
                                    alt={compName}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                ) : (
                                  initial
                                )}
                              </div>
                            )}
                            <div className="ai-rec-card-info">
                              <h3 className="ai-rec-job-title">{rec.job.title}</h3>
                              <p className="ai-rec-company">{compName} · {rec.job.city}, {rec.job.country}</p>
                            </div>
                          </div>

                          {/* Match Quality Badge */}
                          <div className="ai-match-badge" style={{ background: `${matchColor}15`, color: matchColor, borderColor: `${matchColor}35` }}>
                            <FaStar style={{ fontSize: "0.65rem" }} /> {matchLabel}
                          </div>

                          {/* AI Reason */}
                          <p className="ai-rec-reason">{reasonText}</p>

                          {/* Employer Required Skills (Same to Same as Job Card) */}
                          {employerRequiredSkills && employerRequiredSkills.length > 0 && (
                            <div className="ai-rec-highlights">
                              {employerRequiredSkills.slice(0, 4).map((skill, i) => (
                                <span className="ai-highlight-tag" key={i}>{skill}</span>
                              ))}
                              {employerRequiredSkills.length > 4 && (
                                <span className="ai-highlight-tag">+{employerRequiredSkills.length - 4} more</span>
                              )}
                            </div>
                          )}

                          {/* Salary + Action Footer */}
                          <div className="ai-rec-footer">
                            <span className="ai-rec-salary">
                              {formatSalary(rec.job)}
                            </span>
                            <Link to={`/job/${rec.job._id}`} className="ai-view-role-btn" onClick={closeAiModal}>
                              View Role →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Jobs;
