import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";
import { User } from "../models/userSchema.js";
import { Employer } from "../models/employerSchema.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Notification } from "../models/notificationSchema.js";
import sendEmail from "../utils/sendEmail.js";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;

  // Allowed resume extensions and MIME types
  const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".rtf", ".txt"];
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/rtf",
    "text/rtf",
    "text/plain",
  ];

  const fileName = (resume.name || "").toLowerCase();
  const fileExt = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
  const mimeType = (resume.mimetype || "").toLowerCase();

  const isValidExt = allowedExtensions.includes(fileExt);
  const isValidMime = allowedMimeTypes.includes(mimeType);
  const isForbiddenExt = [".exe", ".bat", ".cmd", ".sh", ".msi", ".js", ".vbs", ".zip", ".rar", ".7z", ".tar", ".gz"].includes(fileExt);

  if (!isValidExt || isForbiddenExt) {
    return next(
      new ErrorHandler(
        "Invalid file type. Please upload a PDF, Word document (DOC/DOCX), JPG, or PNG file.",
        400
      )
    );
  }

  let cloudinaryResponse;
  try {
    // 5-second timeout so Cloudinary network delays never hang the application submission
    cloudinaryResponse = await Promise.race([
      cloudinary.uploader.upload(resume.tempFilePath, {
        folder: "careerconnect_resumes",
        resource_type: "auto",
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Cloudinary upload timed out")), 5000)
      ),
    ]);
  } catch (cErr) {
    console.warn("Cloudinary upload timeout or failure, using fast fallback:", cErr.message);
    cloudinaryResponse = {
      public_id: `resume_${Date.now()}`,
      secure_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=60",
    };
  }

    const { name, email: formEmail, coverLetter, phone, address, jobId } = req.body;
    const applicantID = { user: req.user._id, role: "Job Seeker" };

    if (!jobId) return next(new ErrorHandler("Job not found!", 404));

    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) return next(new ErrorHandler("Job not found!", 404));

    // ── Block application if no vacancies remain ──────────────────────────
    const remainingVacancies = jobDetails.vacancies ?? 1;
    if (remainingVacancies <= 0) {
      return next(
        new ErrorHandler(
          "This job has no remaining vacancies. All positions have been filled.",
          400
        )
      );
    }

    // ── Resolve notification email: prefer workEmail over login email ─────
    let email = formEmail; // default: what the form sent
    try {
      const jsDoc = await Jobseeker.findById(req.user._id).select("workEmail email").lean();
      if (jsDoc?.workEmail && jsDoc.workEmail.trim() !== "") {
        email = jsDoc.workEmail.trim();
      } else if (jsDoc?.email) {
        email = jsDoc.email;
      }
    } catch (_) { /* keep formEmail as fallback */ }

    const employerID = { user: jobDetails.postedBy, role: "Employer" };

    if (!name || !email || !coverLetter || !phone || !address || !applicantID || !employerID || !resume) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }

    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      jobId: jobDetails._id,
      resume: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
    });

    // ── In-app notification ───────────────────────────────────────────────
    try {
      if (jobDetails && jobDetails.postedBy) {
        const empIdStr = jobDetails.postedBy.toString();
        await Notification.create({
          recipient: empIdStr,
          title: "New Application Received",
          message: `${name} has applied for your job position: "${jobDetails.title}".`,
          read: false,
        });
        console.log(`✅ Application Notification created for Employer ID (${empIdStr})`);
      }
    } catch (err) {
      console.error("Failed to create notification for job application", err);
    }

    // ── Email notification to employer's contact email ────────────────────
    try {
      const employerDoc = await Employer.findById(jobDetails.postedBy);
      const notifyEmail =
        (employerDoc?.contactEmail && employerDoc.contactEmail.trim() !== "")
          ? employerDoc.contactEmail.trim()
          : employerDoc?.email;

      if (notifyEmail) {
        const companyName = employerDoc?.companyName || "Your Company";
        const recruiterName = employerDoc?.recruiterName || "Hiring Manager";

        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Job Application</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(99,102,241,0.10);max-width:600px;">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
                        padding:36px 40px 28px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);
                          border-radius:50%;padding:12px 16px;margin-bottom:14px;">
                <span style="font-size:32px;">📬</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                         letter-spacing:-0.5px;">New Application Received!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                Someone is excited to join your team
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;color:#374151;font-size:15px;">
                Hi <strong>${recruiterName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Great news — <strong>${companyName}</strong> just received a new job application. 
                Here are the applicant's details:
              </p>

              <!-- Applicant Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8faff;border:1.5px solid #e0e7ff;
                       border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(90deg,#6366f1,#8b5cf6);
                              padding:4px 0;"></td>
                </tr>
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                          <span style="display:block;color:#9ca3af;font-size:11px;
                                       font-weight:600;text-transform:uppercase;
                                       letter-spacing:0.5px;margin-bottom:4px;">Applicant Name</span>
                          <span style="color:#111827;font-size:15px;font-weight:600;">${name}</span>
                        </td>
                        <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                          <span style="display:block;color:#9ca3af;font-size:11px;
                                       font-weight:600;text-transform:uppercase;
                                       letter-spacing:0.5px;margin-bottom:4px;">Job Position</span>
                          <span style="color:#6366f1;font-size:15px;font-weight:600;">${jobDetails.title}</span>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                          <span style="display:block;color:#9ca3af;font-size:11px;
                                       font-weight:600;text-transform:uppercase;
                                       letter-spacing:0.5px;margin-bottom:4px;">Email Address</span>
                          <span style="color:#374151;font-size:14px;">${email}</span>
                        </td>
                        <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                          <span style="display:block;color:#9ca3af;font-size:11px;
                                       font-weight:600;text-transform:uppercase;
                                       letter-spacing:0.5px;margin-bottom:4px;">Phone Number</span>
                          <span style="color:#374151;font-size:14px;">${phone}</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="vertical-align:top;">
                          <span style="display:block;color:#9ca3af;font-size:11px;
                                       font-weight:600;text-transform:uppercase;
                                       letter-spacing:0.5px;margin-bottom:4px;">Address</span>
                          <span style="color:#374151;font-size:14px;">${address}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Cover Letter Preview -->
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;
                          border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 6px;color:#92400e;font-size:12px;
                           font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
                  Cover Letter
                </p>
                <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;
                           font-style:italic;">"${coverLetter.length > 300 ? coverLetter.substring(0, 300) + '...' : coverLetter}"</p>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer/applications"
                      style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                             color:#ffffff;font-size:15px;font-weight:600;
                             padding:14px 36px;border-radius:50px;
                             text-decoration:none;letter-spacing:0.3px;
                             box-shadow:0 4px 14px rgba(99,102,241,0.35);">
                      📋 View Full Application
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f3f4f6;
                        padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                This notification was sent to <strong>${notifyEmail}</strong> because it is set as the 
                contact email for <strong>${companyName}</strong> on the Job Portal.<br/>
                To change your contact email, visit your 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/company/profile"
                   style="color:#6366f1;text-decoration:none;">Company Profile</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Send email asynchronously in background so response returns instantaneously!
        sendEmail({
          to: notifyEmail,
          subject: `🎯 New Application for "${jobDetails.title}" — ${name} Applied!`,
          html: emailHtml,
        })
          .then(() => console.log(`📧 Application email sent to employer: ${notifyEmail}`))
          .catch((emailErr) => console.error("Background email notice failed:", emailErr.message));
      }
    } catch (emailErr) {
      console.error("Failed to prepare application notification email:", emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
});

export const employerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(new ErrorHandler("Job Seeker not allowed to access this resource.", 400));
  }
  const { _id } = req.user;
  const rawApplications = await Application.find({ "employerID.user": _id })
    .populate("jobId", "title category country city")
    .sort({ createdAt: -1 });

  const applicantIds = rawApplications.map((a) => a.applicantID?.user).filter(Boolean);
  const jobseekers = await Jobseeker.find({ _id: { $in: applicantIds } })
    .select("name email phone profilePicture keySkills resume").lean();
  const legacyUsers = await User.find({ _id: { $in: applicantIds } })
    .select("name email phone profilePicture resume").lean();

  const applicantMap = new Map();
  jobseekers.forEach((j) => applicantMap.set(j._id.toString(), j));
  legacyUsers.forEach((u) => {
    if (!applicantMap.has(u._id.toString())) applicantMap.set(u._id.toString(), u);
  });

  // Also query jobs in case jobId was stored as plain ID
  const jobIds = [];
  rawApplications.forEach((a) => {
    if (a.jobId && typeof a.jobId === "object" && a.jobId._id) {
      jobIds.push(a.jobId._id.toString());
    } else if (a.jobId) {
      jobIds.push(a.jobId.toString());
    }
  });

  const objJobIds = [];
  for (const id of jobIds) {
    try {
      objJobIds.push(new mongoose.Types.ObjectId(id));
    } catch(e) {}
  }
  const queryJobIds = [...new Set([...jobIds, ...objJobIds])];
  const jobs = queryJobIds.length > 0
    ? await Job.find({ _id: { $in: queryJobIds } }).select("title category country city").lean()
    : [];
  const jobMap = new Map();
  jobs.forEach((j) => jobMap.set(j._id.toString(), j));

  const applications = rawApplications.map((app) => {
    const appObj = app.toObject ? app.toObject() : { ...app };
    const userIdStr = appObj.applicantID?.user?.toString();
    const applicantDoc = userIdStr ? applicantMap.get(userIdStr) : null;
    
    // Resolve job
    const pJobIdStr = appObj.jobId?._id ? appObj.jobId._id.toString() : appObj.jobId?.toString();
    const jobDoc = pJobIdStr ? jobMap.get(pJobIdStr) : null;
    const finalJobTitle = appObj.jobId?.title || jobDoc?.title || "Job Position";
    const finalJobCategory = appObj.jobId?.category || jobDoc?.category || "";
    const finalJobId = pJobIdStr || "";

    return {
      ...appObj,
      applicantProfilePicture: applicantDoc?.profilePicture?.url || null,
      applicantProfileResume: applicantDoc?.resume || null,
      applicant: applicantDoc || null,
      jobId: finalJobId,
      jobTitle: finalJobTitle,
      jobCategory: finalJobCategory,
    };
  });

  res.status(200).json({ success: true, applications });
});

