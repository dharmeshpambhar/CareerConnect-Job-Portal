import React, { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import { FaBookmark, FaRegBookmark, FaRupeeSign, FaStar } from "react-icons/fa";
import {
  FiSearch,
  FiFilter,
  FiBriefcase,
  FiAward,
  FiClock,
  FiUsers,
  FiLayers,
  FiX,
  FiZap,
  FiMapPin,
  FiArrowRight,
  FiTrendingUp,
  FiCheck,
} from "react-icons/fi";
import { MdOutlineVerified } from "react-icons/md";
import { fetchAllJobs, toggleWishlist, fetchWishlist, fetchAiMatchRecommendations } from "../../apiService";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const { isAuthorized, user } = useContext(Context);
  const [searchParams] = useSearchParams();

  // Filter States — pre-seeded from hero search bar URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || searchParams.get("cat") || "All");
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("loc") || "All");
  const [selectedExperience, setSelectedExperience] = useState("All");
  const [selectedJobType, setSelectedJobType] = useState("All");
  const [selectedSalary, setSelectedSalary] = useState("All");
  const [selectedDatePosted, setSelectedDatePosted] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Latest");

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
    setSelectedCategory("All");
    setSelectedLocation("All");
    setSelectedExperience("All");
    setSelectedJobType("All");
    setSelectedSalary("All");
    setSelectedDatePosted("All");
    setSelectedSort("Latest");
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

  // Unique categories derived from jobs plus standard options
  const standardCategories = [
    "Frontend Web Development",
    "MERN Stack Development",
    "MEAN Stack Development",
    "Mobile App Development",
    "Graphics & Design",
    "Artificial Intelligence",
    "Account & Finance",
    "Video Animation",
    "Business Development Executive",
    "Data Entry Operator",
  ];
  const uniqueCategories = Array.from(
    new Set([...jobs.map((job) => job.category).filter(Boolean), ...standardCategories])
  ).sort();

  // Unique locations (both countries and cities)
  const uniqueCountries = Array.from(new Set(jobs.map((job) => job.country).filter(Boolean))).sort();
  const uniqueCities = Array.from(new Set(jobs.map((job) => job.city).filter(Boolean))).sort();
  const uniqueLocations = Array.from(new Set([...uniqueCountries, ...uniqueCities])).sort();

  // Unique experience options
  const standardExperiences = [
    "Entry Level",
    "Junior (1-2 years)",
    "Mid Level (3-5 years)",
    "Senior (5-8 years)",
    "Lead / Principal (8+ years)",
    "2+ Years",
    "5+ Years",
  ];
  const uniqueExperiences = Array.from(
    new Set([...standardExperiences, ...jobs.map((j) => j.experience).filter(Boolean)])
  );

  // Unique job types
  const standardJobTypes = [
    "Full-Time",
    "Part-Time",
    "Contract",
    "Internship",
    "Freelance",
    "Remote",
    "Hybrid",
    "Onsite",
  ];
  const uniqueJobTypes = Array.from(
    new Set([...standardJobTypes, ...jobs.map((j) => j.jobType).filter(Boolean)])
  );

  // Active filter count
  const activeFilterCount = [
    searchQuery.trim() !== "",
    selectedCategory !== "All",
    selectedLocation !== "All",
    selectedExperience !== "All",
    selectedJobType !== "All",
    selectedSalary !== "All",
    selectedDatePosted !== "All",
    selectedSort !== "Latest",
  ].filter(Boolean).length;

  // Filter & Sort Jobs Array in React
  const filteredJobs = jobs
    .filter((job) => {
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

      // Category Check
      const matchesCategory =
        selectedCategory === "All" ||
        job.category === selectedCategory ||
        (job.category && job.category.toLowerCase() === selectedCategory.toLowerCase());

      // Location Check — exact or partial match across city and country
      const matchesLocation =
        selectedLocation === "All" ||
        job.country === selectedLocation ||
        job.city === selectedLocation ||
        (job.country && job.country.toLowerCase().includes(selectedLocation.toLowerCase())) ||
        (job.city && job.city.toLowerCase().includes(selectedLocation.toLowerCase()));

      // Experience Check
      const expVal = job.experience || deriveExperience(job._id);
      const matchesExperience =
        selectedExperience === "All" ||
        expVal === selectedExperience ||
        expVal.toLowerCase().includes(selectedExperience.toLowerCase()) ||
        selectedExperience.toLowerCase().includes(expVal.toLowerCase());

      // Job Type Check
      const typeVal = job.jobType || deriveJobType(job._id);
      const matchesJobType =
        selectedJobType === "All" ||
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

      // Date Posted Check
      let matchesDatePosted = true;
      if (selectedDatePosted !== "All" && job.jobPostedOn) {
        const postedTime = new Date(job.jobPostedOn).getTime();
        const now = Date.now();
        const diffHours = (now - postedTime) / (1000 * 60 * 60);
        if (selectedDatePosted === "Past 24 Hours") {
          matchesDatePosted = diffHours <= 24;
        } else if (selectedDatePosted === "Past Week") {
          matchesDatePosted = diffHours <= 24 * 7;
        } else if (selectedDatePosted === "Past Month") {
          matchesDatePosted = diffHours <= 24 * 30;
        }
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        matchesExperience &&
        matchesJobType &&
        matchesSalary &&
        matchesDatePosted
      );
    })
    .sort((a, b) => {
      if (selectedSort === "Latest") {
        return new Date(b.jobPostedOn || 0) - new Date(a.jobPostedOn || 0);
      }
      if (selectedSort === "Oldest") {
        return new Date(a.jobPostedOn || 0) - new Date(b.jobPostedOn || 0);
      }
      if (selectedSort === "Salary: High to Low") {
        return getSalaryVal(b) - getSalaryVal(a);
      }
      if (selectedSort === "Salary: Low to High") {
        return getSalaryVal(a) - getSalaryVal(b);
      }
      if (selectedSort === "Most Vacancies") {
        return (b.vacancies || 1) - (a.vacancies || 1);
      }
      return 0;
    });

  // Quick Filter Pills definitions
  const QUICK_FILTERS = [
    { id: "all", label: "All Positions", type: "all" },
    { id: "remote", label: "Remote", type: "jobType", val: "Remote" },
    { id: "fulltime", label: "Full-Time", type: "jobType", val: "Full-Time" },
    { id: "internship", label: "Internship", type: "jobType", val: "Internship" },
    { id: "contract", label: "Contract", type: "jobType", val: "Contract" },
    { id: "frontend", label: "Frontend", type: "cat", val: "Frontend Web Development" },
    { id: "mern", label: "MERN Stack", type: "cat", val: "MERN Stack Development" },
    { id: "ai", label: "AI & ML", type: "cat", val: "Artificial Intelligence" },
    { id: "design", label: "Design", type: "cat", val: "Graphics & Design" },
    { id: "mobile", label: "Mobile Dev", type: "cat", val: "Mobile App Development" },
  ];

  const handleQuickFilter = (qf) => {
    if (qf.type === "all") {
      resetFilters();
    } else if (qf.type === "jobType") {
      setSelectedJobType((prev) => (prev === qf.val ? "All" : qf.val));
    } else if (qf.type === "cat") {
      setSelectedCategory((prev) => (prev === qf.val ? "All" : qf.val));
    }
  };

  const isQuickActive = (qf) => {
    if (qf.type === "all") {
      return activeFilterCount === 0;
    }
    if (qf.type === "jobType") {
      return selectedJobType === qf.val;
    }
    if (qf.type === "cat") {
      return selectedCategory === qf.val;
    }
    return false;
  };

  const isNewJob = (dateStr) => {
    if (!dateStr) return false;
    const diffDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <section className="jobs-page-v3">
      {/* Ambient background glow accents */}
      <div className="jobs-v3-ambient-glow jobs-v3-glow-1"></div>
      <div className="jobs-v3-ambient-glow jobs-v3-glow-2"></div>

      <div className="container">
        {/* Top Hero Showcase */}
        <div className="jobs-v3-hero">
          <div className="jobs-v3-hero-left">
            <div className="jobs-hero-badge">
              <span className="jobs-hero-badge-pulse"></span>
              <span className="jobs-hero-badge-text"> Match Your Skills With Your Dream Career</span>
            </div>
            <h1 className="jobs-v3-hero-title">
              Find Your Next Role <span className="jobs-gradient-text">&amp; Level Up</span>
            </h1>
            <p className="jobs-v3-hero-sub">
              Browse hand-picked developer, designer, and AI roles from vetted engineering teams worldwide.
            </p>
          </div>

          <div className="jobs-v3-hero-right">
            <button className="ai-match-btn-v3" onClick={handleAiMatch}>
              {/* Animated background orbs */}
              <div className="ai-match-orb ai-match-orb-1" />
              <div className="ai-match-orb ai-match-orb-2" />
              {/* Shimmer sweep */}
              <div className="ai-match-btn-shine" />

              {/* Icon with glow ring */}
              <div className="ai-match-icon-wrap">
                <div className="ai-match-icon-ring" />
                <FiZap className="ai-match-zap-icon" />
              </div>

              {/* Text */}
              <div className="ai-match-text-group">
                <span className="ai-match-btn-title">AI Match Engine</span>
                <span className="ai-match-btn-sub">Instant recommendations for your stack</span>
              </div>

              {/* Badge */}
              <span className="ai-match-badge-tag">
                <span className="ai-match-badge-dot" />
                Smart Match
              </span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills Row */}
        <div className="jobs-quick-pills-wrap">
          <span className="jobs-quick-label">Popular:</span>
          <div className="jobs-quick-pills-list">
            {QUICK_FILTERS.map((qf) => {
              const active = isQuickActive(qf);
              return (
                <button
                  key={qf.id}
                  className={`jobs-quick-pill ${active ? "active" : ""}`}
                  onClick={() => handleQuickFilter(qf)}
                >
                  {qf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Sidebar + Job Cards */}
        <div className="jobs-v3-grid">
          {/* Left Sidebar Filter Card */}
          <aside className="filters-sidebar-v3">
            <div className="filters-v3-header">
              <div className="filters-v3-title-wrap">
                <div className="filters-v3-icon-badge">
                  <FiFilter />
                </div>
                <div>
                  <h3 className="filters-v3-heading">Filter Positions</h3>
                  <p className="filters-v3-sub">Refine your search criteria</p>
                </div>
              </div>
              {activeFilterCount > 0 ? (
                <button className="filters-v3-reset-btn active" onClick={resetFilters} title="Reset all filters">
                  Reset ({activeFilterCount})
                </button>
              ) : (
                <button className="filters-v3-reset-btn" onClick={resetFilters} title="Reset filters">
                  Clear
                </button>
              )}
            </div>

            <div className="filters-v3-body">
              {/* 1. Search Query */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiSearch /> Search Keyword
                </label>
                <div className="filter-v3-input-box">
                  <input
                    type="text"
                    placeholder="Title, skill, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery ? (
                    <button
                      className="filter-v3-clear-input"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                    >
                      <FiX />
                    </button>
                  ) : (
                    <FiSearch className="filter-v3-input-icon" />
                  )}
                </div>
              </div>

              {/* 2. Category */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiLayers /> Category
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {uniqueCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 3. Location */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiMapPin /> Location / City
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                    <option value="All">All Locations</option>
                    {uniqueLocations.map((loc, idx) => (
                      <option key={idx} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 4. Experience Requirement */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiAward /> Experience Level
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedExperience} onChange={(e) => setSelectedExperience(e.target.value)}>
                    <option value="All">All Experience</option>
                    {uniqueExperiences.map((exp, idx) => (
                      <option key={idx} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 5. Job Type */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiBriefcase /> Employment Type
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedJobType} onChange={(e) => setSelectedJobType(e.target.value)}>
                    <option value="All">All Job Types</option>
                    {uniqueJobTypes.map((type, idx) => (
                      <option key={idx} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 6. Min Salary */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FaRupeeSign /> Salary Range
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedSalary} onChange={(e) => setSelectedSalary(e.target.value)}>
                    <option value="All">All Salaries</option>
                    <option value="Under ₹3 Lakhs">Under ₹3 Lakhs</option>
                    <option value="₹3 Lakhs - ₹6 Lakhs">₹3 Lakhs - ₹6 Lakhs</option>
                    <option value="₹6 Lakhs - ₹12 Lakhs">₹6 Lakhs - ₹12 Lakhs</option>
                    <option value="Over ₹12 Lakhs">Over ₹12 Lakhs</option>
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 7. Date Posted */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiClock /> Date Posted
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedDatePosted} onChange={(e) => setSelectedDatePosted(e.target.value)}>
                    <option value="All">Anytime</option>
                    <option value="Past 24 Hours">Past 24 Hours</option>
                    <option value="Past Week">Past Week</option>
                    <option value="Past Month">Past Month</option>
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>

              {/* 8. Sort By */}
              <div className="filter-v3-group">
                <label className="filter-v3-label">
                  <FiTrendingUp /> Sort By
                </label>
                <div className="filter-v3-select-box">
                  <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                    <option value="Latest">Latest First</option>
                    <option value="Oldest">Oldest First</option>
                    <option value="Salary: High to Low">Salary: High to Low</option>
                    <option value="Salary: Low to High">Salary: Low to High</option>
                    <option value="Most Vacancies">Most Vacancies</option>
                  </select>
                  <span className="filter-v3-select-arrow">▾</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Job Cards Column */}
          <main className="jobs-v3-list">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((element) => {
                const experience = element.experience || deriveExperience(element._id);
                const jobType = element.jobType || deriveJobType(element._id);
                const skills =
                  element.skills && Array.isArray(element.skills) && element.skills.length > 0
                    ? element.skills
                    : typeof element.skills === "string" && element.skills.trim()
                    ? element.skills.split(",").map((s) => s.trim()).filter(Boolean)
                    : deriveSkills(element.category, element.title);
                const comColor = getCompanyColor(element.category || "Job");
                const companyTitleName = getCompanyName(element);
                const initial = (companyTitleName || element.category || "J").trim().charAt(0).toUpperCase();
                const isNew = isNewJob(element.jobPostedOn);

                return (
                  <div className="job-card-v3" key={element._id}>
                    {/* Card Top Row: Logo + Info + Actions */}
                    <div className="job-card-v3-top">
                      {/* Company Squircle Logo */}
                      <div className="job-v3-logo-wrap">
                        {getEmployerId(element) ? (
                          <Link
                            to={`/company/view/${getEmployerId(element)}`}
                            className="job-v3-logo-link"
                            title={`View ${companyTitleName}'s profile`}
                          >
                            <div
                              className="job-v3-company-logo"
                              style={element.postedBy?.profilePicture?.url ? { backgroundColor: "#ffffff" } : { backgroundColor: comColor }}
                            >
                              {element.postedBy?.profilePicture?.url ? (
                                <img
                                  src={element.postedBy?.profilePicture?.url}
                                  alt={companyTitleName}
                                  className="job-v3-logo-img"
                                />
                              ) : (
                                initial
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div
                            className="job-v3-company-logo"
                            style={element.postedBy?.profilePicture?.url ? { backgroundColor: "#ffffff" } : { backgroundColor: comColor }}
                          >
                            {element.postedBy?.profilePicture?.url ? (
                              <img
                                src={element.postedBy?.profilePicture?.url}
                                alt={companyTitleName}
                                className="job-v3-logo-img"
                              />
                            ) : (
                              initial
                            )}
                          </div>
                        )}
                      </div>

                      {/* Header Main Info */}
                      <div className="job-card-v3-info">
                        <div className="job-v3-badges-row">
                          <span className="job-v3-cat-tag">{element.category || "Engineering"}</span>
                          {isNew && <span className="job-v3-new-tag">✨ New</span>}
                        </div>
                        <h2 className="job-v3-title">
                          <Link to={`/job/${element._id}`}>{element.title}</Link>
                        </h2>
                        <div className="job-v3-company-row">
                          {getEmployerId(element) ? (
                            <Link
                              to={`/company/view/${getEmployerId(element)}`}
                              className="job-v3-company-link"
                              title="Click to view company profile"
                            >
                              <span>{companyTitleName}</span>
                              <MdOutlineVerified className="verified-ico" />
                            </Link>
                          ) : (
                            <span className="job-v3-company-name">
                              {companyTitleName}
                              <MdOutlineVerified className="verified-ico" />
                            </span>
                          )}
                          <span className="job-v3-dot">•</span>
                          <span className="job-v3-location">
                            <FiMapPin /> {element.city}, {element.country}
                          </span>
                        </div>
                      </div>

                      {/* Top Right Actions */}
                      <div className="job-card-v3-actions">
                        {user && user.role === "Job Seeker" && (
                          <button
                            className={`job-v3-bookmark-btn ${isWishlisted(element._id) ? "active" : ""}`}
                            onClick={() => handleWishlistToggle(element._id)}
                            title={isWishlisted(element._id) ? "Remove from saved jobs" : "Save this job"}
                          >
                            {isWishlisted(element._id) ? <FaBookmark /> : <FaRegBookmark />}
                          </button>
                        )}
                        <Link to={`/job/${element._id}`} className="job-v3-view-btn">
                          <span>View Role</span>
                          <FiArrowRight />
                        </Link>
                      </div>
                    </div>

                    {/* Description Excerpt */}
                    <div className="job-card-v3-desc">
                      {element.description.length > 180
                        ? `${element.description.substring(0, 180)}...`
                        : element.description}
                    </div>

                    {/* Skill Tags */}
                    <div className="job-card-v3-tags">
                      {skills.slice(0, 5).map((skill, index) => (
                        <span className="job-v3-tag" key={index}>
                          {skill}
                        </span>
                      ))}
                      {skills.length > 5 && (
                        <span className="job-v3-tag-more">+{skills.length - 5} more</span>
                      )}
                    </div>

                    {/* Card Footer: Metadata badges + posted freshness */}
                    <div className="job-card-v3-bottom">
                      <div className="job-v3-meta-pills">
                        <div className="job-v3-pill salary">
                          <FaRupeeSign /> {formatSalary(element)}
                        </div>
                        <div className="job-v3-pill jobtype">
                          <FiBriefcase /> {jobType}
                        </div>
                        <div className="job-v3-pill exp">
                          <FiAward /> {experience}
                        </div>
                        <div className="job-v3-pill vacancies">
                          <FiLayers /> {element.vacancies ?? 1}{" "}
                          {(element.vacancies ?? 1) === 1 ? "Opening" : "Openings"}
                        </div>
                        <div className="job-v3-pill applied">
                          <FiUsers /> {element.appliedCount ?? 0} Applied
                        </div>
                      </div>

                      <div className="job-v3-meta-posted">
                        <FiClock /> {`Posted: ${new Date(element.jobPostedOn).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="jobs-v3-empty-state">
                <div className="jobs-v3-empty-icon">
                  <FiSearch />
                </div>
                <h3>No jobs match your search criteria</h3>
                <p>
                  We couldn't find any positions matching your selected filters. Try broadening your keywords or reset all filters.
                </p>
                <button className="jobs-v3-empty-btn" onClick={resetFilters}>
                  Clear All Filters
                </button>
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
                <div className="ai-sparkle-icon">
                  <FiZap />
                </div>
                <div>
                  <div className="ai-modal-badge-row">
                    <h2 className="ai-modal-title">AI Career Match Engine</h2>
                    <span className="ai-modal-badge-live">Live Intelligence</span>
                  </div>
                  <p className="ai-modal-subtitle">
                    {aiProfileName ? (
                      <>Personalized recommendations for <strong>{aiProfileName}</strong></>
                    ) : (
                      "Smart role recommendations matched to your tech stack"
                    )}
                    {aiTotalAnalyzed > 0 && ` · ${aiTotalAnalyzed} jobs evaluated`}
                  </p>
                </div>
              </div>
              <div className="ai-modal-header-actions">
                {aiRecommendations.length > 0 && (
                  <span className="ai-header-count-pill">
                    ✦ {aiRecommendations.length} Matches Found
                  </span>
                )}
                <button className="ai-modal-close" onClick={closeAiModal} aria-label="Close modal">
                  <FiX />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="ai-modal-body">
              {/* Candidate Profile Skills Bar */}
              {!aiLoading && !aiError && aiCandidateSkills.length > 0 && (
                <div className="ai-skills-context-strip">
                  <div className="ai-skills-strip-left">
                    <span className="ai-skills-strip-label">🎯 Matched Against Your Skills:</span>
                    <div className="ai-skills-strip-tags">
                      {aiCandidateSkills.map((sk, i) => (
                        <span key={i} className="ai-skills-strip-tag">
                          <FiCheck style={{ fontSize: "0.72rem", marginRight: "3px" }} />
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link to="/jobseeker/profile" onClick={closeAiModal} className="ai-skills-strip-link">
                    Update Skills →
                  </Link>
                </div>
              )}
              {/* Loading State */}
              {aiLoading && (
                <div className="ai-loading-state">
                  <div className="ai-loading-simple-icon">
                    <FiZap style={{ fontSize: "2rem", color: "#2563eb" }} />
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
                <div className="ai-empty-state-card">
                  <div className="ai-empty-state-icon">🧠</div>
                  <h3 className="ai-empty-state-title">
                    No skills found in your profile
                  </h3>
                  <p className="ai-empty-state-desc">
                    The AI match engine reads your <strong>Key Skills</strong> and <strong>IT Skills</strong> from
                    your profile to match you with top engineering teams. Add your core skills to get precision matches.
                  </p>
                  <div className="ai-skills-guide-box">
                    <p className="ai-guide-title">
                      📋 How to activate your AI match:
                    </p>
                    <ol className="ai-guide-list">
                      <li>Go to your <strong>Job Seeker Profile</strong></li>
                      <li>Open <strong>"Key Skills"</strong> and add your primary competencies</li>
                      <li>Optionally add <strong>IT / Technical Skills</strong> for deeper matching</li>
                      <li>Return here to view tailored recommendations</li>
                    </ol>
                  </div>
                  <div className="ai-empty-actions">
                    <Link
                      to="/jobseeker/profile"
                      onClick={closeAiModal}
                      className="ai-primary-action-btn"
                    >
                      ✏️ Complete My Profile Skills
                    </Link>
                    <button
                      onClick={closeAiModal}
                      className="ai-secondary-action-btn"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* ── Empty Results State (has skills but no matching jobs) ──── */}
              {!aiLoading && !aiError && !aiNoSkills && aiRecommendations.length === 0 && (
                <div className="ai-empty-state-card">
                  <div className="ai-empty-state-icon">🔍</div>
                  <h3 className="ai-empty-state-title">
                    No direct matches found right now
                  </h3>
                  <p className="ai-empty-state-desc">
                    We couldn't find active positions that strictly match your specific profile skills.
                    Try adding related skills or broaden your profile attributes.
                  </p>
                  <div className="ai-empty-actions">
                    <Link
                      to="/jobseeker/profile"
                      onClick={closeAiModal}
                      className="ai-primary-action-btn"
                    >
                      ✏️ Update Profile Skills
                    </Link>
                    <button
                      onClick={closeAiModal}
                      className="ai-secondary-action-btn"
                    >
                      Browse All Jobs
                    </button>
                  </div>
                </div>
              )}

              {/* Top AI Match Status Banner */}
              {!aiLoading && !aiError && aiRecommendations.length > 0 && (
                <div className="ai-results-found-bar">
                  <span className="ai-found-sparkle">✦</span>
                  <span>
                    Found <strong className="ai-found-num">{aiRecommendations.length}</strong> personalized job matches ranked by AI
                  </span>
                </div>
              )}

              {/* Recommendations Cards */}
              {!aiLoading && !aiError && aiRecommendations.length > 0 && (
                <div className="ai-recommendations-list">
                  {aiRecommendations.map((rec, index) => {
                    const matchLabel = getMatchLabel(rec.matchScore);
                    const compName = rec.job?.companyName ||
                      rec.job?.postedBy?.companyName ||
                      rec.job?.postedBy?.name ||
                      "Verified Employer";
                    
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
                      <div className="ai-clean-job-card" key={rec.job._id}>
                        {/* 1. Card Top Header: Rank on Left, Match % on Right */}
                        <div className="ai-clean-card-header">
                          <div className="ai-clean-rank-pill">
                            <span className="ai-clean-rank-star">✦</span>
                            <span>#{index + 1} Best Match</span>
                          </div>
                          <div
                            className={`ai-clean-match-pill ${
                              rec.matchScore >= 85 ? "excellent" : rec.matchScore >= 70 ? "strong" : "good"
                            }`}
                          >
                            {rec.matchScore}% MATCH
                          </div>
                        </div>

                        {/* 2. Identity Row: Logo + Job Title + Company Name & Location */}
                        <div className="ai-clean-identity-row">
                          <div
                            className="ai-clean-logo-box"
                            style={employerLogoUrl ? { backgroundColor: "#ffffff" } : { backgroundColor: getCompanyColor(rec.job.category || "Job") }}
                          >
                            {employerLogoUrl ? (
                              <img src={employerLogoUrl} alt={compName} className="ai-clean-logo-img" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div className="ai-clean-title-group">
                            <h3 className="ai-clean-job-title">
                              <Link to={`/job/${rec.job._id}`} onClick={closeAiModal}>
                                {rec.job.title}
                              </Link>
                            </h3>
                            <div className="ai-clean-meta-line">
                              <span className="ai-clean-comp-name">{compName}</span>
                              <span className="ai-clean-dot">·</span>
                              <span className="ai-clean-location">
                                {rec.job.city}, {rec.job.country}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Verdict Pill: ★ Excellent Match / ★ Strong Match */}
                        <div className="ai-clean-verdict-row">
                          <span
                            className={`ai-clean-verdict-pill ${
                              rec.matchScore >= 85 ? "excellent" : rec.matchScore >= 70 ? "strong" : "good"
                            }`}
                          >
                            ★ {matchLabel}
                          </span>
                        </div>

                        {/* 4. AI Match Rationale Paragraph */}
                        <p className="ai-clean-rationale-text">
                          {reasonText}
                        </p>

                        {/* 5. Skills Pill Tags */}
                        {employerRequiredSkills && employerRequiredSkills.length > 0 && (
                          <div className="ai-clean-skills-row">
                            {employerRequiredSkills.slice(0, 5).map((skill, i) => (
                              <span className="ai-clean-skill-pill" key={i}>
                                {skill}
                              </span>
                            ))}
                            {employerRequiredSkills.length > 5 && (
                              <span className="ai-clean-skill-pill more">
                                +{employerRequiredSkills.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 6. Bottom Row: Salary on Left, View Role Button on Right */}
                        <div className="ai-clean-bottom-row">
                          <div className="ai-clean-salary">
                            {formatSalary(rec.job)}
                          </div>
                          <Link
                            to={`/job/${rec.job._id}`}
                            className="ai-clean-view-btn"
                            onClick={closeAiModal}
                          >
                            View Role →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Jobs;
