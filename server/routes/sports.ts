import express, { Request, Response } from "express";
import sportsParlayService from "../services/sportsParlayService";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

// Get upcoming events
router.get("/events", async (req: Request, res: Response) => {
  try {
    const sport = req.query.sport as string | undefined;
    const events = await sportsParlayService.getUpcomingEvents(sport);
    res.json(events);
  } catch (error: any) {
    console.error("Error fetching sports events:", error);
    res.status(500).json({ error: "Failed to fetch sports events" });
  }
});

// Get specific event
router.get("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await sportsParlayService.getEvent(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error: any) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Get live odds for a sport
router.get("/odds/:sport", async (req: Request, res: Response) => {
  try {
    const { sport } = req.params;
    const odds = sportsParlayService.getLiveOdds(sport);
    res.json(odds);
  } catch (error: any) {
    console.error("Error fetching live odds:", error);
    res.status(500).json({ error: "Failed to fetch live odds" });
  }
});

// Create a parlay
router.post("/parlays", verifyToken, async (req: Request, res: Response) => {
  try {
    const { legs, totalWager } = req.body;
    const userId = (req as any).user?.id;

    if (!legs || !Array.isArray(legs) || legs.length === 0) {
      return res.status(400).json({ error: "Invalid parlay legs" });
    }

    if (!totalWager || totalWager <= 0) {
      return res.status(400).json({ error: "Invalid wager amount" });
    }

    const parlay = await sportsParlayService.createParlay(
      userId,
      legs,
      totalWager,
    );
    res.status(201).json(parlay);
  } catch (error: any) {
    console.error("Error creating parlay:", error);
    res.status(400).json({ error: error.message || "Failed to create parlay" });
  }
});

// Get user's parlays
router.get(
  "/user/parlays",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      const parlays = await sportsParlayService.getUserParlays(userId, limit);
      res.json(parlays);
    } catch (error: any) {
      console.error("Error fetching user parlays:", error);
      res.status(500).json({ error: "Failed to fetch user parlays" });
    }
  },
);

// Get specific parlay
router.get(
  "/parlays/:parlayId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { parlayId } = req.params;

      const parlay = await sportsParlayService.getParlay(parlayId);

      if (!parlay) {
        return res.status(404).json({ error: "Parlay not found" });
      }

      res.json(parlay);
    } catch (error: any) {
      console.error("Error fetching parlay:", error);
      res.status(500).json({ error: "Failed to fetch parlay" });
    }
  },
);

// Update event score (admin only)
router.post(
  "/events/:eventId/score",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { homeScore, awayScore } = req.body;

      if (homeScore === undefined || awayScore === undefined) {
        return res.status(400).json({
          error: "Missing required fields: homeScore, awayScore",
        });
      }

      await sportsParlayService.updateEventScore(eventId, homeScore, awayScore);
      res.json({ message: "Event score updated successfully" });
    } catch (error: any) {
      console.error("Error updating event score:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to update event score" });
    }
  },
);

// Get admin statistics
router.get("/admin/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    const stats = await sportsParlayService.getAdminStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin statistics" });
  }
});

// Get parlay history (admin)
router.get(
  "/admin/history",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const history = await sportsParlayService.getParlayHistory(limit);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching parlay history:", error);
      res.status(500).json({ error: "Failed to fetch parlay history" });
    }
  },
);

export default router;