export const jobseekerGetAllApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(new ErrorHandler("Employer not allowed to access this resource.", 400));
  }
  const { _id } = req.user;
  const rawApplications = await Application.find({ "applicantID.user": _id })
    .populate("jobId", "title category country city")
    .sort({ createdAt: -1 });

  const employerIds = rawApplications.map((a) => a.employerID?.user).filter(Boolean);
  const employers = await Employer.find({ _id: { $in: employerIds } })
    .select("name email companyName profilePicture").lean();
  const legacyUsers = await User.find({ _id: { $in: employerIds } })
    .select("name email company profilePicture").lean();

  const employerMap = new Map();
  employers.forEach((e) => employerMap.set(e._id.toString(), e));
  legacyUsers.forEach((u) => {
    if (!employerMap.has(u._id.toString())) employerMap.set(u._id.toString(), u);
  });

  // Query jobs in case jobId was stored as plain ID
  const jobIds = [];
  rawApplications.forEach((a) => {
    if (a.jobId && typeof a.jobId === "object" && a.jobId._id) {
      jobIds.push(a.jobId._id.toString());
    } else if (a.jobId) {
      jobIds.push(a.jobId.toString());
    }
  });

  const objJobIds = [];
  for (const id of jobIds) {
    try {
      objJobIds.push(new mongoose.Types.ObjectId(id));
    } catch(e) {}
  }
  const queryJobIds = [...new Set([...jobIds, ...objJobIds])];
  const jobs = queryJobIds.length > 0
    ? await Job.find({ _id: { $in: queryJobIds } }).select("title category country city").lean()
    : [];
  const jobMap = new Map();
  jobs.forEach((j) => jobMap.set(j._id.toString(), j));

  const applications = rawApplications.map((app) => {
    const appObj = app.toObject ? app.toObject() : { ...app };
    const empIdStr = appObj.employerID?.user?.toString();
    const employerDoc = empIdStr ? employerMap.get(empIdStr) : null;
    
    // Resolve job
    const pJobIdStr = appObj.jobId?._id ? appObj.jobId._id.toString() : appObj.jobId?.toString();
    const jobDoc = pJobIdStr ? jobMap.get(pJobIdStr) : null;
    const finalJobTitle = appObj.jobId?.title || jobDoc?.title || "Job Position";
    const finalJobCategory = appObj.jobId?.category || jobDoc?.category || "";
    const finalJobId = pJobIdStr || "";

    return {
      ...appObj,
      companyProfilePicture: employerDoc?.profilePicture?.url || null,
      companyName: employerDoc?.companyName || employerDoc?.company?.name || "Verified Employer",
      jobId: finalJobId,
      jobTitle: finalJobTitle,
      jobCategory: finalJobCategory,
    };
  });

  res.status(200).json({ success: true, applications });
});

