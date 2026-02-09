import express, { Request, Response } from "express";
import { Pool } from "pg";
import { PokerService } from "../services/pokerService";
import { verifyToken } from "../middleware/auth";

const router = express.Router();

// Initialize with pool (will be injected)
let pokerService: PokerService;

export function initPokerRoutes(pool: Pool) {
  pokerService = PokerService.getInstance(pool);

  // Get all open poker tables
  router.get("/tables", async (req: Request, res: Response) => {
    try {
      const tables = await pokerService.getOpenTables();
      res.json(tables);
    } catch (error: any) {
      console.error("Error fetching poker tables:", error);
      res.status(500).json({ error: "Failed to fetch poker tables" });
    }
  });

  // Get specific table details
  router.get("/tables/:tableId", async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const players = await pokerService.getTablePlayers(tableId);
      res.json({ tableId, players });
    } catch (error: any) {
      console.error("Error fetching table details:", error);
      res.status(500).json({ error: "Failed to fetch table details" });
    }
  });

  // Create new poker table (admin only)
  router.post("/tables", verifyToken, async (req: Request, res: Response) => {
    try {
      const { name, smallBlind, bigBlind, maxPlayers } = req.body;

      if (!name || !smallBlind || !bigBlind) {
        return res.status(400).json({
          error: "Missing required fields: name, smallBlind, bigBlind",
        });
      }

      const table = await pokerService.createTable(name, smallBlind, bigBlind, maxPlayers || 6);
      res.status(201).json(table);
    } catch (error: any) {
      console.error("Error creating poker table:", error);
      res.status(500).json({ error: "Failed to create poker table" });
    }
  });

  // Join a poker table
  router.post("/tables/:tableId/join", verifyToken, async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const { buyIn } = req.body;
      const userId = (req as any).userId;

      if (!buyIn || buyIn <= 0) {
        return res.status(400).json({ error: "Invalid buy-in amount" });
      }

      const success = await pokerService.joinTable(tableId, userId, buyIn);

      if (success) {
        res.json({ message: "Successfully joined table" });
      } else {
        res.status(500).json({ error: "Failed to join table" });
      }
    } catch (error: any) {
      console.error("Error joining poker table:", error);
      res.status(400).json({ error: error.message || "Failed to join poker table" });
    }
  });

  // Leave a poker table
  router.post("/tables/:tableId/leave", verifyToken, async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const { cashOut } = req.body;
      const userId = (req as any).userId;

      if (!cashOut || cashOut <= 0) {
        return res.status(400).json({ error: "Invalid cash out amount" });
      }

      const success = await pokerService.leaveTable(tableId, userId, cashOut);

      if (success) {
        res.json({ message: "Successfully left table and cashed out" });
      } else {
        res.status(500).json({ error: "Failed to leave table" });
      }
    } catch (error: any) {
      console.error("Error leaving poker table:", error);
      res.status(400).json({ error: error.message || "Failed to leave table" });
    }
  });

  // Deal a hand
  router.post("/tables/:tableId/deal", verifyToken, async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;

      const hand = await pokerService.dealHand(tableId);
      res.json(hand);
    } catch (error: any) {
      console.error("Error dealing hand:", error);
      res.status(500).json({ error: "Failed to deal hand" });
    }
  });

  // Complete a hand
  router.post("/hands/:handId/complete", verifyToken, async (req: Request, res: Response) => {
    try {
      const { handId } = req.params;
      const { winnerId, winningHand } = req.body;

      if (!winnerId || !winningHand) {
        return res.status(400).json({
          error: "Missing required fields: winnerId, winningHand",
        });
      }

      await pokerService.completeHand(handId, winnerId, winningHand);
      res.json({ message: "Hand completed successfully" });
    } catch (error: any) {
      console.error("Error completing hand:", error);
      res.status(500).json({ error: "Failed to complete hand" });
    }
  });

  // Get player poker statistics
  router.get("/player/:userId/stats", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const stats = await pokerService.getPlayerStats(parseInt(userId));
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ error: "Failed to fetch player statistics" });
    }
  });

  // Get admin statistics
  router.get("/admin/stats", verifyToken, async (req: Request, res: Response) => {
    try {
      const stats = await pokerService.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin statistics" });
    }
  });

  // Get table history
  router.get("/tables/:tableId/history", async (req: Request, res: Response) => {
    try {
      const { tableId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await pokerService.getTableHistory(tableId, limit);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching table history:", error);
      res.status(500).json({ error: "Failed to fetch table history" });
    }
  });

  return router;
}

export default router;
