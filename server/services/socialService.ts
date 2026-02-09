import databaseService from './database';

interface UserProfile {
  id: number;
  username: string;
  level: number;
  totalWinnings: number;
  favoriteGame: string;
  bio: string;
  avatarEmoji: string;
  isFriend: boolean;
  canMessage: boolean;
}

interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Guild {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  totalPrizePool: number;
  createdBy: number;
  createdAt: string;
  isPublic: boolean;
}

class SocialService {
  /**
   * Send message to user
   */
  async sendMessage(fromUserId: number, toUserId: number, content: string): Promise<boolean> {
    try {
      // Check if users are friends (optional)
      await databaseService.query(
        `INSERT INTO messages (from_user_id, to_user_id, content, is_read)
         VALUES ($1, $2, $3, false)`,
        [fromUserId, toUserId, content.substring(0, 1000)]
      );

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Get messages for user
   */
  async getMessages(userId: number, limit: number = 50): Promise<Message[]> {
    const query = `
      SELECT 
        id,
        from_user_id,
        to_user_id,
        content,
        is_read,
        created_at
      FROM messages
      WHERE to_user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await databaseService.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: number): Promise<void> {
    await databaseService.query(
      `UPDATE messages SET is_read = true WHERE id = $1`,
      [messageId]
    );
  }

  /**
   * Add friend
   */
  async addFriend(userId: number, friendId: number): Promise<boolean> {
    try {
      // Check if already friends
      const checkQuery = `
        SELECT id FROM friendships 
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
      `;
      const checkResult = await databaseService.query(checkQuery, [userId, friendId]);

      if (checkResult.rows.length > 0) {
        return false; // Already friends
      }

      // Add friendship
      await databaseService.query(
        `INSERT INTO friendships (user_id, friend_id, status)
         VALUES ($1, $2, 'accepted')`,
        [userId, friendId]
      );

      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  }

  /**
   * Get friends list
   */
  async getFriends(userId: number): Promise<UserProfile[]> {
    const query = `
      SELECT 
        CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END as id,
        u.username,
        u.level,
        COALESCE(SUM(CASE WHEN gs.result = 'win' THEN gs.payout ELSE 0 END), 0)::int as total_winnings,
        u.avatar_emoji
      FROM friendships f
      JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
      LEFT JOIN game_spins gs ON u.id = gs.user_id
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
      GROUP BY id, u.username, u.level, u.avatar_emoji
      ORDER BY u.username
    `;

    const result = await databaseService.query(query, [userId]);
    return result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      level: row.level || 1,
      totalWinnings: row.total_winnings,
      favoriteGame: '',
      bio: '',
      avatarEmoji: row.avatar_emoji || '🎮',
      isFriend: true,
      canMessage: true,
    }));
  }

  /**
   * Create guild
   */
  async createGuild(createdById: number, name: string, description: string, icon: string, isPublic: boolean): Promise<string> {
    const guildId = `guild_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await databaseService.query(
      `INSERT INTO guilds (id, name, description, icon, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [guildId, name, description, icon, createdById, isPublic]
    );

    // Add creator as member
    await databaseService.query(
      `INSERT INTO guild_members (guild_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [guildId, createdById]
    );

    return guildId;
  }

  /**
   * Join guild
   */
  async joinGuild(userId: number, guildId: string): Promise<boolean> {
    try {
      // Check if already member
      const checkQuery = `SELECT id FROM guild_members WHERE guild_id = $1 AND user_id = $2`;
      const checkResult = await databaseService.query(checkQuery, [guildId, userId]);

      if (checkResult.rows.length > 0) {
        return false; // Already member
      }

      // Add member
      await databaseService.query(
        `INSERT INTO guild_members (guild_id, user_id, role)
         VALUES ($1, $2, 'member')`,
        [guildId, userId]
      );

      return true;
    } catch (error) {
      console.error('Error joining guild:', error);
      return false;
    }
  }

  /**
   * Get guilds
   */
  async getGuilds(limit: number = 50): Promise<Guild[]> {
    const query = `
      SELECT 
        id,
        name,
        description,
        icon,
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id)::int as member_count,
        COALESCE(prize_pool, 0)::int as total_prize_pool,
        created_by,
        created_at,
        is_public
      FROM guilds g
      WHERE is_public = true
      ORDER BY member_count DESC, created_at DESC
      LIMIT $1
    `;

    const result = await databaseService.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get user guilds
   */
  async getUserGuilds(userId: number): Promise<Guild[]> {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.icon,
        (SELECT COUNT(*) FROM guild_members WHERE guild_id = g.id)::int as member_count,
        COALESCE(g.prize_pool, 0)::int as total_prize_pool,
        g.created_by,
        g.created_at,
        g.is_public
      FROM guilds g
      JOIN guild_members gm ON g.id = gm.guild_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `;

    const result = await databaseService.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get guild members
   */
  async getGuildMembers(guildId: string): Promise<any[]> {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.level,
        u.avatar_emoji,
        gm.role,
        gm.joined_at,
        COALESCE(SUM(CASE WHEN gs.result = 'win' THEN gs.payout ELSE 0 END), 0)::int as total_winnings
      FROM guild_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN game_spins gs ON u.id = gs.user_id
      WHERE gm.guild_id = $1
      GROUP BY u.id, u.username, u.level, u.avatar_emoji, gm.role, gm.joined_at
      ORDER BY gm.role DESC, total_winnings DESC
    `;

    const result = await databaseService.query(query, [guildId]);
    return result.rows;
  }

  /**
   * Get guild leaderboard
   */
  async getGuildLeaderboard(guildId: string): Promise<any[]> {
    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(CASE WHEN gs.result = 'win' THEN gs.payout ELSE 0 END) DESC) as rank,
        u.username,
        COUNT(CASE WHEN gs.result = 'win' THEN 1 END)::int as wins,
        COALESCE(SUM(gs.payout), 0)::int as total_winnings
      FROM guild_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN game_spins gs ON u.id = gs.user_id
      WHERE gm.guild_id = $1
      GROUP BY u.id, u.username
      ORDER BY total_winnings DESC
    `;

    const result = await databaseService.query(query, [guildId]);
    return result.rows;
  }

  /**
   * Send guild message
   */
  async sendGuildMessage(userId: number, guildId: string, content: string): Promise<boolean> {
    try {
      await databaseService.query(
        `INSERT INTO guild_messages (guild_id, user_id, content)
         VALUES ($1, $2, $3)`,
        [guildId, userId, content.substring(0, 500)]
      );

      return true;
    } catch (error) {
      console.error('Error sending guild message:', error);
      return false;
    }
  }

  /**
   * Get guild chat
   */
  async getGuildChat(guildId: string, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        gm.id,
        gm.user_id,
        u.username,
        u.avatar_emoji,
        gm.content,
        gm.created_at
      FROM guild_messages gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.guild_id = $1
      ORDER BY gm.created_at DESC
      LIMIT $2
    `;

    const result = await databaseService.query(query, [guildId, limit]);
    return result.rows.reverse();
  }
}

export const socialService = new SocialService();
export default socialService;
