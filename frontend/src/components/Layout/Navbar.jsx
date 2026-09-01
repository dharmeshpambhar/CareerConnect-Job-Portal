import React, { useContext, useState, useEffect } from "react";
import { Context } from "../../main";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";
import { FaUserCircle, FaBell, FaCheckDouble } from "react-icons/fa";
import { HiX } from "react-icons/hi";
import Sidebar from "./Sidebar";
import { fetchNotificationsApi, markNotificationsReadApi, markSingleNotificationReadApi } from "../../apiService";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  // Fetch real-time notifications when authorized
  const fetchUserNotifications = async () => {
    if (!isAuthorized) return;
    try {
      const res = await fetchNotificationsApi();
      if (res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchUserNotifications();
      const interval = setInterval(fetchUserNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsReadApi();
      await fetchUserNotifications();
      toast.success("Notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleMarkOneRead = async (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notifId ? { ...n, read: true } : n))
    );
    await markSingleNotificationReadApi(notifId);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <nav className="navbarShow">
        <div className="container">
          <div className="logo">
            <img src="/careerconnect-white.png" alt="logo" />
          </div>
          <ul className={!show ? "menu" : "show-menu menu"}>
            <li>
              <Link to={"/"} onClick={() => setShow(false)}>
                HOME
              </Link>
            </li>
            <li>
              <Link to={"/job/getall"} onClick={() => setShow(false)}>
                ALL JOBS
              </Link>
            </li>
            {isAuthorized && (
              <li>
                <Link to={"/applications/me"} onClick={() => setShow(false)}>
                  MY APPLICATIONS
                </Link>
              </li>
            )}
            {isAuthorized ? (
              <>
                {user && user.role === "Employer" ? (
                  <>
                    <li>
                      <Link to={"/job/post"} onClick={() => setShow(false)}>
                        POST NEW JOB
                      </Link>
                    </li>
                    <li>
                      <Link to={"/job/me"} onClick={() => setShow(false)}>
                        VIEW YOUR JOBS
                      </Link>
                    </li>
                    <li>
                      <Link to={"/company/profile"} onClick={() => setShow(false)}>
                        MY COMPANY
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link to={"/wishlist"} onClick={() => setShow(false)}>
                      MY WISHLIST
                    </Link>
                  </li>
                )}

                {/* NOTIFICATION BELL ICON TRIGGER */}
                <li>
                  <button
                    onClick={() => {
                      setNotificationsOpen(true);
                      setShow(false);
                      fetchUserNotifications();
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: "1.3rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "5px 10px",
                      position: "relative",
                      transition: "color 0.2s",
                    }}
                    title="Notifications"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="nav-notif-badge">{unreadCount}</span>
                    )}
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to={"/login"} onClick={() => setShow(false)}>
                  LOGIN
                </Link>
              </li>
            )}
            
            {/* Sidebar toggle button */}
            <li>
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setShow(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.85)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)")}
                title="Open user panel"
              >
                {user?.profilePicture?.url ? (
                  <img
                    src={user?.profilePicture?.url}
                    alt="Profile"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid rgba(255,255,255,0.7)",
                      transition: "border-color 0.2s",
                    }}
                  />
                ) : (
                  <FaUserCircle />
                )}
              </button>
            </li>
          </ul>
          <div className="hamburger" onClick={() => setShow(!show)}>
            {show ? <AiOutlineClose /> : <GiHamburgerMenu />}
          </div>
        </div>
      </nav>

      {/* TOP-LEVEL DEDICATED NOTIFICATIONS MODAL OVERLAY */}
      {notificationsOpen && (
        <div className="notif-modal-overlay" onClick={() => setNotificationsOpen(false)}>
          <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="notif-header">
              <div>
                <span className="notif-pill">NOTIFICATIONS & ALERTS</span>
                <h4>Activity Center {unreadCount > 0 && `(${unreadCount} Unread)`}</h4>
              </div>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="notif-mark-btn">
                    <FaCheckDouble /> Mark all read
                  </button>
                )}
                <button className="notif-close-btn" onClick={() => setNotificationsOpen(false)}>
                  <HiX />
                </button>
              </div>
            </div>

            <div className="notif-list-body">
              {notifications.length === 0 ? (
                <div className="notif-empty-state">
                  🔔 No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`notif-item ${!notif.read ? "unread" : ""}`}
                    onClick={() => !notif.read && handleMarkOneRead(notif._id)}
                    style={{ cursor: !notif.read ? "pointer" : "default" }}
                    title={!notif.read ? "Click to mark as read" : ""}
                  >
                    <div className="notif-item-top">
                      <h5 className="notif-item-title">{notif.title}</h5>
                      {!notif.read && <span className="unread-dot">UNREAD</span>}
                    </div>
                    <p className="notif-item-msg">{notif.message}</p>
                    <div className="notif-item-time">
                      🕒 {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render the slide-out sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
