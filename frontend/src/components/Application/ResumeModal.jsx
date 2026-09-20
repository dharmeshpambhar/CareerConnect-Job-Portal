import React from "react";
import { HiX, HiOutlineExternalLink, HiOutlineDownload, HiOutlineDocumentText } from "react-icons/hi";

const ResumeModal = ({ imageUrl, title = "Resume Document", onClose }) => {
  if (!imageUrl) return null;

  const urlLower = typeof imageUrl === "string" ? imageUrl.toLowerCase() : "";
  const isPdf =
    urlLower.endsWith(".pdf") ||
    urlLower.includes("/raw/") ||
    urlLower.includes("pdf");

  const isWord =
    urlLower.endsWith(".doc") ||
    urlLower.endsWith(".docx") ||
    urlLower.includes("msword") ||
    urlLower.includes("wordprocessingml");

  const isText = urlLower.endsWith(".txt") || urlLower.endsWith(".rtf");

  return (
    <div className="resume-modal-overlay" onClick={onClose}>
      <div className="resume-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="resume-modal-header">
          <div className="resume-modal-title-wrap">
            <div className="resume-icon-badge">
              <HiOutlineDocumentText />
            </div>
            <div>
              <span className="resume-type-badge">
                {title.toLowerCase().includes("profile") ? "Candidate Profile Resume" : "Application Specific Resume"}
              </span>
              <h3 className="resume-modal-title">{title}</h3>
            </div>
          </div>
          <div className="resume-modal-actions">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="resume-action-btn external"
              title="Open full resume in new tab"
            >
              <HiOutlineExternalLink /> Open in Tab
            </a>
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="resume-action-btn download"
              title="Download resume file"
            >
              <HiOutlineDownload /> Download
            </a>
            <button className="resume-modal-close" onClick={onClose} title="Close resume view">
              <HiX />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="resume-modal-body">
          {isPdf ? (
            <iframe
              src={imageUrl}
              title={title}
              className="resume-modal-iframe"
            />
          ) : isWord ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "52px", color: "#2563eb", marginBottom: "16px" }}>
                <HiOutlineDocumentText style={{ margin: "0 auto" }} />
              </div>
              <h4 style={{ fontSize: "1.25rem", color: "#1e293b", fontWeight: 700, marginBottom: "8px" }}>
                Microsoft Word Resume Document
              </h4>
              <p style={{ color: "#64748b", maxWidth: "420px", margin: "0 auto 24px", fontSize: "0.95rem" }}>
                This resume is saved in Word format (.doc / .docx). You can preview it in Office Online or download the file directly.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(imageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resume-action-btn external"
                  style={{ padding: "10px 18px", fontSize: "0.95rem" }}
                >
                  <HiOutlineExternalLink /> View in Office Online
                </a>
                <a
                  href={imageUrl}
                  download
                  className="resume-action-btn download"
                  style={{ padding: "10px 18px", fontSize: "0.95rem" }}
                >
                  <HiOutlineDownload /> Download Document
                </a>
              </div>
            </div>
          ) : isText ? (
            <iframe
              src={imageUrl}
              title={title}
              className="resume-modal-iframe"
            />
          ) : (
            <div className="resume-image-container">
              <img src={imageUrl} alt={title} className="resume-modal-img" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
