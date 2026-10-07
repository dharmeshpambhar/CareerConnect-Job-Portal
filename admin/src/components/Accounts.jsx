import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaPencilAlt, FaUserEdit, FaUserCircle, FaEnvelope, FaPhone, FaUserTag } from "react-icons/fa";

const Accounts = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Modal State
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("Job Seeker");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/admin/users",
        { withCredentials: true }
      );
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user account? This cannot be undone.")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/admin/users/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setUsers(users.filter(u => u._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleEditClick = (user) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditRole(user.role);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName || !editEmail || !editPhone) {
      return toast.error("Please fill all fields!");
    }
    setSubmitting(true);
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/v1/admin/users/${editUser._id}`,
        { name: editName, email: editEmail, phone: editPhone, role: editRole },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setUsers(users.map(u => u._id === editUser._id ? data.user : u));
      setEditUser(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <h1 className="page-title">Accounts</h1>
      <p className="page-subtitle">Inspect, modify roles, or delete system user accounts.</p>

      {/* Filter and Search Bar */}
      <div className="filter-row">
        <div className="search-input-wrapper input-icon-wrapper" style={{ margin: 0 }}>
          <RxMagnifyingGlass />
          <input
            type="text"
            className="search-input"
            placeholder="Search accounts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Employer">Employer</option>
          <option value="Job Seeker">Job Seeker</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loader">
          <div className="admin-spinner" />
          <span>Loading accounts...</span>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <span className="empty-state-icon">👤</span>
                        <span className="empty-state-text">No accounts match your criteria.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "N/A"}</td>
                      <td>
                        <span className={`badge ${u.role === 'Admin' ? 'admin' : u.role === 'Employer' ? 'employer' : 'seeker'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="btn-action edit"
                            title="Edit user details"
                          >
                            <FaPencilAlt />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="btn-action delete"
                            title="Delete user account"
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

      {/* ── Premium Edit Account Modal ── */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "540px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-title-icon">
                  <FaUserEdit />
                </span>
                Edit Account Details
              </div>
              <button onClick={() => setEditUser(null)} className="btn-close" title="Close">
                <RxCross2 />
              </button>
            </div>

            {/* User identity badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              padding: "1rem 1.75rem",
              background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))",
              borderBottom: "1px solid rgba(99,102,241,0.08)"
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: "1.15rem",
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)", flexShrink: 0
              }}>
                {(editUser.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>{editUser.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{editUser.email}</div>
              </div>
              <span className={`badge ${editUser.role === 'Admin' ? 'admin' : editUser.role === 'Employer' ? 'employer' : 'seeker'}`} style={{ marginLeft: "auto" }}>
                {editUser.role}
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdate}>
              <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>
                      <FaUserCircle style={{ display: "inline", marginRight: 5, color: "var(--primary-accent)" }} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter full name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>
                      <FaPhone style={{ display: "inline", marginRight: 5, color: "var(--primary-accent)" }} />
                      Phone Number
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>
                    <FaEnvelope style={{ display: "inline", marginRight: 5, color: "var(--primary-accent)" }} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>
                    <FaUserTag style={{ display: "inline", marginRight: 5, color: "var(--primary-accent)" }} />
                    Role
                  </label>
                  <select
                    className="form-input"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Employer">Employer</option>
                    <option value="Job Seeker">Job Seeker</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditUser(null)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spinRound 0.7s linear infinite", display: "inline-block" }} />
                      Saving...
                    </span>
                  ) : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
