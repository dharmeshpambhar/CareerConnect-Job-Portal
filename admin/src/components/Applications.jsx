import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaInfoCircle, FaFileAlt, FaUserCircle, FaIdBadge, FaEnvelope, FaPhone, FaMapMarkerAlt, FaDownload, FaRegFileAlt, FaBriefcase } from "react-icons/fa";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/admin/applications",
        { withCredentials: true }
      );
      setApplications(data.applications || []);
    } catch (error) {
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job application? This action cannot be undone.")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/admin/applications/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setApplications(applications.filter(app => app._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete application.");
    }
  };

  const filteredApps = applications.filter((app) => {
    return app.name.toLowerCase().includes(search.toLowerCase()) ||
           app.email.toLowerCase().includes(search.toLowerCase()) ||
           app.phone.toString().includes(search);
  });

  return (
    <div>
      <h1 className="page-title">Applications</h1>
      <p className="page-subtitle">Inspect candidates' details, download resumes, or delete job submissions.</p>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input
            type="text"
            className="search-input"
            placeholder="Search applications by candidate name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loader">
          <div className="admin-spinner" />
          <span>Loading applications...</span>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <span className="empty-state-icon">📄</span>
                        <span className="empty-state-text">No applications match your search.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr key={app._id}>
                      <td style={{ fontWeight: 600 }}>{app.name}</td>
                      <td>{app.email}</td>
                      <td>{app.phone}</td>
                      <td>{app.address}</td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="btn-action edit"
                            title="View application details"
                          >
                            <FaInfoCircle />
                          </button>
                          <button
                            onClick={() => handleDelete(app._id)}
                            className="btn-action delete"
                            title="Delete submission record"
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

      {/* ── Premium Detail Modal ── */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "620px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-title-icon">
                  <FaRegFileAlt />
                </span>
                Application Review
              </div>
              <button onClick={() => setSelectedApp(null)} className="btn-close" title="Close">
                <RxCross2 />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="modal-scroll" style={{ padding: "1.5rem 1.75rem" }}>

              {/* Candidate Info Section */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaUserCircle /> Candidate Information
                </div>
                <div className="modal-info-grid">
                  <div className="info-chip">
                    <span className="info-chip-label"><FaUserCircle style={{ display: "inline", marginRight: 3 }} />Full Name</span>
                    <span className="info-chip-value">{selectedApp.name}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaEnvelope style={{ display: "inline", marginRight: 3 }} />Email Address</span>
                    <span className="info-chip-value" style={{ fontSize: "0.82rem" }}>{selectedApp.email}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaPhone style={{ display: "inline", marginRight: 3 }} />Phone Number</span>
                    <span className="info-chip-value">{selectedApp.phone}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaMapMarkerAlt style={{ display: "inline", marginRight: 3 }} />Address</span>
                    <span className="info-chip-value">{selectedApp.address || "—"}</span>
                  </div>
                </div>
              </div>

              {/* System IDs Section */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaIdBadge /> System Identifiers
                </div>
                <div className="modal-info-grid">
                  <div className="info-chip">
                    <span className="info-chip-label">Applicant Account ID</span>
                    <span className="info-chip-value mono">{selectedApp.applicantID?.user || "—"}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label">Employer Account ID</span>
                    <span className="info-chip-value mono">{selectedApp.employerID?.user || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Cover Letter Section */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaFileAlt /> Cover Letter & Profile Summary
                </div>
                <div className="detail-text-block">
                  {selectedApp.coverLetter || "No cover letter submitted."}
                </div>
              </div>

              {/* Resumes Section */}
              {(selectedApp.applicantProfileResume?.url || selectedApp.resume?.url) && (
                <div className="modal-section">
                  <div className="modal-section-title">
                    <FaDownload /> Submitted Resumes
                  </div>

                  {/* Main Profile Resume */}
                  {selectedApp.applicantProfileResume?.url && (
                    <div className="cv-card" style={{ marginBottom: "0.75rem", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.04)" }}>
                      <div className="cv-card-icon" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))" }}>
                        ⭐
                      </div>
                      <div className="cv-card-info">
                        <div className="cv-card-title">
                          {selectedApp.applicantProfileResume.name || "Master Profile Resume"}
                        </div>
                        <div className="cv-card-subtitle">Candidate Profile Resume · Priority</div>
                      </div>
                      <a
                        href={selectedApp.applicantProfileResume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-card-btn primary"
                      >
                        <FaDownload style={{ fontSize: "0.75rem" }} /> View
                      </a>
                    </div>
                  )}

                  {/* Specific Job Resume */}
                  {selectedApp.resume?.url && (
                    <div className="cv-card" style={{ borderColor: "rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.04)" }}>
                      <div className="cv-card-icon" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))" }}>
                        📋
                      </div>
                      <div className="cv-card-info">
                        <div className="cv-card-title">Application Submission Attachment</div>
                        <div className="cv-card-subtitle">Specific Job Application Resume</div>
                      </div>
                      <a
                        href={selectedApp.resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-card-btn purple"
                      >
                        <FaDownload style={{ fontSize: "0.75rem" }} /> View
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={() => setSelectedApp(null)} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
