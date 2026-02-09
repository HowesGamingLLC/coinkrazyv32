import databaseService from "./database";

export interface PokerTable {
  tableId: string;
  name: string;
  stakes: { smallBlind: number; bigBlind: number };
  maxPlayers: number;
  currentPlayers: number;
  status: "open" | "playing" | "closed";
  createdAt: Date;
  totalPot: number;
  minBuyIn: number;
  maxBuyIn: number;
}

export interface PokerPlayer {
  playerId: number;
  tableId: string;
  username: string;
  stack: number;
  position: "button" | "smallBlind" | "bigBlind" | "under-the-gun" | "middle-position" | "cutoff" | "dealer";
  isActive: boolean;
  totalWins: number;
  totalLosses: number;
}

export interface PokerHand {
  handId: string;
  tableId: string;
  buttonPosition: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  pot: number;
  community: string[];
  status: "pre-flop" | "flop" | "turn" | "river" | "finished";
  winner?: number;
  winningHand?: string;
  startedAt: Date;
}

export class PokerService {
  private static instance: PokerService;
  private activeTables: Map<string, PokerTable> = new Map();

  private constructor() {}

  static getInstance(): PokerService {
    if (!PokerService.instance) {
      PokerService.instance = new PokerService();
    }
    return PokerService.instance;
  }

