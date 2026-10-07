import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  RxMagnifyingGlass,
  RxCross2,
  RxExclamationTriangle,
  RxAvatar,
} from "react-icons/rx";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaBan,
  FaEye,
  FaBuilding,
  FaFileAlt,
  FaExternalLinkAlt,
  FaUserAlt,
  FaEnvelope,
  FaStickyNote,
  FaGavel,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const FraudReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected report for modal inspection & action
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/fraud/admin/all`,
        { withCredentials: true }
      );
      setReports(data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load fraud reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || "");
  };

  const handleUpdateStatus = async (status, actionLabel) => {
    if (!selectedReport) return;
    if (status === "Company Blacklisted") {
      const confirmed = window.confirm(
        `ARE YOU SURE you want to BLACKLIST "${selectedReport.companyName}"?\n\nThis will suspend their account, freeze their active jobs, and notify the reporting candidate.`
      );
      if (!confirmed) return;
    }

    setActionLoading(true);
    try {
      const { data } = await axios.patch(
        `${API_BASE}/fraud/admin/${selectedReport._id}`,
        { status, adminNotes, actionTaken: actionLabel },
        { withCredentials: true }
      );

      toast.success(data.message || `Action executed: ${status}`);
      setReports((prev) =>
        prev.map((r) => (r._id === selectedReport._id ? data.report : r))
      );
      setSelectedReport(data.report);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update report.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const s = search.toLowerCase();
    const matchesSearch =
      (r.companyName && r.companyName.toLowerCase().includes(s)) ||
      (r.jobTitle && r.jobTitle.toLowerCase().includes(s)) ||
      (r.applicantName && r.applicantName.toLowerCase().includes(s)) ||
      (r.applicantEmail && r.applicantEmail.toLowerCase().includes(s)) ||
      (r.reason && r.reason.toLowerCase().includes(s));
    return matchesStatus && matchesSearch;
  });

  // Metrics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending Investigation").length;
  const blacklistedCount = reports.filter((r) => r.status === "Company Blacklisted").length;
  const warnedCount = reports.filter((r) => r.status === "Company Warned").length;

  const getBadgeClass = (status) => {
    switch (status) {
      case "Company Blacklisted": return "blacklisted";
      case "Company Warned": return "warned";
      case "Under Review": return "review";
      case "Dismissed": return "dismissed";
      default: return "pending";
    }
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">Fraud & Disputes</h1>
      <p className="page-subtitle">
        Inspect candidate scam complaints, review evidence, issue warnings, or blacklist deceptive employers.
      </p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Disputes</span>
            <div className="stat-icon"><FaShieldAlt /></div>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-desc">All candidate-reported fraud complaints</div>
        </div>

        <div className="glass-panel stat-card amber">
          <div className="stat-header">
            <span className="stat-title">Pending Review</span>
            <div className="stat-icon"><RxExclamationTriangle /></div>
          </div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-desc">Awaiting administrator investigation</div>
        </div>

        <div className="glass-panel stat-card cyan">
          <div className="stat-header">
            <span className="stat-title">Companies Warned</span>
            <div className="stat-icon"><FaExclamationTriangle /></div>
          </div>
          <div className="stat-value">{warnedCount}</div>
          <div className="stat-desc">Issued formal misconduct warning</div>
        </div>

        <div className="glass-panel stat-card red">
          <div className="stat-header">
            <span className="stat-title">Blacklisted</span>
            <div className="stat-icon"><FaBan /></div>
          </div>
          <div className="stat-value">{blacklistedCount}</div>
          <div className="stat-desc">Suspended fraudulent employers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input
            type="text"
            className="search-input"
            placeholder="Search disputes by company, job role, applicant, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Dispute Statuses</option>
          <option value="Pending Investigation">Pending Investigation</option>
          <option value="Under Review">Under Review</option>
          <option value="Company Warned">Company Warned</option>
          <option value="Company Blacklisted">Company Blacklisted</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="admin-loader">
          <div className="admin-spinner" />
          <span>Loading dispute reports...</span>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company & Position</th>
                  <th>Reporting Candidate</th>
                  <th>Fraud Category</th>
                  <th>Date Reported</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <span className="empty-state-icon">🛡️</span>
                        <span className="empty-state-text">No dispute reports match your criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>
                            <FaBuilding style={{ marginRight: "6px", color: "var(--primary-accent)" }} />
                            {report.companyName}
                          </strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>
                            Role: {report.jobTitle}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {report.applicantName}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            {report.applicantEmail}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="fraud-category-tag" title={report.reason}>
                          {report.reason}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleOpenModal(report)}
                            className="btn-action edit"
                            title="Inspect details & moderate"
                          >
                            <FaEye />
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

      {/* ── Premium Dispute Investigation Modal ── */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "660px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-title-icon" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                  <FaShieldAlt />
                </span>
                Dispute Investigation
              </div>
              <button onClick={() => setSelectedReport(null)} className="btn-close" title="Close">
                <RxCross2 />
              </button>
            </div>

            {/* Dispute status strip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.85rem 1.75rem",
              background: "linear-gradient(135deg, rgba(239,68,68,0.04), rgba(245,158,11,0.02))",
              borderBottom: "1px solid rgba(239,68,68,0.08)"
            }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                Current Status:
                <span className={`badge ${getBadgeClass(selectedReport.status)}`} style={{ margin: 0 }}>
                  {selectedReport.status}
                </span>
              </div>
              {selectedReport.actionTaken && (
                <div style={{ fontSize: "0.78rem", color: "var(--primary-accent)", fontStyle: "italic" }}>
                  Last Action: {selectedReport.actionTaken}
                </div>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="modal-scroll" style={{ padding: "1.5rem 1.75rem" }}>

              {/* Accused Company & Reporting Candidate */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaBuilding /> Parties Involved
                </div>
                <div className="modal-info-grid">
                  <div className="info-chip">
                    <span className="info-chip-label"><FaBuilding style={{ display: "inline", marginRight: 3 }} />Accused Company</span>
                    <span className="info-chip-value">{selectedReport.companyName}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Position: {selectedReport.jobTitle}
                    </span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaUserAlt style={{ display: "inline", marginRight: 3 }} />Reporting Candidate</span>
                    <span className="info-chip-value">{selectedReport.applicantName}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {selectedReport.applicantEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fraud Category */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaExclamationTriangle /> Reported Fraud Category
                </div>
                <div className="fraud-modal-category">
                  <FaExclamationTriangle style={{ color: "var(--warning-color)", marginRight: "6px" }} />
                  <span>{selectedReport.reason}</span>
                </div>
              </div>

              {/* Candidate Statement */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaEnvelope /> Candidate Statement & Explanation
                </div>
                <div className="fraud-modal-statement detail-text-block">
                  {selectedReport.details || "No detailed statement was provided."}
                </div>
              </div>

              {/* Evidence */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaFileAlt /> Attached Evidence / Proof
                </div>
                {selectedReport.evidenceUrl ? (
                  <div className="fraud-modal-evidence-box">
                    <div className="cv-card" style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.03)" }}>
                      <div className="cv-card-icon" style={{ fontSize: "1.5rem" }}>📁</div>
                      <div className="cv-card-info">
                        <div className="cv-card-title">Uploaded Screenshot / Proof Document</div>
                        <div className="cv-card-subtitle">Evidence submitted by candidate</div>
                      </div>
                      <a
                        href={selectedReport.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-card-btn primary"
                      >
                        <FaExternalLinkAlt style={{ fontSize: "0.7rem" }} /> View
                      </a>
                    </div>
                    {selectedReport.evidenceUrl.match(/\.(jpeg|jpg|png|webp)/i) && (
                      <div className="evidence-modal-thumb" style={{ marginTop: "0.75rem" }}>
                        <img src={selectedReport.evidenceUrl} alt="Evidence proof" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: "0.9rem 1rem", borderRadius: 10,
                    background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)",
                    fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic"
                  }}>
                    No screenshot or document was attached to this dispute.
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaStickyNote /> Administrator Case Notes
                </div>
                <textarea
                  className="admin-case-notes"
                  rows={3}
                  placeholder="Record verification call outcomes, candidate confirmation, or rationale for penalties..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Moderation Actions Footer */}
            <div className="fraud-modal-footer">
              <button
                type="button"
                className="btn-modal-subtle"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus("Dismissed", "Dismissed (No violation)")}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="btn-modal-review"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus("Under Review", "Marked Under Review")}
              >
                Under Review
              </button>
              <button
                type="button"
                className="btn-modal-warn"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus("Company Warned", "Formal Warning Issued")}
              >
                <FaExclamationTriangle /> Issue Warning
              </button>
              <button
                type="button"
                className="btn-modal-blacklist"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus("Company Blacklisted", "Blacklisted & Suspended")}
              >
                <FaBan /> Blacklist Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudReports;
