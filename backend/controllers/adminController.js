import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Employer } from "../models/employerSchema.js";
import { AdminUser } from "../models/adminUserSchema.js";
import { User } from "../models/userSchema.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import sendEmail from "../utils/sendEmail.js";

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
    contactEmail: c.contactEmail || c.company?.contactEmail || c.email,
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
  let user = null;

  if (employer) {
    user = await User.findOne({ email: employer.email });
  } else {
    user = await User.findById(id);
    if (user) {
      employer = await Employer.findOne({ email: user.email });
    }
  }

  if (!employer && !user) {
    return next(new ErrorHandler("Company / Employer not found!", 404));
  }

  const isApproved = status === "Approved";
  const defaultRemarks = isApproved
    ? "Company certificate verified and approved by Administrator."
    : status === "Rejected"
    ? "Verification documentation was rejected or incomplete."
    : "Verification is currently pending review.";

  const finalRemarks = remarks && remarks.trim() ? remarks.trim() : defaultRemarks;

  if (employer) {
    employer.verificationStatus = status;
    employer.isVerified = isApproved;
    employer.verificationRemarks = finalRemarks;
    employer.verifiedAt = isApproved ? new Date() : null;
    await employer.save({ validateBeforeSave: false });
  }

  if (user) {
    user.verificationStatus = status;
    user.isVerified = isApproved;
    user.verificationRemarks = finalRemarks;
    user.verifiedAt = isApproved ? new Date() : null;
    await user.save({ validateBeforeSave: false });
  }

  // Send Email Notification to Employer's specific contact email (or account email fallback)
  const recipientEmail =
    (employer?.contactEmail && employer.contactEmail.trim() !== "")
      ? employer.contactEmail.trim()
      : (employer?.company?.contactEmail && employer.company.contactEmail.trim() !== "")
      ? employer.company.contactEmail.trim()
      : (user?.contactEmail && user.contactEmail.trim() !== "")
      ? user.contactEmail.trim()
      : (user?.company?.contactEmail && user.company.contactEmail.trim() !== "")
      ? user.company.contactEmail.trim()
      : (employer?.email || user?.email);

  const employerName = employer?.recruiterName || employer?.name || user?.name || "Valued Employer";
  const companyName = employer?.companyName || employer?.company?.name || user?.company?.name || user?.name || "Your Company";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (recipientEmail && (status === "Approved" || status === "Rejected")) {
    try {
      if (status === "Approved") {
        const approvalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Company Verification Approved</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:38px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:68px;height:68px;line-height:68px;font-size:34px;margin-bottom:12px;">
                🎉
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 6px;letter-spacing:-0.3px;">
                Congratulations! Verification Approved
              </h1>
              <p style="color:#d1fae5;font-size:15px;margin:0;font-weight:500;">
                Your company is now an Official Verified Employer
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 16px;font-weight:600;">
                Dear ${employerName},
              </p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px;">
                Great news! We are thrilled to inform you that your company <strong style="color:#0f172a;">${companyName}</strong> has been officially reviewed and <span style="color:#059669;font-weight:700;">Approved</span> by the CareerConnect Administration Team.
              </p>

              <!-- Verification Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="margin-bottom:6px;">
                      <span style="font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">
                        ✓ Verification Status: APPROVED
                      </span>
                    </div>
                    <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
                      <strong>Admin Remarks:</strong> ${finalRemarks}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Benefits List -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;margin:0 0 28px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">
                  🌟 What's unlocked for ${companyName}:
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;line-height:1.5;">
                  ✅ <strong>Verified Employer Badge:</strong> Displayed across all your active job postings.
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;line-height:1.5;">
                  ✅ <strong>Higher Trust & Visibility:</strong> Verified profiles receive 3x higher applicant engagement.
                </p>
                <p style="margin:0;font-size:14px;color:#334155;line-height:1.5;">
                  ✅ <strong>Public Company Showcase:</strong> Highlight culture, perks, and official credentials.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/job/post"
                       style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;text-decoration:none;box-shadow:0 6px 20px rgba(16,185,129,0.35);">
                      🚀 Post a Job Now
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;line-height:1.6;">
                Thank you for partnering with CareerConnect.
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                © ${new Date().getFullYear()} CareerConnect &nbsp;|&nbsp; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        sendEmail({
          to: recipientEmail,
          subject: `🎉 Congratulations! "${companyName}" is Officially Verified on CareerConnect`,
          html: approvalHtml,
        })
          .then(() => console.log(`📧 Company approval email sent to ${recipientEmail}`))
          .catch((err) => console.error("Failed to send company approval email:", err.message));
      } else if (status === "Rejected") {
        const rejectionHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Company Verification Update</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626 0%,#ea580c 100%);padding:38px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:68px;height:68px;line-height:68px;font-size:34px;margin-bottom:12px;">
                ⚠️
              </div>
              <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 6px;letter-spacing:-0.3px;">
                Company Verification Update
              </h1>
              <p style="color:#ffedd5;font-size:15px;margin:0;font-weight:500;">
                Action required for your company profile
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:16px;color:#1e293b;margin:0 0 16px;font-weight:600;">
                Dear ${employerName},
              </p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 16px;">
                Thank you for submitting your verification details for <strong style="color:#0f172a;">${companyName}</strong> on CareerConnect.
              </p>
              <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px;">
                We regret to inform you that after administrative review, your company verification could not be approved at this stage.
              </p>

              <!-- Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="margin-bottom:6px;">
                      <span style="font-size:13px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">
                        ❌ Verification Status: REJECTED
                      </span>
                    </div>
                    <p style="margin:0;font-size:14px;color:#b91c1c;line-height:1.6;">
                      <strong>Reason / Administrator Remarks:</strong><br>
                      ${finalRemarks}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 22px;margin:0 0 28px;">
                <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">
                  📌 How you can resolve this:
                </p>
                <p style="margin:0 0 6px;font-size:14px;color:#475569;line-height:1.6;">
                  1. Double-check that your Company Registration Number (CIN / GSTIN) matches official records.
                </p>
                <p style="margin:0 0 6px;font-size:14px;color:#475569;line-height:1.6;">
                  2. Make sure your uploaded certificate or incorporation document is clear, legible, and unexpired.
                </p>
                <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                  3. Re-upload your revised certificate on your Company Profile page to resubmit for review.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/company/profile"
                       style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;text-decoration:none;box-shadow:0 6px 20px rgba(37,99,235,0.35);">
                      📄 Update Company Documents
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;line-height:1.6;">
                Need help? Contact support or reply to this message.
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                © ${new Date().getFullYear()} CareerConnect &nbsp;|&nbsp; Automated Notification
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        sendEmail({
          to: recipientEmail,
          subject: `⚠️ Important Update: Company Verification for "${companyName}" - CareerConnect`,
          html: rejectionHtml,
        })
          .then(() => console.log(`📧 Company rejection email sent to ${recipientEmail}`))
          .catch((err) => console.error("Failed to send company rejection email:", err.message));
      }
    } catch (emailErr) {
      console.error("Error dispatching verification email:", emailErr.message);
    }
  }

  res.status(200).json({
    success: true,
    message: `Company status successfully updated to ${status}!`,
    company: employer || user,
  });
});
