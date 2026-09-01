import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaInfoCircle } from "react-icons/fa";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal Detail State
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/admin/jobs",
        {
          withCredentials: true,
        }
      );
      setJobs(data.jobs || []);
    } catch (error) {
      toast.error("Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job listing? Users will no longer see it.")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/admin/jobs/${id}`,
        {
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setJobs(jobs.filter(j => j._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete job.");
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Active" && !j.expired) || 
      (statusFilter === "Expired" && j.expired);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="page-title">Jobs</h1>
      <p className="page-subtitle">Inspect job posts, view description requirements, or delete listings.</p>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search job listings by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="select-filter" 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Postings</option>
          <option value="Active">Active Only</option>
          <option value="Expired">Expired Only</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem", color: "#fff" }}>
          <div>Loading job listings...</div>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Category</th>
                  <th>Salary Details</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlignment: "center", color: "var(--text-muted)" }}>
                      No job postings match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => (
                    <tr key={j._id}>
                      <td style={{ fontWeight: 600 }}>{j.title}</td>
                      <td>{j.category}</td>
                      <td>
                        {j.fixedSalary ? (
                          <span>₹{j.fixedSalary.toLocaleString("en-IN")} / mo</span>
                        ) : (
                          <span>₹{j.salaryFrom.toLocaleString("en-IN")} - ₹{j.salaryTo.toLocaleString("en-IN")} / mo</span>
                        )}
                      </td>
                      <td>{j.city}, {j.country}</td>
                      <td>
                        <span className={`badge ${j.expired ? 'expired' : 'active'}`}>
                          {j.expired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button 
                            onClick={() => setSelectedJob(j)} 
                            className="btn-action edit"
                            title="View job description details"
                          >
                            <FaInfoCircle />
                          </button>
                          <button 
                            onClick={() => handleDelete(j._id)} 
                            className="btn-action delete"
                            title="Delete job posting"
                          >
                            <RxTrash />
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

      {/* Info View Glass Modal */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Job Details</h3>
              <button onClick={() => setSelectedJob(null)} className="btn-close">
                <RxCross2 />
              </button>
            </div>
            
            <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "0.5rem" }}>
              <div className="detail-item">
                <div className="detail-label">Title</div>
                <div className="detail-value" style={{ fontWeight: 700 }}>{selectedJob.title}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Category</div>
                <div className="detail-value">{selectedJob.category}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Location Address</div>
                <div className="detail-value">{selectedJob.location}, {selectedJob.city}, {selectedJob.country}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Salary Model</div>
                <div className="detail-value">
                  {selectedJob.fixedSalary ? `Fixed Salary: ₹${selectedJob.fixedSalary.toLocaleString("en-IN")}` : `Salary Range: ₹${selectedJob.salaryFrom.toLocaleString("en-IN")} - ₹${selectedJob.salaryTo.toLocaleString("en-IN")}`}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  <span className={`badge ${selectedJob.expired ? 'expired' : 'active'}`} style={{ margin: 0 }}>
                    {selectedJob.expired ? 'Expired' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Posted By User ID</div>
                <div className="detail-value" style={{ fontFamily: "monospace" }}>{selectedJob.postedBy}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Job Description</div>
                <div className="detail-value" style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                  {selectedJob.description}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setSelectedJob(null)} className="btn-cancel">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
