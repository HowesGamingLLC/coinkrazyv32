import express, { RequestHandler } from "express";
import { authenticateToken } from "../middleware/auth";
import leaderboardService from "../services/leaderboardService";
import vipService from "../services/vipService";
import tournamentService from "../services/tournamentService";
import affiliateService from "../services/affiliateService";
import socialService from "../services/socialService";

const router = express.Router();

// ============= LEADERBOARDS =============

/**
 * GET /api/bonus/leaderboards/daily
 */
const getDailyLeaderboard: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = await leaderboardService.getDailyLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

/**
 * GET /api/bonus/leaderboards/weekly
 */
const getWeeklyLeaderboard: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = await leaderboardService.getWeeklyLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

/**
 * GET /api/bonus/leaderboards/all-time
 */
const getAllTimeLeaderboard: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = await leaderboardService.getAllTimeLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

/**
 * GET /api/bonus/leaderboards/user-rank
 */
const getUserRank: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const rank = await leaderboardService.getUserRank(user.id);
    res.json({ success: true, rank });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch user rank" });
  }
};

// ============= VIP SYSTEM =============

/**
 * GET /api/bonus/vip/status
 */
const getVIPStatus: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const status = await vipService.getUserVIPStatus(user.id);
    res.json({ success: true, status });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch VIP status" });
  }
};

/**
 * GET /api/bonus/vip/tiers
 */
const getVIPTiers: RequestHandler = (req, res) => {
  try {
    const tiers = vipService.getTiers();
    res.json({ success: true, tiers });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch VIP tiers" });
  }
};

/**
 * POST /api/bonus/vip/redeem-points
 */
const redeemVIPPoints: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { points, rewardType } = req.body;

    const success = await vipService.redeemVIPPoints(
      user.id,
      points,
      rewardType,
    );

    if (success) {
      res.json({ success: true, message: "Points redeemed successfully" });
    } else {
      res.status(400).json({ success: false, message: "Redemption failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Redemption failed" });
  }
};

// ============= TOURNAMENTS =============

/**
 * GET /api/bonus/tournaments
 */
const getTournaments: RequestHandler = async (req, res) => {
  try {
    const tournaments = await tournamentService.getActiveTournaments();
    res.json({ success: true, tournaments });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch tournaments" });
  }
};

/**
 * GET /api/bonus/tournaments/:tournamentId
 */
const getTournamentDetails: RequestHandler = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament =
      await tournamentService.getTournamentDetails(tournamentId);

    if (!tournament) {
      return res
        .status(404)
        .json({ success: false, error: "Tournament not found" });
    }

    res.json({ success: true, tournament });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch tournament" });
  }
};

/**
 * POST /api/bonus/tournaments/:tournamentId/join
 */
const joinTournament: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { tournamentId } = req.params;
    const result = await tournamentService.joinTournament(
      user.id,
      tournamentId,
    );

    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to join tournament" });
  }
};

/**
 * GET /api/bonus/tournaments/:tournamentId/leaderboard
 */
const getTournamentLeaderboard: RequestHandler = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const leaderboard =
      await tournamentService.getTournamentLeaderboard(tournamentId);

    res.json({ success: true, leaderboard });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

// ============= AFFILIATES =============

/**
 * GET /api/bonus/affiliate/code
 */
const getAffiliateCode: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const code = await affiliateService.generateAffiliateCode(user.id);

    res.json({ success: true, code });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate code" });
  }
};

/**
 * GET /api/bonus/affiliate/profile
 */
const getAffiliateProfile: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = await affiliateService.getAffiliateProfile(user.id);

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
};

/**
 * GET /api/bonus/affiliate/tiers
 */
const getAffiliateTiers: RequestHandler = (req, res) => {
  try {
    const tiers = affiliateService.getTiers();
    res.json({ success: true, tiers });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch tiers" });
  }
};

/**
 * POST /api/bonus/affiliate/withdraw
 */
const withdrawAffiliateEarnings: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;

    const result = await affiliateService.withdrawEarnings(user.id, amount);

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: "Withdrawal failed" });
  }
};

/**
 * GET /api/bonus/affiliate/referrals
 */
const getAffiliateReferrals: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const referrals = await affiliateService.getReferrals(user.id);

    res.json({ success: true, referrals });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch referrals" });
  }
};

