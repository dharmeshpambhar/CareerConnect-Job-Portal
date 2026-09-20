import React, { useContext, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { fetchMyJobs, updateJob, deleteJob } from "../../apiService";
import {
  FiBriefcase,
  FiPlus,
  FiArchive,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiCheck,
  FiX,
  FiLayers,
  FiAlertTriangle,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { HiOutlineCheckCircle, HiOutlineClock } from "react-icons/hi";

const CATEGORIES = [
  "Graphics & Design",
  "Mobile App Development",
  "Frontend Web Development",
  "MERN Stack Development",
  "Account & Finance",
  "Artificial Intelligence",
  "Video Animation",
  "MEAN Stack Development",
  "MEVN Stack Development",
  "Data Entry Operator",
];

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Double verification modal state for closing a job
  const [closingJob, setClosingJob] = useState(null);
  const [isClosingAction, setIsClosingAction] = useState(false);
  const [pendingEditClose, setPendingEditClose] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'expired'
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { isAuthorized, user, isLoading } = useContext(Context);
  const navigateTo = useNavigate();

  // Fetch employer's jobs
  useEffect(() => {
    if (isAuthorized && user?.role === "Employer") {
      fetchMyJobs().then(({ myJobs: data, offline }) => {
        if (offline && (!data || data.length === 0)) {
          const demoJobs = [
            {
              _id: "demo_job_1",
              title: "Senior Full Stack Engineer",
              category: "MERN Stack Development",
              country: "India",
              city: "Bangalore",
              location: "Indiranagar, Metro Station Road",
              description: "Seeking an experienced Full Stack developer with strong React, Node.js, and database design skills to build scalable enterprise web applications.",
              fixedSalary: 1400000,
              vacancies: 2,
              expired: false,
              jobPostedOn: new Date().toISOString(),
            },
            {
              _id: "demo_job_2",
              title: "Lead UI/UX & Frontend Developer",
              category: "Frontend Web Development",
              country: "India",
              city: "Mumbai",
              location: "BKC Tech Hub",
              description: "Looking for an expert Frontend engineer passionate about clean animations, responsive user interfaces, and state management.",
              salaryFrom: 900000,
              salaryTo: 1600000,
              vacancies: 1,
              expired: false,
              jobPostedOn: new Date().toISOString(),
            },
          ];
          setMyJobs(demoJobs);
          toast("Demo mode active with sample jobs.", { icon: "💼" });
        } else {
          setMyJobs(data || []);
        }
      });
    }
  }, [isAuthorized, user]);

  if (isLoading) {
    return (
      <div className="myJobs-loading">
        <div className="myJobs-spinner" />
        <p>Loading your job listings...</p>
      </div>
    );
  }

  if (!isAuthorized || (user && user.role !== "Employer")) {
    return <Navigate to="/login" />;
  }

  // Derived counts
  const totalJobs = myJobs.length;
  const activeJobs = myJobs.filter((j) => !j.expired || j.expired === "false").length;
  const expiredJobs = totalJobs - activeJobs;

  // Filtered jobs
  const filteredJobs = myJobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.country?.toLowerCase().includes(searchQuery.toLowerCase());

    const isJobExpired = Boolean(job.expired && job.expired !== "false");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isJobExpired) ||
      (statusFilter === "expired" && isJobExpired);

    const matchesCategory =
      categoryFilter === "all" || job.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Start editing a job
  const handleStartEdit = (job) => {
    setEditingJobId(job._id);
    setEditFormData({
      title: job.title || "",
      category: job.category || "Frontend Web Development",
      country: job.country || "",
      city: job.city || "",
      location: job.location || "",
      description: job.description || "",
      salaryType: job.fixedSalary ? "fixed" : "range",
      fixedSalary: job.fixedSalary || "",
      salaryFrom: job.salaryFrom || "",
      salaryTo: job.salaryTo || "",
      vacancies: job.vacancies ?? 1,
      expired: Boolean(job.expired && job.expired !== "false"),
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditFormData({});
  };

  // Handle edit form change
  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save updated job
  const handleSaveEdit = async (jobId) => {
    if (!editFormData.title?.trim()) {
      toast.error("Job title is required.");
      return;
    }
    if (!editFormData.country?.trim() || !editFormData.city?.trim() || !editFormData.location?.trim()) {
      toast.error("Please provide location details.");
      return;
    }
    if (!editFormData.description?.trim()) {
      toast.error("Job description is required.");
      return;
    }

    const payload = {
      title: editFormData.title.trim(),
      category: editFormData.category,
      country: editFormData.country.trim(),
      city: editFormData.city.trim(),
      location: editFormData.location.trim(),
      description: editFormData.description.trim(),
      vacancies: Number(editFormData.vacancies) || 1,
      expired: editFormData.expired,
    };

    if (editFormData.salaryType === "fixed") {
      payload.fixedSalary = Number(editFormData.fixedSalary) || 0;
      payload.salaryFrom = undefined;
      payload.salaryTo = undefined;
    } else {
      payload.salaryFrom = Number(editFormData.salaryFrom) || 0;
      payload.salaryTo = Number(editFormData.salaryTo) || 0;
      payload.fixedSalary = undefined;
    }

    // If employer is closing an active job via edit form, prompt double verification
    const originalJob = myJobs.find((j) => j._id === jobId);
    const wasActive = originalJob && (!originalJob.expired || originalJob.expired === "false");
    if (wasActive && payload.expired) {
      setClosingJob({ ...originalJob, ...payload });
      setPendingEditClose({ jobId, payload });
      return;
    }

    setIsUpdating(true);
    try {
      const { message, offline } = await updateJob(jobId, payload);
      if (offline) {
        toast.error(message);
      } else {
        toast.success(message || "Job listing updated successfully! ✓");
        // Update local state
        setMyJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, ...payload } : j))
        );
        setEditingJobId(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update job.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a job
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      return;
    }

    setDeletingId(jobId);
    try {
      const { message, offline } = await deleteJob(jobId);
      if (offline) {
        toast.error(message);
      } else {
        toast.success(message || "Job deleted successfully.");
        setMyJobs((prev) => prev.filter((j) => j._id !== jobId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job.");
    } finally {
      setDeletingId(null);
    }
  };

  // Initiate status toggle: Double verification if closing, direct if re-activating
  const handleInitiateStatusToggle = (job) => {
    const isJobExpired = Boolean(job.expired && job.expired !== "false");
    if (!isJobExpired) {
      // Active Job -> Employer wants to CLOSE job -> Trigger Double Verification Modal!
      setClosingJob(job);
      setPendingEditClose(null);
    } else {
      // Expired Job -> Re-activate directly
      handleReactivateJob(job);
    }
  };

  // Re-activate an expired job
  const handleReactivateJob = async (job) => {
    try {
      const { message, offline } = await updateJob(job._id, { ...job, expired: false });
      setMyJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, expired: false } : j))
      );
      toast.success(`Job "${job.title}" re-activated successfully! ✓`);
    } catch (err) {
      toast.error("Failed to re-activate job.");
    }
  };

  // Double verification confirmed: Close the job
  const handleConfirmCloseJob = async () => {
    if (!closingJob) return;

    setIsClosingAction(true);
    try {
      if (pendingEditClose) {
        // Saved via in-card edit mode with Expired selected
        const { jobId, payload } = pendingEditClose;
        const { message, offline } = await updateJob(jobId, payload);
        setMyJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, ...payload } : j))
        );
        setEditingJobId(null);
        setEditFormData({});
        toast.success(message || `Job "${closingJob.title}" closed successfully.`);
        setPendingEditClose(null);
      } else {
        // Closed directly via "Close Job" action button
        const { message, offline } = await updateJob(closingJob._id, {
          ...closingJob,
          expired: true,
        });
        setMyJobs((prev) =>
          prev.map((j) => (j._id === closingJob._id ? { ...j, expired: true } : j))
        );
        toast.success(`Job "${closingJob.title}" has been closed.`);
      }
      setClosingJob(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to close job.");
    } finally {
      setIsClosingAction(false);
    }
  };

  const formatSalary = (job) => {
    if (job.fixedSalary) {
      return `₹${job.fixedSalary.toLocaleString("en-IN")}`;
    }
    if (job.salaryFrom && job.salaryTo) {
      return `₹${job.salaryFrom.toLocaleString("en-IN")} – ₹${job.salaryTo.toLocaleString("en-IN")}`;
    }
    return "Negotiable";
  };

  return (
    <section className="myjobs-v2-page">
      <div className="myjobs-v2-container">
        
        {/* ── Page Header ── */}
        <div className="myjobs-v2-header">
          <div className="myjobs-v2-header-text">
            <span className="myjobs-v2-badge">Employer Workspace</span>
            <h1>Manage Job Postings</h1>
            <p>Monitor performance, update role requirements, and control active openings.</p>
          </div>
          <Link to="/job/post" className="myjobs-v2-post-btn">
            <FiPlus /> Post New Job
          </Link>
        </div>

        {/* ── Metric Stats Cards ── */}
        <div className="myjobs-v2-stats">
          <div className="myjobs-v2-stat-card" onClick={() => setStatusFilter("all")}>
            <div className="myjobs-v2-stat-icon myjobs-v2-stat-icon--indigo">
              <FiBriefcase />
            </div>
            <div className="myjobs-v2-stat-info">
              <span className="myjobs-v2-stat-label">Total Listings</span>
              <span className="myjobs-v2-stat-val">{totalJobs}</span>
            </div>
          </div>

          <div className="myjobs-v2-stat-card" onClick={() => setStatusFilter("active")}>
            <div className="myjobs-v2-stat-icon myjobs-v2-stat-icon--emerald">
              <HiOutlineCheckCircle />
            </div>
            <div className="myjobs-v2-stat-info">
              <span className="myjobs-v2-stat-label">Active Openings</span>
              <span className="myjobs-v2-stat-val">{activeJobs}</span>
            </div>
          </div>

          <div className="myjobs-v2-stat-card" onClick={() => setStatusFilter("expired")}>
            <div className="myjobs-v2-stat-icon myjobs-v2-stat-icon--amber">
              <FiArchive />
            </div>
            <div className="myjobs-v2-stat-info">
              <span className="myjobs-v2-stat-label">Expired / Closed</span>
              <span className="myjobs-v2-stat-val">{expiredJobs}</span>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ── */}
        <div className="myjobs-v2-toolbar">
          <div className="myjobs-v2-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by role title, category, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>

          <div className="myjobs-v2-filter-group">
            {/* Status Segmented Tabs */}
            <div className="myjobs-v2-tabs">
              <button
                className={`myjobs-tab-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({totalJobs})
              </button>
              <button
                className={`myjobs-tab-btn ${statusFilter === "active" ? "active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                Active ({activeJobs})
              </button>
              <button
                className={`myjobs-tab-btn ${statusFilter === "expired" ? "active" : ""}`}
                onClick={() => setStatusFilter("expired")}
              >
                Expired ({expiredJobs})
              </button>
            </div>

            {/* Category Select */}
            <select
              className="myjobs-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Jobs Grid / List ── */}
        {filteredJobs.length > 0 ? (
          <div className="myjobs-v2-list">
            {filteredJobs.map((job) => {
              const isEditing = editingJobId === job._id;
              const isJobExpired = Boolean(job.expired && job.expired !== "false");

              if (isEditing) {
                /* ── In-Card Full Edit Mode ── */
                return (
                  <div className="myjobs-v2-card myjobs-v2-card--editing" key={job._id}>
                    <div className="myjobs-edit-header">
                      <div className="myjobs-edit-title-group">
                        <h3>Update Job Details</h3>
                      </div>
                      <button className="myjobs-edit-close" onClick={handleCancelEdit} title="Cancel editing">
                        <FiX />
                      </button>
                    </div>

                    <div className="myjobs-edit-form">
                      {/* Row 1: Title & Category */}
                      <div className="myjobs-form-row">
                        <div className="myjobs-form-field">
                          <label>Job Title *</label>
                          <input
                            type="text"
                            value={editFormData.title}
                            onChange={(e) => handleEditChange("title", e.target.value)}
                            placeholder="e.g. Senior Frontend Engineer"
                          />
                        </div>
                        <div className="myjobs-form-field">
                          <label>Category</label>
                          <select
                            value={editFormData.category}
                            onChange={(e) => handleEditChange("category", e.target.value)}
                          >
                            {CATEGORIES.map((cat, i) => (
                              <option key={i} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Location */}
                      <div className="myjobs-form-row">
                        <div className="myjobs-form-field">
                          <label>Country *</label>
                          <input
                            type="text"
                            value={editFormData.country}
                            onChange={(e) => handleEditChange("country", e.target.value)}
                            placeholder="e.g. India"
                          />
                        </div>
                        <div className="myjobs-form-field">
                          <label>City *</label>
                          <input
                            type="text"
                            value={editFormData.city}
                            onChange={(e) => handleEditChange("city", e.target.value)}
                            placeholder="e.g. Bangalore"
                          />
                        </div>
                        <div className="myjobs-form-field">
                          <label>Exact Location / Address *</label>
                          <input
                            type="text"
                            value={editFormData.location}
                            onChange={(e) => handleEditChange("location", e.target.value)}
                            placeholder="e.g. Tech Park, Outer Ring Road"
                          />
                        </div>
                      </div>

                      {/* Row 3: Salary & Vacancies & Status */}
                      <div className="myjobs-form-row">
                        <div className="myjobs-form-field">
                          <label>Salary Mode</label>
                          <div className="myjobs-salary-toggle">
                            <button
                              type="button"
                              className={editFormData.salaryType === "fixed" ? "active" : ""}
                              onClick={() => handleEditChange("salaryType", "fixed")}
                            >
                              Fixed Salary
                            </button>
                            <button
                              type="button"
                              className={editFormData.salaryType === "range" ? "active" : ""}
                              onClick={() => handleEditChange("salaryType", "range")}
                            >
                              Salary Range
                            </button>
                          </div>
                        </div>

                        {editFormData.salaryType === "fixed" ? (
                          <div className="myjobs-form-field">
                            <label>Fixed Salary (₹ / Year) *</label>
                            <input
                              type="number"
                              value={editFormData.fixedSalary}
                              onChange={(e) => handleEditChange("fixedSalary", e.target.value)}
                              placeholder="e.g. 850000"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="myjobs-form-field">
                              <label>Salary From (₹)</label>
                              <input
                                type="number"
                                value={editFormData.salaryFrom}
                                onChange={(e) => handleEditChange("salaryFrom", e.target.value)}
                                placeholder="e.g. 600000"
                              />
                            </div>
                            <div className="myjobs-form-field">
                              <label>Salary To (₹)</label>
                              <input
                                type="number"
                                value={editFormData.salaryTo}
                                onChange={(e) => handleEditChange("salaryTo", e.target.value)}
                                placeholder="e.g. 1200000"
                              />
                            </div>
                          </>
                        )}

                        <div className="myjobs-form-field">
                          <label>Vacancies</label>
                          <input
                            type="number"
                            min="1"
                            value={editFormData.vacancies}
                            onChange={(e) => handleEditChange("vacancies", e.target.value)}
                          />
                        </div>

                        <div className="myjobs-form-field">
                          <label>Listing Status</label>
                          <select
                            value={editFormData.expired}
                            onChange={(e) => handleEditChange("expired", e.target.value === "true")}
                          >
                            <option value="false">Active (Accepting Applications)</option>
                            <option value="true">Expired (Closed)</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 4: Description */}
                      <div className="myjobs-form-field full-width">
                        <label>Job Description *</label>
                        <textarea
                          rows={4}
                          value={editFormData.description}
                          onChange={(e) => handleEditChange("description", e.target.value)}
                          placeholder="Detailed role requirements, responsibilities, and perks..."
                        />
                      </div>
                    </div>

                    <div className="myjobs-edit-actions">
                      <button
                        type="button"
                        className="myjobs-cancel-btn"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="myjobs-save-btn"
                        onClick={() => handleSaveEdit(job._id)}
                        disabled={isUpdating}
                      >
                        <FiCheck /> {isUpdating ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                );
              }

              /* ── Standard Rich View Mode Card ── */
              return (
                <div
                  className={`myjobs-v2-card ${isJobExpired ? "myjobs-v2-card--expired" : ""}`}
                  key={job._id}
                >
                  <div className="myjobs-card-main">
                    {/* Top Meta: Category + Status Badge */}
                    <div className="myjobs-card-top-row">
                      <div className="myjobs-tag-group">
                        <span className="myjobs-category-badge">{job.category}</span>
                        <span
                          className={`myjobs-status-pill ${
                            isJobExpired ? "status-expired" : "status-active"
                          }`}
                        >
                          {isJobExpired ? (
                            <>
                              <FiArchive /> Expired
                            </>
                          ) : (
                            <>
                              <span className="pulse-dot" /> Active
                            </>
                          )}
                        </span>
                      </div>

                      <div className="myjobs-card-date">
                        <FiCalendar /> Posted: {new Date(job.jobPostedOn || Date.now()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Title + Public link */}
                    <div className="myjobs-card-title-area">
                      <h2 className="myjobs-card-title">{job.title}</h2>
                      <Link
                        to={`/job/${job._id}`}
                        className="myjobs-public-view-link"
                        title="View public job posting"
                      >
                        <FiExternalLink /> View on Portal
                      </Link>
                    </div>

                    {/* Key Attributes Pills Row */}
                    <div className="myjobs-card-chips">
                      <div className="myjobs-chip">
                        <FaRupeeSign className="chip-icon rupee" />
                        <span>{formatSalary(job)}</span>
                      </div>
                      <div className="myjobs-chip">
                        <FiMapPin className="chip-icon location" />
                        <span>{job.city}, {job.country}</span>
                      </div>
                      <div className="myjobs-chip">
                        <FiLayers className="chip-icon vacancies" />
                        <span>{job.vacancies ?? 1} {(job.vacancies ?? 1) === 1 ? "Vacancy" : "Vacancies"}</span>
                      </div>
                    </div>

                    {/* Description Excerpt */}
                    <p className="myjobs-card-description">
                      {job.description?.length > 180
                        ? `${job.description.substring(0, 180)}...`
                        : job.description}
                    </p>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="myjobs-card-actions">
                    <button
                      className="myjobs-action-btn myjobs-toggle-btn"
                      onClick={() => handleInitiateStatusToggle(job)}
                      title={isJobExpired ? "Re-activate this job" : "Mark this job as expired"}
                    >
                      {isJobExpired ? "Re-activate Job" : "Close Job"}
                    </button>

                    <div className="myjobs-action-right-btns">
                      <button
                        className="myjobs-action-btn myjobs-edit-btn"
                        onClick={() => handleStartEdit(job)}
                        title="Edit Job Details"
                      >
                        <FiEdit2 /> Edit
                      </button>

                      <button
                        className="myjobs-action-btn myjobs-delete-btn"
                        onClick={() => handleDeleteJob(job._id)}
                        disabled={deletingId === job._id}
                        title="Delete Job Posting"
                      >
                        <FiTrash2 /> {deletingId === job._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="myjobs-v2-empty">
            <div className="empty-icon-wrap">📋</div>
            <h3>No Job Listings Found</h3>
            <p>
              {myJobs.length === 0
                ? "You haven't posted any jobs yet. Create your first opening to start receiving applications from qualified candidates."
                : "No job postings matched your current search or filter criteria. Try clearing filters."}
            </p>
            {myJobs.length === 0 ? (
              <Link to="/job/post" className="myjobs-v2-post-btn">
                <FiPlus /> Post Your First Job
              </Link>
            ) : (
              <button
                className="myjobs-reset-btn"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* ── Simple Close Job Confirmation Popup (Rectangle Shape) ── */}
        {closingJob && (
          <div
            className="simple-modal-backdrop"
            onClick={() => {
              if (!isClosingAction) {
                setClosingJob(null);
                setPendingEditClose(null);
              }
            }}
          >
            <div
              className="simple-modal-box"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="simple-modal-header">
                <h3 className="simple-modal-title">
                  <FiAlertTriangle className="simple-modal-warn-icon" /> Warning
                </h3>
                <button
                  type="button"
                  className="simple-modal-x"
                  onClick={() => {
                    if (!isClosingAction) {
                      setClosingJob(null);
                      setPendingEditClose(null);
                    }
                  }}
                  disabled={isClosingAction}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="simple-modal-content">
                <p className="simple-modal-msg">
                  Are you sure want to close job <strong>"{closingJob.title}"</strong>?
                </p>

                <div className="simple-modal-note">
                  <strong>Please note before closing job:</strong>
                  <p>
                    Once closed, this job will be marked as expired and candidates will no longer be able to apply. You can re-open it anytime from your dashboard.
                  </p>
                </div>
              </div>

              <div className="simple-modal-footer">
                <button
                  type="button"
                  className="simple-btn simple-btn-cancel"
                  onClick={() => {
                    setClosingJob(null);
                    setPendingEditClose(null);
                  }}
                  disabled={isClosingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="simple-btn simple-btn-danger"
                  onClick={handleConfirmCloseJob}
                  disabled={isClosingAction}
                >
                  {isClosingAction ? "Closing..." : "Yes, Close Job"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MyJobs;
