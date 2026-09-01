import express from "express";
import compression from "compression";
import dbConnection from "./database/dbConnection.js";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import { ensureAdminExists } from "./controllers/adminAuthController.js";
import { config } from "dotenv";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import mongoose from "mongoose";
import os from "os";

const app = express();
config();

// Enable Gzip/Deflate response compression for ultra-fast payload delivery
app.use(compression());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
    ],
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
  }),
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/ai", aiRouter);

// ── ONE-TIME MIGRATION: Remove redundant `company` nested object from employers ──
// Visit http://localhost:4000/api/v1/migrate/remove-employer-company once, then remove this route.
/*app.get("/api/v1/migrate/remove-employer-company", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("employers");
    const withCompany = await collection.countDocuments({ company: { $exists: true } });
    if (withCompany === 0) {
      return res.json({ success: true, message: "Nothing to migrate — no employer documents have the redundant company field.", modified: 0 });
    }
    const result = await collection.updateMany(
      { company: { $exists: true } },
      { $unset: { company: "" } }
    );
    res.json({
      success: true,
      message: `Migration complete! Removed the redundant 'company' field from ${result.modifiedCount} employer document(s).`,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});*/

// Connect database — admin data now lives in Job_Portal alongside jobseekers & employers
export const connectDatabases = async () => {
  await dbConnection();
  await ensureAdminExists();
};

app.use(errorMiddleware);
export default app;
