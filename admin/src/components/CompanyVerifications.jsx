import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  RxMagnifyingGlass,
  RxCross2,
  RxExclamationTriangle,
} from "react-icons/rx";
import {
  FaBuilding,
  FaFileAlt,
  FaExternalLinkAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaCheck,
  FaTimes,
  FaGlobe,
  FaMapMarkerAlt,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const CompanyVerifications = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected company modal state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/admin/companies/verifications`,
        { withCredentials: true }
      );
      setCompanies(data.companies || []);
    } catch (error) {
      toast.error("Failed to load company verification requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenModal = (company) => {
    setSelectedCompany(company);
    setRemarks(company.verificationRemarks || "");
  };

  const handleVerify = async (status) => {
    if (!selectedCompany) return;
    if (status === "Rejected") {
      const confirmed = window.confirm(
        `Are you sure you want to REJECT verification for "${selectedCompany.companyName}"?\n\nThis will prevent them from posting active job listings until re-verified.`
      );
      if (!confirmed) return;
    }

    setActionLoading(true);
    try {
      const { data } = await axios.put(
        `${API_BASE}/admin/companies/${selectedCompany._id}/verify`,
        { status, remarks },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message || `Company verification updated to ${status}!`);

      // Update local state
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === selectedCompany._id
            ? {
                ...c,
                verificationStatus: status,
                isVerified: status === "Approved",
                verificationRemarks: remarks,
                verifiedAt: status === "Approved" ? new Date().toISOString() : null,
              }
            : c
        )
      );
      setSelectedCompany(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update verification status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalCount = companies.length;
  const pendingCount = companies.filter((c) => c.verificationStatus === "Pending").length;
  const approvedCount = companies.filter((c) => c.verificationStatus === "Approved").length;
  const rejectedCount = companies.filter((c) => c.verificationStatus === "Rejected").length;

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      (c.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.companyRegistrationNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || c.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBadgeClass = (status) => {
    switch (status) {
      case "Approved":
        return "active";
      case "Rejected":
        return "blacklisted";
      default:
        return "pending";
    }
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">Company Verifications</h1>
      <p className="page-subtitle">
        Audit employer registration certificates and authenticate official company accounts to protect job seekers.
      </p>

      {/* Stats Cards — matching FraudReports & Dashboard design */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Employers</span>
            <div className="stat-icon"><FaBuilding /></div>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-desc">All registered hiring entities</div>
        </div>

        <div className="glass-panel stat-card amber">
          <div className="stat-header">
            <span className="stat-title">Pending Review</span>
            <div className="stat-icon"><FaClock /></div>
          </div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-desc">Awaiting certificate audit</div>
        </div>

        <div className="glass-panel stat-card emerald">
          <div className="stat-header">
            <span className="stat-title">Verified Official</span>
            <div className="stat-icon"><FaCheckCircle /></div>
          </div>
          <div className="stat-value">{approvedCount}</div>
          <div className="stat-desc">Authenticated trusted companies</div>
        </div>

        <div className="glass-panel stat-card red">
          <div className="stat-header">
            <span className="stat-title">Rejected</span>
            <div className="stat-icon"><FaTimesCircle /></div>
          </div>
          <div className="stat-value">{rejectedCount}</div>
          <div className="stat-desc">Failed documentation review</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input
            type="text"
            className="search-input"
            placeholder="Search by company name, recruiter, email, reg no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Verification Statuses</option>
          <option value="Pending">Pending Review ({pendingCount})</option>
          <option value="Approved">Verified & Approved ({approvedCount})</option>
          <option value="Rejected">Rejected ({rejectedCount})</option>
        </select>
      </div>

      {/* Table List View */}
      {loading ? (
        <div className="admin-loader">
          <div className="admin-spinner" />
          <span>Loading company verification requests...</span>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company & Recruiter</th>
                  <th>Reg / Tax ID</th>
                  <th>Contact Details</th>
                  <th>Certificate Document</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <span className="empty-state-icon">🏢</span>
                        <span className="empty-state-text">No company accounts match the filter criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ color: "var(--text-main)", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <FaBuilding style={{ color: "var(--primary-accent)" }} />
                            {c.companyName}
                            {c.isVerified && (
                              <span title="Verified Official Company" style={{ color: "#10b981", fontSize: "0.9rem" }}>
                                ✓
                              </span>
                            )}
                          </strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>
                            Recruiter: {c.name || "HR Manager"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {c.companyRegistrationNumber ? (
                          <span className="fraud-category-tag" style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>
                            {c.companyRegistrationNumber}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.82rem" }}>
                            Not Provided
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.85rem" }}>
                            {c.email}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                            📞 {c.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {c.companyCertificate && c.companyCertificate.url ? (
                          <a
                            href={c.companyCertificate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-evidence-link"
                            title="Open certificate in new tab"
                          >
                            <FaFileAlt />
                            <span>
                              {c.companyCertificate.fileName
                                ? c.companyCertificate.fileName.length > 18
                                  ? c.companyCertificate.fileName.slice(0, 15) + "..."
                                  : c.companyCertificate.fileName
                                : "Certificate"}
                            </span>
                            <FaExternalLinkAlt style={{ fontSize: "0.65rem", marginLeft: "2px" }} />
                          </a>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: "0.8rem", fontStyle: "italic" }}>
                            ⚠️ No File Attached
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getBadgeClass(c.verificationStatus)}`}>
                          {c.verificationStatus === "Approved"
                            ? "Verified"
                            : c.verificationStatus === "Rejected"
                            ? "Rejected"
                            : "Pending Review"}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="btn-action edit"
                            title="Audit certificate & credentials"
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

      {/* ── Inspection & Audit Glass Modal (Matches FraudReports Modal) ── */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "640px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Company Verification Audit</h3>
              <button onClick={() => setSelectedCompany(null)} className="btn-close">
                <RxCross2 />
              </button>
            </div>

            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              {/* Company & Recruiter Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Company Name</div>
                  <div className="detail-value">{selectedCompany.companyName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Recruiter: {selectedCompany.name}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Govt Registration / CIN</div>
                  <div className="detail-value" style={{ fontFamily: "monospace" }}>
                    {selectedCompany.companyRegistrationNumber || "Not Provided"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {selectedCompany.email}
                  </div>
                </div>
              </div>

              {/* Contact & Web Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="detail-item">
                  <div className="detail-label">Phone & Contact</div>
                  <div className="detail-value">📞 {selectedCompany.phone || "N/A"}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Website / Location</div>
                  <div className="detail-value">
                    {selectedCompany.website ? (
                      <a
                        href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--primary-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <FaGlobe style={{ fontSize: "0.8rem" }} /> {selectedCompany.website}
                      </a>
                    ) : selectedCompany.location ? (
                      <span><FaMapMarkerAlt style={{ color: "var(--text-muted)", marginRight: "4px" }} /> {selectedCompany.location}</span>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              </div>

              {/* Submitted Certificate Document */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Submitted Company Certificate / License</div>
                {selectedCompany.companyCertificate && selectedCompany.companyCertificate.url ? (
                  <div className="fraud-modal-evidence-box">
                    <a
                      href={selectedCompany.companyCertificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-evidence-link"
                    >
                      <FaFileAlt /> View Uploaded Registration Certificate{" "}
                      <FaExternalLinkAlt style={{ fontSize: "0.75rem", marginLeft: "4px" }} />
                    </a>
                    {selectedCompany.companyCertificate.url.match(/\.(jpeg|jpg|png|webp)/i) && (
                      <div className="evidence-modal-thumb">
                        <img src={selectedCompany.companyCertificate.url} alt="Registration Certificate" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    ⚠️ No certificate document was attached during registration.
                  </div>
                )}
              </div>

              {/* Administrator Audit Remarks */}
              <div className="detail-item" style={{ marginBottom: "1rem" }}>
                <div className="detail-label">Administrator Audit Remarks (Visible to Company)</div>
                <textarea
                  className="admin-case-notes"
                  rows={3}
                  placeholder="Record verification notes (e.g., Certificate verified against MCA registry. Approved for hiring)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0.5rem 0" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Current Status:{" "}
                  <span className={`badge ${getBadgeClass(selectedCompany.verificationStatus)}`}>
                    {selectedCompany.verificationStatus}
                  </span>
                </span>
                {selectedCompany.verifiedAt && (
                  <span style={{ fontSize: "0.8rem", color: "var(--primary-accent)", fontStyle: "italic" }}>
                    Verified On: {new Date(selectedCompany.verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Moderation Actions Footer (Matches FraudReports Modal Footer) */}
            <div className="fraud-modal-footer">
              <button
                type="button"
                className="btn-modal-subtle"
                disabled={actionLoading}
                onClick={() => setSelectedCompany(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-warn"
                disabled={actionLoading}
                onClick={() => handleVerify("Pending")}
              >
                <FaClock /> Mark Pending
              </button>
              <button
                type="button"
                className="btn-modal-blacklist"
                disabled={actionLoading}
                onClick={() => handleVerify("Rejected")}
              >
                <FaTimesCircle /> Reject Company
              </button>
              <button
                type="button"
                className="btn-modal-review"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  borderColor: "#10b981",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                }}
                disabled={actionLoading}
                onClick={() => handleVerify("Approved")}
              >
                <FaCheckCircle /> Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyVerifications;
