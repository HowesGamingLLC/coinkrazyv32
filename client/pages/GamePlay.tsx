import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Game {
  id: string;
  name: string;
  provider: string;
  category: string;
  image: string;
  description: string;
  rtp: number;
  volatility: string;
  maxWin: number;
  minBet: number;
  maxBet: number;
}

interface Balance {
  goldCoins: number;
  sweepsCoins: number;
}

interface SpinResult {
  spinId: string;
  gameId: string;
  result: "win" | "loss";
  payout: number;
  multiplier: number;
  symbols: string[];
  isJackpot: boolean;
}

export const GamePlay = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance>({
    goldCoins: 0,
    sweepsCoins: 0,
  });
  const [betAmount, setBetAmount] = useState(1);
  const [currency, setCurrency] = useState<"GC" | "SC">("GC");
  const [spinning, setSpinning] = useState(false);
  const [lastSpin, setLastSpin] = useState<SpinResult | null>(null);
  const [reels, setReels] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      const gameResponse = await fetch(`/api/games/${gameId}`);
      const gameData = await gameResponse.json();

      if (gameData.success) {
        setGame(gameData.game);
      }

      // Fetch user balance
      const token = localStorage.getItem("token");
      const balanceResponse = await fetch("/api/user/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const balanceData = await balanceResponse.json();

      if (balanceData.success) {
        setBalance({
          goldCoins: balanceData.balance.gold_coins,
          sweepsCoins: balanceData.balance.sweeps_coins,
        });
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
      setError("Failed to load game");
    } finally {
      setLoading(false);
    }
  };

  const generateReels = () => {
    const symbols = ["🎰", "🍒", "🍋", "🍊", "👑", "💎", "7️⃣", "⭐"];
    return Array.from({ length: 5 }).map(
      () => symbols[Math.floor(Math.random() * symbols.length)],
    );
  };

  const handleSpin = async () => {
    if (!game) return;

    // Validate bet
    const availableBalance =
      currency === "GC" ? balance.goldCoins / 1000 : balance.sweepsCoins;
    if (betAmount > availableBalance) {
      setError("Insufficient balance");
      return;
    }

    setSpinning(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/games/${gameId}/spin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          betAmount,
          currency,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Animate reels
        const newReels = generateReels();
        setReels(newReels);

        // Update after animation
        setTimeout(() => {
          setLastSpin(data.spin);
          setBalance(data.newBalance);
          setReels(data.spin.symbols || newReels);
        }, 1000);
      } else {
        setError(data.error || "Spin failed");
      }
    } catch (error) {
      console.error("Spin error:", error);
      setError("Failed to process spin");
    } finally {
      setSpinning(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#f0f6fc" }}>Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div style={{ color: "#ff6b6b", marginBottom: "1rem" }}>
            Game not found
          </div>
          <button
            onClick={() => navigate("/games")}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#ffd700",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/games")}
          style={{
            marginBottom: "2rem",
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            border: "1px solid #30363d",
            color: "#f0f6fc",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          ← Back to Lobby
        </button>

        {/* Game Header */}
        <div
          style={{
            backgroundColor: "#161b22",
            borderRadius: "1rem",
            border: "1px solid #30363d",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "start",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                fontSize: "5rem",
              }}
            >
              {game.image}
            </div>
            <div>
              <h1
                style={{
                  color: "#ffd700",
                  fontSize: "2rem",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {game.name}
              </h1>
              <p
                style={{
                  color: "#8b949e",
                  margin: "0 0 1rem 0",
                }}
              >
                by {game.provider}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: "0.875rem",
                    }}
                  >
                    RTP
                  </div>
                  <div
                    style={{
                      color: "#f0f6fc",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    {game.rtp}%
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: "0.875rem",
                    }}
                  >
                    Volatility
                  </div>
                  <div
                    style={{
                      color: "#f0f6fc",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    {game.volatility.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: "0.875rem",
                    }}
                  >
                    Max Win
                  </div>
                  <div
                    style={{
                      color: "#f0f6fc",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                    }}
                  >
                    {game.maxWin.toLocaleString()}x
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #ffd700",
              borderRadius: "0.75rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#ffd700",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              GOLD COINS
            </div>
            <div
              style={{
                color: "#f0f6fc",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {(balance.goldCoins / 1000).toLocaleString()}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #7c3aed",
              borderRadius: "0.75rem",
              padding: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#7c3aed",
                fontSize: "0.875rem",
                marginBottom: "0.5rem",
              }}
            >
              SWEEPS COINS
            </div>
            <div
              style={{
                color: "#f0f6fc",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              {balance.sweepsCoins.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div
          style={{
            backgroundColor: "#161b22",
            borderRadius: "1rem",
            border: "1px solid #30363d",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* Reels */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "2rem",
              minHeight: "150px",
              alignItems: "center",
            }}
          >
            {reels.length === 0 ? (
              <div
                style={{
                  fontSize: "5rem",
                  color: "#444",
                  display: "flex",
                  gap: "1rem",
                }}
              >
                <span>🎰</span>
                <span>🎰</span>
                <span>🎰</span>
                <span>🎰</span>
                <span>🎰</span>
              </div>
            ) : (
              reels.map((symbol, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "3rem",
                    animation: spinning ? "spin 0.5s ease-in-out" : "none",
                  }}
                >
                  {symbol}
                </div>
              ))
            )}
          </div>

          {/* Last Spin Result */}
          {lastSpin && (
            <div
              style={{
                backgroundColor: "#0d1117",
                borderRadius: "0.75rem",
                padding: "1rem",
                marginBottom: "2rem",
                textAlign: "center",
              }}
            >
              {lastSpin.result === "win" ? (
                <>
                  <div
                    style={{
                      color: "#4ade80",
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    🎉 YOU WIN!
                  </div>
                  <div
                    style={{
                      color: "#ffd700",
                      fontSize: "2rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    +{lastSpin.payout.toLocaleString()} {currency}
                  </div>
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: "0.875rem",
                    }}
                  >
                    {lastSpin.multiplier}x Multiplier{" "}
                    {lastSpin.isJackpot && "🎊 JACKPOT!"}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: "#8b949e",
                  }}
                >
                  No match this time. Try again!
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: "#3d2d2d",
                border: "1px solid #8b4444",
                color: "#ff6b6b",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          {/* Betting Controls */}
          <div
            style={{
              backgroundColor: "#0d1117",
              borderRadius: "0.75rem",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                marginBottom: "1.5rem",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "#f0f6fc",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                Bet Amount: {betAmount}
              </label>
              <input
                type="range"
                min={game.minBet}
                max={Math.min(
                  game.maxBet,
                  currency === "GC"
                    ? balance.goldCoins / 1000
                    : balance.sweepsCoins,
                )}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={spinning}
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => setCurrency("GC")}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: currency === "GC" ? "#ffd700" : "#21262d",
                    color: currency === "GC" ? "#000" : "#f0f6fc",
                    border: `1px solid ${
                      currency === "GC" ? "#ffd700" : "#30363d"
                    }`,
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  🪙 Gold Coins
                </button>
                <button
                  onClick={() => setCurrency("SC")}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: currency === "SC" ? "#7c3aed" : "#21262d",
                    color: currency === "SC" ? "#fff" : "#f0f6fc",
                    border: `1px solid ${
                      currency === "SC" ? "#7c3aed" : "#30363d"
                    }`,
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  💎 Sweeps Coins
                </button>
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                width: "100%",
                padding: "1.5rem",
                backgroundColor: spinning ? "#666" : "#ffd700",
                color: "#000",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1.25rem",
                fontWeight: "700",
                cursor: spinning ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!spinning)
                  e.currentTarget.style.backgroundColor = "#ffed4e";
              }}
              onMouseLeave={(e) => {
                if (!spinning)
                  e.currentTarget.style.backgroundColor = "#ffd700";
              }}
            >
              {spinning ? "SPINNING..." : "SPIN"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GamePlay;
