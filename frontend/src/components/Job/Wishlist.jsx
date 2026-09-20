import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import { FaHeart, FaTimes } from "react-icons/fa";
import { fetchWishlist, fetchAllJobs, toggleWishlist } from "../../apiService";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [jobsMap, setJobsMap] = useState(new Map());
  const { isAuthorized, user, setUser, isLoading } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthorized) {
      Promise.all([fetchWishlist(), fetchAllJobs()]).then(
        ([{ wishlist: data }, { jobs: allJobs }]) => {
          setWishlist(data || []);
          if (allJobs && allJobs.length > 0) {
            const map = new Map(allJobs.map((j) => [j._id?.toString(), j]));
            setJobsMap(map);
          }
        }
      );
    }
  }, [isAuthorized]);

  const handleRemoveFromWishlist = async (jobId) => {
    try {
      await toggleWishlist(jobId);
      toast.success("Job removed from wishlist!");
      // Filter by the job's _id inside each item
      setWishlist((prev) => prev.filter((item) => item.job?._id !== jobId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="wl-loading">
        <div className="wl-loading-spinner"></div>
        <p>Loading your saved jobs...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  if (user && user.role !== "Job Seeker") {
    return <Navigate to="/" />;
  }

  return (
    <section className="wl-page">
      <div className="wl-container">
        {/* Header */}
        <div className="wl-header">
          <h1 className="wl-title">
            <FaHeart className="wl-title-icon" />
            My Bookmarked Jobs
          </h1>
          <p className="wl-subtitle">
            Keep track of positions you have saved for future application reviews.
          </p>
        </div>

        {/* Job List */}
        {wishlist.length === 0 ? (
          <div className="wl-empty">
            <FaHeart className="wl-empty-icon" />
            <h3>No saved jobs yet</h3>
            <p>Explore jobs and bookmark the ones you like!</p>
            <Link to="/job/getall" className="wl-browse-btn">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="wl-list">
            {wishlist.map((item) => {
              const rawJob = item.job || {};
              const catalogJob = jobsMap.get(rawJob._id?.toString()) || {};
              const job = { ...catalogJob, ...rawJob };

              const comName =
                job.postedBy?.companyName ||
                catalogJob.postedBy?.companyName ||
                job.postedBy?.company?.name ||
                catalogJob.postedBy?.company?.name ||
                job.postedBy?.name ||
                catalogJob.postedBy?.name ||
                item.jobDetails?.companyName ||
                "Verified Employer";

              const profilePic =
                job.postedBy?.profilePicture?.url ||
                catalogJob.postedBy?.profilePicture?.url ||
                job.postedBy?.company?.profilePicture?.url ||
                catalogJob.postedBy?.company?.profilePicture?.url ||
                null;

              const initial = comName
                ? comName.charAt(0).toUpperCase()
                : (job.title ? job.title.charAt(0).toUpperCase() : "C");

              const employerId = job.postedBy?._id || catalogJob.postedBy?._id || null;

              return (
              <div
                className="wl-card"
                key={item._id}
                onClick={() => navigate(`/job/${job._id}`)}
                style={{ cursor: "pointer" }}
                title={`Click anywhere to view ${job.title} details`}
              >
                {/* Left: Avatar + Info */}
                <div className="wl-card-left">
                  <div
                    className="wl-job-avatar"
                    style={profilePic ? { background: "#ffffff", border: "1px solid #e2e8f0" } : {}}
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt={comName}
                        className="wl-job-avatar-img"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="wl-job-info">
                    <h3 className="wl-job-title">
                      {job.title}
                    </h3>
                    <p className="wl-job-meta">
                      {employerId ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/company/view/${employerId}`);
                          }}
                          style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                          className="wl-company-link"
                          title="Click to view company profile"
                        >
                          {comName}
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{comName}</span>
                      )}
                      {" • "}{job.city || job.country || "Location"}
                    </p>
                  </div>
                </div>

                {/* Right: Salary + Type + Unsave */}
                <div className="wl-card-right">
                  <div className="wl-job-details">
                    {job.fixedSalary ? (
                      <span className="wl-salary">₹{job.fixedSalary.toLocaleString("en-IN")}</span>
                    ) : job.salaryFrom ? (
                      <span className="wl-salary">
                        ₹{job.salaryFrom.toLocaleString("en-IN")} – ₹{job.salaryTo?.toLocaleString("en-IN")}
                      </span>
                    ) : null}
                    <span className="wl-job-type">{job.jobType || "Full-Time"}</span>
                  </div>
                  <button
                    className="wl-unsave-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFromWishlist(job._id);
                    }}
                    title="Remove from saved"
                  >
                    <FaTimes className="wl-unsave-icon" />
                    Unsave
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Wishlist;
