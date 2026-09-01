/**
 * test_wishlist_snapshot.js
 * Manually inserts one wishlist document with snapshot fields to verify
 * the new schema works correctly in Atlas.
 * 
 * Run: node test_wishlist_snapshot.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();

try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch(e) {}

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/Job_Portal";

// ── Inline schema with all snapshot fields ──────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  job:     { type: mongoose.Schema.ObjectId, ref: "Job",  required: true },
  userDetails: {
    name:  { type: String, default: "" },
    email: { type: String, default: "" },
  },
  jobDetails: {
    title:       { type: String, default: "" },
    category:    { type: String, default: "" },
    city:        { type: String, default: "" },
    country:     { type: String, default: "" },
    location:    { type: String, default: "" },
    companyName: { type: String, default: "" },
    salary: {
      fixed: { type: Number, default: null },
      from:  { type: Number, default: null },
      to:    { type: Number, default: null },
    },
  },
  addedAt: { type: Date, default: Date.now },
});

wishlistSchema.index({ user: 1, job: 1 }, { unique: true });
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

async function run() {
  console.log("🔗 Connecting to MongoDB Atlas...");
  await mongoose.connect(DB_URL, { dbName: "Job_Portal" });
  console.log("✅ Connected!\n");

  // Get one real user and one real job from the database
  const userDoc  = await mongoose.connection.collection("users").findOne({});
  const jobDoc   = await mongoose.connection.collection("jobs").findOne({});
  const employer = jobDoc?.postedBy
    ? await mongoose.connection.collection("users").findOne({ _id: jobDoc.postedBy })
    : null;

  if (!userDoc || !jobDoc) {
    console.error("❌ No users or jobs found in the database to test with.");
    await mongoose.disconnect();
    return;
  }

  console.log(`👤 Using user:  ${userDoc.name} (${userDoc.email})`);
  console.log(`💼 Using job:   ${jobDoc.title} — ${jobDoc.city}, ${jobDoc.country}`);
  console.log(`🏢 Company:     ${employer?.company?.name || "(no company set)"}\n`);

  // Delete existing entry if any
  await Wishlist.deleteOne({ user: userDoc._id, job: jobDoc._id });

  const doc = await Wishlist.create({
    user: userDoc._id,
    job:  jobDoc._id,
    userDetails: {
      name:  userDoc.name  || "",
      email: userDoc.email || "",
    },
    jobDetails: {
      title:       jobDoc.title    || "",
      category:    jobDoc.category || "",
      city:        jobDoc.city     || "",
      country:     jobDoc.country  || "",
      location:    jobDoc.location || "",
      companyName: employer?.company?.name || "",
      salary: {
        fixed: jobDoc.fixedSalary ?? null,
        from:  jobDoc.salaryFrom  ?? null,
        to:    jobDoc.salaryTo    ?? null,
      },
    },
  });

  console.log("✅ Test wishlist document inserted!\n");
  console.log("📄 Document saved to Atlas:");
  console.log(JSON.stringify(doc.toObject(), null, 2));
  console.log("\n👉 Refresh MongoDB Atlas — you should now see full details in the 'wishlists' collection.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  mongoose.disconnect();
});
