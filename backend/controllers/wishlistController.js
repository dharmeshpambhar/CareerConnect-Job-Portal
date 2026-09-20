import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Wishlist } from "../models/wishlistSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { Employer } from "../models/employerSchema.js";
import mongoose from "mongoose";
import ErrorHandler from "../middlewares/error.js";

// POST /api/v1/wishlist/toggle/:jobId
export const toggleWishlist = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;
  const userId = req.user._id;

  // Fetch job with employer info for snapshot
  const job = await Job.findById(jobId).populate("postedBy", "name company");
  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  const existing = await Wishlist.findOne({ user: userId, job: jobId });

  if (existing) {
    await Wishlist.deleteOne({ _id: existing._id });
    return res.status(200).json({
      success: true,
      message: "Job removed from wishlist!",
      saved: false,
    });
  }

  // Fetch user for snapshot
  const user = await User.findById(userId).select("name email");

  await Wishlist.create({
    user: userId,
    job: jobId,
    // ── Human-readable snapshot stored directly in the document ──
    userDetails: {
      name:  user?.name  || "",
      email: user?.email || "",
    },
    jobDetails: {
      title:       job.title       || "",
      category:    job.category    || "",
      city:        job.city        || "",
      country:     job.country     || "",
      location:    job.location    || "",
      companyName: job.postedBy?.company?.name || "",
      salary: {
        fixed: job.fixedSalary  ?? null,
        from:  job.salaryFrom   ?? null,
        to:    job.salaryTo     ?? null,
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Job added to wishlist!",
    saved: true,
  });
});

// GET /api/v1/wishlist
export const getWishlist = catchAsyncErrors(async (req, res, next) => {
  const items = await Wishlist.find({ user: req.user._id })
    .populate("job")
    .sort({ addedAt: -1 })
    .lean();

  if (!items || items.length === 0) {
    return res.status(200).json({ success: true, wishlist: [] });
  }

  // Enrich jobs with full employer details (companyName, profilePicture from Employer and User collections)
  const postedByIdsRaw = items
    .map((item) => item.job?.postedBy?._id || item.job?.postedBy)
    .filter(Boolean);

  const objIds = [];
  for (const id of postedByIdsRaw) {
    try {
      objIds.push(new mongoose.Types.ObjectId(id.toString()));
    } catch (e) {}
  }
  const queryIds = [...postedByIdsRaw, ...objIds];

  const [users, employers] = await Promise.all([
    User.find({ _id: { $in: queryIds } }).select("name email company role profilePicture").lean(),
    Employer.find({ _id: { $in: queryIds } }).select("name email companyName profilePicture").lean(),
  ]);

  const userMap = new Map();
  users.forEach((u) => userMap.set(u._id.toString(), u));

  const employerMap = new Map();
  employers.forEach((e) => employerMap.set(e._id.toString(), e));

  const enrichedItems = items.map((item) => {
    if (!item.job) return item;
    const pId = item.job.postedBy?._id
      ? item.job.postedBy._id.toString()
      : item.job.postedBy?.toString();

    const emp = pId ? employerMap.get(pId) : null;
    const usr = pId ? userMap.get(pId) : null;

    const resolvedCompanyName =
      emp?.companyName && emp.companyName.trim() !== ""
        ? emp.companyName.trim()
        : usr?.company?.name && usr.company.name.trim() !== ""
        ? usr.company.name.trim()
        : emp?.name && emp.name.trim() !== ""
        ? `${emp.name.trim()}'s Company`
        : usr?.name && usr.name.trim() !== ""
        ? `${usr.name.trim()}'s Company`
        : item.jobDetails?.companyName || "Verified Employer";

    const resolvedProfilePic = emp?.profilePicture || usr?.profilePicture || null;

    return {
      ...item,
      job: {
        ...item.job,
        postedBy: {
          ...(typeof item.job.postedBy === "object" ? item.job.postedBy : {}),
          _id: pId,
          name: emp?.name || usr?.name || "Employer",
          companyName: resolvedCompanyName,
          profilePicture: resolvedProfilePic,
        },
      },
    };
  });

  res.status(200).json({
    success: true,
    wishlist: enrichedItems,
  });
});

// DELETE /api/v1/wishlist/:jobId
export const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;

  const result = await Wishlist.findOneAndDelete({
    user: req.user._id,
    job: jobId,
  });

  if (!result) {
    return next(new ErrorHandler("Job not found in your wishlist", 404));
  }

  res.status(200).json({
    success: true,
    message: "Job removed from wishlist!",
  });
});

// GET /api/v1/wishlist/check/:jobId  — check if a specific job is in wishlist
export const checkWishlist = catchAsyncErrors(async (req, res, next) => {
  const { jobId } = req.params;

  const exists = await Wishlist.findOne({ user: req.user._id, job: jobId });

  res.status(200).json({
    success: true,
    saved: !!exists,
  });
});
