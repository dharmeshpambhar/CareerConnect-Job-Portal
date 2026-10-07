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
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaStickyNote,
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
      case "Approved": return "active";
      case "Rejected": return "blacklisted";
      default: return "pending";
    }
  };

  return (
    <div>
      {/* Header */}
      <h1 className="page-title">Company Verifications</h1>
      <p className="page-subtitle">
        Audit employer registration certificates and authenticate official company accounts to protect job seekers.
      </p>

      {/* Stats Cards */}
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
                          <span style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.85rem" }}>{c.email}</span>
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

      {/* ── Premium Verification Audit Modal ── */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "660px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-title-icon">
                  <FaShieldAlt />
                </span>
                Company Verification Audit
              </div>
              <button onClick={() => setSelectedCompany(null)} className="btn-close" title="Close">
                <RxCross2 />
              </button>
            </div>

            {/* Company hero identity card */}
            <div style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1.15rem 1.75rem",
              background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))",
              borderBottom: "1px solid rgba(99,102,241,0.08)"
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", flexShrink: 0,
                border: "1px solid rgba(99,102,241,0.15)"
              }}>
                🏢
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>
                  {selectedCompany.companyName}
                  {selectedCompany.isVerified && (
                    <span style={{ marginLeft: 8, color: "#10b981", fontSize: "0.85rem" }}>✓ Verified</span>
                  )}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Recruiter: {selectedCompany.name} · {selectedCompany.email}
                </div>
              </div>
              <span className={`badge ${getBadgeClass(selectedCompany.verificationStatus)}`} style={{ margin: 0, flexShrink: 0 }}>
                {selectedCompany.verificationStatus}
              </span>
            </div>

            {/* Scrollable body */}
            <div className="modal-scroll" style={{ padding: "1.5rem 1.75rem" }}>

              {/* Company & Registration Details */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaBuilding /> Company & Registration
                </div>
                <div className="modal-info-grid">
                  <div className="info-chip">
                    <span className="info-chip-label"><FaBuilding style={{ display: "inline", marginRight: 3 }} />Company Name</span>
                    <span className="info-chip-value">{selectedCompany.companyName}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2 }}>
                      Recruiter: {selectedCompany.name}
                    </span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaIdCard style={{ display: "inline", marginRight: 3 }} />Govt Registration / CIN</span>
                    <span className="info-chip-value mono">
                      {selectedCompany.companyRegistrationNumber || "Not Provided"}
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {selectedCompany.email}
                    </span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaPhone style={{ display: "inline", marginRight: 3 }} />Phone & Contact</span>
                    <span className="info-chip-value">📞 {selectedCompany.phone || "N/A"}</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label"><FaGlobe style={{ display: "inline", marginRight: 3 }} />Website / Location</span>
                    <span className="info-chip-value">
                      {selectedCompany.website ? (
                        <a
                          href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--primary-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          <FaGlobe style={{ fontSize: "0.8rem" }} /> {selectedCompany.website}
                        </a>
                      ) : selectedCompany.location ? (
                        <span><FaMapMarkerAlt style={{ color: "var(--text-muted)", marginRight: 4 }} />{selectedCompany.location}</span>
                      ) : (
                        <span className="info-chip-value muted">N/A</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Document */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaFileAlt /> Submitted Company Certificate / License
                </div>
                {selectedCompany.companyCertificate && selectedCompany.companyCertificate.url ? (
                  <>
                    <div className="cv-card" style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.04)" }}>
                      <div className="cv-card-icon" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))", fontSize: "1.6rem" }}>
                        📜
                      </div>
                      <div className="cv-card-info">
                        <div className="cv-card-title">
                          {selectedCompany.companyCertificate.fileName || "Registration Certificate"}
                        </div>
                        <div className="cv-card-subtitle">Business License / Govt Registration Document</div>
                      </div>
                      <a
                        href={selectedCompany.companyCertificate.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cv-card-btn"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
                      >
                        <FaExternalLinkAlt style={{ fontSize: "0.7rem" }} /> View
                      </a>
                    </div>
                    {selectedCompany.companyCertificate.url.match(/\.(jpeg|jpg|png|webp)/i) && (
                      <div className="evidence-modal-thumb" style={{ marginTop: "0.75rem" }}>
                        <img src={selectedCompany.companyCertificate.url} alt="Registration Certificate" />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: "1rem", borderRadius: 10,
                    background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)",
                    fontSize: "0.86rem", color: "#b91c1c", display: "flex", alignItems: "center", gap: 8
                  }}>
                    ⚠️ No certificate document was attached during registration.
                  </div>
                )}
              </div>

              {/* Admin Remarks */}
              <div className="modal-section">
                <div className="modal-section-title">
                  <FaStickyNote /> Administrator Audit Remarks
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.7rem", marginLeft: 4 }}>(visible to company)</span>
                </div>
                <textarea
                  className="admin-case-notes"
                  rows={3}
                  placeholder="Record verification notes (e.g., Certificate verified against MCA registry. Approved for hiring)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                {selectedCompany.verifiedAt && (
                  <div style={{ fontSize: "0.78rem", color: "var(--primary-accent)", marginTop: 6, fontStyle: "italic" }}>
                    Last verified: {new Date(selectedCompany.verifiedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Moderation Actions Footer */}
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
                <FaTimesCircle /> Reject
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