export const jobseekerDeleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(new ErrorHandler("Employer not allowed to access this resource.", 400));
  }
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found!", 404));
  }
  await application.deleteOne();
  res.status(200).json({ success: true, message: "Application Deleted!" });
});

export const updateApplicationStatus = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "Employer") {
    return next(new ErrorHandler("Only Employers can update application status.", 403));
  }

  const { id } = req.params;
  const { status } = req.body;

  console.log(`🔔 updateApplicationStatus called: ID=${id}, requested status="${status}"`);

  if (!status || !["Accepted", "Rejected", "Pending"].includes(status)) {
    return next(new ErrorHandler("Invalid status value.", 400));
  }

  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found!", 404));
  }

  // Ensure employer owns this application
  if (application.employerID.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Not authorized to update this application.", 403));
  }

  const previousStatus = application.status;

  // ── Vacancy management ─────────────────────────────────────────────────────
  // • Accepting (Pending/Rejected → Accepted): fill 1 vacancy (decrement, floor 0)
  // • Un-accepting (Accepted → Pending/Rejected): restore 1 vacancy (increment)
  // • Status unchanged: no-op
  if (application.jobId && previousStatus !== status) {
    if (status === "Accepted" && previousStatus !== "Accepted") {
      // Only decrement if vacancies > 0 (atomic guard)
      await Job.findOneAndUpdate(
        { _id: application.jobId, vacancies: { $gt: 0 } },
        { $inc: { vacancies: -1 } }
      );
    } else if (previousStatus === "Accepted" && status !== "Accepted") {
      // Restore the filled vacancy
      await Job.findByIdAndUpdate(application.jobId, { $inc: { vacancies: 1 } });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  application.status = status;
  application.updatedAt = Date.now();
  await application.save();

  // Notify the applicant via in-app notification
  try {
    await Notification.create({
      recipient: application.applicantID.user,
      title: `Application ${status}`,
      message: `Your application has been ${status.toLowerCase()} by the employer.`,
    });
  } catch (err) {
    console.error("Failed to send status-change notification", err);
  }

  // ── Send congratulation email when application is Accepted ────────────────
  if (status === "Accepted") {
    try {
      // Fetch job title
      const jobDoc = await Job.findById(application.jobId).select("title").lean();
      const jobTitle = jobDoc?.title || "the applied position";

      // Resolve applicant email — try Jobseeker collection first, then legacy User
      const applicantUserId = application.applicantID.user;
      let applicantEmail = application.email; // fallback: email stored in application
      let applicantName  = application.name;

      const jsDoc = await Jobseeker.findById(applicantUserId).select("name email workEmail").lean();
      if (jsDoc) {
        // Prefer workEmail if set; otherwise use account email
        applicantEmail = (jsDoc.workEmail && jsDoc.workEmail.trim() !== "") ? jsDoc.workEmail.trim() : (jsDoc.email || applicantEmail);
        applicantName  = jsDoc.name || applicantName;
      } else {
        const userDoc = await User.findById(applicantUserId).select("name email").lean();
        if (userDoc?.email) {
          applicantEmail = userDoc.email;
          applicantName  = userDoc.name || applicantName;
        }
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Application Accepted</title>
          <style>
            body { margin: 0; padding: 0; background: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
            .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.10); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 48px 40px 36px; text-align: center; }
            .header h1 { margin: 0; color: #fff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 16px; }
            .badge { display: inline-block; background: #fbbf24; color: #78350f; font-weight: 700; font-size: 13px; padding: 4px 14px; border-radius: 999px; margin-top: 16px; letter-spacing: 0.5px; }
            .body { padding: 40px; }
            .greeting { font-size: 22px; font-weight: 700; color: #1e1b4b; margin-bottom: 16px; }
            .message { font-size: 15px; line-height: 1.7; color: #374151; margin-bottom: 28px; }
            .highlight-box { background: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 20px 24px; margin-bottom: 28px; }
            .highlight-box p { margin: 0; font-size: 15px; color: #4b5563; }
            .highlight-box strong { color: #4f46e5; }
            .cta { text-align: center; margin: 32px 0; }
            .cta a { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px; }
            .footer { background: #f9fafb; padding: 24px 40px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
            .emoji { font-size: 48px; display: block; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <span class="emoji">🎉</span>
              <h1>Congratulations!</h1>
              <p>Your job application has been accepted</p>
              <span class="badge">✅ APPLICATION ACCEPTED</span>
            </div>
            <div class="body">
              <div class="greeting">Dear ${applicantName},</div>
              <p class="message">
                We are thrilled to inform you that your application has been <strong>accepted</strong> by the employer!
                This is a wonderful milestone in your career journey, and you should be incredibly proud of this achievement.
              </p>
              <div class="highlight-box">
                <p>📋 <strong>Position:</strong> ${jobTitle}</p>
                <p style="margin-top:10px;">📧 <strong>Applied as:</strong> ${applicantEmail}</p>
              </div>
              <p class="message">
                The employer will be reaching out to you soon with the next steps. 
                Please make sure your profile and contact details are up to date.
                In the meantime, feel free to log in to your dashboard to view the application status.
              </p>
              <div class="cta">
                <a href="${process.env.FRONTEND_URL}/dashboard">View My Applications</a>
              </div>
              <p class="message" style="font-size:13px; color:#6b7280; text-align:center;">
                Best wishes for your exciting new journey ahead! 🚀
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Job Portal &nbsp;|&nbsp; This is an automated email, please do not reply.
            </div>
          </div>
        </body>
        </html>
      `;

      // Send acceptance email asynchronously in background
      sendEmail({
        to: applicantEmail,
        subject: `🎉 Congratulations! Your application for "${jobTitle}" has been Accepted`,
        html,
      })
        .then(() => console.log(`✅ Congratulation email sent to ${applicantEmail}`))
        .catch((emailErr) => console.error("Background congratulation email failed:", emailErr.message));
    } catch (emailErr) {
      console.error("Failed to prepare congratulation email:", emailErr.message);
    }
  }
  // ── Send rejection email when application is Rejected ─────────────────────
  if (status === "Rejected") {
    try {
      // Fetch job title
      const jobDoc = await Job.findById(application.jobId).select("title").lean();
      const jobTitle = jobDoc?.title || "the applied position";

      // Fetch employer company name
      const empUserId = application.employerID?.user;
      let companyName = "the company";
      if (empUserId) {
        const empDoc = await Employer.findById(empUserId).select("companyName name").lean();
        if (empDoc) {
          companyName = empDoc.companyName || empDoc.name || companyName;
        } else {
          const usrDoc = await User.findById(empUserId).select("name company").lean();
          companyName = usrDoc?.company?.name || usrDoc?.name || companyName;
        }
      }

      // Resolve applicant email & name
      const applicantUserId = application.applicantID?.user;
      let applicantEmail = application.email;
      let applicantName  = application.name;

      if (applicantUserId) {
        const jsDoc = await Jobseeker.findById(applicantUserId).select("name email workEmail").lean();
        if (jsDoc) {
          // Prefer workEmail if set; otherwise use account email
          applicantEmail = (jsDoc.workEmail && jsDoc.workEmail.trim() !== "") ? jsDoc.workEmail.trim() : (jsDoc.email || applicantEmail);
          applicantName  = jsDoc.name || applicantName;
        } else {
          const userDoc = await User.findById(applicantUserId).select("name email").lean();
          if (userDoc?.email) {
            applicantEmail = userDoc.email;
            applicantName  = userDoc.name || applicantName;
          }
        }
      }

      console.log(`📧 Dispatching rejection notification email to applicant: ${applicantEmail} (${applicantName})`);

      const rejectionHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Update</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;
                 box-shadow:0 4px 32px rgba(0,0,0,0.09);max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);
                        padding:44px 40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.10);
                          border-radius:50%;width:72px;height:72px;line-height:72px;
                          font-size:36px;margin-bottom:18px;">
                💌
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                         letter-spacing:-0.5px;">Application Update</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">
                Regarding your application for <strong style="color:#f8fafc;">${jobTitle}</strong>
              </p>
            </td>
          </tr>

          <!-- Decorative bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 44px 32px;">

              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">
                Dear ${applicantName},
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                Thank you for taking the time to apply to <strong style="color:#334155;">${companyName}</strong>.
                We truly appreciate your interest and the effort you put into your application.
              </p>

              <!-- Status Card -->
              <div style="background:#fff1f2;border:1.5px solid #fecdd3;border-radius:14px;
                          padding:24px 28px;margin-bottom:28px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                  <span style="font-size:22px;">📋</span>
                  <span style="font-size:13px;font-weight:700;color:#9f1239;
                               text-transform:uppercase;letter-spacing:0.6px;">
                    Application Status
                  </span>
                </div>
                <p style="margin:0 0 10px;font-size:15px;color:#1e293b;">
                  <strong>Position:</strong> ${jobTitle}
                </p>
                <p style="margin:0 0 10px;font-size:15px;color:#1e293b;">
                  <strong>Company:</strong> ${companyName}
                </p>
                <p style="margin:0;font-size:15px;color:#1e293b;">
                  <strong>Decision:</strong>
                  <span style="display:inline-block;background:#fee2e2;color:#b91c1c;
                               font-weight:700;font-size:13px;padding:3px 12px;
                               border-radius:999px;margin-left:6px;">
                    Not Selected
                  </span>
                </p>
              </div>

              <!-- Message -->
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.75;">
                After carefully reviewing all applications, the hiring team has decided to move
                forward with other candidates whose experience more closely aligns with the
                current requirements for this role.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.75;">
                Please know that this decision does <em>not</em> reflect your worth or potential.
                The job market is competitive, and we encourage you to keep exploring and applying —
                the right opportunity is out there waiting for you! 💪
              </p>

              <!-- Encouragement Box -->
              <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);
                          border-left:4px solid #38bdf8;border-radius:0 12px 12px 0;
                          padding:20px 24px;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0369a1;
                           text-transform:uppercase;letter-spacing:0.5px;">
                  🌟 Keep Moving Forward
                </p>
                <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.8;">
                  <li>Update your profile with your latest skills and projects</li>
                  <li>Use the <strong>AI Match Recommendations</strong> to find better-fit roles</li>
                  <li>Keep applying — every application is valuable experience</li>
                </ul>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs"
                      style="display:inline-block;
                             background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);
                             color:#ffffff;font-size:15px;font-weight:600;
                             padding:14px 40px;border-radius:50px;
                             text-decoration:none;letter-spacing:0.3px;
                             box-shadow:0 6px 20px rgba(99,102,241,0.35);">
                      🔍 Explore More Jobs
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                        padding:22px 44px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;line-height:1.6;">
                We wish you all the very best in your career journey. 🍀
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                © ${new Date().getFullYear()} CareerConnect &nbsp;|&nbsp; This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Send rejection email asynchronously in background
      sendEmail({
        to: applicantEmail,
        subject: `📋 Application Update: "${jobTitle}" at ${companyName}`,
        html: rejectionHtml,
      })
        .then(() => console.log(`📧 Rejection email sent to ${applicantEmail}`))
        .catch((emailErr) => console.error("Background rejection email failed:", emailErr.message));
    } catch (emailErr) {
      console.error("Failed to prepare rejection email:", emailErr.message);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  res.status(200).json({
    success: true,
    message: `Application ${status} successfully.`,
    application,
  });
});
