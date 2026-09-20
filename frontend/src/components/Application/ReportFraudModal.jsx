import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineShieldExclamation,
  HiOutlineExclamationCircle,
  HiOutlinePaperClip,
  HiOutlineX,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { FiAlertTriangle, FiUploadCloud } from "react-icons/fi";
import { submitFraudReport } from "../../apiService";

const FRAUD_CATEGORIES = [
  {
    id: "fees",
    label: "Asking for Money, Security Deposit, or Training Fees",
    description: "Employer demands payment before joining, laptop deposit, or registration charges.",
  },
  {
    id: "fake_offer",
    label: "Fake Offer Letter or Ghost / Non-Existent Company",
    description: "The company identity is fictitious, or the job position differs completely from listing.",
  },
  {
    id: "bank_phishing",
    label: "Phishing for Bank Details, UPI PINs, or OTPs",
    description: "Demanded personal financial credentials, passwords, or unauthorized identity documents.",
  },
  {
    id: "unpaid_labor",
    label: "Unpaid Work or Exploitative Demands",
    description: "Requested substantial unpaid assignments or ghosted after receiving work output.",
  },
  {
    id: "harassment",
    label: "Harassment or Inappropriate / Unethical Conduct",
    description: "Threatening, abusive, or discriminatory communications from the recruiter or employer.",
  },
  {
    id: "other",
    label: "Other Fraudulent or Suspicious Activity",
    description: "Any other suspicious behavior violating fair employment standards.",
  },
];

const ReportFraudModal = ({ application, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState(FRAUD_CATEGORIES[0].label);
  const [details, setDetails] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const jobTitle =
    application.jobTitle ||
    (typeof application.jobId === "object" ? application.jobId.title : null) ||
    "Job Position";
  const companyName = application.companyName || "Employer";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB.");
        return;
      }
      setEvidenceFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 15) {
      toast.error("Please provide a detailed description (at least 15 characters).");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("applicationId", application._id);
    formData.append("reason", selectedReason);
    formData.append("details", details.trim());
    if (evidenceFile) {
      formData.append("evidence", evidenceFile);
    }

    const { success, message, report } = await submitFraudReport(formData);
    setSubmitting(false);

    if (success) {
      toast.success(message || "Fraud report submitted. Our moderation team is investigating.");
      if (onSuccess) onSuccess(report);
      onClose();
    } else {
      toast.error(message || "Failed to submit fraud report.");
    }
  };

  return (
    <div className="report-fraud-modal-overlay" onClick={onClose}>
      <div
        className="report-fraud-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="report-fraud-modal-header">
          <div className="report-fraud-modal-title-group">
            <div className="report-fraud-icon-wrap">
              <HiOutlineShieldExclamation />
            </div>
            <div>
              <h3>Report Company / Fraudulent Activity</h3>
              <p>
                Dispute for <strong>{jobTitle}</strong> at <strong>{companyName}</strong>
              </p>
            </div>
          </div>
          <button
            className="report-fraud-close-btn"
            onClick={onClose}
            title="Close"
          >
            <HiOutlineX />
          </button>
        </div>

        {/* Safety Advisory Banner */}
        <div className="report-fraud-advisory">
          <FiAlertTriangle className="report-fraud-advisory-icon" />
          <div className="report-fraud-advisory-text">
            <strong>Candidate Safety Advisory:</strong> Real employers will NEVER ask you to
            transfer money for training, laptop security, or interviews. Reporting malicious employers
            protects you and all other job seekers on the platform.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="report-fraud-form">
          {/* Reason Selection */}
          <div className="report-fraud-field">
            <label className="report-fraud-label">
              Fraud Category <span className="req">*</span>
            </label>
            <select
              className="report-fraud-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {FRAUD_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Details */}
          <div className="report-fraud-field">
            <label className="report-fraud-label">
              Incident Explanation & Details <span className="req">*</span>
            </label>
            <textarea
              className="report-fraud-textarea"
              rows={4}
              placeholder="Explain clearly what happened: what payment or personal details did the company demand? Mention dates, phone numbers, or email conversations..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
            <span className="report-fraud-hint">
              Minimum 15 characters. Be as specific as possible to assist the investigation.
            </span>
          </div>

          {/* Evidence Upload */}
          <div className="report-fraud-field">
            <label className="report-fraud-label">
              Attach Evidence / Proof (Optional, Recommended)
            </label>
            <div className="report-fraud-file-drop">
              <input
                type="file"
                id="fraud-evidence-input"
                className="report-fraud-file-input"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="fraud-evidence-input" className="report-fraud-file-label">
                <FiUploadCloud className="report-fraud-upload-icon" />
                {evidenceFile ? (
                  <span className="report-fraud-filename">
                    📄 {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <span>
                    <strong>Click to upload screenshot or PDF</strong> (Chat screenshots, payment demand receipts, offer letter)
                  </span>
                )}
              </label>
              {evidenceFile && (
                <button
                  type="button"
                  className="report-fraud-remove-file"
                  onClick={() => setEvidenceFile(null)}
                >
                  Remove file
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="report-fraud-modal-actions">
            <button
              type="button"
              className="report-fraud-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="report-fraud-btn-submit"
              disabled={submitting}
            >
              <HiOutlineShieldExclamation />
              {submitting ? "Submitting Report..." : "Submit Fraud Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportFraudModal;