  // Create a new poker table
  async createTable(
    name: string,
    smallBlind: number,
    bigBlind: number,
    maxPlayers: number = 6,
  ): Promise<PokerTable> {
    const tableId = `table_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const minBuyIn = bigBlind * 20;
    const maxBuyIn = bigBlind * 500;

    const query = `
      INSERT INTO poker_tables (table_id, name, small_blind, big_blind, max_players, min_buy_in, max_buy_in, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
      RETURNING *
    `;

    const result = await databaseService.query(query, [
      tableId,
      name,
      smallBlind,
      bigBlind,
      maxPlayers,
      minBuyIn,
      maxBuyIn,
    ]);

    const table = result.rows[0];
    this.activeTables.set(tableId, {
      tableId: table.table_id,
      name: table.name,
      stakes: { smallBlind: table.small_blind, bigBlind: table.big_blind },
      maxPlayers: table.max_players,
      currentPlayers: 0,
      status: "open",
      createdAt: table.created_at,
      totalPot: 0,
      minBuyIn: table.min_buy_in,
      maxBuyIn: table.max_buy_in,
    });

    return this.activeTables.get(tableId)!;
  }

  // Join a poker table
  async joinTable(tableId: string, userId: number, buyIn: number): Promise<boolean> {
    // Verify table exists
    const tableQuery = `
      SELECT * FROM poker_tables WHERE table_id = $1
    `;
    const tableResult = await databaseService.query(tableQuery, [tableId]);
    if (!tableResult.rows[0]) {
      throw new Error("Table not found");
    }

    const table = tableResult.rows[0];

    // Validate buy-in
    if (buyIn < table.min_buy_in || buyIn > table.max_buy_in) {
      throw new Error(`Buy-in must be between ${table.min_buy_in} and ${table.max_buy_in}`);
    }

    // Check player count
    const playerCountQuery = `
      SELECT COUNT(*) as count FROM poker_players
      WHERE table_id = $1 AND is_active = TRUE
    `;
    const countResult = await databaseService.query(playerCountQuery, [tableId]);
    if (countResult.rows[0].count >= table.max_players) {
      throw new Error("Table is full");
    }

    // Deduct buy-in from player balance
    const balanceQuery = `
      SELECT sweeps_coins FROM user_balances WHERE user_id = $1
    `;
    const balanceResult = await databaseService.query(balanceQuery, [userId]);
    if (!balanceResult.rows[0] || balanceResult.rows[0].sweeps_coins < buyIn) {
      throw new Error("Insufficient balance for buy-in");
    }

    // Add player to table
    const playerQuery = `
      INSERT INTO poker_players (table_id, user_id, stack, position, is_active)
      VALUES ($1, $2, $3, 'under-the-gun', TRUE)
      RETURNING *
    `;
    const playerResult = await databaseService.query(playerQuery, [tableId, userId, buyIn]);

    // Deduct from user balance
    await databaseService.query(
      `
      UPDATE user_balances
      SET sweeps_coins = sweeps_coins - $2
      WHERE user_id = $1
    `,
      [userId, buyIn],
    );

    // Log transaction
    await databaseService.query(
      `
      INSERT INTO transactions (user_id, transaction_type, currency, amount, description, status)
      VALUES ($1, 'bet', 'SC', $2, 'Poker table buy-in', 'completed')
    `,
      [userId, buyIn],
    );

    return !!playerResult.rows[0];
  }

  // Leave a poker table and cash out
  async leaveTable(tableId: string, userId: number, cashOut: number): Promise<boolean> {
    // Remove player from table
    const query = `
      UPDATE poker_players
      SET is_active = FALSE
      WHERE table_id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await databaseService.query(query, [tableId, userId]);

    if (!result.rows[0]) {
      throw new Error("Player not found at this table");
    }

    // Add cash out to player balance
    await databaseService.query(
      `
      UPDATE user_balances
      SET sweeps_coins = sweeps_coins + $2
      WHERE user_id = $1
    `,
      [userId, cashOut],
    );

    // Log transaction
    await databaseService.query(
      `
      INSERT INTO transactions (user_id, transaction_type, currency, amount, description, status)
      VALUES ($1, 'win', 'SC', $2, 'Poker table cash out', 'completed')
    `,
      [userId, cashOut],
    );

    return true;
  }

  // Get all open tables
  async getOpenTables(): Promise<PokerTable[]> {
    const query = `
      SELECT 
        pt.*,
        COUNT(CASE WHEN pp.is_active = TRUE THEN 1 END) as current_players
      FROM poker_tables pt
      LEFT JOIN poker_players pp ON pt.table_id = pp.table_id
      WHERE pt.status = 'open'
      GROUP BY pt.table_id
      ORDER BY pt.created_at DESC
    `;

    const result = await databaseService.query(query);
    return result.rows.map((row) => ({
      tableId: row.table_id,
      name: row.name,
      stakes: { smallBlind: row.small_blind, bigBlind: row.big_blind },
      maxPlayers: row.max_players,
      currentPlayers: parseInt(row.current_players || 0),
      status: row.status,
      createdAt: row.created_at,
      totalPot: row.total_pot || 0,
      minBuyIn: row.min_buy_in,
      maxBuyIn: row.max_buy_in,
    }));
  }

  // Get table players
  async getTablePlayers(tableId: string): Promise<PokerPlayer[]> {
    const query = `
      SELECT 
        pp.*,
        u.username
      FROM poker_players pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.table_id = $1 AND pp.is_active = TRUE
      ORDER BY pp.position
    `;

    const result = await databaseService.query(query, [tableId]);
    return result.rows.map((row) => ({
      playerId: row.user_id,
      tableId: row.table_id,
      username: row.username,
      stack: row.stack,
      position: row.position,
      isActive: row.is_active,
      totalWins: row.total_wins || 0,
      totalLosses: row.total_losses || 0,
    }));
  }

  // Deal a hand
  async dealHand(tableId: string): Promise<PokerHand> {
    const handId = `hand_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get table info and calculate blinds
    const tableQuery = `
      SELECT pt.*, COUNT(CASE WHEN pp.is_active = TRUE THEN 1 END) as player_count
      FROM poker_tables pt
      LEFT JOIN poker_players pp ON pt.table_id = pp.table_id
      WHERE pt.table_id = $1
      GROUP BY pt.table_id
    `;
    const tableResult = await this.pool.query(tableQuery, [tableId]);
    const table = tableResult.rows[0];

    const smallBlindAmount = table.small_blind;
    const bigBlindAmount = table.big_blind;
    const totalPot = smallBlindAmount + bigBlindAmount;

    // Generate community cards (simulated)
    const community: string[] = [];

    const query = `
      INSERT INTO poker_hands (hand_id, table_id, small_blind_amount, big_blind_amount, pot, status)
      VALUES ($1, $2, $3, $4, $5, 'pre-flop')
      RETURNING *
    `;

    const result = await databaseService.query(query, [
      handId,
      tableId,
      smallBlindAmount,
      bigBlindAmount,
      totalPot,
    ]);

    return {
      handId: result.rows[0].hand_id,
      tableId: result.rows[0].table_id,
      buttonPosition: 0,
      smallBlindAmount,
      bigBlindAmount,
      pot: totalPot,
      community,
      status: "pre-flop",
      startedAt: result.rows[0].started_at,
    };
  }

  // Simulate hand completion and distribute pot
  async completeHand(handId: string, winnerId: number, winningHand: string): Promise<void> {
    // Get hand details
    const handQuery = `
      SELECT * FROM poker_hands WHERE hand_id = $1
    `;
    const handResult = await this.pool.query(handQuery, [handId]);
    const hand = handResult.rows[0];

    // Update hand status
    await databaseService.query(
      `
      UPDATE poker_hands
      SET status = 'finished', winner_id = $2, winning_hand = $3
      WHERE hand_id = $1
    `,
      [handId, winnerId, winningHand],
    );

    // Distribute pot to winner
    const pot = hand.pot;
    await databaseService.query(
      `
      UPDATE user_balances
      SET sweeps_coins = sweeps_coins + $2
      WHERE user_id = $1
    `,
      [winnerId, pot],
    );

    // Log transaction
    await databaseService.query(
      `
      INSERT INTO transactions (user_id, transaction_type, currency, amount, description, status)
      VALUES ($1, 'win', 'SC', $2, $3, 'completed')
    `,
      [winnerId, pot, `Poker hand win with ${winningHand}`],
    );

    // Update player stats
    await databaseService.query(
      `
      UPDATE poker_players
      SET total_wins = total_wins + 1
      WHERE user_id = $1
    `,
      [winnerId],
    );
  }

  // Get player poker statistics
  async getPlayerStats(userId: number) {
    const query = `
      SELECT 
        COUNT(DISTINCT table_id) as tables_joined,
        SUM(CASE WHEN total_wins > 0 THEN 1 ELSE 0 END) as winning_sessions,
        SUM(total_wins) as total_wins,
        SUM(total_losses) as total_losses,
        AVG(stack) as avg_stack
      FROM poker_players
      WHERE user_id = $1
    `;

    const result = await databaseService.query(query, [userId]);
    return result.rows[0];
  }

  // Get poker admin stats
  async getAdminStats() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM poker_tables) as total_tables,
        (SELECT COUNT(*) FROM poker_tables WHERE status = 'open') as open_tables,
        (SELECT COUNT(*) FROM poker_players WHERE is_active = TRUE) as active_players,
        (SELECT COUNT(DISTINCT table_id) FROM poker_players) as tables_with_players,
        (SELECT SUM(pot) FROM poker_hands WHERE status = 'finished') as total_pots_distributed,
        (SELECT AVG(pot) FROM poker_hands WHERE status = 'finished') as avg_pot_size
      FROM poker_tables LIMIT 1
    `;

    const result = await databaseService.query(query);
    return result.rows[0];
  }

  // Get table history
  async getTableHistory(tableId: string, limit: number = 50) {
    const query = `
      SELECT 
        ph.*,
        u.username as winner_username
      FROM poker_hands ph
      LEFT JOIN users u ON ph.winner_id = u.id
      WHERE ph.table_id = $1
      ORDER BY ph.started_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [tableId, limit]);
    return result.rows;
  }
}
