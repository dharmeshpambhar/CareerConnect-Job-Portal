import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { RxTrash, RxMagnifyingGlass, RxCross2 } from "react-icons/rx";
import { FaPencilAlt } from "react-icons/fa";

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
        {
          withCredentials: true,
        }
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
        {
          withCredentials: true,
        }
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

      {/* Edit Glass Modal */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3 className="modal-title">Edit Account Details</h3>
              <button onClick={() => setEditUser(null)} className="btn-close">
                <RxCross2 />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter full name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
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

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter email address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
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

              <div className="modal-footer">
                <button type="button" onClick={() => setEditUser(null)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
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
