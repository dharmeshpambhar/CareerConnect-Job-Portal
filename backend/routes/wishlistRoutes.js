import express from "express";
import {
  toggleWishlist,
  getWishlist,
  removeFromWishlist,
  checkWishlist,
} from "../controllers/wishlistController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Get all wishlist items for the logged-in user
router.get("/", isAuthenticated, getWishlist);

// Toggle (add/remove) a job in the wishlist
router.post("/toggle/:jobId", isAuthenticated, toggleWishlist);

// Explicitly remove a job from the wishlist
router.delete("/:jobId", isAuthenticated, removeFromWishlist);

// Check if a specific job is saved
router.get("/check/:jobId", isAuthenticated, checkWishlist);

export default router;
