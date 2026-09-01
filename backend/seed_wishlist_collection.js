/**
 * seed_wishlist_collection.js
 * Run once to force-create the "wishlists" collection in MongoDB Atlas.
 * This script inserts a placeholder document and immediately deletes it.
 *
 * Usage:
 *   cd backend
 *   node seed_wishlist_collection.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { Wishlist } from "./models/wishlistSchema.js";

dotenv.config();

// Force Google/Cloudflare DNS to resolve MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) { /* ignore */ }

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/Job_Portal";

async function run() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(DB_URL, { dbName: "Job_Portal" });
    console.log("✅ Connected!");

    // Insert a placeholder using a fake ObjectId, then delete it immediately
    const fakeId = new mongoose.Types.ObjectId();
    const doc = await Wishlist.create({ user: fakeId, job: fakeId });
    console.log("📝 Placeholder document inserted — collection created.");

    await Wishlist.deleteOne({ _id: doc._id });
    console.log("🗑️  Placeholder deleted.");

    console.log(
      "\n✅ Done! Refresh your MongoDB Atlas cluster — the 'wishlists' collection should now be visible."
    );
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
