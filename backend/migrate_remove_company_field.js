/**
 * Migration: Remove redundant `company` nested object from employers collection.
 *
 * The `company` sub-document duplicated data already stored in flat top-level
 * fields (companyName, industry, companySize, founded, website, location, description).
 * This script unsets it from all existing documents.
 *
 * Run once:  node migrate_remove_company_field.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const DB_URL = process.env.DB_URL;

async function migrate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(DB_URL);
  console.log("Connected.\n");

  const db = mongoose.connection.db;
  const collection = db.collection("employers");

  // Count documents that still have the company field
  const withCompany = await collection.countDocuments({ company: { $exists: true } });
  console.log(`Found ${withCompany} employer document(s) with the redundant 'company' field.`);

  if (withCompany === 0) {
    console.log("Nothing to migrate. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Remove the nested 'company' object from all employer documents
  const result = await collection.updateMany(
    { company: { $exists: true } },
    { $unset: { company: "" } }
  );

  console.log(`Migration complete!`);
  console.log(`   Matched:  ${result.matchedCount}`);
  console.log(`   Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
