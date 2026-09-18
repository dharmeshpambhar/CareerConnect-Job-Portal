import "./dnsConfig.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/Job_Portal";

async function checkWorkEmail() {
  await mongoose.connect(DB_URL, { dbName: "Job_Portal", serverSelectionTimeoutMS: 30000 });
  console.log("✅ Connected");
  const db = mongoose.connection.db;

  // Show all jobseekers' email + workEmail
  const seekers = await db.collection("jobseekers").find({}).project({ name: 1, email: 1, workEmail: 1 }).limit(10).toArray();
  console.log("\n=== JOBSEEKERS (email vs workEmail) ===");
  seekers.forEach(s => {
    console.log(`  name: ${s.name} | email: ${s.email} | workEmail: ${s.workEmail || "(empty)"}`);
  });

  // Also check employer contactEmail
  const employers = await db.collection("employers").find({}).project({ name: 1, email: 1, contactEmail: 1 }).limit(10).toArray();
  console.log("\n=== EMPLOYERS (email vs contactEmail) ===");
  employers.forEach(e => {
    console.log(`  name: ${e.name} | email: ${e.email} | contactEmail: ${e.contactEmail || "(empty)"}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

checkWorkEmail().catch(e => { console.error(e.message); process.exit(1); });
