import databaseService from './database';

interface AffiliateProfile {
  userId: number;
  affiliateCode: string;
  isActive: boolean;
  totalReferrals: number;
  totalEarnings: number;
  pendingBalance: number;
  withdrawnBalance: number;
  conversionRate: number;
  topPerformer: boolean;
  joinedDate: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface AffiliateCommission {
  tier: string;
  minReferrals: number;
  commissionRate: number;
  benefits: string[];
}

class AffiliateService {
  private commissionTiers: AffiliateCommission[] = [
    {
      tier: 'bronze',
      minReferrals: 0,
      commissionRate: 10,
      benefits: ['10% commission', 'Affiliate dashboard', 'Weekly payouts'],
    },
    {
      tier: 'silver',
      minReferrals: 10,
      commissionRate: 15,
      benefits: ['15% commission', 'Monthly bonus', 'Dedicated support'],
    },
    {
      tier: 'gold',
      minReferrals: 50,
      commissionRate: 20,
      benefits: ['20% commission', 'Quarterly bonus', 'Marketing materials'],
    },
    {
      tier: 'platinum',
      minReferrals: 200,
      commissionRate: 25,
      benefits: ['25% commission', 'Annual bonus', 'Custom support', 'Co-marketing'],
    },
  ];

  /**
   * Generate affiliate code for user
   */
  async generateAffiliateCode(userId: number): Promise<string> {
    const code = `AFF${userId}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await databaseService.query(
      `INSERT INTO affiliates (user_id, affiliate_code, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id) DO UPDATE SET is_active = true`,
      [userId, code]
    );

    return code;
  }

  /**
   * Get affiliate profile
   */
  async getAffiliateProfile(userId: number): Promise<AffiliateProfile | null> {
    const query = `
      SELECT 
        a.user_id,
        a.affiliate_code,
        a.is_active,
        COUNT(DISTINCT ar.referred_user_id)::int as total_referrals,
        COALESCE(SUM(ar.commission_earned), 0)::float as total_earnings,
        COALESCE(a.pending_balance, 0)::float as pending_balance,
        COALESCE(a.withdrawn_balance, 0)::float as withdrawn_balance,
        a.created_at
      FROM affiliates a
      LEFT JOIN affiliate_referrals ar ON a.user_id = ar.affiliate_id
      WHERE a.user_id = $1
      GROUP BY a.user_id, a.affiliate_code, a.is_active, a.pending_balance, a.withdrawn_balance, a.created_at
    `;

    const result = await databaseService.query(query, [userId]);
    if (result.rows.length === 0) return null;

    const profile = result.rows[0];
    const commissionRate = this.getCommissionRate(profile.total_referrals);

    return {
      userId: profile.user_id,
      affiliateCode: profile.affiliate_code,
      isActive: profile.is_active,
      totalReferrals: profile.total_referrals,
      totalEarnings: profile.total_earnings,
      pendingBalance: profile.pending_balance,
      withdrawnBalance: profile.withdrawn_balance,
      conversionRate: profile.total_referrals > 0 ? (profile.total_referrals / 100) * 100 : 0,
      topPerformer: profile.total_referrals >= 50,
      joinedDate: profile.created_at,
      tier: this.getTierByReferrals(profile.total_referrals),
    };
  }

  /**
   * Register referral
   */
  async registerReferral(affiliateCode: string, referredUserId: number): Promise<boolean> {
    try {
      // Find affiliate
      const affiliateQuery = `SELECT user_id FROM affiliates WHERE affiliate_code = $1 AND is_active = true`;
      const affiliateResult = await databaseService.query(affiliateQuery, [affiliateCode]);

      if (affiliateResult.rows.length === 0) {
        return false;
      }

      const affiliateId = affiliateResult.rows[0].user_id;

      // Check if already referred
      const checkQuery = `
        SELECT id FROM affiliate_referrals 
        WHERE affiliate_id = $1 AND referred_user_id = $2
      `;
      const checkResult = await databaseService.query(checkQuery, [affiliateId, referredUserId]);

      if (checkResult.rows.length > 0) {
        return false; // Already referred
      }

      // Insert referral
      await databaseService.query(
        `INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, created_at)
         VALUES ($1, $2, NOW())`,
        [affiliateId, referredUserId]
      );

      // Award sign-up bonus
      const signupBonus = 50; // $50 or equivalent
      await this.addCommission(affiliateId, signupBonus, 'Referral signup bonus');

      return true;
    } catch (error) {
      console.error('Error registering referral:', error);
      return false;
    }
  }

  /**
   * Record commission from referral purchase
   */
  async recordPurchaseCommission(affiliateCode: string, purchaseAmount: number): Promise<void> {
    const affiliateQuery = `SELECT user_id FROM affiliates WHERE affiliate_code = $1`;
    const result = await databaseService.query(affiliateQuery, [affiliateCode]);

    if (result.rows.length === 0) return;

    const affiliateId = result.rows[0].user_id;
    const commissionRate = this.getCommissionRate(0) / 100; // Placeholder
    const commission = purchaseAmount * commissionRate;

    await this.addCommission(affiliateId, commission, `Commission from referral purchase: $${purchaseAmount.toFixed(2)}`);
  }

  /**
   * Add commission to affiliate
   */
  private async addCommission(affiliateId: number, amount: number, description: string): Promise<void> {
    await databaseService.query(
      `UPDATE affiliates 
       SET pending_balance = pending_balance + $2
       WHERE user_id = $1`,
      [affiliateId, amount]
    );

    // Log transaction
    await databaseService.query(
      `INSERT INTO affiliate_commissions (affiliate_id, amount, description, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [affiliateId, amount, description]
    );
  }

