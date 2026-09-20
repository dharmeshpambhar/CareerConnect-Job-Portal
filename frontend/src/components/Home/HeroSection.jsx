import React, { useState, useEffect } from "react";
import { FaBuilding, FaSuitcase, FaUsers, FaUserPlus, FaStar } from "react-icons/fa";
import {
  FiSearch, FiMapPin, FiTrendingUp, FiArrowRight,
  FiCheckCircle, FiFileText, FiSend, FiBriefcase,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { MdOutlineVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";

/* ── Application process steps ── */
const APP_STEPS = [
  {
    id: 0,
    icon: <FiSearch />,
    label: "Search Job",
    desc: "Browse 1,23,441 live listings",
    color: "apstep-indigo",
  },
  {
    id: 1,
    icon: <FiFileText />,
    label: "Build Profile",
    desc: "Upload resume & set preferences",
    color: "apstep-sky",
  },
  {
    id: 2,
    icon: <FiSend />,
    label: "Apply Instantly",
    desc: "One-click apply to top companies",
    color: "apstep-violet",
  },
  {
    id: 3,
    icon: <FiBriefcase />,
    label: "Get Hired 🎉",
    desc: "Receive offer & start your dream role",
    color: "apstep-emerald",
  },
];

const HeroSection = () => {
  const [jobQuery, setJobQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  const trendingSearches = [
    "Full stack Developer", "UI-UX Designer", "Data Analyst", "Shopify Developer", "Marketing",
  ];

  const trustAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
  ];

  /* Animate step highlight every 2s */
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % APP_STEPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const jobText = jobQuery.trim();
    const locText = locationQuery.trim();

    const knownCities = [
      "ahmedabad", "bangalore", "bengaluru", "chennai", "delhi",
      "hyderabad", "kolkata", "mumbai", "noida", "pune", "gurgaon",
      "india", "gujarat", "surat", "vadodara", "rajkot"
    ];

    if (jobText && knownCities.includes(jobText.toLowerCase()) && !locText) {
      params.set("loc", jobText);
    } else {
      if (jobText) params.set("q", jobText);
      if (locText) params.set("loc", locText);
    }
    navigate(`/job/getall?${params.toString()}`);
  };

  const handleTrendingClick = (term) => {
    navigate(`/job/getall?q=${encodeURIComponent(term)}`);
  };

  const details = [
    { id: 1, title: "1,23,441", subTitle: "Live Job",    icon: <FaSuitcase /> },
    { id: 2, title: "91,220",   subTitle: "Companies",   icon: <FaBuilding /> },
    { id: 3, title: "2,34,200", subTitle: "Job Seekers", icon: <FaUsers /> },
    { id: 4, title: "1,03,761", subTitle: "Employers",   icon: <FaUserPlus /> },
  ];

  const progressPct = ((activeStep + 1) / APP_STEPS.length) * 100;

  return (
    <>
      <div className="hero-v2">
        {/* Animated blobs */}
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-blob hero-blob-3" />

        {/* Grid dots */}
        <div className="hero-grid-dots" />

        <div className="hero-v2-split">
          {/* ── LEFT COLUMN ── */}
          <div className="hero-v2-left">
            {/* Badge */}
            <div className="hero-badge">
              <FiTrendingUp className="hero-badge-icon" />
              <span>India's #1 Job Discovery Platform</span>
              <span className="hero-badge-dot" />
              
            </div>

            {/* Headline */}
            <h1 className="hero-v2-title">
              Find a job that suits
              <span className="hero-gradient-text"> your interests</span>
              <br />and skills
            </h1>
            <p className="hero-v2-sub">
              Discover opportunities that match your skills and passions.
              Connect with top employers seeking talent like yours.
            </p>

            {/* ─── Super Search Bar ─── */}
            <form className="hero-search-form" onSubmit={handleSearch} id="hero-search-form">
              <div className="hero-search-bar">
                <div className="hero-search-field">
                  <FiSearch className="hero-search-ico" />
                  <input
                    id="hero-job-input"
                    type="text"
                    placeholder="Job title, skills or company…"
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="hero-search-divider" />
                <div className="hero-search-field">
                  <FiMapPin className="hero-search-ico hero-search-ico--pin" />
                  <input
                    id="hero-location-input"
                    type="text"
                    placeholder="City, state or country…"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="hero-search-btn" id="hero-search-btn">
                  <FiSearch />
                  <span>Search Jobs</span>
                </button>
              </div>
            </form>

            {/* Trending Tags */}
            <div className="hero-trending">
              <span className="hero-trending-label">🔥 Trending:</span>
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  className="hero-trending-tag"
                  onClick={() => handleTrendingClick(term)}
                  type="button"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hero-cta-row">
              <button className="hero-cta-primary" onClick={() => navigate("/register")} id="hero-cta-register">
                Get Started Free
                <FiArrowRight />
              </button>
              <button className="hero-cta-secondary" onClick={() => navigate("/job/getall")} id="hero-cta-browse">
                Browse All Jobs
              </button>
            </div>

            {/* Trust Row */}
            <div className="hero-trust-row">
              <div className="hero-trust-avatars">
                {trustAvatars.map((src, i) => (
                  <img key={i} src={src} alt={`User ${i + 1}`} className="hero-trust-avatar" />
                ))}
              </div>
              <div className="hero-trust-text">
                <div className="hero-trust-stars">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
                <span>Trusted by <strong>2M+</strong> professionals</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Job Application Process ── */}
          <div className="hero-v2-right">
            <div className="apflow-panel">
              {/* Panel header */}
              <div className="apflow-header">
                <div className="apflow-header-left">
                  <span className="apflow-live-dot" />
                  <span className="apflow-header-title">Your Journey to Getting Hired</span>
                </div>
                <span className="apflow-step-count">
                  Step {activeStep + 1} / {APP_STEPS.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="apflow-progress-track">
                <div
                  className="apflow-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Candidate profile card */}
              <div className="apflow-candidate">
                <div className="apflow-avatar">
                  <img src="https://i.pravatar.cc/60?img=12" alt="Candidate" />
                  <span className="apflow-avatar-verified">
                    <MdOutlineVerified />
                  </span>
                </div>
                <div className="apflow-candidate-info">
                  <p className="apflow-name">Aarav Sharma</p>
                  <p className="apflow-role">Full Stack Developer • 3 yrs exp</p>
                  <div className="apflow-skills">
                    <span>React</span>
                    <span>Node.js</span>
                    <span>MongoDB</span>
                  </div>
                </div>
                <div className="apflow-match-badge">
                  <HiSparkles />
                  <span>92% Match</span>
                </div>
              </div>

              {/* Process steps */}
              <div className="apflow-steps">
                {APP_STEPS.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`apflow-step ${step.color} ${
                      idx === activeStep ? "apflow-step--active" : ""
                    } ${idx < activeStep ? "apflow-step--done" : ""}`}
                  >
                    {/* vertical connector line */}
                    {idx < APP_STEPS.length - 1 && (
                      <div className={`apflow-line ${idx < activeStep ? "apflow-line--done" : ""}`} />
                    )}

                    <div className="apflow-step-icon">
                      {idx < activeStep ? <FiCheckCircle /> : step.icon}
                    </div>
                    <div className="apflow-step-body">
                      <p className="apflow-step-label">{step.label}</p>
                      <p className="apflow-step-desc">{step.desc}</p>
                    </div>
                    {idx === activeStep && (
                      <span className="apflow-step-ping" />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer CTA inside panel */}
              <button
                className="apflow-cta"
                onClick={() => navigate("/job/getall")}
                id="apflow-explore-btn"
              >
                Start Your Journey <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="hero-stats-strip">
          {details.map((el) => (
            <div className="hero-stat-card" key={el.id}>
              <div className="hero-stat-icon">{el.icon}</div>
              <div className="hero-stat-text">
                <span className="hero-stat-num">{el.title}</span>
                <span className="hero-stat-label">{el.subTitle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HeroSection;
