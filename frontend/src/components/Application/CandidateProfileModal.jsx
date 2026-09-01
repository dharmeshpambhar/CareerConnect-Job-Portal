import React, { useState, useEffect } from "react";
import {
  HiX,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineCode,
  HiOutlineFolder,
  HiOutlineUser,
  HiOutlineExternalLink,
  HiOutlineSparkles,
} from "react-icons/hi";
import { FiCheck, FiX } from "react-icons/fi";
import { fetchJobseekerProfileByUserId } from "../../apiService";

const CandidateProfileModal = ({ application, onClose, onStatusChange, updatingId, openResumeModal }) => {
  if (!application) return null;

  const applicantUserId = application.applicantID?.user;
  const [dbCandidateProfile, setDbCandidateProfile] = useState(null);

  useEffect(() => {
    if (applicantUserId) {
      fetchJobseekerProfileByUserId(applicantUserId)
        .then(({ profile }) => {
          if (profile) setDbCandidateProfile(profile);
        })
        .catch((err) => console.log("Profile fetch note:", err));
    }
  }, [applicantUserId]);

  // Retrieve candidate profile from localStorage or MongoDB Atlas Collection
  let candidateData = dbCandidateProfile;

  if (!candidateData && applicantUserId) {
    const saved = localStorage.getItem(`jobseeker_profile_${applicantUserId}`);
    if (saved) {
      try {
        candidateData = JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing candidate saved data", e);
      }
    }
  }

  // Fallback defaults if candidate profile not saved in localStorage
  const keySkills = candidateData?.keySkills || ["React.js", "JavaScript", "Node.js", "SQL", "Python", "HTML", "CSS"];
  const educationList = candidateData?.educationList || [
    {
      degree: "Masters/Post-Graduation",
      institute: "National Institute of Technology",
      course: "MCA",
      specialization: "Computer Science & Artificial Intelligence",
      courseType: "Full time",
      startYear: "2022",
      endYear: "2026",
      gradingSystem: "Scale 10 Grading System",
      grade: "8.5 CGPA",
    },
  ];
  const itSkillsList = candidateData?.itSkillsList || [
    {
      name: "React.js",
      version: "18.2",
      lastUsed: "2026",
      expYears: "2",
      expMonths: "6",
    },
    {
      name: "Node.js",
      version: "20.0",
      lastUsed: "2026",
      expYears: "2",
      expMonths: "0",
    },
  ];
  const projectsList = candidateData?.projectsList || [
    {
      title: "React Job Portal System",
      client: "Academic Project",
      status: "Finished",
      year: "2026",
      month: "August",
      details:
        "Designed and implemented full-stack job application workflow, candidate search filtering, and employer applicant management panel.",
    },
  ];
  const profileSummary =
    candidateData?.profileSummary ||
    "Motivated MCA candidate with strong problem-solving skills, modern React frontend architecture expertise, and backend RESTful API integration experience.";
  
  const personalDetails = candidateData?.personalDetails || {
    dob: "15 May 2001",
    gender: "Male",
    maritalStatus: "Single",
    category: "General",
    languages: "English, Hindi, Gujarati",
    workPermit: "Have INDIA work permit",
    address: application.address || "Ahmedabad, Gujarat, INDIA",
  };

  // ── Two Distinct Resumes ───────────────────────────────────────────────────
  // 1. Main Priority Profile Resume (attached in Jobseeker Profile account)
  const profileResume = candidateData?.resume || dbCandidateProfile?.resume || application.applicantProfileResume || null;
  const profileResumeUrl = profileResume?.url || null;
  const profileResumeName = profileResume?.name || `${application.name}_Profile_Resume.pdf`;

  // 2. Specific Job Application Resume (attached when submitting this specific job application)
  const applicationResumeUrl = application.resume?.url || null;
  const applicationResumeName = application.resume?.name || `${application.name}_Job_Application_Resume`;
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="candidate-modal-overlay" onClick={onClose}>
      <div className="candidate-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="candidate-modal-header">
          <div className="candidate-header-title">
            <span className="candidate-badge">JOBSEEKER FULL PROFILE</span>
            <h2>{application.name}</h2>
          </div>
          <button className="candidate-close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="candidate-modal-body">
          {/* Top Banner Card */}
          <div className="candidate-top-card">
            <div className="candidate-avatar" style={{ overflow: "hidden" }}>
              {(candidateData?.profilePicture?.url || application.applicantProfilePicture) ? (
                <img
                  src={candidateData?.profilePicture?.url || application.applicantProfilePicture}
                  alt={application.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (application.name || "C").charAt(0).toUpperCase()
              )}
            </div>
            <div className="candidate-top-info">
              <h3>{application.name}</h3>
              <p className="candidate-subtext">
                Applied for: <strong>{application.jobTitle || (typeof application.jobId === "object" ? application.jobId?.title : null) || "Job Position"}</strong>
                {(application.jobCategory || (typeof application.jobId === "object" ? application.jobId?.category : null)) && (
                  <span style={{ color: "#6366f1", fontWeight: "600", marginLeft: "6px" }}>
                    • {application.jobCategory || application.jobId?.category}
                  </span>
                )}
              </p>

              <div className="candidate-contact-grid">
                <div className="contact-item">
                  <HiOutlineMail className="icon" />
                  <span>{application.email}</span>
                  <HiOutlineCheckCircle className="check" />
                </div>
                <div className="contact-item">
                  <HiOutlinePhone className="icon" />
                  <span>{application.phone}</span>
                  <HiOutlineCheckCircle className="check" />
                </div>
                <div className="contact-item">
                  <HiOutlineLocationMarker className="icon" />
                  <span>{application.address || "Ahmedabad, INDIA"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Candidate Resumes Comparison Section ── */}
          <div className="candidate-section-box resume-comparison-section">
            <h4 className="section-title">
              <HiOutlineDocumentText /> Candidate Resumes (Profile vs Job Application)
            </h4>
            <div className="resumes-comparison-grid">
              {/* Option 1: Profile Attached Resume (Main Priority Resume) */}
              <div className="resume-dual-card primary-resume-card">
                <div className="resume-dual-card-header">
                  <span className="resume-source-badge profile-badge">
                    <HiOutlineSparkles /> Main Profile Resume
                  </span>
                  <span className="resume-badge-sub">Priority Resume from Jobseeker Profile</span>
                </div>
                <div className="resume-dual-card-body">
                  <p className="resume-name-text">
                    📄 {profileResumeName}
                  </p>
                  {profileResume?.uploadedAt && (
                    <span className="resume-meta-date">
                      Uploaded on: {new Date(profileResume.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  {profileResumeUrl ? (
                    <div className="resume-card-actions">
                      <button
                        type="button"
                        className="btn-view-profile-resume"
                        onClick={() => openResumeModal(profileResumeUrl, `${application.name} - Profile Resume (Main)`)}
                      >
                        ⭐ View Profile Resume
                      </button>
                      <a
                        href={profileResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-resume-open-tab"
                        title="Open in new tab"
                      >
                        <HiOutlineExternalLink /> Open
                      </a>
                    </div>
                  ) : (
                    <p className="resume-empty-note">
                      No resume uploaded to profile. (Application resume available below)
                    </p>
                  )}
                </div>
              </div>

              {/* Option 2: Application Specific Resume (Attached during Apply) */}
              <div className="resume-dual-card application-resume-card">
                <div className="resume-dual-card-header">
                  <span className="resume-source-badge job-badge">
                    <HiOutlineBriefcase /> Job Application Resume
                  </span>
                  <span className="resume-badge-sub">Specific Resume Submitted for this Job</span>
                </div>
                <div className="resume-dual-card-body">
                  <p className="resume-name-text">
                    📄 {applicationResumeName}
                  </p>
                  {application.createdAt && (
                    <span className="resume-meta-date">
                      Submitted on: {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {applicationResumeUrl ? (
                    <div className="resume-card-actions">
                      <button
                        type="button"
                        className="btn-view-job-resume"
                        onClick={() => openResumeModal(applicationResumeUrl, `${application.name} - Job Application Resume`)}
                      >
                        📋 View Job Resume
                      </button>
                      <a
                        href={applicationResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-resume-open-tab"
                        title="Open in new tab"
                      >
                        <HiOutlineExternalLink /> Open
                      </a>
                    </div>
                  ) : (
                    <p className="resume-empty-note">
                      No separate application resume found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Cover Letter */}
          {application.coverLetter && (
            <div className="candidate-section-box">
              <h4 className="section-title">
                <HiOutlineDocumentText /> Cover Letter / Application Message
              </h4>
              <p className="cover-letter-text">{application.coverLetter}</p>
            </div>
          )}

          {/* Profile Summary */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineUser /> Profile Summary
            </h4>
            <p className="summary-text">{profileSummary}</p>
          </div>

          {/* Key Skills */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineCode /> Key Skills
            </h4>
            <div className="skills-badge-wrap">
              {keySkills.map((skill, idx) => (
                <span key={idx} className="candidate-skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education Details */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineAcademicCap /> Educational Background
            </h4>
            {educationList.map((edu, idx) => (
              <div key={idx} className="candidate-detail-item">
                <div className="item-main-header">
                  <h5>{edu.degree} {edu.course && `— ${edu.course}`}</h5>
                  <span className="edu-year">{edu.startYear} - {edu.endYear}</span>
                </div>
                <p className="inst-name">🏛️ {edu.institute}</p>
                <p className="meta-text">
                  Specialization: {edu.specialization} • Course Type: {edu.courseType} {edu.grade && `• Grade: ${edu.grade}`}
                </p>
              </div>
            ))}
          </div>

          {/* IT Skills Details */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineCode /> IT & Software Skills
            </h4>
            <div className="it-skills-grid">
              {itSkillsList.map((it, idx) => (
                <div key={idx} className="it-skill-card">
                  <span className="skill-title">{it.name}</span>
                  <span className="skill-detail">Ver: {it.version || "Latest"}</span>
                  <span className="skill-detail">Exp: {it.expYears} yrs {it.expMonths} mos</span>
                  <span className="skill-detail">Last Used: {it.lastUsed}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Projects Details */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineFolder /> Projects & Portfolio
            </h4>
            {projectsList.map((proj, idx) => (
              <div key={idx} className="candidate-detail-item">
                <div className="item-main-header">
                  <h5>{proj.title}</h5>
                  <span className="proj-status-badge">{proj.status}</span>
                </div>
                <p className="inst-name">Client: {proj.client}</p>
                <p className="meta-text">Worked: {proj.month} {proj.year}</p>
                {proj.details && <p className="proj-desc">{proj.details}</p>}
              </div>
            ))}
          </div>

          {/* Personal Details */}
          <div className="candidate-section-box">
            <h4 className="section-title">
              <HiOutlineUser /> Personal Details
            </h4>
            <div className="personal-info-grid">
              <div className="info-cell">
                <span className="cell-label">Gender & Marital Status</span>
                <span className="cell-value">{personalDetails.gender || "Male"}, {personalDetails.maritalStatus || "Single"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Date of Birth</span>
                <span className="cell-value">{personalDetails.dob || "15 May 2001"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Work Permit</span>
                <span className="cell-value">{personalDetails.workPermit || "Have INDIA work permit"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Category</span>
                <span className="cell-value">{personalDetails.category || "General"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Languages</span>
                <span className="cell-value">{personalDetails.languages || "English, Hindi, Gujarati"}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Permanent Address</span>
                <span className="cell-value">{personalDetails.address || application.address || "Ahmedabad, Gujarat, INDIA"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="candidate-modal-footer">
          <div className="footer-resume-actions">
            {profileResumeUrl ? (
              <button
                className="modal-footer-btn view-resume primary-profile-resume-btn"
                onClick={() => openResumeModal(profileResumeUrl, `${application.name} - Profile Resume (Main)`)}
                title="View Main Profile Resume (Primary)"
              >
                ⭐ View Profile Resume
              </button>
            ) : (
              applicationResumeUrl && (
                <button
                  className="modal-footer-btn view-resume primary-profile-resume-btn"
                  onClick={() => openResumeModal(applicationResumeUrl, `${application.name} - Application Resume`)}
                  title="View Submitted Resume"
                >
                  📄 View Resume
                </button>
              )
            )}

            {applicationResumeUrl && profileResumeUrl && applicationResumeUrl !== profileResumeUrl && (
              <button
                className="modal-footer-btn view-resume secondary-job-resume-btn"
                onClick={() => openResumeModal(applicationResumeUrl, `${application.name} - Job Application Resume`)}
                title="View specific resume submitted when applying for this job"
              >
                📋 View Job Resume
              </button>
            )}
          </div>

          <div className="footer-status-actions">
            {application.status !== "Accepted" && (
              <button
                className="modal-footer-btn accept"
                onClick={() => {
                  onStatusChange(application._id, "Accepted");
                  onClose();
                }}
                disabled={updatingId === application._id}
              >
                <FiCheck /> Accept Applicant
              </button>
            )}
            {application.status !== "Rejected" && (
              <button
                className="modal-footer-btn reject"
                onClick={() => {
                  onStatusChange(application._id, "Rejected");
                  onClose();
                }}
                disabled={updatingId === application._id}
              >
                <FiX /> Reject Applicant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfileModal;
