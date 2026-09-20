import express from "express";
import {
  createFraudReport,
  getJobseekerReports,
  getAllFraudReports,
  updateReportStatus,
} from "../controllers/fraudReportController.js";
import { isAuthenticated, isAdminAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// ── Job Seeker Routes ──
router.post("/report", isAuthenticated, createFraudReport);
router.get("/my-reports", isAuthenticated, getJobseekerReports);

// ── Admin Routes ──
router.get("/admin/all", isAdminAuthenticated, isAdmin, getAllFraudReports);
router.patch("/admin/:id", isAdminAuthenticated, isAdmin, updateReportStatus);

export default router;
