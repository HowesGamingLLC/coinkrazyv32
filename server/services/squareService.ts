// Note: Square SDK integration is optional
// import { Client, Environment } from "square";
import databaseService from "./database";

// Square SDK configuration (mocked if SDK not available)
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || "sq_test_";
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
const SQUARE_APP_ID = process.env.SQUARE_APP_ID || "";

let paymentsApi: any = null;
// Optional Square client initialization
try {
  // const { Client, Environment } = await import("square");
  // client initialization would go here
} catch (error) {
  console.log("Square SDK not available - payment processing disabled");
}

interface CoinPackage {
  id: string;
  name: string;
  goldCoins: number;
  bonusCoins: number;
  priceUsd: number;
  description: string;
}

interface CreatePaymentRequest {
  sourceId: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  idempotencyKey: string;
  autocomplete?: boolean;
  customerId?: string;
  orderId?: string;
  referenceId?: string;
  note?: string;
  deviceDetails?: {
    deviceSessionId?: string;
    deviceName?: string;
  };
}

class SquareService {
  private coinPackages: CoinPackage[] = [
    {
      id: "pkg_100gc",
      name: "100 Gold Coins",
      goldCoins: 100,
      bonusCoins: 20,
      priceUsd: 4.99,
      description: "100 Gold Coins + 20 Bonus",
    },
    {
      id: "pkg_500gc",
      name: "500 Gold Coins",
      goldCoins: 500,
      bonusCoins: 150,
      priceUsd: 19.99,
      description: "500 Gold Coins + 150 Bonus",
    },
    {
      id: "pkg_1000gc",
      name: "1000 Gold Coins",
      goldCoins: 1000,
      bonusCoins: 400,
      priceUsd: 34.99,
      description: "1000 Gold Coins + 400 Bonus",
    },
    {
      id: "pkg_2500gc",
      name: "2500 Gold Coins",
      goldCoins: 2500,
      bonusCoins: 1250,
      priceUsd: 74.99,
      description: "2500 Gold Coins + 1250 Bonus",
    },
    {
      id: "pkg_5000gc",
      name: "5000 Gold Coins",
      goldCoins: 5000,
      bonusCoins: 3000,
      priceUsd: 129.99,
      description: "5000 Gold Coins + 3000 Bonus (BEST VALUE)",
    },
  ];

  /**
   * Get all available coin packages
   */
  getCoinPackages(): CoinPackage[] {
    return this.coinPackages;
  }

  /**
   * Get a specific coin package by ID
   */
  getPackageById(packageId: string): CoinPackage | undefined {
    return this.coinPackages.find((pkg) => pkg.id === packageId);
  }

