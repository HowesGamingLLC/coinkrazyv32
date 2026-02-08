import express, { RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import squareService from '../services/squareService';
import databaseService from '../services/database';

const router = express.Router();

/**
 * GET /api/square/packages
 * Get all available coin packages
 */
const getPackages: RequestHandler = (_req, res) => {
  try {
    const packages = squareService.getCoinPackages();
    res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get packages',
    });
  }
};

/**
 * POST /api/square/create-payment
 * Create a payment with Square
 * Body: { packageId, nonce }
 */
const createPayment: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { packageId, nonce } = req.body;

    if (!packageId || !nonce) {
      return res.status(400).json({
        success: false,
        error: 'packageId and nonce are required',
      });
    }

    // Verify package exists
    const pkg = squareService.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: 'Package not found',
      });
    }

    // Process payment
    const result = await squareService.createPaymentRequest(packageId, user.id, nonce);

    // Get updated balance
    const balance = await databaseService.getUserBalance(user.id);

    res.json({
      success: true,
      orderId: result.orderId,
      paymentId: result.paymentId,
      amount: result.amount,
      coinsAwarded: pkg.goldCoins + pkg.bonusCoins,
      newBalance: {
        goldCoins: balance.gold_coins,
        sweepsCoins: balance.sweeps_coins,
      },
      message: `Successfully purchased ${pkg.name}!`,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * GET /api/square/payment/:paymentId
 * Get payment details
 */
const getPayment: RequestHandler = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await squareService.getPayment(paymentId);

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment',
    });
  }
};

/**
 * POST /api/square/refund
 * Refund a payment (admin only)
 * Body: { paymentId, amount? }
 */
const refundPayment: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin only',
      });
    }

    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'paymentId is required',
      });
    }

    const amountInCents = amount ? Math.round(amount * 100) : undefined;
    const refund = await squareService.refundPayment(paymentId, amountInCents);

    res.json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Refund failed',
    });
  }
};

/**
 * GET /api/square/orders
 * Get user's order history
 */
const getUserOrders: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    const result = await databaseService.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [user.id, parseInt(limit as string), parseInt(offset as string)],
    );

    res.json({
      success: true,
      orders: result.rows,
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
};

/**
 * GET /api/square/stats (admin only)
 * Get payment statistics
 */
const getPaymentStats: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin only',
      });
    }

    const stats = await squareService.getPaymentStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
};

// Routes
router.get('/packages', getPackages);
router.post('/create-payment', authenticateToken, createPayment);
router.get('/payment/:paymentId', authenticateToken, getPayment);
router.post('/refund', authenticateToken, refundPayment);
router.get('/orders', authenticateToken, getUserOrders);
router.get('/stats', authenticateToken, getPaymentStats);

export default router;
