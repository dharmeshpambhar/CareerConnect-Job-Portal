import mongoose from "mongoose";

const fraudReportSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  jobTitle: {
    type: String,
    default: "Job Position",
  },
  companyName: {
    type: String,
    default: "Company",
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applicantName: {
    type: String,
    required: true,
  },
  applicantEmail: {
    type: String,
    required: true,
  },
  applicantPhone: {
    type: String,
    default: "",
  },
  reason: {
    type: String,
    required: [true, "Please specify the fraud category."],
  },
  details: {
    type: String,
    required: [true, "Please provide full incident details."],
  },
  evidenceUrl: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Pending Investigation", "Under Review", "Company Warned", "Company Blacklisted", "Dismissed"],
    default: "Pending Investigation",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  actionTaken: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
});

fraudReportSchema.index({ applicantId: 1, createdAt: -1 });
fraudReportSchema.index({ applicationId: 1 });
fraudReportSchema.index({ employerId: 1 });
fraudReportSchema.index({ status: 1 });

export const FraudReport = mongoose.model("FraudReport", fraudReportSchema);
