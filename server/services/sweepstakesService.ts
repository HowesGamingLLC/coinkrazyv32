import databaseService from "./database";

interface SweepstakesRules {
  minAge: number;
  eligibleStates: string[];
  eligibleCountries: string[];
  disclaimerAccepted: boolean;
  contestTermsAccepted: boolean;
  privacyPolicyAccepted: boolean;
}

interface ComplianceCheck {
  userId: number;
  userAge: number;
  userState: string;
  isEligible: boolean;
  reason?: string;
  timestamp: Date;
}

export class SweepstakesService {
  private static instance: SweepstakesService;

  // Ineligible states for sweepstakes (Montana, South Carolina, Tennessee, etc.)
  private ineligibleStates = [
    "MT", // Montana
    "SC", // South Carolina
    "TN", // Tennessee
    "VT", // Vermont
  ];

  // Countries where sweepstakes are allowed
  private eligibleCountries = ["US", "CA"];

  private constructor() {}

  static getInstance(): SweepstakesService {
    if (!SweepstakesService.instance) {
      SweepstakesService.instance = new SweepstakesService();
    }
    return SweepstakesService.instance;
  }

  // Check if user is eligible for sweepstakes
  async checkEligibility(userId: number): Promise<ComplianceCheck> {
    const query = `
      SELECT u.*, ub.sweeps_coins
      FROM users u
      LEFT JOIN user_balances ub ON u.id = ub.user_id
      WHERE u.id = $1
    `;
    const result = await databaseService.query(query, [userId]);
    if (!result.rows[0]) {
      throw new Error("User not found");
    }

    const user = result.rows[0];
    const birthDate = new Date(user.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    const isAgeEligible = age >= 18;
    const isStateEligible = !this.ineligibleStates.includes(user.state?.toUpperCase());
    const isCountryEligible = this.eligibleCountries.includes(user.country?.toUpperCase() || "US");

    const isEligible = isAgeEligible && isStateEligible && isCountryEligible;

    const reason = !isAgeEligible
      ? "Must be 18+ years old"
      : !isStateEligible
        ? `Sweepstakes not available in ${user.state}`
        : !isCountryEligible
          ? "Only available in US and Canada"
          : undefined;

    // Log compliance check
    await this.logComplianceCheck(userId, age, user.state, isEligible, reason);

    return {
      userId,
      userAge: age,
      userState: user.state,
      isEligible,
      reason,
      timestamp: new Date(),
    };
  }

  // Record user acceptance of sweepstakes terms
  async acceptTerms(userId: number): Promise<boolean> {
    const query = `
      INSERT INTO sweepstakes_compliance (user_id, terms_accepted, disclaimer_accepted, privacy_accepted, accepted_at)
      VALUES ($1, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        terms_accepted = TRUE,
        disclaimer_accepted = TRUE,
        privacy_accepted = TRUE,
        accepted_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    const result = await databaseService.query(query, [userId]);
    return !!result.rows[0];
  }

  // Get user's compliance status
  async getComplianceStatus(userId: number) {
    const query = `
      SELECT * FROM sweepstakes_compliance
      WHERE user_id = $1
    `;
    const result = await databaseService.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Log compliance check for audit
  private async logComplianceCheck(
    userId: number,
    age: number,
    state: string,
    isEligible: boolean,
    reason?: string,
  ) {
    const query = `
      INSERT INTO compliance_logs (user_id, check_type, age, state, is_eligible, reason, checked_at)
      VALUES ($1, 'eligibility', $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;
    await databaseService.query(query, [userId, age, state, isEligible, reason]);
  }

  // Get contest rules and terms
  getContestRules() {
    return {
      title: "CoinKrazy Social Casino Sweepstakes",
      eligibility: {
        minimumAge: 18,
        citizenship: "US or Canadian residents only",
        excludedStates: this.ineligibleStates,
        noEmployees: "Employees of CoinKrazy and their families are not eligible",
      },
      prizes: {
        description: "Virtual coins and cash prizes as stated in individual sweepstakes",
        disclaimer: "No purchase necessary. Free play available.",
      },
      terms: {
        startDate: "2024-01-01",
        endDate: "2025-12-31",
        howToEnter: "Play sweepstakes games on CoinKrazy platform",
        winner: "Winners selected by random draw from eligible entries",
        odds: "Odds depend on number of entries and game mechanics",
      },
      disclaimers: [
        "This is a sweepstakes, not gambling",
        "All sweepstakes coins (SC) are virtual currency with no real monetary value unless redeemed according to terms",
        "Users must comply with all applicable laws",
        "CoinKrazy reserves right to void entries from ineligible users",
      ],
      responsiblePlay: {
        ageVerified: true,
        selfExclusionAvailable: true,
        limitDeposits: true,
        helplines: [
          "National Problem Gambling Helpline: 1-800-522-4700",
          "Gamblers Anonymous: 1-213-386-8789",
        ],
      },
    };
  }

  // Get privacy policy
  getPrivacyPolicy() {
    return {
      title: "Privacy Policy",
      lastUpdated: "2024-01-01",
      content: `
        CoinKrazy respects your privacy and is committed to protecting your personal information.
        
        Information We Collect:
        - Account information (name, email, date of birth, location)
        - Device information (IP address, device type, browser)
        - Activity data (games played, transactions, sweepstakes entries)
        - Payment information (processed securely)
        
        How We Use Your Information:
        - Verify eligibility for sweepstakes
        - Process payments and transactions
        - Improve our services
        - Comply with legal requirements
        - Prevent fraud and abuse
        
        Data Protection:
        - All data encrypted in transit and at rest
        - Limited access to authorized personnel
        - Annual security audits
        - GDPR and CCPA compliant
        
        Your Rights:
        - Access your personal data
        - Request deletion of your data
        - Opt-out of marketing communications
        - Lodge complaints with privacy authorities
      `,
    };
  }

  // Get terms of service
  getTermsOfService() {
    return {
      title: "Terms of Service",
      lastUpdated: "2024-01-01",
      sections: {
        acceptance: "By using CoinKrazy, you accept all terms and conditions",
        userResponsibilities: [
          "You are responsible for maintaining account security",
          "You may not use the platform if under 18",
          "You may not violate any applicable laws",
          "You acknowledge sweepstakes coins have no monetary value except as stated",
        ],
        limitations: [
          "CoinKrazy is not liable for data loss or service interruptions",
          "Maximum winnings per user per day",
          "Account termination for violations",
          "No refunds except where legally required",
        ],
        governing: "These terms are governed by applicable federal and state law",
      },
    };
  }

  // Verify user before sweepstakes entry
  async verifyEligibilityForEntry(userId: number): Promise<{
    eligible: boolean;
    message: string;
  }> {
    const eligibility = await this.checkEligibility(userId);
    const compliance = await this.getComplianceStatus(userId);

    if (!eligibility.isEligible) {
      return {
        eligible: false,
        message: eligibility.reason || "User not eligible for sweepstakes",
      };
    }

    if (!compliance?.terms_accepted) {
      return {
        eligible: false,
        message: "Must accept sweepstakes terms before participation",
      };
    }

    return {
      eligible: true,
      message: "User is eligible for sweepstakes participation",
    };
  }

  // Get compliance stats for admin
  async getComplianceStats() {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(CASE WHEN terms_accepted THEN 1 END) as terms_accepted_users,
        COUNT(CASE WHEN disclaimer_accepted THEN 1 END) as disclaimer_accepted_users,
        COUNT(CASE WHEN privacy_accepted THEN 1 END) as privacy_accepted_users
      FROM sweepstakes_compliance
    `;
    const result = await databaseService.query(query);
    return result.rows[0];
  }

  // Get compliance logs for audit
  async getComplianceLogs(limit: number = 100) {
    const query = `
      SELECT cl.*, u.email, u.username
      FROM compliance_logs cl
      JOIN users u ON cl.user_id = u.id
      ORDER BY cl.checked_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }
}
