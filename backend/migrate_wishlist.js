/**
 * migrate_wishlist.js
 * Backfills all existing wishlist documents that are missing
 * userDetails / jobDetails snapshot fields.
 *
 * Run:  node migrate_wishlist.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch(e) {}

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/Job_Portal";

async function run() {
  console.log("🔗 Connecting to MongoDB Atlas...");
  await mongoose.connect(DB_URL, { dbName: "Job_Portal" });
  console.log("✅ Connected!\n");

  const db = mongoose.connection;
  const wishlists = db.collection("wishlists");
  const users     = db.collection("users");
  const jobs      = db.collection("jobs");

  // Find all documents missing the snapshot fields
  const stale = await wishlists
    .find({ "jobDetails.title": { $exists: false } })
    .toArray();

  if (stale.length === 0) {
    console.log("✅ All wishlist documents already have snapshot fields. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  console.log(`📋 Found ${stale.length} document(s) to backfill...\n`);
  let success = 0;

  for (const doc of stale) {
    const user    = await users.findOne({ _id: doc.user });
    const job     = await jobs.findOne({ _id: doc.job });
    const employer = job?.postedBy
      ? await users.findOne({ _id: job.postedBy })
      : null;

    if (!user || !job) {
      console.warn(`  ⚠️  Skipping ${doc._id} — user or job not found`);
      continue;
    }

    await wishlists.updateOne(
      { _id: doc._id },
      {
        $set: {
          userDetails: {
            name:  user.name  || "",
            email: user.email || "",
          },
          jobDetails: {
            title:       job.title    || "",
            category:    job.category || "",
            city:        job.city     || "",
            country:     job.country  || "",
            location:    job.location || "",
            companyName: employer?.company?.name || "",
            salary: {
              fixed: job.fixedSalary ?? null,
              from:  job.salaryFrom  ?? null,
              to:    job.salaryTo    ?? null,
            },
          },
        },
      }
    );

    console.log(`  ✅ ${doc._id}  →  ${user.name} saved "${job.title}"`);
    success++;
  }

  console.log(`\n🎉 Migration complete! ${success}/${stale.length} documents backfilled.`);
  console.log("👉 Refresh MongoDB Atlas — all wishlist documents now have full details.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  mongoose.disconnect();
});
