import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";

const jobseekerSchema = new mongoose.Schema(
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
      default: "Job Seeker",
    },
    location: { type: String, default: "Ahmedabad, INDIA" },
    disabilityStatus: { type: String, default: "I don't have a disability" },
    keySkills: [{ type: String }],
    educationList: [
      {
        degree: String,
        institute: String,
        course: String,
        specialization: String,
        courseType: String,
        startYear: String,
        endYear: String,
        gradingSystem: String,
        grade: String,
      },
    ],
    itSkillsList: [
      {
        name: String,
        version: String,
        lastUsed: String,
        expYears: String,
        expMonths: String,
      },
    ],
    projectsList: [
      {
        title: String,
        client: String,
        status: String,
        year: String,
        month: String,
        details: String,
      },
    ],
    profileSummary: { type: String, default: "" },
    personalDetails: {
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      maritalStatus: { type: String, default: "" },
      category: { type: String, default: "" },
      languages: { type: String, default: "" },
      workPermit: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    resume: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
      name: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    },
    profilePicture: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    notificationSettings: {
      newJobs: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
    },
  },
  { timestamps: true, collection: "jobseekers" }
);

jobseekerSchema.methods.comparePassword = async function (enteredPassword) {
  return enteredPassword === this.password;
};

jobseekerSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: "Job Seeker" }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const Jobseeker = mongoose.model("Jobseeker", jobseekerSchema, "jobseekers");
export const JobseekerProfile = Jobseeker;
