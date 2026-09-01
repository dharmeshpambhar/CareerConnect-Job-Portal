import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { AdminUser } from "../models/adminUserSchema.js";
import ErrorHandler from "../middlewares/error.js";

// Helper: Send admin token via a separate cookie named "admin_token"
const sendAdminToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: "/",
  };

  res.status(statusCode).cookie("admin_token", token, options).json({
    success: true,
    user,
    message,
    token,
  });
};

// Helper: Ensure the single fixed admin account exists and password is set to admin@123
export const ensureAdminExists = async () => {
  try {
    const fixedEmail = "admin@gmail.com";
    let admin = await AdminUser.findOne({ email: fixedEmail }).select("+password");
    if (!admin) {
      admin = await AdminUser.create({
        name: "System Administrator",
        email: fixedEmail,
        phone: 9999999999,
        password: "admin@123",
        role: "Admin",
      });
      console.log("✅ Fixed Admin account initialized in Job_Portal: admin@gmail.com / admin@123");
    } else {
      const isMatched = await admin.comparePassword("admin@123").catch(() => false);
      if (!isMatched) {
        admin.password = "admin@123";
        await admin.save();
        console.log("🔄 Fixed Admin password synced to admin@123");
      }
    }
  } catch (error) {
    console.warn("Notice: Admin auto-seed check:", error.message);
  }
};

// Admin Registration — disabled because admin has only ONE fixed account
export const adminRegister = catchAsyncErrors(async (req, res, next) => {
  return next(
    new ErrorHandler(
      "Admin registration is not allowed. The portal has only ONE fixed Admin account (admin@gmail.com).",
      403
    )
  );
});

// Admin Login — authenticates from Admin_Portal database using fixed credentials
export const adminLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password!", 400));
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  let admin = await AdminUser.findOne({ email: cleanEmail }).select("+password");
  if (!admin && cleanEmail === "admin@gmail.com") {
    admin = await AdminUser.create({
      name: "System Administrator",
      email: "admin@gmail.com",
      phone: 9999999999,
      password: "admin@123",
      role: "Admin",
    });
  }

  if (!admin) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }

  // Handle master admin login directly and sync if needed
  if (cleanEmail === "admin@gmail.com" && cleanPassword === "admin@123") {
    const isMatched = await admin.comparePassword("admin@123").catch(() => false);
    if (!isMatched) {
      admin.password = "admin@123";
      await admin.save();
    }
    return sendAdminToken(admin, 200, res, "Admin Logged In Successfully!");
  }

  const isPasswordMatched = await admin.comparePassword(cleanPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }

  sendAdminToken(admin, 200, res, "Admin Logged In Successfully!");
});

// Admin Logout — clears the admin_token cookie
export const adminLogout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("admin_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully!",
    });
});

// Get current admin user details — reads from Admin_Portal database
export const getAdminUser = catchAsyncErrors(async (req, res, next) => {
  const admin = req.user;
  res.status(200).json({
    success: true,
    user: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
    },
  });
});
