import { User } from "../models/userSchema.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Employer } from "../models/employerSchema.js";
import { AdminUser } from "../models/adminUserSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  let user = null;

  // Fast direct path based on JWT token's role
  if (decoded.role === "Job Seeker") {
    user = await Jobseeker.findById(decoded.id);
  } else if (decoded.role === "Employer") {
    user = await Employer.findById(decoded.id);
  } else if (decoded.role === "Admin") {
    user = await AdminUser.findById(decoded.id);
  }

  // Fallback parallel check across remaining collections only if needed
  if (!user) {
    const [js, emp, usr, adm] = await Promise.all([
      Jobseeker.findById(decoded.id),
      Employer.findById(decoded.id),
      User.findById(decoded.id),
      AdminUser.findById(decoded.id),
    ]);
    user = js || emp || usr || adm;
  }

  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }

  req.user = user;
  next();
});

// Middleware that authenticates admin users from the Admin_Portal database
export const isAdminAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { admin_token } = req.cookies;
  if (!admin_token) {
    return next(new ErrorHandler("Admin Not Authorized", 401));
  }
  const decoded = jwt.verify(admin_token, process.env.JWT_SECRET_KEY);

  // Only look up in the Admin database
  const adminUser = await AdminUser.findById(decoded.id);
  if (!adminUser) {
    return next(new ErrorHandler("Admin user not found", 401));
  }

  req.user = adminUser;
  next();
});

export const isAdmin = catchAsyncErrors(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("User Not Authenticated", 401));
  }
  if (req.user.role !== "Admin") {
    return next(
      new ErrorHandler(
        `Role (${req.user.role}) is not allowed to access this resource!`,
        403
      )
    );
  }
  next();
});
