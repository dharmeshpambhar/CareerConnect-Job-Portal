import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import toast from "react-hot-toast";
import { useNavigate, Navigate, Link } from "react-router-dom";
import ResumeModal from "./ResumeModal";
import CandidateProfileModal from "./CandidateProfileModal";
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineBookmark,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineUser,
} from "react-icons/hi";
import { FiCheck, FiX, FiUserCheck } from "react-icons/fi";
import {
  fetchApplications,
  deleteApplication,
  fetchWishlist,
  updateApplicationStatus,
} from "../../apiService";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");
  const [resumeTitle, setResumeTitle] = useState("Resume");
  const [wishlist, setWishlist] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);

  const { isAuthorized, user, isLoading } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    if (!isAuthorized || !user?.role) return;
    fetchApplications(user.role).then(({ applications: data }) => {
      setApplications(data || []);
    });
  }, [isAuthorized, user]);

  // Fetch wishlist for bookmark count (job seekers only)
  useEffect(() => {
    if (!isAuthorized || !user || user.role !== "Job Seeker") return;
    fetchWishlist().then(({ wishlist: data }) => {
      setWishlist(data || []);
    });
  }, [isAuthorized, user]);

  if (isLoading) {
    return (
      <div className="appDash-loading">
        <div className="appDash-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  const handleDeleteApplication = async (id) => {
    const { message, offline } = await deleteApplication(id);
    if (offline) {
      toast.error("Cannot delete in offline demo mode.");
    } else {
      toast.success(message);
      setApplications((prev) => prev.filter((app) => app._id !== id));
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    const { message, application, offline } = await updateApplicationStatus(id, status);
    setUpdatingId(null);
    if (offline) {
      toast.error(message);
    } else {
      toast.success(message);
      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app._id === id ? { ...app, status: application.status } : app
        )
      );
    }
  };

  const openModal = (imageUrl, title = "Resume Document") => {
    setResumeImageUrl(imageUrl);
    setResumeTitle(title);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const isEmployer = user?.role === "Employer";

  // ── Stats derivations ──
  const totalCount = applications.length;
  const acceptedCount = applications.filter(
    (app) => app.status === "Accepted"
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "Rejected"
  ).length;
  const pendingCount = applications.filter(
    (app) => !app.status || app.status === "Pending"
  ).length;

  // Status badge renderer
  const renderStatusBadge = (status) => {
    const s = status || "Pending";
    if (s === "Accepted")
      return (
        <span className="appDash-status-badge appDash-status-badge--accepted">
          <HiOutlineCheckCircle /> Accepted
        </span>
      );
    if (s === "Rejected")
      return (
        <span className="appDash-status-badge appDash-status-badge--rejected">
          <HiOutlineXCircle /> Rejected
        </span>
      );
    return (
      <span className="appDash-status-badge appDash-status-badge--pending">
        <HiOutlineClock /> Pending
      </span>
    );
  };

  return (
    <section className="appDash-page">
      <div className="appDash-container">
        {/* ── Header ── */}
        <div className="appDash-header">
          <div className="appDash-header-text">
            <h1 className="appDash-title">
              {isEmployer ? "Applications Received" : "Applicant Dashboard"}
            </h1>
            <p className="appDash-subtitle">
              Welcome back, <strong>{user?.name || "User"}</strong>.{" "}
              {isEmployer
                ? "Review applicants and update their status below."
                : "Monitor your submissions and track progress."}
            </p>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="appDash-stats-grid">
          <div className="appDash-stat-card">
            <div className="appDash-stat-icon appDash-stat-icon--blue">
              <HiOutlineClipboardList />
            </div>
            <div className="appDash-stat-info">
              <span className="appDash-stat-label">
                {isEmployer ? "TOTAL APPLICANTS" : "TOTAL APPLIED"}
              </span>
              <span className="appDash-stat-value">{totalCount}</span>
            </div>
          </div>

          <div className="appDash-stat-card">
            <div className="appDash-stat-icon appDash-stat-icon--green">
              <HiOutlineCheckCircle />
            </div>
            <div className="appDash-stat-info">
              <span className="appDash-stat-label">
                {isEmployer ? "ACCEPTED" : "ACCEPTED OFFERS"}
              </span>
              <span className="appDash-stat-value">{acceptedCount}</span>
            </div>
          </div>

          <div className="appDash-stat-card">
            <div className="appDash-stat-icon appDash-stat-icon--red">
              {isEmployer ? <HiOutlineClock /> : <HiOutlineBookmark />}
            </div>
            <div className="appDash-stat-info">
              <span className="appDash-stat-label">
                {isEmployer ? "PENDING REVIEW" : "BOOKMARKS"}
              </span>
              <span className="appDash-stat-value">
                {isEmployer
                  ? pendingCount
                  : `${user?.wishlist?.length || wishlist.length} Saved`}
              </span>
            </div>
          </div>
        </div>

        {/* ── Applications Panel ── */}
        <div className="appDash-submissions-panel">
          <h2 className="appDash-section-title">
            {isEmployer ? "All Applications" : "My Submissions"}
          </h2>

          {applications.length === 0 ? (
            <div className="appDash-empty-state">
              <HiOutlineClipboardList className="appDash-empty-icon" />
              <p>
                {isEmployer
                  ? "No applications received yet."
                  : "No Applications Found"}
              </p>
              {!isEmployer && (
                <a href="/job/getall" className="appDash-empty-link">
                  Browse Jobs <HiOutlineArrowRight />
                </a>
              )}
            </div>
          ) : (
            <div className="appDash-submissions-list">
              {applications.map((element) => (
                <div className="appDash-submission-card" key={element._id}>
                  {/* Left — avatar + info */}
                  <div className="appDash-submission-left">
                    <div className="appDash-submission-avatar" style={{ overflow: "hidden" }}>
                      {isEmployer ? (
                        element.applicantProfilePicture ? (
                          <img
                            src={element.applicantProfilePicture}
                            alt={element.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (element.name || "A").charAt(0).toUpperCase()
                        )
                      ) : (
                        element.companyProfilePicture ? (
                          <img
                            src={element.companyProfilePicture}
                            alt={element.companyName || "Company"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          (element.companyName || element.name || "C").charAt(0).toUpperCase()
                        )
                      )}
                    </div>
                    <div className="appDash-submission-info">
                      <h3 className="appDash-submission-name">
                        {element.name}
                      </h3>

                      {/* Job Role Applied For — shown clearly to both Employer and Job Seeker */}
                      <div className="appDash-submission-jobtag">
                        <HiOutlineBriefcase />
                        <span>Applied for: </span>
                        {element.jobId ? (
                          <Link
                            to={`/job/${typeof element.jobId === "object" ? element.jobId._id : element.jobId}`}
                            className="appDash-jobtag-link"
                            title="View Job Details"
                          >
                            {element.jobTitle || (typeof element.jobId === "object" ? element.jobId.title : null) || "Job Position"}
                          </Link>
                        ) : (
                          <strong className="appDash-jobtag-link">
                            {element.jobTitle || "Job Position"}
                          </strong>
                        )}
                        {(element.jobCategory || (typeof element.jobId === "object" ? element.jobId.category : null)) && (
                          <span className="appDash-jobtag-cat">
                            {element.jobCategory || element.jobId.category}
                          </span>
                        )}
                        {!isEmployer && element.companyName && (
                          <span className="appDash-jobtag-company">
                            at {element.companyName}
                          </span>
                        )}
                      </div>

                      <p className="appDash-submission-email">
                        {element.email}
                      </p>
                      <p className="appDash-submission-date">
                        📞 {element.phone}
                        {element.address && ` · ${element.address}`}
                      </p>
                      {element.coverLetter && (
                        <p className="appDash-submission-cover">
                          {element.coverLetter.length > 120
                            ? `${element.coverLetter.substring(0, 120)}…`
                            : element.coverLetter}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right — status + actions */}
                  <div className="appDash-submission-right">
                    {/* Status badge */}
                    {renderStatusBadge(element.status)}

                    <div className="appDash-submission-actions">
                      {/* Employer View Candidate Full Profile */}
                      {isEmployer && (
                        <button
                          className="appDash-action-btn appDash-action-btn--profile"
                          onClick={() => setSelectedCandidateApp(element)}
                          title="View Candidate Full Profile"
                        >
                          <HiOutlineUser /> View Candidate Profile
                        </button>
                      )}

                      {/* Specific Job Application Resume */}
                      {element.resume && element.resume.url && (
                        <button
                          className="appDash-action-btn appDash-action-btn--view"
                          onClick={() =>
                            openModal(
                              element.resume.url,
                              `${element.name} - Specific Job Application Resume`
                            )
                          }
                          title="View Specific Resume submitted for this job application"
                        >
                          <HiOutlineEye /> Specific Resume
                        </button>
                      )}

                      {/* ── EMPLOYER: Accept / Reject ── */}
                      {isEmployer && (
                        <>
                          {element.status !== "Accepted" && (
                            <button
                              className="appDash-action-btn appDash-action-btn--accept"
                              onClick={() =>
                                handleStatusChange(element._id, "Accepted")
                              }
                              disabled={updatingId === element._id}
                              title="Accept Application"
                            >
                              <FiCheck />
                              {updatingId === element._id ? "..." : "Accept"}
                            </button>
                          )}
                          {element.status !== "Rejected" && (
                            <button
                              className="appDash-action-btn appDash-action-btn--reject"
                              onClick={() =>
                                handleStatusChange(element._id, "Rejected")
                              }
                              disabled={updatingId === element._id}
                              title="Reject Application"
                            >
                              <FiX />
                              {updatingId === element._id ? "..." : "Reject"}
                            </button>
                          )}
                        </>
                      )}

                      {/* ── JOB SEEKER: Delete ── */}
                      {!isEmployer && (
                        <button
                          className="appDash-action-btn appDash-action-btn--delete"
                          onClick={() =>
                            handleDeleteApplication(element._id)
                          }
                          title="Withdraw Application"
                        >
                          <HiOutlineTrash /> Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ResumeModal
          imageUrl={resumeImageUrl}
          title={resumeTitle}
          onClose={closeModal}
        />
      )}

      {selectedCandidateApp && (
        <CandidateProfileModal
          application={selectedCandidateApp}
          onClose={() => setSelectedCandidateApp(null)}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
          openResumeModal={openModal}
        />
      )}
    </section>
  );
};

export default MyApplications;
