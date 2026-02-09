import { Pool } from "pg";

export interface SportsEvent {
  eventId: string;
  sport: "nfl" | "nba" | "mlb" | "nhl" | "ncaa";
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: "scheduled" | "in-progress" | "completed" | "postponed";
  homeScore?: number;
  awayScore?: number;
  spread?: number; // Negative favors home team
  overUnder?: number;
  moneylineHome?: number;
  moneylineAway?: number;
}

export interface SportsParlay {
  parlay_id: string;
  user_id: number;
  legs: ParlayLeg[];
  total_wager: number;
  potential_payout: number;
  status: "pending" | "won" | "lost" | "pending_results";
  created_at: Date;
  updated_at: Date;
}

export interface ParlayLeg {
  legId: string;
  eventId: string;
  pick: "home" | "away" | "over" | "under";
  betType: "spread" | "moneyline" | "over_under";
  odds: number;
  wager: number;
  result?: "won" | "lost" | "pending";
}

export class SportsParleyService {
  private static instance: SportsParleyService;
  private pool: Pool;
  private eventCache: Map<string, SportsEvent> = new Map();

  // Mock sports data - in production, integrate with ESPN, The Odds API, etc.
  private mockEvents: SportsEvent[] = [
    {
      eventId: "nfl_001",
      sport: "nfl",
      homeTeam: "Kansas City Chiefs",
      awayTeam: "Buffalo Bills",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "scheduled",
      spread: -3.5,
      overUnder: 47.5,
      moneylineHome: -170,
      moneylineAway: 145,
    },
    {
      eventId: "nba_001",
      sport: "nba",
      homeTeam: "Los Angeles Lakers",
      awayTeam: "Denver Nuggets",
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: "scheduled",
      spread: -2,
      overUnder: 218,
      moneylineHome: -115,
      moneylineAway: -105,
    },
    {
      eventId: "mlb_001",
      sport: "mlb",
      homeTeam: "New York Yankees",
      awayTeam: "Boston Red Sox",
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "scheduled",
      spread: -1.5,
      overUnder: 8.5,
      moneylineHome: -140,
      moneylineAway: 120,
    },
  ];

  private constructor(pool: Pool) {
    this.pool = pool;
    this.initializeMockEvents();
  }

  static getInstance(pool: Pool): SportsParleyService {
    if (!SportsParleyService.instance) {
      SportsParleyService.instance = new SportsParleyService(pool);
    }
    return SportsParleyService.instance;
  }

  private initializeMockEvents() {
    this.mockEvents.forEach((event) => {
      this.eventCache.set(event.eventId, event);
    });
  }

  // Get all upcoming events
  async getUpcomingEvents(sport?: string): Promise<SportsEvent[]> {
    const events = Array.from(this.eventCache.values()).filter((event) => {
      if (sport && event.sport !== sport) return false;
      return event.status === "scheduled" && event.startTime > new Date();
    });
    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // Get event details
  async getEvent(eventId: string): Promise<SportsEvent | null> {
    return this.eventCache.get(eventId) || null;
  }

  // Create a parlay
  async createParlay(
    userId: number,
    legs: ParlayLeg[],
    totalWager: number,
  ): Promise<SportsParlay> {
    // Validate wager
    if (totalWager <= 0) {
      throw new Error("Wager must be greater than 0");
    }

    // Check user balance
    const balanceQuery = `
      SELECT sweeps_coins FROM user_balances WHERE user_id = $1
    `;
    const balanceResult = await this.pool.query(balanceQuery, [userId]);
    if (
      !balanceResult.rows[0] ||
      balanceResult.rows[0].sweeps_coins < totalWager
    ) {
      throw new Error("Insufficient balance for parlay wager");
    }

    const parlay_id = `parlay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Calculate potential payout (multiply odds)
    let potentialPayout = totalWager;
    for (const leg of legs) {
      const event = await this.getEvent(leg.eventId);
      if (!event) {
        throw new Error(`Event ${leg.eventId} not found`);
      }

      const odds = leg.odds;
      potentialPayout *= odds / 100; // Convert moneyline odds to decimal
    }

    // Create parlay in database
    const query = `
      INSERT INTO sports_parlays (parlay_id, user_id, total_wager, potential_payout, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      parlay_id,
      userId,
      totalWager,
      potentialPayout,
    ]);

    // Add parlay legs
    for (const leg of legs) {
      const legId = `leg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await this.pool.query(
        `
        INSERT INTO parlay_legs (leg_id, parlay_id, event_id, pick, bet_type, odds)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [legId, parlay_id, leg.eventId, leg.pick, leg.betType, leg.odds],
      );
    }

    // Deduct wager from balance
    await this.pool.query(
      `
      UPDATE user_balances 
      SET sweeps_coins = sweeps_coins - $2
      WHERE user_id = $1
    `,
      [userId, totalWager],
    );

    // Log transaction
    await this.pool.query(
      `
      INSERT INTO transactions (user_id, transaction_type, currency, amount, description, status)
      VALUES ($1, 'bet', 'SC', $2, $3, 'completed')
    `,
      [userId, totalWager, `Sports parlay ${parlay_id}`],
    );

