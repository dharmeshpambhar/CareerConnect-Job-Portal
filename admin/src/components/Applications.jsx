import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaInfoCircle, FaDownload } from "react-icons/fa";

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
        {
          withCredentials: true,
        }
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
        {
          withCredentials: true,
        }
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
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "#fff" }}>
          <div>Loading job applications...</div>
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
                    <td colSpan="5" style={{ textAlignment: "center", color: "var(--text-muted)" }}>
                      No applications match your search.
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

      {/* Detail overlay glass modal */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Application Review</h3>
              <button onClick={() => setSelectedApp(null)} className="btn-close">
                <RxCross2 />
              </button>
            </div>
            
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Name</div>
                  <div className="detail-value">{selectedApp.name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Email</div>
                  <div className="detail-value" style={{ fontSize: "0.85rem" }}>{selectedApp.email}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Phone</div>
                  <div className="detail-value">{selectedApp.phone}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Address</div>
                  <div className="detail-value">{selectedApp.address}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Applicant Account ID</div>
                  <div className="detail-value" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{selectedApp.applicantID?.user}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Employer Account ID</div>
                  <div className="detail-value" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{selectedApp.employerID?.user}</div>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Cover Letter Description</div>
                <div className="detail-value" style={{ whiteSpace: "pre-wrap", lineHeight: "1.5", fontSize: "0.9rem" }}>
                  {selectedApp.coverLetter}
                </div>
              </div>

              {/* 1. Main Priority Profile Resume */}
              {selectedApp.applicantProfileResume && selectedApp.applicantProfileResume.url && (
                <div className="detail-item" style={{ marginTop: "1rem" }}>
                  <div className="detail-label" style={{ color: "#38bdf8" }}>⭐ Candidate Profile Resume (Main / Priority)</div>
                  <div className="cv-preview-box" style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                    <FaDownload style={{ fontSize: "1.8rem", color: "#38bdf8" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {selectedApp.applicantProfileResume.name || "Master Profile Resume"}
                    </span>
                    <a 
                      href={selectedApp.applicantProfileResume.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Open candidate main profile resume in new tab"
                      style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#fff", padding: "6px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}
                    >
                      View Profile Resume
                    </a>
                  </div>
                </div>
              )}

              {/* 2. Specific Job Application Resume */}
              {selectedApp.resume && selectedApp.resume.url && (
                <div className="detail-item" style={{ marginTop: "1rem" }}>
                  <div className="detail-label" style={{ color: "#a855f7" }}>📋 Specific Job Application Resume (Submitted for this Job)</div>
                  <div className="cv-preview-box" style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.25)" }}>
                    <FaDownload style={{ fontSize: "1.8rem", color: "#a855f7" }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Application Submission Attachment</span>
                    <a 
                      href={selectedApp.resume.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Open application submitted resume in new tab"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", padding: "6px 14px", borderRadius: "6px", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}
                    >
                      View Application Resume
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setSelectedApp(null)} className="btn-cancel">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
