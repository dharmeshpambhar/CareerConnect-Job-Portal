import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";

const employerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your Name!"],
      minLength: [3, "Name must contain at least 3 Characters!"],
      maxLength: [30, "Name cannot exceed 30 Characters!"],
    },
    email: {
      type: String,
      required: [true, "Please enter your Email!"],
      validate: [validator.isEmail, "Please provide a valid Email!"],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Please enter your Phone Number!"],
    },
    password: {
      type: String,
      required: [true, "Please provide a Password!"],
      minLength: [8, "Password must contain at least 8 characters!"],
      select: false,
    },
    role: {
      type: String,
      default: "Employer",
    },
    // ── Company info stored flat (no redundant nested 'company' object) ──
    companyName:  { type: String, default: "Acme Technologies" },
    tagline:      { type: String, default: "Empowering Careers & Driving Digital Innovation" },
    industry:     { type: String, default: "Information Technology & Software" },
    companySize:  { type: String, default: "51–200 employees" },
    founded:      { type: String, default: "2018" },
    website:      { type: String, default: "" },
    location:     { type: String, default: "" },
    description:  { type: String, default: "" },
    // ── Recruiter / HR contact ──
    recruiterName:  { type: String, default: "" },
    recruiterTitle: { type: String, default: "Talent Acquisition Lead" },
    // contactEmail is separate from account email — used only for job-application notifications
    contactEmail:   { type: String, default: "" },
    perks: [{ type: String }],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    profilePicture: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    notificationSettings: {
      newJobs:             { type: Boolean, default: true },
      applicationUpdates:  { type: Boolean, default: true },
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    blacklistReason: {
      type: String,
      default: "",
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Warned", "Frozen", "Blacklisted"],
      default: "Active",
    },
    // ── Company Certificate & Admin Verification ──
    companyRegistrationNumber: {
      type: String,
      default: "",
    },
    companyCertificate: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
      fileName: { type: String, default: "" },
      uploadedAt: { type: Date, default: null },
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationRemarks: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "employers" }
);

employerSchema.methods.comparePassword = async function (enteredPassword) {
  return enteredPassword === this.password;
};

employerSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: "Employer" }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const Employer = mongoose.model("Employer", employerSchema, "employers");
export const EmployerProfile = Employer;
