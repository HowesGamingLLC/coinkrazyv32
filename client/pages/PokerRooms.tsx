import React, { useState, useEffect } from "react";

interface PokerTable {
  tableId: string;
  name: string;
  stakes: { smallBlind: number; bigBlind: number };
  maxPlayers: number;
  currentPlayers: number;
  status: "open" | "playing" | "closed";
  totalPot: number;
  minBuyIn: number;
  maxBuyIn: number;
}

const PokerRooms = () => {
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<PokerTable | null>(null);
  const [buyInAmount, setBuyInAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tables" | "play" | "history">("tables");
  const [playerStack, setPlayerStack] = useState(0);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/poker/tables");
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error("Error fetching poker tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTable = async () => {
    if (!selectedTable || !buyInAmount) {
      alert("Please enter a buy-in amount");
      return;
    }

    if (buyInAmount < selectedTable.minBuyIn || buyInAmount > selectedTable.maxBuyIn) {
      alert(`Buy-in must be between ${selectedTable.minBuyIn} and ${selectedTable.maxBuyIn}`);
      return;
    }

    try {
      const response = await fetch(`/api/poker/tables/${selectedTable.tableId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ buyIn: buyInAmount }),
      });

      if (response.ok) {
        setPlayerStack(buyInAmount);
        setActiveTab("play");
        alert("Successfully joined table!");
      } else {
        alert("Failed to join table");
      }
    } catch (error) {
      console.error("Error joining table:", error);
      alert("Error joining table");
    }
  };

  const handleLeaveTable = async () => {
    if (!selectedTable) return;

    try {
      const response = await fetch(`/api/poker/tables/${selectedTable.tableId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ cashOut: playerStack }),
      });

      if (response.ok) {
        setSelectedTable(null);
        setPlayerStack(0);
        setBuyInAmount(0);
        setActiveTab("tables");
        fetchTables();
      }
    } catch (error) {
      console.error("Error leaving table:", error);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "#0d1117",
        color: "#f0f6fc",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          color: "#ffd700",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        🎰 Poker Rooms
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "1px solid #30363d",
          paddingBottom: "1rem",
        }}
      >
        {["tables", "play", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: activeTab === tab ? "#ffd700" : "#21262d",
              color: activeTab === tab ? "#000" : "#f0f6fc",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: activeTab === tab ? "bold" : "normal",
            }}
          >
            {tab === "tables" && "🎯 Available Tables"}
            {tab === "play" && "🎮 Play Game"}
            {tab === "history" && "📊 History"}
          </button>
        ))}
      </div>

      {/* Available Tables Tab */}
      {activeTab === "tables" && (
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
              color: "#ffd700",
            }}
          >
            Available Poker Tables
          </h2>

          {loading ? (
            <p style={{ textAlign: "center", color: "#8b949e" }}>Loading tables...</p>
          ) : tables.length === 0 ? (
            <p style={{ textAlign: "center", color: "#8b949e" }}>No tables available</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {tables.map((table) => (
                <div
                  key={table.tableId}
                  onClick={() => setSelectedTable(table)}
                  style={{
                    padding: "1.5rem",
                    backgroundColor: selectedTable?.tableId === table.tableId ? "#21262d" : "#161b22",
                    border: selectedTable?.tableId === table.tableId ? "2px solid #ffd700" : "1px solid #30363d",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: selectedTable?.tableId === table.tableId ? "0 0 20px rgba(255, 215, 0, 0.3)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ffd700";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = selectedTable?.tableId === table.tableId ? "#ffd700" : "#30363d";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <h3 style={{ color: "#ffd700", marginBottom: "1rem", fontSize: "1.25rem" }}>
                    {table.name}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      marginBottom: "1rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    <div>
                      <p style={{ color: "#8b949e", marginBottom: "0.25rem" }}>Stakes</p>
                      <p style={{ color: "#f0f6fc", fontWeight: "bold" }}>
                        ${table.stakes.smallBlind} / ${table.stakes.bigBlind}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b949e", marginBottom: "0.25rem" }}>Players</p>
                      <p style={{ color: "#f0f6fc", fontWeight: "bold" }}>
                        {table.currentPlayers} / {table.maxPlayers}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b949e", marginBottom: "0.25rem" }}>Buy-in Range</p>
                      <p style={{ color: "#f0f6fc", fontWeight: "bold" }}>
                        ${table.minBuyIn} - ${table.maxBuyIn}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#8b949e", marginBottom: "0.25rem" }}>Pot</p>
                      <p style={{ color: "#7c3aed", fontWeight: "bold" }}>💎 {table.totalPot}</p>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#1c1f26",
                      borderRadius: "0.375rem",
                      textAlign: "center",
                      color:
                        table.status === "open"
                          ? "#00d966"
                          : table.status === "playing"
                            ? "#ffb81c"
                            : "#8b949e",
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                    }}
                  >
                    {table.status === "open" && "✅ Open"}
                    {table.status === "playing" && "🎮 Playing"}
                    {table.status === "closed" && "❌ Closed"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buy-in Section */}
          {selectedTable && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1.5rem",
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "0.75rem",
              }}
            >
              <h3 style={{ color: "#ffd700", marginBottom: "1rem" }}>Join {selectedTable.name}</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#8b949e",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Buy-in Amount (${selectedTable.minBuyIn} - ${selectedTable.maxBuyIn})
                </label>
                <input
                  type="number"
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(Number(e.target.value))}
                  min={selectedTable.minBuyIn}
                  max={selectedTable.maxBuyIn}
                  step={selectedTable.minBuyIn}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#21262d",
                    border: "1px solid #30363d",
                    borderRadius: "0.375rem",
                    color: "#f0f6fc",
                    fontSize: "1rem",
                  }}
                />
              </div>
              <button
                onClick={handleJoinTable}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#ffd700",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Join Table 🎮
              </button>
            </div>
          )}
        </div>
      )}

      {/* Play Game Tab */}
      {activeTab === "play" && selectedTable && (
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#ffd700" }}>
            Playing at {selectedTable.name}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "2rem",
              marginBottom: "2rem",
            }}
          >
            {/* Poker Table */}
            <div
              style={{
                aspectRatio: "2/1",
                backgroundColor: "#1a3a2f",
                border: "3px solid #8b6914",
                borderRadius: "1.5rem",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <h3 style={{ color: "#ffd700", textAlign: "center" }}>Texas Hold'em</h3>

              {/* Community Cards */}
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", margin: "1rem 0" }}>
                {["🎴", "🎴", "🎴", "🎴", "🎴"].map((card, i) => (
                  <div
                    key={i}
                    style={{
                      width: "60px",
                      height: "90px",
                      backgroundColor: "#f0f6fc",
                      border: "2px solid #ffd700",
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                    }}
                  >
                    {card}
                  </div>
                ))}
              </div>

              {/* Pot Display */}
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#8b949e", marginBottom: "0.5rem" }}>Pot</p>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#7c3aed" }}>
                  💎 {selectedTable.totalPot}
                </p>
              </div>
            </div>

            {/* Player Info */}
            <div>
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <h4 style={{ color: "#ffd700", marginBottom: "1rem" }}>Your Hand</h4>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "1rem",
                      backgroundColor: "#21262d",
                      borderRadius: "0.375rem",
                      textAlign: "center",
                      fontSize: "2rem",
                    }}
                  >
                    🎴
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "1rem",
                      backgroundColor: "#21262d",
                      borderRadius: "0.375rem",
                      textAlign: "center",
                      fontSize: "2rem",
                    }}
                  >
                    🎴
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#21262d",
                    borderRadius: "0.375rem",
                    marginBottom: "1rem",
                  }}
                >
                  <p style={{ color: "#8b949e", marginBottom: "0.25rem", fontSize: "0.875rem" }}>Stack</p>
                  <p style={{ color: "#f0f6fc", fontSize: "1.25rem", fontWeight: "bold" }}>
                    💎 {playerStack}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <button
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#7c3aed",
                    color: "#f0f6fc",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Check
                </button>
                <button
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#ff4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Fold
                </button>
                <button
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "#00d966",
                    color: "#000",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={handleLeaveTable}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#ffd700" }}>
            Your Poker Statistics
          </h2>
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "0.75rem",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#8b949e" }}>Join a table to start playing and see your statistics!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerRooms;
