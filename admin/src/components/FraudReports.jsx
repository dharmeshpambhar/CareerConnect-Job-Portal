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
        {
          status,
          adminNotes,
          actionTaken: actionLabel,
        },
        { withCredentials: true }
      );

      toast.success(data.message || `Action executed: ${status}`);
      // Update local reports list
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
    const matchesStatus =
      statusFilter === "All" || r.status === statusFilter;
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
      case "Company Blacklisted":
        return "blacklisted";
      case "Company Warned":
        return "warned";
      case "Under Review":
        return "review";
      case "Dismissed":
        return "dismissed";
      default:
        return "pending";
    }
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">Fraud & Disputes</h1>
      <p className="page-subtitle">
        Inspect candidate scam complaints, review evidence, issue warnings, or blacklist deceptive employers.
      </p>

      {/* Stats Cards — styled with .stats-grid & .glass-panel .stat-card matching Dashboard */}
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

      {/* Filter and Search Bar — styled with .filter-row, .search-input-wrapper & .select-filter matching Accounts & Jobs */}
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

      {/* Reports Table — styled with .glass-panel & .admin-table matching Applications & Accounts */}
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

      {/* ── Inspection Glass Modal — styled with .modal-overlay & .modal-content .glass-panel ── */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "640px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Dispute Investigation</h3>
              <button onClick={() => setSelectedReport(null)} className="btn-close">
                <RxCross2 />
              </button>
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              {/* Company & Candidate Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Accused Company</div>
                  <div className="detail-value">{selectedReport.companyName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Position: {selectedReport.jobTitle}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Reporting Candidate</div>
                  <div className="detail-value">{selectedReport.applicantName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {selectedReport.applicantEmail}
                  </div>
                </div>
              </div>

              {/* Reported Category */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Reported Fraud Category</div>
                <div className="fraud-modal-category">
                  <FaExclamationTriangle style={{ color: "var(--warning-color)", marginRight: "6px" }} />
                  <span>{selectedReport.reason}</span>
                </div>
              </div>

              {/* Candidate Statement */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Candidate Statement & Explanation</div>
                <div className="fraud-modal-statement">
                  {selectedReport.details}
                </div>
              </div>

              {/* Evidence / Screenshot */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Attached Evidence / Proof</div>
                {selectedReport.evidenceUrl ? (
                  <div className="fraud-modal-evidence-box">
                    <a
                      href={selectedReport.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-evidence-link"
                    >
                      <FaFileAlt /> View Uploaded Screenshot / Proof{" "}
                      <FaExternalLinkAlt style={{ fontSize: "0.75rem", marginLeft: "4px" }} />
                    </a>
                    {selectedReport.evidenceUrl.match(/\.(jpeg|jpg|png|webp)/i) && (
                      <div className="evidence-modal-thumb">
                        <img src={selectedReport.evidenceUrl} alt="Evidence proof" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No screenshot or document was attached to this dispute.
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Administrator Case Notes</div>
                <textarea
                  className="admin-case-notes"
                  rows={3}
                  placeholder="Record verification call outcomes, candidate confirmation, or rationale for penalties..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.5rem 0" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Current Status:{" "}
                  <span className={`badge ${getBadgeClass(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </span>
                {selectedReport.actionTaken && (
                  <span style={{ fontSize: "0.8rem", color: "var(--primary-accent)", fontStyle: "italic" }}>
                    Last Action: {selectedReport.actionTaken}
                  </span>
                )}
              </div>
            </div>

            {/* Moderation Actions */}
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
