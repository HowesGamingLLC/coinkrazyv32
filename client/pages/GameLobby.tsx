import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
}

export const GameLobby = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games");
      const data = await response.json();

      if (data.success) {
        setGames(data.games);
        setFilteredGames(data.games);

        // Extract unique categories
        const cats = [
          "All",
          ...new Set(data.games.map((g: Game) => g.category)),
        ];
        setCategories(cats as string[]);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = games;

    // Filter by category
    if (activeCategory !== "All") {
      filtered = filtered.filter((game) => game.category === activeCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (game) =>
          game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredGames(filtered);
  }, [activeCategory, searchQuery, games]);

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
        <div style={{ color: "#f0f6fc" }}>Loading games...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1
          style={{
            color: "#ffd700",
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          Game Lobby
        </h1>

        {/* Search Bar */}
        <div style={{ marginBottom: "2rem" }}>
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "0.75rem 1rem 0.75rem 3rem",
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: "0.5rem",
              color: "#f0f6fc",
              fontSize: "0.875rem",
              outline: "none",
              boxSizing: "border-box",
              backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"%238b949e\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm8 15.5l4.7 4.7a1 1 0 1 0 1.4-1.4l-4.7-4.7\" /></svg>')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "10px center",
              backgroundSize: "16px",
              paddingLeft: "3rem",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />
        </div>

        {/* Category Filter */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "2rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
          }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid #30363d",
                borderRadius: "1.5rem",
                backgroundColor:
                  activeCategory === category ? "#ffd700" : "#21262d",
                color: activeCategory === category ? "#000" : "#c9d1d9",
                fontSize: "0.875rem",
                fontWeight: activeCategory === category ? "600" : "400",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== category) {
                  e.currentTarget.style.backgroundColor = "#30363d";
                  e.currentTarget.style.color = "#f0f6fc";
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== category) {
                  e.currentTarget.style.backgroundColor = "#21262d";
                  e.currentTarget.style.color = "#c9d1d9";
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredGames.map((game) => (
            <div
              key={game.id}
              style={{
                backgroundColor: "#161b22",
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "1px solid #30363d",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => navigate(`/game/${game.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "#ffd700";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(255, 215, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "#30363d";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Game Image */}
              <div
                style={{
                  height: "160px",
                  background: "linear-gradient(135deg, #21262d, #30363d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4rem",
                  position: "relative",
                }}
              >
                {game.image}

                {/* Category Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#ffd700",
                    color: "#000",
                    fontSize: "0.625rem",
                    fontWeight: "600",
                    borderRadius: "0.25rem",
                  }}
                >
                  {game.category}
                </div>

                {/* Play Overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "50px",
                    height: "50px",
                    backgroundColor: "rgba(255, 215, 0, 0.9)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  ▶️
                </div>
              </div>

              {/* Game Info */}
              <div style={{ padding: "1rem" }}>
                <h3
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1rem",
                    fontWeight: "600",
                    margin: "0 0 0.25rem 0",
                  }}
                >
                  {game.name}
                </h3>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    margin: "0 0 0.75rem 0",
                  }}
                >
                  by {game.provider}
                </p>

                {/* Game Features */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#21262d",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        color: "#ffd700",
                      }}
                    >
                      RTP {game.rtp}%
                    </div>
                    <div
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#21262d",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        color: "#7c3aed",
                      }}
                    >
                      {game.volatility}
                    </div>
                  </div>
                </div>

                <button
                  style={{
                    width: "100%",
                    marginTop: "0.75rem",
                    padding: "0.5rem",
                    backgroundColor: "#ffd700",
                    color: "#000",
                    border: "none",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  PLAY NOW
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#8b949e",
            }}
          >
            <p style={{ fontSize: "1.125rem" }}>No games found</p>
            <p style={{ fontSize: "0.875rem" }}>
              Try adjusting your search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
