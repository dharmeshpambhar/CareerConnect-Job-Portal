import "../dnsConfig.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Employer } from "../models/employerSchema.js";
import { AdminUser } from "../models/adminUserSchema.js";

dotenv.config();

const dbConnection = async () => {
  const primaryUrl =
    process.env.DB_URL || "mongodb://127.0.0.1:27017/Job_Portal";
  const localUrl = "mongodb://127.0.0.1:27017/Job_Portal";

  const mongooseOptions = {
    dbName: "Job_Portal",
    serverSelectionTimeoutMS: 30000, // 30s timeout allows DNS resolution & TLS negotiation
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 25,
  };

  try {
    await mongoose.connect(primaryUrl, mongooseOptions);

    const isLocal =
      primaryUrl.includes("127.0.0.1") || primaryUrl.includes("localhost");
    console.log(
      isLocal
        ? "✅ MongoDB Connected — Localhost"
        : "✅ MongoDB Connected — Atlas (cloud)",
    );

    // Auto-create collections in Job_Portal if they don't exist yet
    await Jobseeker.createCollection().catch(() => {});
    await Employer.createCollection().catch(() => {});
    await AdminUser.createCollection().catch(() => {});

    // Drop legacy Admin_Portal database if present
    try {
      const adminDb = mongoose.connection.client.db("Admin_Portal");
      const adminDbInfo = await adminDb.listCollections().toArray();
      if (adminDbInfo.length > 0) {
        await adminDb.dropDatabase();
      }
    } catch (e) {
      // Ignore if not present
    }
  } catch (error) {
    console.warn(
      `⚠️ Primary MongoDB connection failed (${error.message}). Attempting retry...`,
    );
    try {
      // Retry primary Atlas connection once before local fallback
      await mongoose.connect(primaryUrl, mongooseOptions);
      console.log("✅ MongoDB Connected — Atlas (cloud) on retry");
    } catch (retryError) {
      console.warn(
        `⚠️ Atlas retry failed (${retryError.message}). Attempting local MongoDB fallback...`,
      );
      try {
        await mongoose.connect(localUrl, {
          dbName: "Job_Portal",
          serverSelectionTimeoutMS: 5000,
        });
        console.log("✅ MongoDB Connected — Localhost (fallback)");
        await Jobseeker.createCollection().catch(() => {});
        await Employer.createCollection().catch(() => {});
        await AdminUser.createCollection().catch(() => {});
      } catch (fallbackError) {
        console.error(
          "❌ MongoDB connection failed completely:",
          fallbackError.message,
        );
        throw fallbackError;
      }
    }
  }
};

export default dbConnection;
