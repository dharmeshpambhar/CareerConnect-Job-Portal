import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { FraudReport } from "../models/fraudReportSchema.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { Employer } from "../models/employerSchema.js";
import { Notification } from "../models/notificationSchema.js";
import cloudinary from "cloudinary";

// ── 1. JOB SEEKER: Submit Fraud / Dispute Report ─────────────────────────────
export const createFraudReport = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "Job Seeker") {
    return next(new ErrorHandler("Only job seekers can report fraudulent companies/applications.", 403));
  }

  const { applicationId, reason, details } = req.body;

  if (!applicationId || !reason || !details) {
    return next(new ErrorHandler("Please provide application ID, fraud category reason, and details.", 400));
  }

  // Find the target application
  const application = await Application.findById(applicationId);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  // Ensure this candidate owns the application
  if (application.applicantID?.user?.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Not authorized to report this application.", 403));
  }

  // Check if already reported and under investigation
  if (application.fraudReport?.isReported && application.fraudReport.status !== "Dismissed") {
    return next(new ErrorHandler("A fraud report has already been submitted for this application and is currently under investigation.", 400));
  }

  // Resolve Job and Company info
  let jobTitle = "Job Position";
  let companyName = "Company";
  let employerId = application.employerID?.user;

  if (application.jobId) {
    const job = await Job.findById(application.jobId).select("title companyName postedBy").lean();
    if (job) {
      jobTitle = job.title || jobTitle;
      companyName = job.companyName || companyName;
      if (!employerId && job.postedBy) {
        employerId = job.postedBy;
      }
    }
  }

  if (employerId) {
    const emp = await Employer.findById(employerId).select("companyName name").lean();
    if (emp && emp.companyName) {
      companyName = emp.companyName;
    }
  }

  // Handle optional evidence file upload (screenshot/receipt)
  let evidenceUrl = "";
  if (req.files && req.files.evidence) {
    try {
      const file = req.files.evidence;
      const uploadResult = await Promise.race([
        cloudinary.v2.uploader.upload(file.tempFilePath, {
          folder: "fraud_evidence",
          resource_type: "auto",
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timeout")), 8000)),
      ]);
      evidenceUrl = uploadResult.secure_url || "";
    } catch (uploadErr) {
      console.warn("Evidence upload failed or timed out:", uploadErr.message);
    }
  } else if (req.body.evidenceUrl) {
    evidenceUrl = req.body.evidenceUrl;
  }

  // Create FraudReport
  const report = await FraudReport.create({
    applicationId: application._id,
    jobId: application.jobId,
    jobTitle,
    companyName,
    employerId,
    applicantId: req.user._id,
    applicantName: req.user.name || application.name,
    applicantEmail: req.user.email || application.email,
    applicantPhone: req.user.phone || application.phone || "",
    reason,
    details,
    evidenceUrl,
    status: "Pending Investigation",
  });

  // Update application with fraudReport tracking
  application.fraudReport = {
    isReported: true,
    reportId: report._id,
    reason,
    status: "Pending Investigation",
    reportedAt: new Date(),
  };
  await application.save();

  // Create confirmation notification for candidate
  try {
    await Notification.create({
      recipient: req.user._id,
      title: "🛡️ Fraud Report Received",
      message: `Your report regarding "${jobTitle}" at ${companyName} has been submitted for admin investigation. We are reviewing this employer.`,
      read: false,
    });
  } catch (_) {}

  res.status(201).json({
    success: true,
    message: "Fraud report submitted successfully. Our safety moderation team is investigating this company.",
    report,
  });
});

// ── 2. JOB SEEKER: Fetch my filed reports ─────────────────────────────────────
export const getJobseekerReports = catchAsyncErrors(async (req, res, next) => {
  const reports = await FraudReport.find({ applicantId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    reports,
  });
});

// ── 3. ADMIN: Get all fraud reports ──────────────────────────────────────────
export const getAllFraudReports = catchAsyncErrors(async (req, res, next) => {
  const { status, search } = req.query;
  const filter = {};

  if (status && status !== "All") {
    filter.status = status;
  }

  if (search) {
    const sRegex = new RegExp(search, "i");
    filter.$or = [
      { companyName: sRegex },
      { jobTitle: sRegex },
      { applicantName: sRegex },
      { applicantEmail: sRegex },
      { reason: sRegex },
    ];
  }

  const reports = await FraudReport.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    reports,
  });
});

// ── 4. ADMIN: Update report status, warn, or blacklist employer ───────────────
export const updateReportStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNotes, actionTaken } = req.body;

  if (!status || !["Pending Investigation", "Under Review", "Company Warned", "Company Blacklisted", "Dismissed"].includes(status)) {
    return next(new ErrorHandler("Invalid status value.", 400));
  }

  const report = await FraudReport.findById(id);
  if (!report) {
    return next(new ErrorHandler("Fraud report not found.", 404));
  }

  report.status = status;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  if (actionTaken !== undefined) report.actionTaken = actionTaken;
  report.resolvedAt = new Date();
  await report.save();

  // Update corresponding application state
  if (report.applicationId) {
    await Application.findByIdAndUpdate(report.applicationId, {
      "fraudReport.status": status,
    });
  }

  // ── If Company Warned: increment warning count ──
  if (status === "Company Warned" && report.employerId) {
    await User.findByIdAndUpdate(report.employerId, {
      $inc: { warningCount: 1 },
      accountStatus: "Warned",
    });
    await Employer.findByIdAndUpdate(report.employerId, {
      $inc: { warningCount: 1 },
      accountStatus: "Warned",
    });
  }

  // ── If Company Blacklisted: suspend employer and expire their jobs ──
  if (status === "Company Blacklisted" && report.employerId) {
    const reasonText = adminNotes || `Blacklisted due to verified fraud report: ${report.reason}`;
    
    await User.findByIdAndUpdate(report.employerId, {
      isBlacklisted: true,
      accountStatus: "Blacklisted",
      blacklistReason: reasonText,
    });

    await Employer.findByIdAndUpdate(report.employerId, {
      isBlacklisted: true,
      accountStatus: "Blacklisted",
      blacklistReason: reasonText,
    });

    // Deactivate/expire all active job postings by this fraudulent employer
    await Job.updateMany(
      { postedBy: report.employerId },
      { expired: true, status: "Expired" }
    );

    // Notify the reporting applicant
    if (report.applicantId) {
      try {
        await Notification.create({
          recipient: report.applicantId,
          title: "🚨 Company Blacklisted",
          message: `Action taken: The employer "${report.companyName}" has been formally blacklisted and suspended following your dispute investigation.`,
          read: false,
        });
      } catch (_) {}
    }
  }

  res.status(200).json({
    success: true,
    message: `Report status updated to "${status}".`,
    report,
  });
});