// ============= SOCIAL FEATURES =============

/**
 * POST /api/bonus/social/message
 */
const sendMessage: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { toUserId, content } = req.body;

    const success = await socialService.sendMessage(user.id, toUserId, content);

    if (success) {
      res.json({ success: true, message: "Message sent" });
    } else {
      res.status(400).json({ success: false, error: "Failed to send message" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
};

/**
 * GET /api/bonus/social/messages
 */
const getMessages: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await socialService.getMessages(user.id, limit);

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch messages" });
  }
};

/**
 * POST /api/bonus/social/friends/add
 */
const addFriend: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { friendId } = req.body;

    const success = await socialService.addFriend(user.id, friendId);

    if (success) {
      res.json({ success: true, message: "Friend added" });
    } else {
      res.status(400).json({ success: false, error: "Already friends" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to add friend" });
  }
};

/**
 * GET /api/bonus/social/friends
 */
const getFriends: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const friends = await socialService.getFriends(user.id);

    res.json({ success: true, friends });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch friends" });
  }
};

/**
 * POST /api/bonus/social/guild/create
 */
const createGuild: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, description, icon, isPublic } = req.body;

    const guildId = await socialService.createGuild(
      user.id,
      name,
      description,
      icon,
      isPublic,
    );

    res.json({ success: true, guildId });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create guild" });
  }
};

/**
 * POST /api/bonus/social/guild/:guildId/join
 */
const joinGuild: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { guildId } = req.params;

    const success = await socialService.joinGuild(user.id, guildId);

    if (success) {
      res.json({ success: true, message: "Guild joined" });
    } else {
      res.status(400).json({ success: false, error: "Already member" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to join guild" });
  }
};

/**
 * GET /api/bonus/social/guilds
 */
const getGuilds: RequestHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const guilds = await socialService.getGuilds(limit);

    res.json({ success: true, guilds });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch guilds" });
  }
};

/**
 * GET /api/bonus/social/guilds/:guildId/members
 */
const getGuildMembers: RequestHandler = async (req, res) => {
  try {
    const { guildId } = req.params;
    const members = await socialService.getGuildMembers(guildId);

    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch members" });
  }
};

/**
 * GET /api/bonus/social/guilds/:guildId/leaderboard
 */
const getGuildLeaderboard: RequestHandler = async (req, res) => {
  try {
    const { guildId } = req.params;
    const leaderboard = await socialService.getGuildLeaderboard(guildId);

    res.json({ success: true, leaderboard });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch leaderboard" });
  }
};

// Register routes
router.get("/leaderboards/daily", getDailyLeaderboard);
router.get("/leaderboards/weekly", getWeeklyLeaderboard);
router.get("/leaderboards/all-time", getAllTimeLeaderboard);
router.get("/leaderboards/user-rank", authenticateToken, getUserRank);

router.get("/vip/status", authenticateToken, getVIPStatus);
router.get("/vip/tiers", getVIPTiers);
router.post("/vip/redeem-points", authenticateToken, redeemVIPPoints);

router.get("/tournaments", getTournaments);
router.get("/tournaments/:tournamentId", getTournamentDetails);
router.post(
  "/tournaments/:tournamentId/join",
  authenticateToken,
  joinTournament,
);
router.get("/tournaments/:tournamentId/leaderboard", getTournamentLeaderboard);

router.get("/affiliate/code", authenticateToken, getAffiliateCode);
router.get("/affiliate/profile", authenticateToken, getAffiliateProfile);
router.get("/affiliate/tiers", getAffiliateTiers);
router.post(
  "/affiliate/withdraw",
  authenticateToken,
  withdrawAffiliateEarnings,
);
router.get("/affiliate/referrals", authenticateToken, getAffiliateReferrals);

router.post("/social/message", authenticateToken, sendMessage);
router.get("/social/messages", authenticateToken, getMessages);
router.post("/social/friends/add", authenticateToken, addFriend);
router.get("/social/friends", authenticateToken, getFriends);
router.post("/social/guild/create", authenticateToken, createGuild);
router.post("/social/guild/:guildId/join", authenticateToken, joinGuild);
router.get("/social/guilds", getGuilds);
router.get("/social/guilds/:guildId/members", getGuildMembers);
router.get("/social/guilds/:guildId/leaderboard", getGuildLeaderboard);

export default router;
