import "./dnsConfig.js";
import app, { connectDatabases } from "./app.js";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Try to connect DB, but start server regardless
connectDatabases()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    console.log(
      "Starting server anyway (DB unavailable — some routes may not work)",
    );
    // Start the server even if DB fails so frontend doesn't get a blank error
    app.listen(process.env.PORT, () => {
      console.log(`Server running at port ${process.env.PORT} (limited mode)`);
    });
  });
