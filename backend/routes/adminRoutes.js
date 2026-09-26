import express from "express";
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getJobs,
  deleteJob,
  getApplications,
  deleteApplication,
  getCompanyVerifications,
  verifyCompany,
} from "../controllers/adminController.js";
import {
  adminLogin,
  adminLogout,
  getAdminUser,
} from "../controllers/adminAuthController.js";
import { isAdminAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// ─── Admin Auth Routes (use Admin_Portal database) ───
router.post("/auth/login", adminLogin);
router.get("/auth/logout", adminLogout);
router.get("/auth/me", isAdminAuthenticated, getAdminUser);

// ─── Admin Management Routes (require admin auth, manage Job_Portal data) ───
router.use(isAdminAuthenticated);
router.use(isAdmin);

router.get("/stats", getStats);

router.route("/companies/verifications")
  .get(getCompanyVerifications);

router.route("/companies/:id/verify")
  .put(verifyCompany);

router.route("/users")
  .get(getUsers);

router.route("/users/:id")
  .put(updateUser)
  .delete(deleteUser);

router.route("/jobs")
  .get(getJobs);

router.route("/jobs/:id")
  .delete(deleteJob);

router.route("/applications")
  .get(getApplications);

router.route("/applications/:id")
  .delete(deleteApplication);

export default router;
