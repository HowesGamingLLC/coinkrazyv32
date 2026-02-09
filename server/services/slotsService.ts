import databaseService from "./database";

export interface Game {
  id: string;
  name: string;
  provider: string;
  category: string;
  image: string;
  description: string;
  rtp: number; // Return to Player percentage
  volatility: "low" | "medium" | "high";
  maxWin: number;
  minBet: number;
  maxBet: number;
  lines: number;
  reels: number;
  isActive: boolean;
  featured: boolean;
  totalPlays: number;
  totalProfit: number;
}

export interface SpinResult {
  spinId: string;
  gameId: string;
  userId: number;
  betAmount: number;
  currency: "GC" | "SC";
  result: string; // "win" | "loss"
  payout: number;
  multiplier: number;
  lines: string[];
  symbols: string[];
  isJackpot: boolean;
  timestamp: string;
}

// Mock games database - In production, this would be external API
const GAMES: Game[] = [
  {
    id: "mega-fortune",
    name: "Mega Fortune",
    provider: "NetEnt",
    category: "Jackpot",
    image: "🎰",
    description: "Progressive jackpot slot with 5 reels",
    rtp: 96.9,
    volatility: "high",
    maxWin: 150000,
    minBet: 0.01,
    maxBet: 500,
    lines: 25,
    reels: 5,
    isActive: true,
    featured: true,
    totalPlays: 1500000,
    totalProfit: 850000,
  },
  {
    id: "book-of-dead",
    name: "Book of Dead",
    provider: "Play'n GO",
    category: "Popular",
    image: "📚",
    description: "Egyptian themed adventure slot",
    rtp: 96.21,
    volatility: "high",
    maxWin: 250000,
    minBet: 0.01,
    maxBet: 100,
    lines: 10,
    reels: 5,
    isActive: true,
    featured: true,
    totalPlays: 2000000,
    totalProfit: 1200000,
  },
  {
    id: "starburst",
    name: "Starburst",
    provider: "NetEnt",
    category: "Popular",
    image: "⭐",
    description: "Cosmic slot with expanding wilds",
    rtp: 96.1,
    volatility: "low",
    maxWin: 50000,
    minBet: 0.01,
    maxBet: 100,
    lines: 10,
    reels: 5,
    isActive: true,
    featured: false,
    totalPlays: 3000000,
    totalProfit: 950000,
  },
  {
    id: "gonzo-quest",
    name: "Gonzo's Quest",
    provider: "NetEnt",
    category: "Adventure",
    image: "🗿",
    description: "Jungle adventure with falling symbols",
    rtp: 96.0,
    volatility: "medium",
    maxWin: 125000,
    minBet: 0.01,
    maxBet: 100,
    lines: 20,
    reels: 5,
    isActive: true,
    featured: false,
    totalPlays: 1800000,
    totalProfit: 700000,
  },
  {
    id: "wolf-gold",
    name: "Wolf Gold",
    provider: "Pragmatic",
    category: "New Games",
    image: "🐺",
    description: "Wild west wolf hunt",
    rtp: 96.01,
    volatility: "medium",
    maxWin: 500000,
    minBet: 0.01,
    maxBet: 250,
    lines: 25,
    reels: 5,
    isActive: true,
    featured: true,
    totalPlays: 900000,
    totalProfit: 450000,
  },
  {
    id: "sweet-bonanza",
    name: "Sweet Bonanza",
    provider: "Pragmatic",
    category: "Popular",
    image: "🍭",
    description: "Candy land of wins",
    rtp: 96.48,
    volatility: "medium",
    maxWin: 211100,
    minBet: 0.01,
    maxBet: 125,
    lines: 6,
    reels: 6,
    isActive: true,
    featured: false,
    totalPlays: 2500000,
    totalProfit: 1500000,
  },
  {
    id: "gates-of-olympus",
    name: "Gates of Olympus",
    provider: "Pragmatic",
    category: "Mythology",
    image: "⚡",
    description: "Godly rewards await",
    rtp: 96.5,
    volatility: "high",
    maxWin: 500000,
    minBet: 0.01,
    maxBet: 250,
    lines: 20,
    reels: 6,
    isActive: true,
    featured: true,
    totalPlays: 1200000,
    totalProfit: 600000,
  },
];

class SlotsService {
  /**
   * Get all available games
   */
  async getAllGames(): Promise<Game[]> {
    try {
      // Try to get from database first
      const result = await databaseService.getActiveGames();
      return result.length > 0 ? result : this.seedGamesIfNeeded();
    } catch (error) {
      console.error("Error fetching games from database:", error);
      return GAMES;
    }
  }

  /**
   * Get featured games
   */
  async getFeaturedGames(): Promise<Game[]> {
    const games = await this.getAllGames();
    return games.filter((game) => game.featured).slice(0, 6);
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: string): Promise<Game | null> {
    const games = await this.getAllGames();
    return games.find((game) => game.id === gameId) || null;
  }

  /**
   * Get games by category
   */
  async getGamesByCategory(category: string): Promise<Game[]> {
    const games = await this.getAllGames();
    return games.filter((game) => game.category === category);
  }

