import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import {
  HiX,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineChevronRight,
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineBadgeCheck,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { FaCamera } from "react-icons/fa";
import { fetchApplications, uploadProfilePictureApi } from "../../apiService";

const Sidebar = ({ isOpen, onClose }) => {
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();
  const fileInputRef = useRef(null);

  // Component states
  const [applicationCount, setApplicationCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [settings, setSettings] = useState({
    newJobs: true,
    applicationUpdates: true,
  });

  useEffect(() => {
    if (user && user.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user]);

  // Fetch submitted/received applications count when sidebar opens
  useEffect(() => {
    if (isAuthorized && isOpen && user?.role) {
      fetchApplications(user.role)
        .then(({ applications }) => {
          setApplicationCount((applications || []).length);
        })
        .catch((err) => console.error("Error fetching application count for sidebar", err));
    }
  }, [isAuthorized, isOpen, user]);

  const handleToggleSetting = async (key) => {
    // Snapshot previous state for rollback on failure
    const previousSettings = { ...settings };
    const updatedSettings = {
      ...settings,
      [key]: !settings[key],
    };

    // Optimistic UI update
    setSettings(updatedSettings);

    try {
      const response = await axios.put(
        "http://localhost:4000/api/v1/user/notifications/settings",
        updatedSettings,
        { withCredentials: true }
      );

      // Confirm with actual saved value from DB
      const savedSettings = response.data?.notificationSettings || updatedSettings;
      setSettings(savedSettings);

      // Keep global user context in sync so re-opening sidebar shows correct values
      setUser((prev) => ({
        ...prev,
        notificationSettings: savedSettings,
      }));

      const label = key === "newJobs" ? "New Job Alerts" : "Application Updates";
      toast.success(`${label} ${savedSettings[key] ? "enabled ✓" : "disabled"}`);
    } catch (error) {
      // Revert to previous state on failure
      setSettings(previousSettings);
      toast.error("Failed to update notification settings. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/v1/user/logout", {
        withCredentials: true,
      });
      toast.success(response.data?.message || "Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logged out");
    } finally {
      setUser({});
      setIsAuthorized(false);
      onClose();
      navigateTo("/login");
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be smaller than 3MB.");
      return;
    }

    setUploadingPic(true);
    const formData = new FormData();
    formData.append("profilePicture", file);

    const result = await uploadProfilePictureApi(formData);

    if (result.success) {
      setUser((prev) => ({
        ...prev,
        profilePicture: result.profilePicture,
      }));
      toast.success("Profile picture updated! ✓");
    } else {
      toast.error(result.message || "Failed to upload profile picture.");
    }

    setUploadingPic(false);
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isEmployer = user?.role === "Employer";
  const profilePicUrl = user?.profilePicture?.url;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`naukri-sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      {/* Slide-out Sidebar Panel */}
      <div className={`naukri-sidebar-drawer ${isOpen ? "active" : ""}`}>
        {/* Top Close Button */}
        <button className="naukri-sidebar-close" onClick={onClose} title="Close Menu">
          <HiX />
        </button>

        {isAuthorized && user ? (
          <div className="naukri-sidebar-content">
            {/* 1. Header: Profile Info */}
            <div className="naukri-profile-header">
              <div className="naukri-avatar-wrapper">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: "none" }}
                  onChange={handleProfilePictureChange}
                />
                {/* Clickable avatar with camera overlay */}
                <div
                  className={`naukri-avatar-circle naukri-avatar-clickable ${uploadingPic ? "uploading" : ""}`}
                  onClick={handleAvatarClick}
                  title="Click to change profile picture"
                >
                  {uploadingPic ? (
                    <div className="naukri-avatar-spinner" />
                  ) : profilePicUrl ? (
                    <img
                      src={profilePicUrl}
                      alt="Profile"
                      className="naukri-avatar-img"
                    />
                  ) : (
                    (user.name || "U").charAt(0).toUpperCase()
                  )}
                  {/* Camera overlay shown on hover */}
                  {!uploadingPic && (
                    <div className="naukri-avatar-camera-overlay">
                      <FaCamera className="naukri-avatar-camera-icon" />
                      <span>Change</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="naukri-user-details">
                <h3 className="naukri-user-name">{user.name}</h3>
                <p className="naukri-user-role">
                  {isEmployer ? user.company?.name || "Employer Account" : "Jobseeker"}
                </p>
                <Link
                  to={isEmployer ? "/company/profile" : "/jobseeker/profile"}
                  className="naukri-profile-link"
                  onClick={onClose}
                >
                  View &amp; Update Profile
                </Link>
              </div>
            </div>

            {/* 2. Upgrade to CareerConnect Pro Banner */}
            <div className="naukri-pro-banner" onClick={() => toast.success("Pro Membership active!")}>
              <div className="naukri-pro-left">
                <span className="naukri-crown-icon">👑</span>
                <span className="naukri-pro-title">Upgrade to CareerConnect Pro</span>
              </div>
              <HiOutlineChevronRight className="naukri-pro-arrow" />
            </div>

            {/* 3. Your Profile Performance Section (Exactly 1 Box) */}
            <div className="naukri-perf-section">
              <div className="naukri-perf-header">
                <h4>Your profile performance</h4>
                <span className="naukri-perf-period">Last 30 days</span>
              </div>

              {/* Single Performance Card */}
              <div className="naukri-perf-box">
                <div className="naukri-perf-metric">
                  <span className="naukri-perf-number">{applicationCount}</span>
                  <span className="naukri-perf-label">
                    {isEmployer ? "Your Applications" : "Submitted Applications"}
                  </span>
                </div>
                <Link
                  to="/applications/me"
                  className="naukri-perf-viewall"
                  onClick={onClose}
                >
                  View all
                </Link>
              </div>
            </div>

            {/* 4. Menu Items */}
            <div className="naukri-menu-list">
              {/* Settings Item */}
              <div className="naukri-menu-item-group">
                <div
                  className="naukri-menu-item"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <div className="naukri-menu-item-left">
                    <HiOutlineCog className="naukri-menu-icon" />
                    <span>Settings</span>
                  </div>
                  <HiOutlineChevronRight
                    className={`naukri-menu-arrow ${showSettings ? "rotated" : ""}`}
                  />
                </div>

                {/* Expanded Settings Sub-panel (Notification Options) */}
                {showSettings && (
                  <div className="naukri-submenu-box">
                    <h5 className="naukri-submenu-title">
                      <HiOutlineBell /> Notification Preferences
                    </h5>
                    <div className="naukri-toggle-row">
                      <span>New Job Alerts</span>
                      <label className="naukri-switch">
                        <input
                          type="checkbox"
                          checked={settings.newJobs}
                          onChange={() => handleToggleSetting("newJobs")}
                        />
                        <span className="naukri-slider round"></span>
                      </label>
                    </div>
                    <div className="naukri-toggle-row">
                      <span>Application Updates</span>
                      <label className="naukri-switch">
                        <input
                          type="checkbox"
                          checked={settings.applicationUpdates}
                          onChange={() => handleToggleSetting("applicationUpdates")}
                        />
                        <span className="naukri-slider round"></span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* About Us Item */}
              <div className="naukri-menu-item-group">
                <Link
                  to="/about"
                  className="naukri-menu-item"
                  onClick={onClose}
                  style={{ textDecoration: "none" }}
                >
                  <div className="naukri-menu-item-left">
                    <HiOutlineInformationCircle className="naukri-menu-icon" />
                    <span>About Us</span>
                  </div>
                  <HiOutlineChevronRight className="naukri-menu-arrow" />
                </Link>
              </div>

              {/* FAQs Item */}
              <div className="naukri-menu-item-group">
                <div
                  className="naukri-menu-item"
                  onClick={() => setShowFAQs(!showFAQs)}
                >
                  <div className="naukri-menu-item-left">
                    <HiOutlineQuestionMarkCircle className="naukri-menu-icon" />
                    <span>FAQs</span>
                  </div>
                  <HiOutlineChevronRight
                    className={`naukri-menu-arrow ${showFAQs ? "rotated" : ""}`}
                  />
                </div>

                {/* Expanded FAQs */}
                {showFAQs && (
                  <div className="naukri-submenu-box">
                    <h5 className="naukri-submenu-title">Frequently Asked Questions</h5>
                    <div className="naukri-faq-item">
                      <strong>Q: How do employers view my applications?</strong>
                      <p>Employers can see your full details, skills, and resume directly from their candidate dashboard.</p>
                    </div>
                    <div className="naukri-faq-item">
                      <strong>Q: How can I update my profile details?</strong>
                      <p>Click "View &amp; Update Profile" at the top of this menu to manage your information.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Item */}
              <div className="naukri-menu-item naukri-menu-item--logout" onClick={handleLogout}>
                <div className="naukri-menu-item-left">
                  <HiOutlineLogout className="naukri-menu-icon" />
                  <span>Logout</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Guest State */
          <div className="naukri-guest-box">
            <div className="naukri-avatar-circle" style={{ margin: "0 auto 16px auto" }}>
              <HiOutlineUser />
            </div>
            <h3>Welcome to CareerConnect</h3>
            <p>Log in or register to manage your job applications, profile, and settings.</p>
            <div className="naukri-guest-actions">
              <Link to="/login" className="naukri-btn naukri-btn--primary" onClick={onClose}>
                Login
              </Link>
              <Link to="/register" className="naukri-btn naukri-btn--secondary" onClick={onClose}>
                Register
              </Link>
            </div>
            <Link
              to="/about"
              className="naukri-menu-item"
              onClick={onClose}
              style={{ textDecoration: "none", marginTop: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}
            >
              <div className="naukri-menu-item-left">
                <HiOutlineInformationCircle className="naukri-menu-icon" />
                <span>About Us</span>
              </div>
              <HiOutlineChevronRight className="naukri-menu-arrow" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
