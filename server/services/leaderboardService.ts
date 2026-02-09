import databaseService from "./database";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  score: number;
  winCount: number;
  totalWinnings: number;
  level: number;
  avatarEmoji: string;
}

class LeaderboardService {
  /**
   * Get daily leaderboard
   */
  async getDailyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC,
          SUM(gs.payout) DESC
        ) as rank,
        u.id as user_id,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as win_count,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings,
        u.level,
        u.avatar_emoji
      FROM users u
      LEFT JOIN game_spins gs ON u.id = gs.user_id 
        AND DATE(gs.created_at) = DATE(NOW())
      GROUP BY u.id, u.username, u.level, u.avatar_emoji
      HAVING COUNT(gs.id) > 0
      ORDER BY win_count DESC, total_winnings DESC
      LIMIT $1
    `;

    const result = await databaseService.query(query, [limit]);
    return result.rows.map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      username: row.username,
      score: row.win_count,
      winCount: row.win_count,
      totalWinnings: row.total_winnings,
      level: row.level || 1,
      avatarEmoji: row.avatar_emoji || "🎮",
    }));
  }

  /**
   * Get weekly leaderboard
   */
  async getWeeklyLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC,
          SUM(gs.payout) DESC
        ) as rank,
        u.id as user_id,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as win_count,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings,
        u.level,
        u.avatar_emoji
      FROM users u
      LEFT JOIN game_spins gs ON u.id = gs.user_id 
        AND gs.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.username, u.level, u.avatar_emoji
      HAVING COUNT(gs.id) > 0
      ORDER BY win_count DESC, total_winnings DESC
      LIMIT $1
    `;

    const result = await databaseService.query(query, [limit]);
    return result.rows.map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      username: row.username,
      score: row.win_count,
      winCount: row.win_count,
      totalWinnings: row.total_winnings,
      level: row.level || 1,
      avatarEmoji: row.avatar_emoji || "🎮",
    }));
  }

  /**
   * Get all-time leaderboard
   */
  async getAllTimeLeaderboard(
    limit: number = 100,
  ): Promise<LeaderboardEntry[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC,
          SUM(gs.payout) DESC
        ) as rank,
        u.id as user_id,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as win_count,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings,
        u.level,
        u.avatar_emoji
      FROM users u
      LEFT JOIN game_spins gs ON u.id = gs.user_id
      GROUP BY u.id, u.username, u.level, u.avatar_emoji
      HAVING COUNT(gs.id) > 0
      ORDER BY win_count DESC, total_winnings DESC
      LIMIT $1
    `;

    const result = await databaseService.query(query, [limit]);
    return result.rows.map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      username: row.username,
      score: row.win_count,
      winCount: row.win_count,
      totalWinnings: row.total_winnings,
      level: row.level || 1,
      avatarEmoji: row.avatar_emoji || "🎮",
    }));
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: number): Promise<any> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          COUNT(CASE WHEN gs.result = 'win' THEN 1 END) DESC,
          SUM(gs.payout) DESC
        ) as rank,
        u.id,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as win_count,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings,
        COUNT(CASE WHEN gs.result = 'loss' THEN 1 END)::int as loss_count
      FROM users u
      LEFT JOIN game_spins gs ON u.id = gs.user_id
      GROUP BY u.id, u.username
      ORDER BY win_count DESC, total_winnings DESC
    `;

    const result = await databaseService.query(query);
    const userRank = result.rows.find((row: any) => row.id === userId);
    return userRank || null;
  }
}

export const leaderboardService = new LeaderboardService();
export default leaderboardService;
