import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
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
  },
  coverLetter: {
    type: String,
    required: [true, "Please provide a cover letter!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  resume: {
    public_id: {
      type: String, 
      required: true,
    },
    url: {
      type: String, 
      required: true,
    },
  },
  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Job Seeker"],
      required: true,
    },
  },
  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Employer"],
      required: true,
    },
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  fraudReport: {
    isReported: { type: Boolean, default: false },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "FraudReport" },
    reason: { type: String, default: "" },
    status: { type: String, default: "" },
    reportedAt: { type: Date },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for fast application queries, applicant list, employer dashboard, and status lookups
applicationSchema.index({ "applicantID.user": 1, createdAt: -1 });
applicationSchema.index({ "employerID.user": 1, createdAt: -1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });

export const Application = mongoose.model("Application", applicationSchema);