  /**
   * Get commission rate by referral count
   */
  private getCommissionRate(referralCount: number): number {
    for (let i = this.commissionTiers.length - 1; i >= 0; i--) {
      if (referralCount >= this.commissionTiers[i].minReferrals) {
        return this.commissionTiers[i].commissionRate;
      }
    }
    return 10; // Default to bronze tier
  }

  /**
   * Get tier by referral count
   */
  private getTierByReferrals(referralCount: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (referralCount >= 200) return 'platinum';
    if (referralCount >= 50) return 'gold';
    if (referralCount >= 10) return 'silver';
    return 'bronze';
  }

  /**
   * Get commission tiers
   */
  getTiers(): AffiliateCommission[] {
    return this.commissionTiers;
  }

  /**
   * Withdraw affiliate earnings
   */
  async withdrawEarnings(affiliateId: number, amount: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check balance
      const balanceQuery = `SELECT pending_balance FROM affiliates WHERE user_id = $1`;
      const result = await databaseService.query(balanceQuery, [affiliateId]);

      if (result.rows.length === 0) {
        return { success: false, message: 'Affiliate not found' };
      }

      const pendingBalance = result.rows[0].pending_balance || 0;

      if (pendingBalance < amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Process withdrawal
      await databaseService.query(
        `UPDATE affiliates 
         SET pending_balance = pending_balance - $2,
             withdrawn_balance = withdrawn_balance + $2
         WHERE user_id = $1`,
        [affiliateId, amount]
      );

      // Log withdrawal
      await databaseService.query(
        `INSERT INTO affiliate_withdrawals (affiliate_id, amount, status, created_at)
         VALUES ($1, $2, 'pending', NOW())`,
        [affiliateId, amount]
      );

      return { success: true, message: 'Withdrawal request submitted' };
    } catch (error) {
      console.error('Error withdrawing earnings:', error);
      return { success: false, message: 'Withdrawal failed' };
    }
  }

  /**
   * Get referral list
   */
  async getReferrals(affiliateId: number): Promise<any[]> {
    const query = `
      SELECT 
        ar.referred_user_id,
        u.username,
        u.created_at as signup_date,
        COALESCE(SUM(o.amount_usd), 0)::float as total_spent,
        COALESCE(ar.commission_earned, 0)::float as commission_earned
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
      WHERE ar.affiliate_id = $1
      GROUP BY ar.referred_user_id, u.username, u.created_at, ar.commission_earned
      ORDER BY u.created_at DESC
    `;

    const result = await databaseService.query(query, [affiliateId]);
    return result.rows;
  }
}

export const affiliateService = new AffiliateService();
export default affiliateService;
