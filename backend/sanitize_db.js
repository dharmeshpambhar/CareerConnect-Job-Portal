import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const sanitizeDb = async () => {
  try {
    console.log("Connecting to:", process.env.DB_URL);
    await mongoose.connect(process.env.DB_URL, {
      dbName: "Job_Portal",
    });
    console.log("Successfully connected to MongoDB!");

    const jobsCollection = mongoose.connection.db.collection("jobs");
    const jobs = await jobsCollection.find().toArray();
    console.log(`Found ${jobs.length} jobs to inspect/sanitize.`);

    for (const job of jobs) {
      const updates = {};
      
      // Update Country to India
      if (job.country !== "India") {
        updates.country = "India";
      }

      // Update non-Indian cities
      if (job.city && (job.city.toLowerCase() === "oval" || job.city.toLowerCase() === "london" || job.city.toLowerCase() === "new york")) {
        updates.city = "Mumbai";
      }

      // Update location address
      if (job.location && (job.location.includes("England") || job.location.includes("street") || job.location.includes("USA"))) {
        updates.location = "Nariman Point, Mumbai, India";
      }

      if (Object.keys(updates).length > 0) {
        await jobsCollection.updateOne({ _id: job._id }, { $set: updates });
        console.log(`Updated job ID ${job._id}:`, updates);
      }
    }

    console.log("Database sanitization complete!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Sanitization failed:", error);
  }
};

sanitizeDb();