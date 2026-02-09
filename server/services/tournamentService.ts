import databaseService from "./database";

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "ended";
  totalPrizePool: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  minBet: number;
  maxBet: number;
  icon: string;
}

interface TournamentEntry {
  userId: number;
  username: string;
  score: number;
  winCount: number;
  totalWinnings: number;
  position: number;
  prizeWon: number;
}

class TournamentService {
  /**
   * Get all active tournaments
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    const query = `
      SELECT 
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        total_prize_pool,
        entry_fee,
        max_participants,
        (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as current_participants,
        min_bet,
        max_bet,
        icon
      FROM tournaments t
      WHERE status IN ('active', 'upcoming')
      ORDER BY start_date DESC
    `;

    const result = await databaseService.query(query);
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      totalPrizePool: row.total_prize_pool,
      entryFee: row.entry_fee,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      minBet: row.min_bet,
      maxBet: row.max_bet,
      icon: row.icon,
    }));
  }

  /**
   * Get tournament details
   */
  async getTournamentDetails(tournamentId: string): Promise<any> {
    const query = `
      SELECT 
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        total_prize_pool,
        entry_fee,
        max_participants,
        (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as current_participants,
        min_bet,
        max_bet,
        icon,
        rules
      FROM tournaments t
      WHERE id = $1
    `;

    const result = await databaseService.query(query, [tournamentId]);
    return result.rows[0] || null;
  }

  /**
   * Join tournament
   */
  async joinTournament(
    userId: number,
    tournamentId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if already joined
      const checkQuery = `
        SELECT id FROM tournament_entries 
        WHERE user_id = $1 AND tournament_id = $2
      `;
      const checkResult = await databaseService.query(checkQuery, [
        userId,
        tournamentId,
      ]);

      if (checkResult.rows.length > 0) {
        return { success: false, message: "Already joined this tournament" };
      }

      // Insert entry
      await databaseService.query(
        `INSERT INTO tournament_entries (user_id, tournament_id, joined_at)
         VALUES ($1, $2, NOW())`,
        [userId, tournamentId],
      );

      return { success: true, message: "Successfully joined tournament" };
    } catch (error) {
      console.error("Error joining tournament:", error);
      return { success: false, message: "Failed to join tournament" };
    }
  }

  /**
   * Get tournament leaderboard
   */
  async getTournamentLeaderboard(
    tournamentId: string,
  ): Promise<TournamentEntry[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC,
          SUM(gs.payout) DESC
        ) as position,
        u.id as user_id,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as win_count,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as score,
        COALESCE((t.total_prize_pool * (CASE ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC, SUM(gs.payout) DESC)
          WHEN 1 THEN 0.4
          WHEN 2 THEN 0.25
          WHEN 3 THEN 0.15
          WHEN 4 THEN 0.1
          WHEN 5 THEN 0.1
          ELSE 0 END)), 0)::int as prize_won
      FROM tournament_entries te
      JOIN users u ON te.user_id = u.id
      LEFT JOIN game_spins gs ON u.id = gs.user_id 
        AND gs.tournament_id = $1
        AND DATE(gs.created_at) >= DATE((SELECT start_date FROM tournaments WHERE id = $1))
        AND DATE(gs.created_at) <= DATE((SELECT end_date FROM tournaments WHERE id = $1))
      LEFT JOIN tournaments t ON t.id = $1
      WHERE te.tournament_id = $1
      GROUP BY u.id, u.username, t.total_prize_pool
      ORDER BY score DESC, total_winnings DESC
    `;

    const result = await databaseService.query(query, [tournamentId]);
    return result.rows.map((row: any) => ({
      userId: row.user_id,
      username: row.username,
      score: row.score,
      winCount: row.win_count,
      totalWinnings: row.total_winnings,
      position: row.position,
      prizeWon: row.prize_won,
    }));
  }

  /**
   * Create new tournament (admin)
   */
  async createTournament(data: any): Promise<string> {
    const tournamentId = `tour_${Date.now()}`;

    await databaseService.query(
      `INSERT INTO tournaments (id, name, description, start_date, end_date, status, total_prize_pool, entry_fee, max_participants, min_bet, max_bet, icon, rules)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        tournamentId,
        data.name,
        data.description,
        data.startDate,
        data.endDate,
        data.status,
        data.totalPrizePool,
        data.entryFee,
        data.maxParticipants,
        data.minBet,
        data.maxBet,
        data.icon,
        data.rules,
      ],
    );

    return tournamentId;
  }
}

export const tournamentService = new TournamentService();
export default tournamentService;