    return {
      parlay_id,
      user_id: userId,
      legs,
      total_wager: totalWager,
      potential_payout: potentialPayout,
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  // Get user's parlays
  async getUserParlays(userId: number, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT sp.*, COUNT(pl.leg_id) as leg_count
      FROM sports_parlays sp
      LEFT JOIN parlay_legs pl ON sp.parlay_id = pl.parlay_id
      WHERE sp.user_id = $1
      GROUP BY sp.parlay_id
      ORDER BY sp.created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Get parlay details with legs
  async getParlay(parlay_id: string): Promise<any> {
    const query = `
      SELECT 
        sp.*,
        json_agg(json_build_object(
          'legId', pl.leg_id,
          'eventId', pl.event_id,
          'pick', pl.pick,
          'betType', pl.bet_type,
          'odds', pl.odds,
          'result', pl.result
        )) as legs
      FROM sports_parlays sp
      LEFT JOIN parlay_legs pl ON sp.parlay_id = pl.parlay_id
      WHERE sp.parlay_id = $1
      GROUP BY sp.parlay_id
    `;

    const result = await this.pool.query(query, [parlay_id]);
    return result.rows[0];
  }

  // Update event scores (simulated)
  async updateEventScore(
    eventId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<void> {
    const event = this.eventCache.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    event.homeScore = homeScore;
    event.awayScore = awayScore;

    // Store in database
    const query = `
      INSERT INTO sports_events (event_id, sport, home_team, away_team, home_score, away_score, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'in-progress')
      ON CONFLICT (event_id) DO UPDATE SET
        home_score = $5,
        away_score = $6,
        status = 'in-progress'
    `;

    await this.pool.query(query, [
      eventId,
      event.sport,
      event.homeTeam,
      event.awayTeam,
      homeScore,
      awayScore,
    ]);

    // Check and resolve related parlays
    await this.resolveParlaysForEvent(eventId);
  }

  // Resolve parlays when event completes
  private async resolveParlaysForEvent(eventId: string): Promise<void> {
    const event = this.eventCache.get(eventId);
    if (!event || event.status !== "completed") return;

    // Get all parlays with this event
    const query = `
      SELECT DISTINCT sp.parlay_id, sp.user_id, sp.total_wager, sp.potential_payout
      FROM sports_parlays sp
      JOIN parlay_legs pl ON sp.parlay_id = pl.parlay_id
      WHERE pl.event_id = $1 AND sp.status = 'pending'
    `;

    const result = await this.pool.query(query, [eventId]);

    for (const parlay of result.rows) {
      // Check all legs of the parlay
      const legsQuery = `
        SELECT pl.*, sp.status as parlay_status
        FROM parlay_legs pl
        JOIN sports_parlays sp ON pl.parlay_id = sp.parlay_id
        WHERE pl.parlay_id = $1
      `;

      const legsResult = await this.pool.query(legsQuery, [parlay.parlay_id]);

      // Determine parlay result
      let parlay_status = "pending_results";
      let allLegsResolved = true;

      for (const leg of legsResult.rows) {
        if (leg.result === null) {
          allLegsResolved = false;
        }
      }

      if (allLegsResolved) {
        const allLegsWon = legsResult.rows.every(
          (leg: any) => leg.result === "won",
        );
        parlay_status = allLegsWon ? "won" : "lost";

        // Update parlay status
        await this.pool.query(
          `
          UPDATE sports_parlays 
          SET status = $2
          WHERE parlay_id = $1
        `,
          [parlay.parlay_id, parlay_status],
        );

        // If won, add payout to balance
        if (parlay_status === "won") {
          await this.pool.query(
            `
            UPDATE user_balances 
            SET sweeps_coins = sweeps_coins + $2
            WHERE user_id = $1
          `,
            [parlay.user_id, parlay.potential_payout],
          );

          // Log transaction
          await this.pool.query(
            `
            INSERT INTO transactions (user_id, transaction_type, currency, amount, description, status)
            VALUES ($1, 'win', 'SC', $2, $3, 'completed')
          `,
            [
              parlay.user_id,
              parlay.potential_payout,
              `Sports parlay win ${parlay.parlay_id}`,
            ],
          );
        }
      }
    }
  }

  // Get sports stats for admin
  async getAdminStats() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM sports_parlays) as total_parlays,
        (SELECT COUNT(*) FROM sports_parlays WHERE status = 'won') as winning_parlays,
        (SELECT COUNT(*) FROM sports_parlays WHERE status = 'lost') as losing_parlays,
        (SELECT COUNT(*) FROM sports_parlays WHERE status = 'pending') as pending_parlays,
        (SELECT SUM(total_wager) FROM sports_parlays) as total_wagers,
        (SELECT SUM(potential_payout) FROM sports_parlays WHERE status = 'won') as total_payouts
      FROM sports_parlays LIMIT 1
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  // Get parlay history for admin
  async getParlayHistory(limit: number = 100) {
    const query = `
      SELECT sp.*, u.username, COUNT(pl.leg_id) as leg_count
      FROM sports_parlays sp
      JOIN users u ON sp.user_id = u.id
      LEFT JOIN parlay_legs pl ON sp.parlay_id = pl.parlay_id
      GROUP BY sp.parlay_id, u.username
      ORDER BY sp.created_at DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Get live sports data (simulated - would connect to ESPN, The Odds API, etc.)
  getLiveOdds(sport: string): any[] {
    return Array.from(this.eventCache.values())
      .filter((event) => event.sport === sport)
      .map((event) => ({
        eventId: event.eventId,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        spread: event.spread,
        overUnder: event.overUnder,
        moneylineHome: event.moneylineHome,
        moneylineAway: event.moneylineAway,
        status: event.status,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
      }));
  }
}
