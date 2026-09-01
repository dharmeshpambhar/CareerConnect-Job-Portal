import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import { FaHeart, FaTimes } from "react-icons/fa";
import { fetchWishlist, toggleWishlist } from "../../apiService";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const { isAuthorized, user, setUser, isLoading } = useContext(Context);

  useEffect(() => {
    if (isAuthorized) {
      fetchWishlist().then(({ wishlist: data }) => {
        setWishlist(data || []);
      });
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
              const job = item.job || {};
              return (
              <div className="wl-card" key={item._id}>
                {/* Left: Avatar + Info */}
                <div className="wl-card-left">
                  <div className="wl-job-avatar">
                    {job.title ? job.title.charAt(0).toUpperCase() : "J"}
                  </div>
                  <div className="wl-job-info">
                    <Link to={`/job/${job._id}`} className="wl-job-title">
                      {job.title}
                    </Link>
                    <p className="wl-job-meta">
                      {job.postedBy?.company?.name || "Company"} • {job.city || job.country || "Location"}
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
                    onClick={() => handleRemoveFromWishlist(job._id)}
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
