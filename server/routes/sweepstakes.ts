import express, { Request, Response } from "express";
import { SweepstakesService } from "../services/sweepstakesService";
import { verifyToken } from "../middleware/auth";

const router = express.Router();
const sweepstakesService = SweepstakesService.getInstance();

// Get contest rules
router.get("/rules", async (req: Request, res: Response) => {
  try {
    const rules = sweepstakesService.getContestRules();
    res.json(rules);
  } catch (error: any) {
    console.error("Error fetching contest rules:", error);
    res.status(500).json({ error: "Failed to fetch contest rules" });
  }
});

// Get privacy policy
router.get("/privacy-policy", async (req: Request, res: Response) => {
  try {
    const policy = sweepstakesService.getPrivacyPolicy();
    res.json(policy);
  } catch (error: any) {
    console.error("Error fetching privacy policy:", error);
    res.status(500).json({ error: "Failed to fetch privacy policy" });
  }
});

// Get terms of service
router.get("/terms", async (req: Request, res: Response) => {
  try {
    const terms = sweepstakesService.getTermsOfService();
    res.json(terms);
  } catch (error: any) {
    console.error("Error fetching terms of service:", error);
    res.status(500).json({ error: "Failed to fetch terms of service" });
  }
});

// Check user eligibility
router.get("/eligibility", verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const eligibility = await sweepstakesService.checkEligibility(userId);
    res.json(eligibility);
  } catch (error: any) {
    console.error("Error checking eligibility:", error);
    res.status(400).json({
      error: error.message || "Failed to check eligibility",
    });
  }
});

// Accept sweepstakes terms
router.post(
  "/accept-terms",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const success = await sweepstakesService.acceptTerms(userId);

      if (success) {
        res.json({ message: "Terms accepted successfully" });
      } else {
        res.status(500).json({ error: "Failed to accept terms" });
      }
    } catch (error: any) {
      console.error("Error accepting terms:", error);
      res.status(500).json({ error: "Failed to accept terms" });
    }
  },
);

// Get user's compliance status
router.get(
  "/compliance-status",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const status = await sweepstakesService.getComplianceStatus(userId);
      res.json(status || { message: "No compliance record found" });
    } catch (error: any) {
      console.error("Error fetching compliance status:", error);
      res.status(500).json({ error: "Failed to fetch compliance status" });
    }
  },
);

// Verify eligibility for sweepstakes entry
router.get(
  "/verify-entry",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const verification =
        await sweepstakesService.verifyEligibilityForEntry(userId);
      res.json(verification);
    } catch (error: any) {
      console.error("Error verifying eligibility:", error);
      res.status(400).json({
        error: error.message || "Failed to verify eligibility",
      });
    }
  },
);

// Admin: Get compliance statistics
router.get("/admin/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    const stats = await sweepstakesService.getComplianceStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching compliance stats:", error);
    res.status(500).json({ error: "Failed to fetch compliance statistics" });
  }
});

// Admin: Get compliance logs
router.get("/admin/logs", verifyToken, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = await sweepstakesService.getComplianceLogs(limit);
    res.json(logs);
  } catch (error: any) {
    console.error("Error fetching compliance logs:", error);
    res.status(500).json({ error: "Failed to fetch compliance logs" });
  }
});

export default router;
