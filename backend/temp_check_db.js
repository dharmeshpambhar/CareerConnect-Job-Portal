import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

//dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const checkDb = async () => {
  try {
    console.log("Connecting to:", process.env.DB_URL);
    await mongoose.connect(process.env.DB_URL, {
      dbName: "Job_Portal",
    });
    console.log("Successfully connected to MongoDB!");

    // Get collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Collections in Job_Portal:",
      collections.map((c) => c.name),
    );

    // Get jobs
    const jobs = await mongoose.connection.db
      .collection("jobs")
      .find()
      .toArray();
    console.log("Total jobs in database:", jobs.length);
    jobs.forEach((j) => {
      console.log(
        `- Title: ${j.title}, Category: ${j.category}, Country: ${j.country}, City: ${j.city}, Location: ${j.location}, Fixed: ${j.fixedSalary}, From: ${j.salaryFrom}, To: ${j.salaryTo}`,
      );
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Database connection check failed:", error);
  }
};

checkDb();
