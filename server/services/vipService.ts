import databaseService from "./database";

interface VIPTier {
  tier: number;
  name: string;
  minSpent: number;
  maxSpent: number;
  icon: string;
  benefits: {
    depositBonus: number;
    cashbackRate: number;
    spinMultiplier: number;
    exclusiveGames: boolean;
    prioritySupport: boolean;
    birthdayBonus: number;
  };
}

interface VIPStatus {
  userId: number;
  currentTier: number;
  totalSpent: number;
  spentThisMonth: number;
  nextTierSpend: number;
  pointsEarned: number;
  pointsBalance: number;
  tier: VIPTier;
}

class VIPService {
  private vipTiers: VIPTier[] = [
    {
      tier: 0,
      name: "Standard",
      minSpent: 0,
      maxSpent: 99.99,
      icon: "👤",
      benefits: {
        depositBonus: 10,
        cashbackRate: 0,
        spinMultiplier: 1,
        exclusiveGames: false,
        prioritySupport: false,
        birthdayBonus: 0,
      },
    },
    {
      tier: 1,
      name: "Silver",
      minSpent: 100,
      maxSpent: 499.99,
      icon: "⭐",
      benefits: {
        depositBonus: 15,
        cashbackRate: 1,
        spinMultiplier: 1.1,
        exclusiveGames: false,
        prioritySupport: false,
        birthdayBonus: 500,
      },
    },
    {
      tier: 2,
      name: "Gold",
      minSpent: 500,
      maxSpent: 1999.99,
      icon: "✨",
      benefits: {
        depositBonus: 20,
        cashbackRate: 2,
        spinMultiplier: 1.2,
        exclusiveGames: true,
        prioritySupport: false,
        birthdayBonus: 1000,
      },
    },
    {
      tier: 3,
      name: "Platinum",
      minSpent: 2000,
      maxSpent: 9999.99,
      icon: "💎",
      benefits: {
        depositBonus: 25,
        cashbackRate: 3,
        spinMultiplier: 1.3,
        exclusiveGames: true,
        prioritySupport: true,
        birthdayBonus: 2500,
      },
    },
    {
      tier: 4,
      name: "Diamond",
      minSpent: 10000,
      maxSpent: Number.MAX_SAFE_INTEGER,
      icon: "👑",
      benefits: {
        depositBonus: 30,
        cashbackRate: 5,
        spinMultiplier: 1.5,
        exclusiveGames: true,
        prioritySupport: true,
        birthdayBonus: 5000,
      },
    },
  ];

  /**
   * Get VIP tier by spend amount
   */
  private getTierBySpend(totalSpent: number): VIPTier {
    for (const tier of [...this.vipTiers].reverse()) {
      if (totalSpent >= tier.minSpent) {
        return tier;
      }
    }
    return this.vipTiers[0];
  }

  /**
   * Get user VIP status
   */
  async getUserVIPStatus(userId: number): Promise<VIPStatus> {
    const query = `
      SELECT 
        COALESCE(SUM(amount_usd), 0)::float as total_spent,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN amount_usd ELSE 0 END), 0)::float as spent_this_month,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) THEN amount_usd ELSE 0 END) * 10 / 100, 0)::int as points_earned
      FROM orders
      WHERE user_id = $1 AND status = 'completed'
    `;

    const result = await databaseService.query(query, [userId]);
    const spending = result.rows[0];

    const currentTier = this.getTierBySpend(spending.total_spent);
    const nextTier = this.vipTiers[currentTier.tier + 1] || currentTier;

    // Get points balance
    const pointsQuery = `
      SELECT COALESCE(vip_points, 0) as points
      FROM users
      WHERE id = $1
    `;
    const pointsResult = await databaseService.query(pointsQuery, [userId]);
    const pointsBalance = pointsResult.rows[0]?.points || 0;

    return {
      userId,
      currentTier: currentTier.tier,
      totalSpent: spending.total_spent,
      spentThisMonth: spending.spent_this_month,
      nextTierSpend: Math.max(0, nextTier.minSpent - spending.total_spent),
      pointsEarned: spending.points_earned,
      pointsBalance,
      tier: currentTier,
    };
  }

  /**
   * Award VIP points
   */
  async awardVIPPoints(
    userId: number,
    points: number,
    reason: string,
  ): Promise<void> {
    await databaseService.query(
      `UPDATE users 
       SET vip_points = GREATEST(0, vip_points + $2)
       WHERE id = $1`,
      [userId, points],
    );

    // Log the transaction
    await databaseService.query(
      `INSERT INTO vip_transactions (user_id, points_change, reason, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, points, reason],
    );
  }

  /**
   * Redeem VIP points
   */
  async redeemVIPPoints(
    userId: number,
    points: number,
    rewardType: string,
  ): Promise<boolean> {
    // Check balance
    const balanceQuery = `SELECT vip_points FROM users WHERE id = $1`;
    const result = await databaseService.query(balanceQuery, [userId]);
    const currentPoints = result.rows[0]?.vip_points || 0;

    if (currentPoints < points) {
      return false;
    }

    // Deduct points
    await databaseService.query(
      `UPDATE users 
       SET vip_points = vip_points - $2
       WHERE id = $1`,
      [userId, points],
    );

    // Apply reward
    let goldCoinsReward = 0;
    switch (rewardType) {
      case "coins_100":
        goldCoinsReward = 100;
        break;
      case "coins_500":
        goldCoinsReward = 500;
        break;
      case "coins_1000":
        goldCoinsReward = 1000;
        break;
    }

    if (goldCoinsReward > 0) {
      await databaseService.updateUserBalance(
        userId,
        goldCoinsReward,
        0,
        `VIP Points Redemption: ${rewardType}`,
      );
    }

    return true;
  }

  /**
   * Get all VIP tiers
   */
  getTiers(): VIPTier[] {
    return this.vipTiers;
  }

  /**
   * Calculate tier progress
   */
  calculateProgress(vipStatus: VIPStatus): {
    percentage: number;
    current: number;
    next: number;
  } {
    const currentTierSpend = vipStatus.tier.minSpent;
    const nextTierSpend =
      this.vipTiers[vipStatus.currentTier + 1]?.minSpent ||
      vipStatus.tier.maxSpent;

    const percentage =
      ((vipStatus.totalSpent - currentTierSpend) /
        (nextTierSpend - currentTierSpend)) *
      100;

    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      current: currentTierSpend,
      next: nextTierSpend,
    };
  }
}

export const vipService = new VIPService();
export default vipService;
