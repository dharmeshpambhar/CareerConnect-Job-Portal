import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  RxAvatar, 
  RxFileText, 
  RxPerson, 
  RxCalendar 
} from "react-icons/rx";
import { FaBriefcase } from "react-icons/fa";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/admin/stats",
          {
            withCredentials: true,
          }
        );
        setStats(data.stats);
        setRecentUsers(data.recentUsers || []);
        setRecentJobs(data.recentJobs || []);
        setRecentApplications(data.recentApplications || []);
      } catch (error) {
        toast.error("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", color: "#fff" }}>
        <div>Loading dashboard metrics...</div>
      </div>
    );
  }

  // Fallback defaults
  const totalUsers = stats?.users?.total || 0;
  const seekers = stats?.users?.jobSeekers || 0;
  const employers = stats?.users?.employers || 0;
  const admins = stats?.users?.admins || 0;
  const totalJobs = stats?.jobs?.total || 0;
  const activeJobs = stats?.jobs?.active || 0;
  const expiredJobs = stats?.jobs?.expired || 0;
  const totalApps = stats?.applications?.total || 0;

  // Simple math for Custom SVG Circle Graph
  const totalPeople = (seekers + employers + admins) || 1;
  const seekerPct = Math.round((seekers / totalPeople) * 100);
  const employerPct = Math.round((employers / totalPeople) * 100);
  const adminPct = Math.round((admins / totalPeople) * 100);

  // SVG calculations for a simple Donut chart
  // Radius = 50, Circumference = 2 * PI * 50 = 314.16
  const circ = 314.16;
  const seekerStroke = (seekers / totalPeople) * circ;
  const employerStroke = (employers / totalPeople) * circ;
  const adminStroke = (admins / totalPeople) * circ;

  const seekerOffset = circ;
  const employerOffset = circ - seekerStroke;
  const adminOffset = circ - seekerStroke - employerStroke;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">CareerConnect System Overview & Realtime Metrics</p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Accounts</span>
            <div className="stat-icon"><RxAvatar /></div>
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-desc">System users across all roles</div>
        </div>

        <div className="glass-panel stat-card cyan">
          <div className="stat-header">
            <span className="stat-title">Job Seekers</span>
            <div className="stat-icon"><RxPerson /></div>
          </div>
          <div className="stat-value">{seekers}</div>
          <div className="stat-desc">{seekerPct}% of registered accounts</div>
        </div>

        <div className="glass-panel stat-card emerald">
          <div className="stat-header">
            <span className="stat-title">Employers</span>
            <div className="stat-icon"><FaBriefcase /></div>
          </div>
          <div className="stat-value">{employers}</div>
          <div className="stat-desc">{employerPct}% of registered accounts</div>
        </div>

        <div className="glass-panel stat-card amber">
          <div className="stat-header">
            <span className="stat-title">Applications</span>
            <div className="stat-icon"><RxFileText /></div>
          </div>
          <div className="stat-value">{totalApps}</div>
          <div className="stat-desc">Total job submissions received</div>
        </div>
      </div>

      {/* Visualizations row */}
      <div className="vis-grid">
        {/* Jobs overview widget */}
        <div className="glass-panel chart-container">
          <div className="chart-title">Job Postings Distribution</div>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", height: "100%", justifyContent: "space-around", padding: "1rem" }}>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                  <span>Active Jobs</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>{activeJobs}</span>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ background: "#10b981", width: `${totalJobs ? (activeJobs / totalJobs) * 100 : 0}%`, height: "100%", borderRadius: "4px" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                  <span>Expired Jobs</span>
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>{expiredJobs}</span>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ background: "#ef4444", width: `${totalJobs ? (expiredJobs / totalJobs) * 100 : 0}%`, height: "100%", borderRadius: "4px" }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary-accent)", lineHeight: 1 }}>{totalJobs}</span>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px", marginTop: "0.25rem" }}>Total Listings</span>
            </div>
          </div>
        </div>

        {/* User breakdown Donut chart */}
        <div className="glass-panel chart-container">
          <div className="chart-title">User Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="svg-donut">
              <svg width="150" height="150" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="12" />
                
                {/* Job Seekers - Emerald */}
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10b981" strokeWidth="12" 
                  strokeDasharray={`${seekerStroke} ${circ}`} 
                  strokeDashoffset={seekerOffset} 
                  transform="rotate(-90 60 60)" 
                />

                {/* Employers - Cyan */}
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#00e5ff" strokeWidth="12" 
                  strokeDasharray={`${employerStroke} ${circ}`} 
                  strokeDashoffset={employerOffset} 
                  transform="rotate(-90 60 60)" 
                />

                {/* Admins - Purple */}
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#7c4dff" strokeWidth="12" 
                  strokeDasharray={`${adminStroke} ${circ}`} 
                  strokeDashoffset={adminOffset} 
                  transform="rotate(-90 60 60)" 
                />
              </svg>
            </div>
            
            <div className="donut-legend" style={{ width: "100%" }}>
              <div className="legend-item">
                <span className="legend-color" style={{ background: "#10b981" }}></span>
                <span style={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                  <span>Job Seeker</span>
                  <span>{seekers} ({seekerPct}%)</span>
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: "#00e5ff" }}></span>
                <span style={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                  <span>Employer</span>
                  <span>{employers} ({employerPct}%)</span>
                </span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ background: "#7c4dff" }}></span>
                <span style={{ display: "flex", justifyContent: "space-between", flexGrow: 1 }}>
                  <span>Admin</span>
                  <span>{admins} ({adminPct}%)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
        {/* Recent users table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="chart-title">New Users Registered</div>
          {recentUsers.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "1rem" }}>No users registered recently.</p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'Admin' ? 'admin' : u.role === 'Employer' ? 'employer' : 'seeker'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent applications table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="chart-title">Recent Job Submissions</div>
          {recentApplications.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", padding: "1rem" }}>No applications submitted yet.</p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Cover Letter</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{app.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{app.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {app.coverLetter}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
