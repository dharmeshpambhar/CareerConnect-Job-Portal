import express from "express";
import { getAiJobMatches } from "../controllers/aiController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// POST /api/v1/ai/match — analyze jobseeker profile and return ranked job matches
router.post("/match", isAuthenticated, getAiJobMatches);

export default router;
