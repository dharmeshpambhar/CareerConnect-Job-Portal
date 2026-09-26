import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import { Notification } from "../models/notificationSchema.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Employer } from "../models/employerSchema.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill full form !"));
  }

  // Admin registration is strictly prohibited (Admin is single fixed account)
  if (role === "Admin" || email.toLowerCase() === "admin@gmail.com") {
    return next(
      new ErrorHandler(
        "Admin registration is not allowed. The portal has only ONE fixed Admin account (admin@gmail.com).",
        400
      )
    );
  }

  // Check if email is already registered across collections
  const existingJobseeker = await Jobseeker.findOne({ email });
  const existingEmployer = await Employer.findOne({ email });
  const existingUser = await User.findOne({ email });

  if (existingJobseeker || existingEmployer || existingUser) {
    return next(new ErrorHandler("Email already registered !"));
  }

  let user;
  if (role === "Job Seeker") {
    user = await Jobseeker.create({
      name,
      email,
      phone,
      password,
      role: "Job Seeker",
      keySkills: ["React.js", "JavaScript", "SQL", "Node.js", "Python"],
    });
  } else if (role === "Employer") {
    let certificateData = {
      public_id: "",
      url: "",
      fileName: "",
      uploadedAt: null,
    };

    if (req.files && req.files.companyCertificate) {
      const { companyCertificate } = req.files;
      const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"];
      const fileName = (companyCertificate.name || "").toLowerCase();
      const fileExt = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
      if (allowedExtensions.includes(fileExt)) {
        try {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            companyCertificate.tempFilePath || companyCertificate.path || companyCertificate,
            {
              folder: "company_certificates",
              resource_type: "auto",
            }
          );
          certificateData = {
            public_id: cloudinaryResponse.public_id || "",
            url: cloudinaryResponse.secure_url || cloudinaryResponse.url || "",
            fileName: companyCertificate.name || "Company_Certificate",
            uploadedAt: new Date(),
          };
        } catch (err) {
          console.warn("Cloudinary certificate upload fallback:", err.message);
          certificateData = {
            public_id: "cert_" + Date.now(),
            url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
            fileName: companyCertificate.name || "Company_Certificate.pdf",
            uploadedAt: new Date(),
          };
        }
      }
    }

    const reqCompanyName = req.body.companyName ? req.body.companyName.trim() : (name || "Company");
    const regNo = req.body.companyRegistrationNumber ? req.body.companyRegistrationNumber.trim() : "";

    user = await Employer.create({
      name,
      email,
      phone,
      password,
      role: "Employer",
      recruiterName: name,
      companyName: reqCompanyName,
      companyRegistrationNumber: regNo,
      companyCertificate: certificateData,
      verificationStatus: "Pending",
      isVerified: false,
    });
  } else {
    user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });
  }

  sendToken(user, 201, res, "Company registered successfully! Your account certificate has been submitted for Admin verification.");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role !"));
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  let user;
  if (role === "Job Seeker") {
    user = await Jobseeker.findOne({ email: cleanEmail }).select("+password");
  } else if (role === "Employer") {
    user = await Employer.findOne({ email: cleanEmail }).select("+password");
  } else if (role === "Admin") {
    user = await User.findOne({ email: cleanEmail, role: "Admin" }).select("+password");
    // Ensure fixed admin user exists in User collection if logging in as Admin
    if (!user && cleanEmail === "admin@gmail.com") {
      user = await User.create({
        name: "System Administrator",
        email: "admin@gmail.com",
        phone: 9999999999,
        password: "admin@123",
        role: "Admin",
      });
    } else if (user && cleanEmail === "admin@gmail.com" && user.password !== "admin@123") {
      user.password = "admin@123";
      await user.save();
    }
  }

  if (!user) {
    user = await User.findOne({ email: cleanEmail }).select("+password");
  }

  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }

  // If Admin role & master admin credentials
  if (user.role === "Admin" && cleanEmail === "admin@gmail.com" && cleanPassword === "admin@123") {
    if (user.password !== "admin@123") {
      user.password = "admin@123";
      await user.save();
    }
    return sendToken(user, 200, res, "Admin Logged In Sucessfully !");
  }

  const isPasswordMatched = await user.comparePassword(cleanPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found !`, 404)
    );
  }
  sendToken(user, 200, res, "User Logged In Sucessfully !");
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, role, newPassword } = req.body;
  if (!email || !role || !newPassword) {
    return next(new ErrorHandler("Please provide email, role, and new password!", 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorHandler("Password must be at least 6 characters!", 400));
  }

  let user;
  if (role === "Job Seeker") {
    user = await Jobseeker.findOne({ email });
  } else if (role === "Employer") {
    user = await Employer.findOne({ email });
  }

  if (!user) {
    user = await User.findOne({ email });
  }

  if (!user) {
    return next(new ErrorHandler("No account found with this email address and role.", 404));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully! You can now log in with your new password.",
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});


export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  // Sanitize user data to remove sensitive fields
  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    company: user.company || {},
    companyName: user.companyName || user.company?.name || user.name || "",
    companyRegistrationNumber: user.companyRegistrationNumber || "",
    companyCertificate: user.companyCertificate || { url: "", fileName: "" },
    verificationStatus: user.verificationStatus || "Pending",
    isVerified: user.isVerified || false,
    verificationRemarks: user.verificationRemarks || "",
    verifiedAt: user.verifiedAt || null,
    notificationSettings: user.notificationSettings || { newJobs: true, applicationUpdates: true },
    profilePicture: user.profilePicture || { public_id: "", url: "" },
  };

  res.status(200).json({
    success: true,
    user: sanitizedUser,
  });
});

export const getNotifications = catchAsyncErrors(async (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(200).json({ success: true, notifications: [] });
  }

  const userId = req.user._id;
  const userIdStr = userId.toString();
  let userObjId = null;
  try {
    userObjId = new mongoose.Types.ObjectId(userIdStr);
  } catch (e) { }

  // 1. Fetch all Notification documents matching this recipient
  const rawNotifs = await Notification.find({
    $or: [
      { recipient: userId },
      { recipient: userIdStr },
      { recipient: userObjId },
    ],
  }).sort({ createdAt: -1 }).lean();

  let notifList = [...rawNotifs];

  // Build a lookup map: applicationId -> DB notification (for synthesized ones)
  const dbNotifByAppId = {};
  notifList.forEach((n) => {
    if (n.applicationId) {
      dbNotifByAppId[n.applicationId] = n;
    }
  });

  // Track notification IDs already in list to avoid duplicates
  const presentIds = new Set(notifList.map((n) => n._id.toString()));

  // 2. EMPLOYER: Synthesize from applications for jobs posted by this employer
  if (req.user.role === "Employer") {
    try {
      // Find all jobs posted by this employer
      const employerJobs = await Job.find({
        $or: [{ postedBy: userId }, { postedBy: userIdStr }],
      }).select("_id title").lean();
      const jobIdList = employerJobs.map((j) => j._id);
      const jobTitleMap = {};
      employerJobs.forEach((j) => { jobTitleMap[j._id.toString()] = j.title; });

      // Get all applications for those jobs
      const [appsForJobs, appsDirect] = await Promise.all([
        jobIdList.length > 0
          ? Application.find({ jobId: { $in: jobIdList } }).select("_id jobId name email createdAt").lean()
          : Promise.resolve([]),
        Application.find({
          $or: [
            { "employerID.user": userId },
            { "employerID.user": userIdStr },
          ],
        }).select("_id jobId name email createdAt").lean(),
      ]);

      // Merge and deduplicate by application _id
      const appMap = new Map();
      [...appsForJobs, ...appsDirect].forEach((app) => {
        if (app && app._id) appMap.set(app._id.toString(), app);
      });

      for (const app of appMap.values()) {
        const appIdStr = app._id.toString();
        const appNotifKey = `employer-app-${appIdStr}`;

        if (dbNotifByAppId[appNotifKey]) {
          presentIds.add(dbNotifByAppId[appNotifKey]._id.toString());
          continue;
        }

        if (presentIds.has(appNotifKey)) continue;

        const jobTitle = app.jobId
          ? (jobTitleMap[app.jobId.toString()] || "your job")
          : "your job";

        const exactMessage = `${app.name} (${app.email}) has applied for your job: "${jobTitle}".`;

        presentIds.add(appNotifKey);
        notifList.push({
          _id: appNotifKey,
          recipient: userIdStr,
          title: "New Job Application Received!",
          message: exactMessage,
          applicationId: appNotifKey,
          read: false,
          createdAt: app.createdAt || new Date(),
        });
      }

      notifList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (appErr) {
      console.error("Error synthesizing employer notifications:", appErr);
    }
  }

  // 3. JOB SEEKER: Synthesize status-change notifications from applications
  if (req.user.role === "Job Seeker") {
    try {
      const seekerApps = await Application.find({
        $or: [
          { "applicantID.user": userId },
          { "applicantID.user": userIdStr },
        ],
      }).sort({ updatedAt: -1 }).select("_id status jobId createdAt updatedAt").lean();

      // Collect unique job IDs for batch fetching titles in ONE query instead of N+1 loop
      const uniqueJobIds = [...new Set(seekerApps.map((a) => a.jobId).filter(Boolean))];
      const jobTitles = await Job.find({ _id: { $in: uniqueJobIds } }).select("_id title").lean();
      const jobTitleMap = new Map(jobTitles.map((j) => [j._id.toString(), j.title]));

      for (const app of seekerApps) {
        if (app.status && app.status !== "Pending") {
          const appIdStr = app._id.toString();
          const appNotifKey = `seeker-status-${appIdStr}`;

          if (dbNotifByAppId[appNotifKey]) {
            presentIds.add(dbNotifByAppId[appNotifKey]._id.toString());
            continue;
          }

          if (presentIds.has(appNotifKey)) continue;

          const jobTitle = (app.jobId && jobTitleMap.get(app.jobId.toString())) || "a job";
          const exactMessage = `Your application for "${jobTitle}" has been marked as "${app.status}" by the employer.`;

          presentIds.add(appNotifKey);
          notifList.push({
            _id: appNotifKey,
            recipient: userIdStr,
            title: `Application Status: ${app.status}`,
            message: exactMessage,
            applicationId: appNotifKey,
            read: false,
            createdAt: app.updatedAt || new Date(),
          });
        }
      }

      notifList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (seekerErr) {
      console.error("Error synthesizing seeker notifications:", seekerErr);
    }
  }

  // 4. Welcome message if completely empty
  if (notifList.length === 0) {
    const roleText = req.user.role === "Employer" ? "Employer" : "Job Seeker";
    notifList = [
      {
        _id: "welcome-1",
        recipient: userIdStr,
        title: `Welcome, ${roleText}!`,
        message:
          req.user.role === "Employer"
            ? "Post job openings to start receiving applications and notifications here."
            : "Explore available jobs and apply — your application updates will appear here.",
        read: false,
        createdAt: new Date(),
      },
    ];
  }

  res.status(200).json({
    success: true,
    notifications: notifList,
  });
});

export const markNotificationsRead = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const userIdStr = userId ? userId.toString() : "";

  // 1. Mark all existing DB notifications as read for this user
  await Notification.updateMany(
    {
      $or: [
        { recipient: userId },
        { recipient: userIdStr },
      ],
      read: false,
    },
    { read: true }
  );

  // 2. For EMPLOYERS: upsert DB records for all application-based synthesized notifications
  //    using applicationId as the unique key so each app gets its own persistent record
  if (req.user.role === "Employer") {
    try {
      const employerJobs = await Job.find({
        $or: [{ postedBy: userId }, { postedBy: userIdStr }],
      });
      const jobIdList = employerJobs.map((j) => j._id);
      const jobTitleMap = {};
      employerJobs.forEach((j) => { jobTitleMap[j._id.toString()] = j.title; });

      const appsForJobs = jobIdList.length > 0
        ? await Application.find({ jobId: { $in: jobIdList } })
        : [];
      const appsDirect = await Application.find({
        $or: [
          { "employerID.user": userId },
          { "employerID.user": userIdStr },
        ],
      });

      const appMap = new Map();
      [...appsForJobs, ...appsDirect].forEach((app) => {
        if (app && app._id) appMap.set(app._id.toString(), app);
      });

      for (const app of appMap.values()) {
        const appIdStr = app._id.toString();
        const appNotifKey = `employer-app-${appIdStr}`;
        const jobTitle = app.jobId
          ? (jobTitleMap[app.jobId.toString()] || "your job")
          : "your job";
        const notifMessage = `${app.name} (${app.email}) has applied for your job: "${jobTitle}".`;

        // Upsert by applicationId (unique per application) — prevents collisions
        await Notification.findOneAndUpdate(
          {
            recipient: userIdStr,
            applicationId: appNotifKey,
          },
          {
            $set: {
              recipient: userIdStr,
              title: "New Job Application Received!",
              message: notifMessage,
              applicationId: appNotifKey,
              read: true,
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.error("Error persisting employer read notifications:", err);
    }
  }

  // 3. For JOB SEEKERS: upsert DB records for all status-change synthesized notifications
  //    using applicationId as unique key to prevent message-collision across multiple apps
  if (req.user.role === "Job Seeker") {
    try {
      const seekerApps = await Application.find({
        $or: [
          { "applicantID.user": userId },
          { "applicantID.user": userIdStr },
        ],
      });

      for (const app of seekerApps) {
        if (app.status && app.status !== "Pending") {
          const appIdStr = app._id.toString();
          const appNotifKey = `seeker-status-${appIdStr}`;

          let jobTitle = "a job";
          try {
            if (app.jobId) {
              const job = await Job.findById(app.jobId).select("title");
              if (job) jobTitle = job.title;
            }
          } catch (e) { }

          const notifMessage = `Your application for "${jobTitle}" has been marked as "${app.status}" by the employer.`;

          // Upsert by applicationId — unique per application, no collision
          await Notification.findOneAndUpdate(
            {
              recipient: userIdStr,
              applicationId: appNotifKey,
            },
            {
              $set: {
                recipient: userIdStr,
                title: `Application Status: ${app.status}`,
                message: notifMessage,
                applicationId: appNotifKey,
                read: true,
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    } catch (err) {
      console.error("Error persisting seeker read notifications:", err);
    }
  }

  res.status(200).json({
    success: true,
    message: "Notifications marked as read!",
  });
});

export const markSingleNotificationRead = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userIdStr = userId ? userId.toString() : "";

  // Try to mark by MongoDB _id first (for real DB notifications)
  let updated = false;
  try {
    const result = await Notification.findOneAndUpdate(
      {
        _id: id,
        $or: [{ recipient: userId }, { recipient: userIdStr }],
      },
      { $set: { read: true } },
      { new: true }
    );
    if (result) updated = true;
  } catch (e) {
    // id might not be a valid ObjectId (synthesized string key), that's OK
  }

  // If not found by _id, try by applicationId (synthesized notifications)
  if (!updated) {
    const result = await Notification.findOneAndUpdate(
      {
        applicationId: id,
        $or: [{ recipient: userId }, { recipient: userIdStr }],
      },
      { $set: { read: true } },
      { new: true }
    );
    // If still no DB record exists, upsert it as read so subsequent fetches show it read
    if (!result) {
      // We can't reconstruct the full notification content here without app data,
      // so we simply create a placeholder; the getNotifications logic uses applicationId to match
      await Notification.findOneAndUpdate(
        {
          applicationId: id,
          recipient: userIdStr,
        },
        {
          $set: {
            applicationId: id,
            recipient: userIdStr,
            title: "Notification",
            message: "",
            read: true,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read!",
  });
});

export const updateNotificationSettings = catchAsyncErrors(async (req, res, next) => {
  const { newJobs, applicationUpdates } = req.body;
  const userId = req.user._id;

  // Find the user in the correct collection — same order as auth middleware
  // Jobseeker → Employer → User (legacy)
  let user = await Jobseeker.findById(userId);
  if (!user) user = await Employer.findById(userId);
  if (!user) user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Ensure notificationSettings object exists (safety for older documents)
  if (!user.notificationSettings) {
    user.notificationSettings = { newJobs: true, applicationUpdates: true };
  }

  if (newJobs !== undefined) user.notificationSettings.newJobs = newJobs;
  if (applicationUpdates !== undefined) user.notificationSettings.applicationUpdates = applicationUpdates;

  // Use markModified so Mongoose detects nested object changes
  user.markModified("notificationSettings");
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Notification settings updated!",
    notificationSettings: user.notificationSettings,
  });
});

export const getCompanyProfile = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Employer") {
    return next(new ErrorHandler("Only employers can access company profiles.", 403));
  }
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    company: user.company || {},
  });
});

export const updateCompanyProfile = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Employer") {
    return next(new ErrorHandler("Only employers can update company profiles.", 403));
  }
  const { name, description, industry, website, location, size, founded } = req.body;

  if (!name || !name.trim()) {
    return next(new ErrorHandler("Company name is required.", 400));
  }

  const companyData = {
    "company.name": name.trim(),
    "company.description": description || "",
    "company.industry": industry || "",
    "company.website": website || "",
    "company.location": location || "",
    "company.size": size || "",
    "company.founded": founded ? Number(founded) : null,
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: companyData },
    { new: true, runValidators: false }
  );

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Company profile updated successfully!",
    company: updatedUser.company,
  });
});

export const getEmployerProfile = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let empData = null;
  let companyData = {};
  let userName = "";
  let userEmail = "";

  try {
    // Try Employer collection first (richer data)
    const employerDoc = await Employer.findById(id);
    if (employerDoc) {
      empData = employerDoc;
      userName = employerDoc.name || "";
      userEmail = employerDoc.email || "";
      companyData = {
        name: employerDoc.companyName || employerDoc.name || "",
        tagline: employerDoc.tagline || "",
        industry: employerDoc.industry || "",
        size: employerDoc.companySize || "",
        founded: employerDoc.founded || "",
        website: employerDoc.website || "",
        location: employerDoc.location || "",
        description: employerDoc.description || "",
        perks: employerDoc.perks || [],
        faqs: employerDoc.faqs || [],
        recruiterTitle: employerDoc.recruiterTitle || "",
      };
    } else {
      // Fallback: try User collection
      const userDoc = await User.findById(id);
      if (!userDoc || userDoc.role !== "Employer") {
        return next(new ErrorHandler("Employer profile not found.", 404));
      }
      empData = userDoc;
      userName = userDoc.name || "";
      userEmail = userDoc.email || "";
      companyData = {
        name: userDoc.company?.name || userDoc.name || "",
        tagline: userDoc.company?.tagline || "",
        industry: userDoc.company?.industry || "",
        size: userDoc.company?.size || "",
        founded: userDoc.company?.founded || "",
        website: userDoc.company?.website || "",
        location: userDoc.company?.location || "",
        description: userDoc.company?.description || "",
        perks: userDoc.company?.perks || [],
        recruiterTitle: userDoc.company?.recruiterTitle || "",
      };
    }
  } catch (error) {
    return next(new ErrorHandler("Invalid Employer ID", 404));
  }

  // Get active jobs posted by this employer
  const jobs = await Job.find({ postedBy: id, expired: false }).sort({ jobPostedOn: -1 });

  res.status(200).json({
    success: true,
    employer: {
      _id: empData._id,
      name: userName,
      email: userEmail,
      role: "Employer",
      profilePicture: empData.profilePicture || null,
      company: companyData,
      faqs: empData.faqs || [],
    },
    jobs,
  });
});


// ============================================================================
// SEPARATE MONGODB COLLECTIONS ENDPOINTS FOR JOBSEEKER & EMPLOYER
// ============================================================================

export const getJobseekerFullProfile = catchAsyncErrors(async (req, res, next) => {
  let profile = await Jobseeker.findById(req.user._id);
  if (!profile) {
    profile = await Jobseeker.create({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone ? req.user.phone.toString() : "",
      keySkills: ["React.js", "JavaScript", "SQL", "Node.js", "Python"],
    });
  }
  res.status(200).json({
    success: true,
    profile,
  });
});

export const updateJobseekerFullProfile = catchAsyncErrors(async (req, res, next) => {
  const profileData = req.body;
  const profile = await Jobseeker.findByIdAndUpdate(
    req.user._id,
    { $set: profileData },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({
    success: true,
    message: "Jobseeker collection document updated in MongoDB Atlas successfully!",
    profile,
  });
});

export const getJobseekerProfileByUserId = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  let profile = await Jobseeker.findById(userId);
  if (!profile) {
    const candidateUser = await User.findById(userId);
    if (!candidateUser) {
      return next(new ErrorHandler("Candidate not found", 404));
    }
    profile = {
      name: candidateUser.name,
      phone: candidateUser.phone ? candidateUser.phone.toString() : "",
      email: candidateUser.email || "",
      location: "Ahmedabad, INDIA",
      profilePicture: candidateUser.profilePicture || null,
      resume: candidateUser.resume || null,
      keySkills: ["React.js", "JavaScript", "SQL", "Node.js", "Python"],
    };
  }
  res.status(200).json({
    success: true,
    profile,
  });
});

export const getEmployerFullProfile = catchAsyncErrors(async (req, res, next) => {
  let profile = await Employer.findById(req.user._id);
  if (!profile) {
    profile = await Employer.create({
      _id: req.user._id,
      name: req.user.name,
      companyName: req.user.name || "Acme Technologies",
      phone: req.user.phone ? req.user.phone.toString() : "",
      email: req.user.email || "",
      recruiterName: req.user.name || "Hiring Lead",
      location: "",
    });
  } else if (profile.location === "Ahmedabad, Gujarat, INDIA" || profile.location === "Ahmedabad, INDIA") {
    profile.location = "";
    await profile.save();
  }
  res.status(200).json({
    success: true,
    profile,
  });
});

export const updateEmployerFullProfile = catchAsyncErrors(async (req, res, next) => {
  const profileData = req.body;
  const profile = await Employer.findByIdAndUpdate(
    req.user._id,
    { $set: profileData },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({
    success: true,
    message: "Employer collection document updated in MongoDB Atlas successfully!",
    profile,
  });
});

export const uploadProfilePicture = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.profilePicture) {
    return next(new ErrorHandler("Please upload an image file.", 400));
  }

  const file = req.files.profilePicture;
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return next(new ErrorHandler("Only JPEG, PNG, GIF, and WebP images are allowed.", 400));
  }

  if (file.size > 3 * 1024 * 1024) {
    return next(new ErrorHandler("Image must be smaller than 3MB.", 400));
  }

  const userId = req.user._id;

  // Determine which collection the user lives in
  let userDoc = await Jobseeker.findById(userId);
  if (!userDoc) userDoc = await Employer.findById(userId);
  if (!userDoc) userDoc = await User.findById(userId);

  if (!userDoc) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Delete old image from Cloudinary if it exists
  if (userDoc.profilePicture && userDoc.profilePicture.public_id) {
    try {
      await cloudinary.uploader.destroy(userDoc.profilePicture.public_id);
    } catch (destroyErr) {
      console.warn("Could not delete old profile picture from Cloudinary:", destroyErr.message);
    }
  }

  // Upload new image to Cloudinary
  let result;
  try {
    result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "job_portal/profile_pictures",
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      fetch_format: "auto",
    });
  } catch (uploadErr) {
    console.error("Cloudinary upload error:", uploadErr);
    return next(new ErrorHandler(`Image upload failed: ${uploadErr.message}`, 500));
  }

  userDoc.profilePicture = {
    public_id: result.public_id,
    url: result.secure_url,
  };
  await userDoc.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully!",
    profilePicture: userDoc.profilePicture,
  });
});

export const deleteProfilePicture = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  let userDoc = await Jobseeker.findById(userId);
  if (!userDoc) userDoc = await Employer.findById(userId);
  if (!userDoc) userDoc = await User.findById(userId);

  if (!userDoc) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Delete from Cloudinary if exists
  if (userDoc.profilePicture && userDoc.profilePicture.public_id) {
    try {
      await cloudinary.uploader.destroy(userDoc.profilePicture.public_id);
    } catch (destroyErr) {
      console.warn("Could not delete profile picture from Cloudinary:", destroyErr.message);
    }
  }

  // Reset to null (default picture)
  userDoc.profilePicture = { public_id: null, url: null };
  await userDoc.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Profile picture removed. Default picture applied.",
  });
});

export const uploadResume = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.resume) {
    return next(new ErrorHandler("Please upload a resume file.", 400));
  }

  const file = req.files.resume;
  const fileName = file.name || "resume";
  const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  const allowedExtensions = [".pdf", ".doc", ".docx", ".rtf", ".png", ".jpg", ".jpeg", ".webp"];

  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/rtf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (!allowedExtensions.includes(fileExt) && !allowedMimeTypes.includes(file.mimetype)) {
    return next(
      new ErrorHandler(
        "Invalid file type. Supported formats: PDF, DOC, DOCX, RTF, PNG, JPEG, WEBP.",
        400
      )
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return next(new ErrorHandler("Resume file must be smaller than 5MB.", 400));
  }

  const userId = req.user._id;
  let userDoc = await Jobseeker.findById(userId);
  if (!userDoc) userDoc = await User.findById(userId);

  if (!userDoc) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Delete previous resume from Cloudinary if exists
  if (userDoc.resume && userDoc.resume.public_id) {
    try {
      await cloudinary.uploader.destroy(userDoc.resume.public_id, {
        resource_type: "raw",
      });
    } catch (destroyErr) {
      console.warn("Could not delete old resume from Cloudinary:", destroyErr.message);
    }
  }

  // Upload new resume to Cloudinary
  let result;
  try {
    result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "job_portal/resumes",
      resource_type: "auto",
    });
  } catch (uploadErr) {
    console.error("Cloudinary resume upload error:", uploadErr);
    return next(new ErrorHandler(`Resume upload failed: ${uploadErr.message}`, 500));
  }

  userDoc.resume = {
    public_id: result.public_id,
    url: result.secure_url,
    name: fileName,
    uploadedAt: new Date(),
  };
  await userDoc.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Resume uploaded successfully!",
    resume: userDoc.resume,
  });
});

export const deleteResume = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  let userDoc = await Jobseeker.findById(userId);
  if (!userDoc) userDoc = await User.findById(userId);

  if (!userDoc) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (userDoc.resume && userDoc.resume.public_id) {
    try {
      await cloudinary.uploader.destroy(userDoc.resume.public_id, {
        resource_type: "raw",
      });
    } catch (destroyErr) {
      console.warn("Could not delete resume from Cloudinary:", destroyErr.message);
    }
  }

  userDoc.resume = { public_id: null, url: null, name: null, uploadedAt: null };
  await userDoc.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Resume deleted successfully!",
  });
});