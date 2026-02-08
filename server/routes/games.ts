import express, { RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import slotsService from '../services/slotsService';
import databaseService from '../services/database';

const router = express.Router();

/**
 * GET /api/games
 * Get all available games
 */
const getAllGames: RequestHandler = async (_req, res) => {
  try {
    const games = await slotsService.getAllGames();
    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
    });
  }
};

/**
 * GET /api/games/featured
 * Get featured games for homepage
 */
const getFeaturedGames: RequestHandler = async (_req, res) => {
  try {
    const games = await slotsService.getFeaturedGames();
    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Error fetching featured games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured games',
    });
  }
};

/**
 * GET /api/games/:gameId
 * Get specific game details
 */
const getGameById: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await slotsService.getGameById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    res.json({
      success: true,
      game,
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game',
    });
  }
};

/**
 * GET /api/games/category/:category
 * Get games by category
 */
const getGamesByCategory: RequestHandler = async (req, res) => {
  try {
    const { category } = req.params;
    const games = await slotsService.getGamesByCategory(category);

    res.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Error fetching games by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games',
    });
  }
};

/**
 * POST /api/games/:gameId/spin
 * Play a spin
 * Body: { betAmount, currency }
 */
const playSpin: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { gameId } = req.params;
    const { betAmount, currency = 'GC' } = req.body;

    if (!betAmount || !['GC', 'SC'].includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet amount or currency',
      });
    }

    // Play spin
    const spinResult = await slotsService.spin(
      gameId,
      user.id,
      betAmount,
      currency,
    );

    // Get updated balance
    const balance = await databaseService.getUserBalance(user.id);

    res.json({
      success: true,
      spin: spinResult,
      newBalance: {
        goldCoins: balance.gold_coins,
        sweepsCoins: balance.sweeps_coins,
      },
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Spin failed',
    });
  }
};

/**
 * GET /api/games/:gameId/stats
 * Get game statistics
 */
const getGameStats: RequestHandler = async (req, res) => {
  try {
    const { gameId } = req.params;

    const stats = await slotsService.getGameStats(gameId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game stats',
    });
  }
};

/**
 * GET /api/games/spins/history (user spins)
 * Get user's spin history
 */
const getSpinHistory: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    const result = await databaseService.query(
      `SELECT 
        s.*, 
        g.name as game_name,
        g.provider,
        g.image
       FROM game_spins s
       JOIN games g ON s.game_id = g.game_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, parseInt(limit as string), parseInt(offset as string)],
    );

    res.json({
      success: true,
      spins: result.rows,
    });
  } catch (error) {
    console.error('Error fetching spin history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spin history',
    });
  }
};

/**
 * GET /api/games/stats/global (admin only)
 * Get global game statistics
 */
const getGlobalStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const stats = await databaseService.query(`
      SELECT 
        COUNT(*) as total_spins,
        COUNT(DISTINCT user_id) as unique_players,
        SUM(bet_amount) as total_bets,
        SUM(payout) as total_payouts,
        SUM(bet_amount) - COALESCE(SUM(payout), 0) as house_profit,
        AVG(multiplier) as avg_multiplier,
        COUNT(CASE WHEN result = 'win' THEN 1 END) as total_wins,
        COUNT(CASE WHEN is_jackpot = true THEN 1 END) as total_jackpots
      FROM game_spins
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
};

// Routes
router.get('/', getAllGames);
router.get('/featured', getFeaturedGames);
router.get('/category/:category', getGamesByCategory);
router.get('/:gameId', getGameById);
router.get('/:gameId/stats', getGameStats);
router.post('/:gameId/spin', authenticateToken, playSpin);
router.get('/user/history', authenticateToken, getSpinHistory);
router.get('/admin/stats', authenticateToken, getGlobalStats);

export default router;