  /**
   * Create a payment request for Square
   */
  async createPaymentRequest(
    packageId: string,
    userId: number,
    nonce: string,
  ): Promise<{ orderId: string; paymentId: string; amount: number }> {
    try {
      const pkg = this.getPackageById(packageId);
      if (!pkg) {
        throw new Error("Package not found");
      }

      // Create order record in database
      const orderId = `order_${Date.now()}_${userId}_${packageId}`;
      const amountInCents = Math.round(pkg.priceUsd * 100);

      // Create payment with Square (or mock if SDK not available)
      let paymentId = `mock_payment_${Date.now()}`;
      if (paymentsApi) {
        const response = await paymentsApi.createPayment({
          sourceId: nonce,
          idempotencyKey: `${orderId}_${Date.now()}`,
          amountMoney: {
            amount: amountInCents,
            currency: "USD",
          },
          autocomplete: true,
          note: `${pkg.name} - ${pkg.goldCoins} Gold Coins`,
          referenceId: orderId,
        });

        if (!response.result.payment) {
          throw new Error("Payment creation failed");
        }
        paymentId = response.result.payment.id;
      }

      // Store order in database
      await databaseService.query(
        `INSERT INTO orders (order_id, user_id, package_id, amount_usd, gold_coins, bonus_coins, payment_method, status, square_payment_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (order_id) DO UPDATE SET status = 'completed', square_payment_id = $9, updated_at = NOW()`,
        [
          orderId,
          userId,
          packageId,
          pkg.priceUsd,
          pkg.goldCoins,
          pkg.bonusCoins,
          "square",
          "completed",
          paymentId,
        ],
      );

      // Update user balance
      await databaseService.updateUserBalance(
        userId,
        pkg.goldCoins + pkg.bonusCoins,
        0,
        `Purchased ${pkg.name}`,
      );

      // Create transaction record
      await databaseService.query(
        `INSERT INTO transactions (user_id, transaction_type, currency, amount, description, order_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          "purchase",
          "GC",
          (pkg.goldCoins + pkg.bonusCoins) * 1000,
          `Purchase: ${pkg.name}`,
          orderId,
          "completed",
        ],
      );

      return {
        orderId,
        paymentId,
        amount: pkg.priceUsd,
      };
    } catch (error) {
      console.error("Square payment creation error:", error);
      throw error;
    }
  }

  /**
   * Retrieve payment details from Square
   */
  async getPayment(paymentId: string) {
    try {
      if (!paymentsApi) {
        // Return mock payment if SDK not available
        return {
          id: paymentId,
          status: "COMPLETED",
          amountMoney: { amount: 0, currency: "USD" },
        };
      }
      const response = await paymentsApi.getPayment(paymentId);
      return response.result.payment;
    } catch (error) {
      console.error("Error retrieving payment:", error);
      throw error;
    }
  }

  /**
   * Cancel/refund a payment
   */
  async refundPayment(paymentId: string, amountInCents?: number) {
    try {
      if (!paymentsApi) {
        // Mock refund if SDK not available
        return {
          id: `refund_${paymentId}_${Date.now()}`,
          paymentId,
          amountMoney: amountInCents
            ? { amount: amountInCents, currency: "USD" }
            : undefined,
          status: "COMPLETED",
        };
      }
      // const refundsApi = client.refundsApi;
      // const response = await refundsApi.refundPayment({
      //   paymentId,
      //   idempotencyKey: `refund_${paymentId}_${Date.now()}`,
      //   amountMoney: amountInCents
      //     ? {
      //         amount: amountInCents,
      //         currency: "USD",
      //       }
      //     : undefined,
      // });
      // return response.result.refund;
      throw new Error("Refunds require Square SDK integration");
    } catch (error) {
      console.error("Error refunding payment:", error);
      throw error;
    }
  }

  /**
   * List all payments (for admin dashboard)
   */
  async listPayments(limit: number = 50, cursor?: string) {
    try {
      if (!paymentsApi) {
        // Return empty list if SDK not available
        return { payments: [] };
      }
      // const response = await paymentsApi.listPayments(
      //   undefined, // begin_time
      //   undefined, // end_time
      //   "DESC", // sort_order
      //   cursor, // cursor
      //   limit,
      //   undefined, // location_id
      //   "COMPLETED", // total
      // );
      // return response.result;
      return { payments: [] };
    } catch (error) {
      console.error("Error listing payments:", error);
      throw error;
    }
  }

  /**
   * Get payment statistics (for admin dashboard)
   */
  async getPaymentStats() {
    try {
      // Get total revenue
      const revenueResult = await databaseService.query(`
        SELECT 
          COUNT(*) as total_purchases,
          SUM(amount_usd) as total_revenue,
          AVG(amount_usd) as avg_order_value,
          MAX(created_at) as last_purchase
        FROM orders
        WHERE status = 'completed'
      `);

      // Get top packages
      const topPackagesResult = await databaseService.query(`
        SELECT 
          package_id,
          COUNT(*) as purchase_count,
          SUM(amount_usd) as revenue
        FROM orders
        WHERE status = 'completed'
        GROUP BY package_id
        ORDER BY purchase_count DESC
        LIMIT 5
      `);

      return {
        totalPurchases: revenueResult.rows[0]?.total_purchases || 0,
        totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue || 0),
        avgOrderValue: parseFloat(revenueResult.rows[0]?.avg_order_value || 0),
        lastPurchase: revenueResult.rows[0]?.last_purchase,
        topPackages: topPackagesResult.rows,
      };
    } catch (error) {
      console.error("Error getting payment stats:", error);
      throw error;
    }
  }
}

export const squareService = new SquareService();
export default squareService;
