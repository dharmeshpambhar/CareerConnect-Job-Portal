import React from "react";
import { HiX, HiOutlineExternalLink, HiOutlineDownload, HiOutlineDocumentText } from "react-icons/hi";

const ResumeModal = ({ imageUrl, title = "Resume Document", onClose }) => {
  if (!imageUrl) return null;

  const isPdf =
    typeof imageUrl === "string" &&
    (imageUrl.toLowerCase().endsWith(".pdf") ||
      imageUrl.toLowerCase().includes("/raw/") ||
      imageUrl.toLowerCase().includes("pdf"));

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
