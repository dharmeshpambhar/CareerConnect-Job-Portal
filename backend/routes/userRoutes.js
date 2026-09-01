import express from "express";
import {
  login,
  register,
  logout,
  resetPassword,
  getUser,
  getNotifications,
  markNotificationsRead,
  markSingleNotificationRead,
  updateNotificationSettings,
  getCompanyProfile,
  updateCompanyProfile,
  getEmployerProfile,
  getJobseekerFullProfile,
  updateJobseekerFullProfile,
  getJobseekerProfileByUserId,
  getEmployerFullProfile,
  updateEmployerFullProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  uploadResume,
  deleteResume,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/logout", logout);
router.get("/getuser", isAuthenticated, getUser);

router.get("/notifications", isAuthenticated, getNotifications);
router.put("/notifications/mark-read", isAuthenticated, markNotificationsRead);
router.put("/notifications/mark-read/:id", isAuthenticated, markSingleNotificationRead);
router.put("/notifications/settings", isAuthenticated, updateNotificationSettings);
router.get("/company", isAuthenticated, getCompanyProfile);
router.put("/company", isAuthenticated, updateCompanyProfile);

// Separate MongoDB Collections Routes for Jobseeker & Employer
// ⚠️ IMPORTANT: static routes MUST be declared before dynamic :id routes in Express
router.get("/jobseeker/profile", isAuthenticated, getJobseekerFullProfile);
router.put("/jobseeker/profile", isAuthenticated, updateJobseekerFullProfile);
router.get("/jobseeker/profile/:userId", isAuthenticated, getJobseekerProfileByUserId);

router.get("/employer/full-profile", isAuthenticated, getEmployerFullProfile);
router.put("/employer/full-profile", isAuthenticated, updateEmployerFullProfile);

// Dynamic :id route — must come AFTER all static /employer/* routes
router.get("/employer/:id", getEmployerProfile);

// Profile picture upload & delete
router.post("/profile-picture", isAuthenticated, uploadProfilePicture);
router.delete("/profile-picture", isAuthenticated, deleteProfilePicture);

// Resume upload & delete
router.post("/resume", isAuthenticated, uploadResume);
router.delete("/resume", isAuthenticated, deleteResume);

export default router;

