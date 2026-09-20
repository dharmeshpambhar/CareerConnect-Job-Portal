import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { 
  RxDashboard, 
  RxAvatar, 
  RxFileText, 
  RxExit 
} from "react-icons/rx";
import { FaBriefcase, FaShieldAlt } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { Context } from "../main";

const Sidebar = () => {
  const { user, setIsAuthorized, setUser } = useContext(Context);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}/user/logout`,
        {
          withCredentials: true,
        }
      );
      toast.success(data.message);
      setIsAuthorized(false);
      setUser({});
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to logout.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      <div>
        <Link to="/" className="sidebar-logo">
          <span>CareerConnect</span>
          <span style={{ fontSize: "0.75rem", background: "rgba(0, 229, 255, 0.1)", color: "#00e5ff", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>ADMIN</span>
        </Link>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/" className="sidebar-link" end>
              <RxDashboard />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/users" className="sidebar-link">
              <RxAvatar />
              <span>Accounts</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/jobs" className="sidebar-link">
              <FaBriefcase />
              <span>Jobs</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/applications" className="sidebar-link">
              <RxFileText />
              <span>Applications</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/fraud-reports" className="sidebar-link">
              <FaShieldAlt />
              <span>Fraud & Disputes</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="admin-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="admin-info">
            <span className="admin-name" title={user?.name}>{user?.name || "Admin User"}</span>
            <span className="admin-role">{user?.role || "Administrator"}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Log out of panel">
          <RxExit />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
