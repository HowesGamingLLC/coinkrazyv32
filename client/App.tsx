import "./global.css";

import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Error Boundary to catch any React errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "0.5rem",
            margin: "1rem",
            color: "#fff",
          }}
        >
          <h2 style={{ color: "#ff4444", marginBottom: "1rem" }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: "1rem" }}>
            There was an error loading the application.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// McLuck-style Left Sidebar Navigation
const McLuckSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/", label: "Game Lobby", icon: "🎮" },
    { path: "/slots", label: "Slots", icon: "🎰" },
    { path: "/table-games", label: "Table Games", icon: "🃏" },
    { path: "/live-games", label: "Live Games", icon: "📺" },
    { path: "/promotions", label: "Promotions", icon: "🎁" },
    { path: "/loyalty", label: "CoinKrazy Club", icon: "👑" },
    { path: "/shop", label: "Coin Shop", icon: "💰" },
    { path: "/prizes", label: "Prize Redemption", icon: "🏆" },
    { path: "/account", label: "My Account", icon: "👤" },
    { path: "/help", label: "Help Center", icon: "❓" },
  ];

  return (
    <div
      style={{
        width: "280px",
        height: "100vh",
        backgroundColor: "#0d1117",
        borderRight: "1px solid #30363d",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "1.5rem",
          borderBottom: "1px solid #30363d",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            background: "linear-gradient(45deg, #ffd700, #ffb347)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          CoinKrazy.com
        </h1>
        <p
          style={{
            color: "#8b949e",
            fontSize: "0.75rem",
            margin: "0.25rem 0 0 0",
          }}
        >
          Social Casino
        </p>
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, padding: "1rem 0", overflow: "auto" }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                border: "none",
                backgroundColor: isActive ? "#21262d" : "transparent",
                color: isActive ? "#ffd700" : "#c9d1d9",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: isActive ? "600" : "400",
                borderLeft: isActive
                  ? "3px solid #ffd700"
                  : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#161b22";
                  e.currentTarget.style.color = "#f0f6fc";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#c9d1d9";
                }
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Bottom User Info */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid #30363d",
          backgroundColor: "#161b22",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#ffd700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
            }}
          >
            ����
          </div>
          <div>
            <div
              style={{
                color: "#f0f6fc",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              Welcome Back!
            </div>
            <div style={{ color: "#8b949e", fontSize: "0.75rem" }}>
              Player #12345
            </div>
          </div>
        </div>
        <button
          style={{
            width: "100%",
            padding: "0.5rem",
            backgroundColor: "#ffd700",
            color: "#000",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Login / Sign Up
        </button>
      </div>
    </div>
  );
};

// McLuck-style Top Bar with Search and Balance
const McLuckTopBar = () => {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div
      style={{
        height: "80px",
        backgroundColor: "#0d1117",
        borderBottom: "1px solid #30363d",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        marginLeft: "280px",
        position: "fixed",
        top: 0,
        right: 0,
        left: "280px",
        zIndex: 999,
      }}
    >
      {/* Search Bar */}
      <div style={{ flex: 1, maxWidth: "500px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search games by name or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 3rem",
              backgroundColor: "#21262d",
              border: "1px solid #30363d",
              borderRadius: "0.5rem",
              color: "#f0f6fc",
              fontSize: "0.875rem",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />
          <div
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8b949e",
              fontSize: "1rem",
            }}
          >
            🔍
          </div>
        </div>
      </div>

      {/* Coin Balances */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Gold Coins */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#21262d",
            borderRadius: "0.5rem",
            border: "1px solid #ffd700",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>🪙</span>
          <div>
            <div
              style={{
                color: "#ffd700",
                fontSize: "0.75rem",
                fontWeight: "600",
              }}
            >
              GOLD COINS
            </div>
            <div
              style={{ color: "#f0f6fc", fontSize: "1rem", fontWeight: "bold" }}
            >
              25,000
            </div>
          </div>
        </div>

        {/* Sweeps Coins */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#21262d",
            borderRadius: "0.5rem",
            border: "1px solid #7c3aed",
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>💎</span>
          <div>
            <div
              style={{
                color: "#7c3aed",
                fontSize: "0.75rem",
                fontWeight: "600",
              }}
            >
              SWEEPS COINS
            </div>
            <div
              style={{ color: "#f0f6fc", fontSize: "1rem", fontWeight: "bold" }}
            >
              15.50
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#ffd700",
            color: "#000",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>💰</span>
          BUY COINS
        </button>
      </div>
    </div>
  );
};

// Game Category Tags
const GameCategories = () => {
  const [activeCategory, setActiveCategory] = React.useState("All Games");

  const categories = [
    "All Games",
    "New Games",
    "Popular",
    "Jackpot",
    "Slots",
    "Table Games",
    "Live Games",
    "Bingo",
    "Scratch Cards",
    "Recently Played",
    "Favorites",
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "1rem 0",
        overflowX: "auto",
        borderBottom: "1px solid #30363d",
      }}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #30363d",
              borderRadius: "1.5rem",
              backgroundColor: isActive ? "#ffd700" : "#21262d",
              color: isActive ? "#000" : "#c9d1d9",
              fontSize: "0.875rem",
              fontWeight: isActive ? "600" : "400",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#30363d";
                e.currentTarget.style.color = "#f0f6fc";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#21262d";
                e.currentTarget.style.color = "#c9d1d9";
              }
            }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

// Game Grid
const GameGrid = () => {
  const games = [
    {
      name: "Mega Fortune",
      provider: "NetEnt",
      jackpot: "€15.2M",
      image: "🎰",
      category: "Jackpot",
    },
    {
      name: "Book of Dead",
      provider: "Play'n GO",
      multiplier: "x5000",
      image: "📚",
      category: "Popular",
    },
    {
      name: "Starburst",
      provider: "NetEnt",
      volatility: "Low",
      image: "⭐",
      category: "Popular",
    },
    {
      name: "Gonzo's Quest",
      provider: "NetEnt",
      feature: "Avalanche",
      image: "🗿",
      category: "Popular",
    },
    {
      name: "Wolf Gold",
      provider: "Pragmatic",
      jackpot: "€125K",
      image: "🐺",
      category: "New Games",
    },
    {
      name: "Sweet Bonanza",
      provider: "Pragmatic",
      multiplier: "x21,100",
      image: "🍭",
      category: "Popular",
    },
    {
      name: "Gates of Olympus",
      provider: "Pragmatic",
      multiplier: "x5000",
      image: "⚡",
      category: "New Games",
    },
    {
      name: "Big Bass Bonanza",
      provider: "Pragmatic",
      feature: "Free Spins",
      image: "🐟",
      category: "Popular",
    },
    {
      name: "Dead or Alive 2",
      provider: "NetEnt",
      volatility: "Extreme",
      image: "🤠",
      category: "Slots",
    },
    {
      name: "Reactoonz",
      provider: "Play'n GO",
      feature: "Cascading",
      image: "👾",
      category: "Slots",
    },
    {
      name: "Fire Joker",
      provider: "Play'n GO",
      multiplier: "x800",
      image: "🔥",
      category: "Slots",
    },
    {
      name: "Jammin' Jars",
      provider: "Push Gaming",
      feature: "Rolling",
      image: "🍯",
      category: "New Games",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem",
        padding: "1.5rem 0",
      }}
    >
      {games.map((game, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "#161b22",
            borderRadius: "0.75rem",
            overflow: "hidden",
            border: "1px solid #30363d",
            cursor: "pointer",
            transition: "all 0.3s ease",
            position: "relative",
          }}
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
            {/* Play Button */}
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
                {game.jackpot ||
                  game.multiplier ||
                  game.feature ||
                  game.volatility}
              </div>
              <button
                style={{
                  padding: "0.375rem 0.75rem",
                  backgroundColor: "#ffd700",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                PLAY
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Content Area
const MainContent = () => {
  return (
    <div
      style={{
        marginLeft: "280px",
        marginTop: "80px",
        minHeight: "calc(100vh - 80px)",
        backgroundColor: "#0d1117",
        padding: "0 2rem 2rem 2rem",
      }}
    >
      <GameCategories />
      <GameGrid />
    </div>
  );
};

// Bottom Quick Access Bar
const BottomBar = () => {
  const quickItems = [
    { label: "Recently Played", icon: "⏱️" },
    { label: "Favorites", icon: "❤️" },
    { label: "Account", icon: "👤" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "280px",
        right: 0,
        height: "60px",
        backgroundColor: "#161b22",
        borderTop: "1px solid #30363d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        zIndex: 999,
      }}
    >
      {quickItems.map((item, index) => (
        <button
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            border: "none",
            color: "#8b949e",
            fontSize: "0.875rem",
            cursor: "pointer",
            borderRadius: "0.375rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#21262d";
            e.currentTarget.style.color = "#f0f6fc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#8b949e";
          }}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};

// Main App Component (CoinKrazy.com)
const App = () => {
  React.useEffect(() => {
    console.log(
      "🎰 CoinKrazy.com loaded successfully - " + new Date().toISOString(),
    );

    // Set dark theme body styles
    document.body.style.backgroundColor = "#0d1117";
    document.body.style.color = "#f0f6fc";
    document.body.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0d1117",
            display: "flex",
            overflow: "hidden",
          }}
        >
          <McLuckSidebar />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <McLuckTopBar />
            <div style={{ flex: 1, overflow: "auto" }}>
              <Routes>
                <Route path="/" element={<MainContent />} />
                <Route path="/slots" element={<MainContent />} />
                <Route path="/table-games" element={<MainContent />} />
                <Route path="/live-games" element={<MainContent />} />
                <Route path="/promotions" element={<MainContent />} />
                <Route path="/loyalty" element={<MainContent />} />
                <Route path="/shop" element={<MainContent />} />
                <Route path="/prizes" element={<MainContent />} />
                <Route path="/account" element={<MainContent />} />
                <Route path="/help" element={<MainContent />} />
                <Route path="*" element={<MainContent />} />
              </Routes>
            </div>
            <BottomBar />
          </div>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
