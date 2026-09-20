import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { Employer } from "../models/employerSchema.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import mongoose from "mongoose";

// Helper function to attach populated employer & company details to jobs
const populateJobsWithCompanyDetails = async (rawJobs) => {
  if (!rawJobs || rawJobs.length === 0) return [];
  
  const isArray = Array.isArray(rawJobs);
  const jobsList = isArray ? rawJobs : [rawJobs];
  
  const postedByIdsRaw = jobsList.map((j) => (j.postedBy?._id || j.postedBy)).filter(Boolean);
  
  const objIds = [];
  for (const id of postedByIdsRaw) {
    try {
      objIds.push(new mongoose.Types.ObjectId(id.toString()));
    } catch(e) {}
  }
  const queryIds = [...postedByIdsRaw, ...objIds];

  const users = await User.find({ _id: { $in: queryIds } }).select("name email company role profilePicture").lean();
  const employers = await Employer.find({ _id: { $in: queryIds } }).select("name email companyName tagline industry companySize founded website location description profilePicture faqs recruiterName recruiterTitle").lean();
  
  const userMap = new Map();
  users.forEach((u) => userMap.set(u._id.toString(), u));
  
  const employerMap = new Map();
  employers.forEach((e) => employerMap.set(e._id.toString(), e));
  
  const enrichedJobs = jobsList.map((job) => {
    const jobObj = job.toObject ? job.toObject() : { ...job };
    const pId = jobObj.postedBy?._id ? jobObj.postedBy._id.toString() : jobObj.postedBy?.toString();
    
    const emp = pId ? employerMap.get(pId) : null;
    const usr = pId ? userMap.get(pId) : null;
    
    const resolvedCompanyName = (emp?.companyName && emp.companyName.trim() !== "")
      ? emp.companyName.trim()
      : (usr?.company?.name && usr.company.name.trim() !== "")
      ? usr.company.name.trim()
      : (emp?.name && emp.name.trim() !== "")
      ? `${emp.name.trim()}'s Company`
      : (usr?.name && usr.name.trim() !== "")
      ? `${usr.name.trim()}'s Company`
      : "Verified Employer";
    
    return {
      ...jobObj,
      postedBy: {
        _id: pId || jobObj.postedBy,
        name: emp?.name || usr?.name || "Employer",
        email: emp?.email || usr?.email || "",
        companyName: resolvedCompanyName,
        profilePicture: emp?.profilePicture || usr?.profilePicture || null,
        faqs: emp?.faqs || usr?.company?.faqs || [],
        recruiterName: emp?.recruiterName || emp?.name || usr?.name || "",
        recruiterTitle: emp?.recruiterTitle || "",
        company: {
          name: resolvedCompanyName,
          location: emp?.location || usr?.company?.location || "",
          industry: emp?.industry || usr?.company?.industry || "",
          website: emp?.website || usr?.company?.website || "",
          size: emp?.companySize || usr?.company?.size || "",
          description: emp?.description || usr?.company?.description || "",
          faqs: emp?.faqs || usr?.company?.faqs || [],
          recruiterName: emp?.recruiterName || emp?.name || usr?.name || "",
          recruiterTitle: emp?.recruiterTitle || "",
        },
      },
    };
  });
  
  return isArray ? enrichedJobs : enrichedJobs[0];
};

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const rawJobs = await Job.find({ expired: false }).sort({ jobPostedOn: -1 }).lean();
  
  if (!rawJobs || rawJobs.length === 0) {
    return res.status(200).json({ success: true, jobs: [] });
  }

  const jobIds = rawJobs.map((j) => j._id);

  // Parallelize company details population and application counting
  const [jobs, counts] = await Promise.all([
    populateJobsWithCompanyDetails(rawJobs),
    Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const jobsWithCount = jobs.map((j) => ({
    ...j,
    appliedCount: countMap.get(j._id?.toString()) || 0,
    vacancies: j.vacancies ?? 1,
  }));

  res.status(200).json({
    success: true,
    jobs: jobsWithCount,
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const {
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    vacancies,
    skills,
    experience,
    jobType,
  } = req.body;

  if (!title || !description || !category || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400)
    );
  }

  let parsedSkills = [];
  if (Array.isArray(skills)) {
    parsedSkills = skills.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
  } else if (typeof skills === "string") {
    parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
    vacancies: vacancies ? Math.max(1, parseInt(vacancies, 10)) : 1,
    skills: parsedSkills,
    experience: experience || "Entry Level",
    jobType: jobType || "Full-Time",
    postedBy,
  });

  // Dispatch notifications in background so job posting responds immediately!
  (async () => {
    try {
      const [jobSeekersDb, legacySeekers] = await Promise.all([
        Jobseeker.find({
          $or: [
            { "notificationSettings.newJobs": true },
            { "notificationSettings.newJobs": { $exists: false } }
          ]
        }).select("_id").lean(),
        User.find({
          role: "Job Seeker",
          $or: [
            { "notificationSettings.newJobs": true },
            { "notificationSettings.newJobs": { $exists: false } }
          ]
        }).select("_id").lean()
      ]);

      const combinedMap = new Map();
      [...jobSeekersDb, ...legacySeekers].forEach(seeker => {
        combinedMap.set(seeker._id.toString(), seeker._id);
      });

      const notifications = Array.from(combinedMap.values()).map((seekerId) => ({
        recipient: seekerId,
        title: "New Job Alert!",
        message: `A new job "${title}" has been posted in "${category}" by ${req.user.name}.`,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error("Failed to create notifications for new job (background):", err);
    }
  })();

  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const rawJobs = await Job.find({ postedBy: req.user._id }).sort({ jobPostedOn: -1 });
  const myJobs = await populateJobsWithCompanyDetails(rawJobs);
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  const updateData = { ...req.body };
  if (updateData.skills) {
    if (typeof updateData.skills === "string") {
      updateData.skills = updateData.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  job = await Job.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const rawJob = await Job.findById(id);
    if (!rawJob) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    const job = await populateJobsWithCompanyDetails(rawJob);
    const appliedCount = await Application.countDocuments({ jobId: rawJob._id });
    res.status(200).json({
      success: true,
      job: { ...job, appliedCount, vacancies: job.vacancies ?? 1 },
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});
