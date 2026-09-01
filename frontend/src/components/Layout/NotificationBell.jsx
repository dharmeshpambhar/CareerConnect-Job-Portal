import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { FaBell, FaCog, FaCheck, FaTimes } from "react-icons/fa";
import { Context } from "../../main";
import toast from "react-hot-toast";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useContext(Context);
  const dropdownRef = useRef(null);

  const [settings, setSettings] = useState({
    newJobs: true,
    applicationUpdates: true,
  });

  useEffect(() => {
    if (user && user.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/v1/user/notifications", {
        withCredentials: true,
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        "http://localhost:4000/api/v1/user/notifications/mark-read",
        {},
        { withCredentials: true }
      );
      // Re-fetch from server to get true persisted read status
      await fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleToggleSetting = async (key) => {
    const previousSettings = { ...settings };
    const updatedSettings = {
      ...settings,
      [key]: !settings[key],
    };
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
    } catch (error) {
      toast.error("Failed to update settings");
      // Revert to previous state
      setSettings(previousSettings);
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: "1.3rem",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: "5px",
          transition: "color 0.2s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)")}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              lineHeight: "1",
              minWidth: "16px",
              textAlign: "center"
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="notification-dropdown"
          style={{
            position: "absolute",
            right: "0",
            top: "40px",
            background: "#18191c",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "var(--border-radius-md)",
            boxShadow: "var(--shadow-lg)",
            width: "320px",
            zIndex: "2000",
            padding: "15px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "10px",
              marginBottom: "10px"
            }}
          >
            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#fff" }}>
              {showSettings ? "Notification Options" : "Notifications"}
            </h4>
            <div style={{ display: "flex", gap: "10px" }}>
              {!showSettings && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary-color)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <FaCheck />
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                title={showSettings ? "Back to notifications" : "Notification options"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: showSettings ? "var(--primary-color)" : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {showSettings ? <FaTimes /> : <FaCog />}
              </button>
            </div>
          </div>

          {showSettings ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "5px 0" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: "0.9rem" }}>
                <span>New Job Alerts</span>
                <input
                  type="checkbox"
                  checked={settings.newJobs}
                  onChange={() => handleToggleSetting("newJobs")}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
              </label>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: "0.9rem" }}>
                <span>Application Updates</span>
                <input
                  type="checkbox"
                  checked={settings.applicationUpdates}
                  onChange={() => handleToggleSetting("applicationUpdates")}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
              </label>
            </div>
          ) : (
            <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }} className="notification-list">
              {notifications.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)", margin: "15px 0" }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    style={{
                      background: notification.read ? "transparent" : "rgba(14, 165, 233, 0.1)",
                      borderLeft: notification.read ? "3px solid transparent" : "3px solid var(--primary-color)",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      fontSize: "0.85rem"
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{notification.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.75)" }}>{notification.message}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