  /**
   * Simulate a spin and return result
   */
  async spin(
    gameId: string,
    userId: number,
    betAmount: number,
    currency: "GC" | "SC",
  ): Promise<SpinResult> {
    const spinId = `spin_${Date.now()}_${userId}_${gameId}`;
    const game = await this.getGameById(gameId);

    if (!game) {
      throw new Error("Game not found");
    }

    // Validate bet
    if (betAmount < game.minBet || betAmount > game.maxBet) {
      throw new Error(`Bet must be between ${game.minBet} and ${game.maxBet}`);
    }

    // Get user balance
    const balance = await databaseService.getUserBalance(userId);
    if (currency === "GC" && balance.gold_coins < betAmount * 1000) {
      throw new Error("Insufficient Gold Coins");
    }
    if (currency === "SC" && balance.sweeps_coins < betAmount) {
      throw new Error("Insufficient Sweeps Coins");
    }

    // Deduct bet
    await databaseService.updateUserBalance(
      userId,
      currency === "GC" ? -betAmount : 0,
      currency === "SC" ? -betAmount : 0,
      `Bet on ${game.name}`,
      gameId,
    );

    // Calculate win
    const { result, payout, multiplier, isJackpot } = this.calculateWin(
      game,
      betAmount,
    );

    // If win, add payout
    let finalPayout = 0;
    if (result === "win") {
      finalPayout = payout;
      await databaseService.updateUserBalance(
        userId,
        currency === "GC" ? finalPayout : 0,
        currency === "SC" ? finalPayout : 0,
        `Won on ${game.name} (${multiplier}x)`,
        gameId,
      );
    }

    // Record spin
    const spinResult: SpinResult = {
      spinId,
      gameId,
      userId,
      betAmount,
      currency,
      result,
      payout: finalPayout,
      multiplier,
      lines: this.generateWinningLines(game.lines),
      symbols: this.generateSymbols(game.reels),
      isJackpot,
      timestamp: new Date().toISOString(),
    };

    // Store spin in database
    try {
      await databaseService.query(
        `INSERT INTO game_spins (spin_id, user_id, game_id, bet_amount, currency, result, payout, multiplier, is_jackpot, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          spinId,
          userId,
          gameId,
          betAmount,
          currency,
          result,
          finalPayout,
          multiplier,
          isJackpot,
        ],
      );

      // Update game stats
      const profit = betAmount - finalPayout;
      await databaseService.updateGameStats(
        gameId,
        currency === "GC" ? profit : 0,
        currency === "SC" ? profit : 0,
      );
    } catch (error) {
      console.error("Error recording spin:", error);
    }

    return spinResult;
  }

  /**
   * Calculate win based on RTP and volatility
   */
  private calculateWin(
    game: Game,
    betAmount: number,
  ): {
    result: "win" | "loss";
    payout: number;
    multiplier: number;
    isJackpot: boolean;
  } {
    // Generate random number between 0 and 100
    const randomValue = Math.random() * 100;

    // Base win probability
    const baseWinChance = game.rtp;

    // Adjust based on volatility
    let winChance = baseWinChance;
    if (game.volatility === "low") {
      winChance = baseWinChance + 2;
    } else if (game.volatility === "high") {
      winChance = baseWinChance - 2;
    }

    // Check for win
    if (randomValue > winChance) {
      return {
        result: "loss",
        payout: 0,
        multiplier: 0,
        isJackpot: false,
      };
    }

    // Calculate multiplier
    const isJackpot = Math.random() < 0.001; // 0.1% jackpot chance
    let multiplier = 0;

    if (isJackpot) {
      multiplier = game.maxWin / betAmount;
    } else {
      // Random multiplier between 2x and 50x (except jackpot)
      const multipliers = [2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 8, 10, 15, 20, 25];
      multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    }

    // Ensure payout doesn't exceed max win
    const payout = Math.min(betAmount * multiplier, game.maxWin);

    return {
      result: "win",
      payout,
      multiplier: multiplier,
      isJackpot,
    };
  }

  /**
   * Generate winning line numbers for display
   */
  private generateWinningLines(totalLines: number): string[] {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 winning lines
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      lines.push(`Line ${Math.floor(Math.random() * totalLines) + 1}`);
    }
    return [...new Set(lines)]; // Remove duplicates
  }

  /**
   * Generate random symbols for reel display
   */
  private generateSymbols(reels: number): string[] {
    const symbols = ["🎰", "🍒", "🍋", "🍊", "👑", "💎", "7️⃣", "⭐"];
    const result: string[] = [];
    for (let i = 0; i < reels; i++) {
      result.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    return result;
  }

  /**
   * Seed games into database if empty
   */
  private async seedGamesIfNeeded(): Promise<Game[]> {
    try {
      for (const game of GAMES) {
        await databaseService.query(
          `INSERT INTO games (game_id, name, provider, category, image, description, rtp, volatility, max_win, min_bet, max_bet, lines, reels, is_active, is_featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (game_id) DO NOTHING`,
          [
            game.id,
            game.name,
            game.provider,
            game.category,
            game.image,
            game.description,
            game.rtp,
            game.volatility,
            game.maxWin,
            game.minBet,
            game.maxBet,
            game.lines,
            game.reels,
            game.isActive,
            game.featured,
          ],
        );
      }
      return GAMES;
    } catch (error) {
      console.error("Error seeding games:", error);
      return GAMES;
    }
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string) {
    const result = await databaseService.query(
      `SELECT 
        COUNT(*) as total_spins,
        SUM(payout) as total_payouts,
        COUNT(CASE WHEN result = 'win' THEN 1 END) as total_wins,
        AVG(multiplier) as avg_multiplier,
        MAX(payout) as max_payout,
        MAX(multiplier) as max_multiplier
       FROM game_spins 
       WHERE game_id = $1`,
      [gameId],
    );

    return result.rows[0];
  }
}

export const slotsService = new SlotsService();
export default slotsService;
