import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Employer } from "../models/employerSchema.js";
import { AdminUser } from "../models/adminUserSchema.js";
import { User } from "../models/userSchema.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";

// Get dashboard statistics
export const getStats = catchAsyncErrors(async (req, res, next) => {
  const jobSeekers = await Jobseeker.countDocuments();
  const employers  = await Employer.countDocuments();
  const admins     = await AdminUser.countDocuments();
  const totalUsers = jobSeekers + employers + admins;

  const totalJobs   = await Job.countDocuments();
  const activeJobs  = await Job.countDocuments({ expired: false });
  const expiredJobs = await Job.countDocuments({ expired: true });

  const totalApplications = await Application.countDocuments();

  // Fetch recent entries with fallback sorting fields
  const recentJobseekers = await Jobseeker.find()
    .select("-password")
    .sort({ createdAt: -1, _id: -1 })
    .limit(3);

  const recentEmployers = await Employer.find()
    .select("-password")
    .sort({ createdAt: -1, _id: -1 })
    .limit(2);

  // Merge and sort the recent users together (most recent first)
  const recentUsers = [...recentJobseekers, ...recentEmployers].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5);

  const recentJobs         = await Job.find().sort({ createdAt: -1, jobPostedOn: -1, _id: -1 }).limit(5);
  const recentApplications = await Application.find().sort({ createdAt: -1, updatedAt: -1, _id: -1 }).limit(5);

  res.status(200).json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        jobSeekers,
        employers,
        admins,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        expired: expiredJobs,
      },
      applications: {
        total: totalApplications,
      },
    },
    recentUsers,
    recentJobs,
    recentApplications,
  });
});

// Accounts Management: Get all users (from all three collections)
export const getUsers = catchAsyncErrors(async (req, res, next) => {
  const jobseekers = await Jobseeker.find().select("-password").sort({ createdAt: -1 });
  const employers  = await Employer.find().select("-password").sort({ createdAt: -1 });
  const admins     = await AdminUser.find().select("-password").sort({ createdAt: -1 });

  // Merge all users and sort by creation date descending
  const users = [...jobseekers, ...employers, ...admins].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.status(200).json({
    success: true,
    users,
  });
});

// Accounts Management: Update user details
export const updateUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

  // Search across all three collections
  let user = await Jobseeker.findById(id);
  let collection = "jobseeker";

  if (!user) {
    user = await Employer.findById(id);
    collection = "employer";
  }
  if (!user) {
    user = await AdminUser.findById(id);
    collection = "admin";
  }

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  user.name  = name  || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  // Only update role for non-admin collections where role is mutable
  if (role && collection !== "admin") {
    user.role = role;
  }

  await user.save({ validateBeforeSave: false });

  // Return user without password
  const userObj = user.toObject();
  delete userObj.password;

  res.status(200).json({
    success: true,
    message: "User account updated successfully!",
    user: userObj,
  });
});

// Accounts Management: Delete user account
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Don't allow an admin to delete themselves
  if (id === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot delete your own admin account!", 400));
  }

  // Search across all three collections
  let user = await Jobseeker.findById(id);
  if (!user) user = await Employer.findById(id);
  if (!user) user = await AdminUser.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User account deleted successfully!",
  });
});

// Jobs Management: Get all jobs
export const getJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    jobs,
  });
});

// Jobs Management: Delete a job listing
export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("Job listing not found", 404));
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job listing deleted successfully!",
  });
});

// Applications Management: Get all applications
export const getApplications = catchAsyncErrors(async (req, res, next) => {
  const applications = await Application.find().sort({ createdAt: -1 });
  const applicantIds = applications.map((a) => a.applicantID?.user).filter(Boolean);
  const jobseekers = await Jobseeker.find({ _id: { $in: applicantIds } })
    .select("name email phone profilePicture resume").lean();
  const legacyUsers = await User.find({ _id: { $in: applicantIds } })
    .select("name email phone profilePicture resume").lean();

  const jsMap = new Map();
  jobseekers.forEach((j) => jsMap.set(j._id.toString(), j));
  legacyUsers.forEach((u) => {
    if (!jsMap.has(u._id.toString())) jsMap.set(u._id.toString(), u);
  });

  const populatedApps = applications.map((app) => {
    const appObj = app.toObject ? app.toObject() : { ...app };
    const js = jsMap.get(appObj.applicantID?.user?.toString());
    return {
      ...appObj,
      applicantProfileResume: js?.resume || null,
    };
  });

  res.status(200).json({
    success: true,
    applications: populatedApps,
  });
});

// Applications Management: Delete an application
export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found", 404));
  }

  await application.deleteOne();

  res.status(200).json({
    success: true,
    message: "Application deleted successfully!",
  });
});

// Company Certificate Verifications: Get all employers & their verification status
export const getCompanyVerifications = catchAsyncErrors(async (req, res, next) => {
  const employers = await Employer.find().select("-password").sort({ createdAt: -1 }).lean();
  const legacyEmployers = await User.find({ role: "Employer" }).select("-password").sort({ createdAt: -1 }).lean();

  const empMap = new Map();
  employers.forEach((e) => empMap.set(e._id.toString(), e));
  legacyEmployers.forEach((u) => {
    if (!empMap.has(u._id.toString())) {
      empMap.set(u._id.toString(), {
        ...u,
        companyName: u.company?.name || u.name || "Company",
      });
    }
  });

  const companies = Array.from(empMap.values()).map((c) => ({
    _id: c._id,
    name: c.name,
    companyName: c.companyName || c.company?.name || c.name || "Company",
    email: c.email,
    phone: c.phone,
    website: c.website || c.company?.website || "",
    location: c.location || c.company?.location || "",
    industry: c.industry || c.company?.industry || "",
    companyRegistrationNumber: c.companyRegistrationNumber || "",
    companyCertificate: c.companyCertificate || { url: "", fileName: "" },
    verificationStatus: c.verificationStatus || "Pending",
    isVerified: Boolean(c.isVerified || c.verificationStatus === "Approved"),
    verificationRemarks: c.verificationRemarks || "",
    verifiedAt: c.verifiedAt || null,
    createdAt: c.createdAt,
  }));

  res.status(200).json({
    success: true,
    companies,
  });
});

// Company Certificate Verifications: Approve or Reject company verification
export const verifyCompany = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return next(new ErrorHandler("Invalid verification status. Must be Approved, Rejected, or Pending.", 400));
  }

  let employer = await Employer.findById(id);
  if (!employer) {
    employer = await User.findById(id);
  }

  if (!employer) {
    return next(new ErrorHandler("Company / Employer not found!", 404));
  }

  employer.verificationStatus = status;
  employer.isVerified = (status === "Approved");
  employer.verificationRemarks = remarks || (status === "Approved" ? "Company certificate verified and approved by Administrator." : "Verification documentation rejected.");
  employer.verifiedAt = (status === "Approved" ? new Date() : null);

  await employer.save();

  res.status(200).json({
    success: true,
    message: `Company status successfully updated to ${status}!`,
    company: employer,
  });
});
