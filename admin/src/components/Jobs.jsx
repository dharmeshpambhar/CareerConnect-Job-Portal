import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaInfoCircle, FaBriefcase, FaMapMarkerAlt, FaRupeeSign, FaUser, FaAlignLeft, FaCalendarAlt } from "react-icons/fa";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal Detail State
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/admin/jobs",
        { withCredentials: true }
      );
      setJobs(data.jobs || []);
    } catch (error) {
      toast.error("Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job listing? Users will no longer see it.")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/admin/jobs/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setJobs(jobs.filter(j => j._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job.");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
                          j.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" ||
      (statusFilter === "Active" && !j.expired) ||
      (statusFilter === "Expired" && j.expired);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="page-title">Jobs</h1>
      <p className="page-subtitle">Inspect job posts, view description requirements, or delete listings.</p>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input
            type="text"
            className="search-input"
            placeholder="Search job listings by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Postings</option>
          <option value="Active">Active Only</option>
          <option value="Expired">Expired Only</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loader">
          <div className="admin-spinner" />
          <span>Loading job listings...</span>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Category</th>
                  <th>Salary Details</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <span className="empty-state-icon">💼</span>
                        <span className="empty-state-text">No job postings match your criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => (
                    <tr key={j._id}>
                      <td style={{ fontWeight: 600 }}>{j.title}</td>
                      <td>{j.category}</td>
                      <td>
                        {j.fixedSalary ? (
                          <span>₹{j.fixedSalary.toLocaleString("en-IN")} / mo</span>
                        ) : (
                          <span>₹{j.salaryFrom.toLocaleString("en-IN")} - ₹{j.salaryTo.toLocaleString("en-IN")} / mo</span>
                        )}
                      </td>
                      <td>{j.city}, {j.country}</td>
                      <td>
                        <span className={`badge ${j.expired ? 'expired' : 'active'}`}>
                          {j.expired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => setSelectedJob(j)}
                            className="btn-action edit"
                            title="View job description details"
                          >
                            <FaInfoCircle />
                          </button>
                          <button
                            onClick={() => handleDelete(j._id)}
                            className="btn-action delete"
                            title="Delete job posting"
                          >
                            <RxTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Premium Job Detail Modal ── */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-title-icon">
                  <FaBriefcase />
                </span>
                Job Details
              </div>
              <button onClick={() => setSelectedJob(null)} className="btn-close" title="Close">
                <RxCross2 />
              </button>
            </div>

            {/* Job Hero Card */}
            <div style={{
              padding: "1.25rem 1.75rem",
              background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))",
              borderBottom: "1px solid rgba(99,102,241,0.08)",
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.4rem", flexShrink: 0,
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)"
              }}>
                💼
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-main)", marginBottom: 4 }}>
                  {selectedJob.title}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span>📂 {selectedJob.category}</span>
                  <span>📍 {selectedJob.city}, {selectedJob.country}</span>
                </div>
              </div>
              <span className={`badge ${selectedJob.expired ? 'expired' : 'active'}`} style={{ flexShrink: 0, margin: 0 }}>
                {selectedJob.expired ? '⏸ Expired' : '✓ Active'}
              </span>
            </div>

            {/* Scrollable Body */}
            <div className="modal-scroll" style={{ padding: "1.5rem 1.75rem" }}>

              {/* Core Details */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaInfoCircle /> Position Details
                </div>
                <div className="modal-info-grid">
                  <div className="info-chip">
                    <span className="info-chip-label"><FaMapMarkerAlt style={{ display: "inline", marginRight: 3 }} />Full Location</span>
                    <span className="info-chip-value">{selectedJob.location}, {selectedJob.city}, {selectedJob.country}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaRupeeSign style={{ display: "inline", marginRight: 3 }} />Salary Package</span>
                    <span className="info-chip-value">
                      {selectedJob.fixedSalary
                        ? `Fixed: ₹${selectedJob.fixedSalary.toLocaleString("en-IN")}/mo`
                        : `₹${selectedJob.salaryFrom?.toLocaleString("en-IN")} – ₹${selectedJob.salaryTo?.toLocaleString("en-IN")}/mo`}
                    </span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaUser style={{ display: "inline", marginRight: 3 }} />Posted By (User ID)</span>
                    <span className="info-chip-value mono">{selectedJob.postedBy}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaCalendarAlt style={{ display: "inline", marginRight: 3 }} />Posting Status</span>
                    <span className="info-chip-value">
                      <span className={`badge ${selectedJob.expired ? 'expired' : 'active'}`} style={{ margin: 0 }}>
                        {selectedJob.expired ? 'Expired' : 'Active'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaAlignLeft /> Job Description
                </div>
                <div className="detail-text-block" style={{ maxHeight: 220 }}>
                  {selectedJob.description || "No description provided."}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={() => setSelectedJob(null)} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
