import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
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
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  password: {
    type: String,
    required: [true, "Please provide a Password!"],
    minLength: [8, "Password must contain at least 8 characters!"],
    maxLength: [32, "Password cannot exceed 32 characters!"],
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: ["Job Seeker", "Employer", "Admin"],
  },
  company: {
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    industry: { type: String, default: "" },
    website: { type: String, default: "" },
    location: { type: String, default: "" },
    size: { type: String, default: "" },
    founded: { type: Number, default: null },
  },
  notificationSettings: {
    newJobs: {
      type: Boolean,
      default: true,
    },
    applicationUpdates: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


//COMPARING THE USER PASSWORD ENTERED BY USER WITH THE USER SAVED PASSWORD
// NOTE: Passwords are stored as plain text (not recommended for production)
userSchema.methods.comparePassword = async function (enteredPassword) {
  return enteredPassword === this.password;
};

//GENERATING A JWT TOKEN WHEN A USER REGISTERS OR LOGINS, IT DEPENDS ON OUR CODE THAT WHEN DO WE NEED TO GENERATE THE JWT TOKEN WHEN THE USER LOGIN OR REGISTER OR FOR BOTH. 
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

export const User = mongoose.model("User", userSchema);
