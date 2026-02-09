import React, { useState, useEffect } from "react";

interface SportsEvent {
  eventId: string;
  sport: "nfl" | "nba" | "mlb" | "nhl" | "ncaa";
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  status: "scheduled" | "in-progress" | "completed" | "postponed";
  homeScore?: number;
  awayScore?: number;
  spread?: number;
  overUnder?: number;
  moneylineHome?: number;
  moneylineAway?: number;
}

interface ParlayLeg {
  eventId: string;
  pick: "home" | "away" | "over" | "under";
  betType: "spread" | "moneyline" | "over_under";
  odds: number;
  wager: number;
}

const SportsBetting = () => {
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [selectedSport, setSelectedSport] = useState<
    "nfl" | "nba" | "mlb" | "nhl" | "ncaa"
  >("nfl");
  const [parlay, setParlay] = useState<ParlayLeg[]>([]);
  const [totalWager, setTotalWager] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "parlay" | "history">(
    "events",
  );

  const sportEmojis = {
    nfl: "🏈",
    nba: "🏀",
    mlb: "⚾",
    nhl: "🏒",
    ncaa: "🎓",
  };
  const sportNames = {
    nfl: "NFL",
    nba: "NBA",
    mlb: "MLB",
    nhl: "NHL",
    ncaa: "College Sports",
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedSport]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sports/events?sport=${selectedSport}`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching sports events:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLegToParlay = (
    event: SportsEvent,
    pick: "home" | "away" | "over" | "under",
    betType: "spread" | "moneyline" | "over_under",
    odds: number,
  ) => {
    if (parlay.some((leg) => leg.eventId === event.eventId)) {
      alert("This event is already in your parlay");
      return;
    }

    setParlay([
      ...parlay,
      {
        eventId: event.eventId,
        pick,
        betType,
        odds,
        wager: 0,
      },
    ]);
  };

  const removeLegFromParlay = (eventId: string) => {
    setParlay(parlay.filter((leg) => leg.eventId !== eventId));
  };

  const calculatePotentialPayout = () => {
    if (totalWager === 0) return 0;
    let payout = totalWager;
    parlay.forEach((leg) => {
      payout *= leg.odds / 100;
    });
    return Math.round(payout * 100) / 100;
  };

  const placeBet = async () => {
    if (parlay.length === 0 || totalWager === 0) {
      alert("Please add selections and enter a wager");
      return;
    }

    try {
      const response = await fetch("/api/sports/parlays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          legs: parlay,
          totalWager,
        }),
      });

      if (response.ok) {
        alert("Parlay placed successfully!");
        setParlay([]);
        setTotalWager(0);
        setActiveTab("history");
      } else {
        alert("Failed to place parlay");
      }
    } catch (error) {
      console.error("Error placing parlay:", error);
      alert("Error placing parlay");
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
        ⚽ Sports Betting & Parlays
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
        {["events", "parlay", "history"].map((tab) => (
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
            {tab === "events" && "📊 Live Events"}
            {tab === "parlay" && `🎯 Build Parlay (${parlay.length})`}
            {tab === "history" && "📈 My Bets"}
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div>
          {/* Sport Selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {(["nfl", "nba", "mlb", "nhl", "ncaa"] as const).map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                style={{
                  padding: "1rem",
                  backgroundColor:
                    selectedSport === sport ? "#ffd700" : "#21262d",
                  color: selectedSport === sport ? "#000" : "#f0f6fc",
                  border:
                    selectedSport === sport
                      ? "2px solid #ffd700"
                      : "1px solid #30363d",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                {sportEmojis[sport]} {sportNames[sport]}
              </button>
            ))}
          </div>

          {/* Events List */}
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
              color: "#ffd700",
            }}
          >
            {sportNames[selectedSport]} Events
          </h2>

          {loading ? (
            <p style={{ textAlign: "center", color: "#8b949e" }}>
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p style={{ textAlign: "center", color: "#8b949e" }}>
              No events available for this sport
            </p>
          ) : (
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {events.map((event) => (
                <div
                  key={event.eventId}
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 2fr 1fr",
                      gap: "1rem",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    {/* Home Team */}
                    <div>
                      <h3 style={{ color: "#f0f6fc", marginBottom: "0.5rem" }}>
                        {event.homeTeam}
                      </h3>
                      {event.status === "in-progress" && (
                        <p
                          style={{
                            color: "#00d966",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          }}
                        >
                          {event.homeScore}
                        </p>
                      )}
                    </div>

                    {/* Score/Time */}
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          color: "#8b949e",
                          fontSize: "0.875rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {event.status === "scheduled" && "Upcoming"}
                        {event.status === "in-progress" && "LIVE"}
                        {event.status === "completed" && "Final"}
                      </p>
                      {event.status === "in-progress" ||
                      event.status === "completed" ? (
                        <p style={{ color: "#ffd700", fontSize: "0.875rem" }}>
                          {event.homeScore} - {event.awayScore}
                        </p>
                      ) : (
                        <p style={{ color: "#8b949e", fontSize: "0.75rem" }}>
                          {new Date(event.startTime).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Away Team */}
                    <div style={{ textAlign: "right" }}>
                      <h3 style={{ color: "#f0f6fc", marginBottom: "0.5rem" }}>
                        {event.awayTeam}
                      </h3>
                      {event.status === "in-progress" && (
                        <p
                          style={{
                            color: "#00d966",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          }}
                        >
                          {event.awayScore}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        padding: "0.5rem",
                        backgroundColor: "#21262d",
                        borderRadius: "0.375rem",
                        textAlign: "center",
                        color:
                          event.status === "in-progress"
                            ? "#ff4444"
                            : "#8b949e",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {event.status === "in-progress" && "🔴 LIVE"}
                      {event.status === "scheduled" && "⏰ Soon"}
                      {event.status === "completed" && "✅ Done"}
                    </div>
                  </div>

                  {/* Betting Options */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Moneyline */}
                    <button
                      onClick={() =>
                        addLegToParlay(
                          event,
                          "home",
                          "moneyline",
                          event.moneylineHome || 100,
                        )
                      }
                      style={{
                        padding: "0.75rem",
                        backgroundColor: "#21262d",
                        border: "1px solid #7c3aed",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        color: "#f0f6fc",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{event.homeTeam}</div>
                      <div style={{ color: "#8b949e", fontSize: "0.75rem" }}>
                        {event.moneylineHome
                          ? (event.moneylineHome > 0 ? "+" : "") +
                            event.moneylineHome
                          : "-"}
                      </div>
                    </button>

                    {/* Spread */}
                    {event.spread !== undefined && (
                      <>
                        <button
                          onClick={() =>
                            addLegToParlay(event, "home", "spread", 110)
                          }
                          style={{
                            padding: "0.75rem",
                            backgroundColor: "#21262d",
                            border: "1px solid #00d966",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            color: "#f0f6fc",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {event.homeTeam}
                          </div>
                          <div
                            style={{ color: "#8b949e", fontSize: "0.75rem" }}
                          >
                            {event.spread > 0 ? "-" : "+"}
                            {Math.abs(event.spread)}
                          </div>
                        </button>
                        <button
                          onClick={() =>
                            addLegToParlay(event, "away", "spread", 110)
                          }
                          style={{
                            padding: "0.75rem",
                            backgroundColor: "#21262d",
                            border: "1px solid #00d966",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            color: "#f0f6fc",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>
                            {event.awayTeam}
                          </div>
                          <div
                            style={{ color: "#8b949e", fontSize: "0.75rem" }}
                          >
                            {event.spread > 0 ? "+" : "-"}
                            {Math.abs(event.spread)}
                          </div>
                        </button>
                      </>
                    )}

                    {/* Over/Under */}
                    {event.overUnder !== undefined && (
                      <>
                        <button
                          onClick={() =>
                            addLegToParlay(event, "over", "over_under", 110)
                          }
                          style={{
                            padding: "0.75rem",
                            backgroundColor: "#21262d",
                            border: "1px solid #ffb81c",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            color: "#f0f6fc",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>Over</div>
                          <div
                            style={{ color: "#8b949e", fontSize: "0.75rem" }}
                          >
                            {event.overUnder}
                          </div>
                        </button>
                        <button
                          onClick={() =>
                            addLegToParlay(event, "under", "over_under", 110)
                          }
                          style={{
                            padding: "0.75rem",
                            backgroundColor: "#21262d",
                            border: "1px solid #ffb81c",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            color: "#f0f6fc",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div style={{ fontWeight: "bold" }}>Under</div>
                          <div
                            style={{ color: "#8b949e", fontSize: "0.75rem" }}
                          >
                            {event.overUnder}
                          </div>
                        </button>
                      </>
                    )}

                    {/* Moneyline Away */}
                    <button
                      onClick={() =>
                        addLegToParlay(
                          event,
                          "away",
                          "moneyline",
                          event.moneylineAway || 100,
                        )
                      }
                      style={{
                        padding: "0.75rem",
                        backgroundColor: "#21262d",
                        border: "1px solid #7c3aed",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        color: "#f0f6fc",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>{event.awayTeam}</div>
                      <div style={{ color: "#8b949e", fontSize: "0.75rem" }}>
                        {event.moneylineAway
                          ? (event.moneylineAway > 0 ? "+" : "") +
                            event.moneylineAway
                          : "-"}
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parlay Tab */}
      {activeTab === "parlay" && (
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
              color: "#ffd700",
            }}
          >
            Build Your Parlay
          </h2>

          {parlay.length === 0 ? (
            <div
              style={{
                padding: "2rem",
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "0.75rem",
                textAlign: "center",
                color: "#8b949e",
              }}
            >
              <p>Add selections from live events to build your parlay</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
              {parlay.map((leg, index) => {
                const event = events.find((e) => e.eventId === leg.eventId);
                return (
                  <div
                    key={index}
                    style={{
                      padding: "1rem",
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: "0.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#ffd700",
                          fontWeight: "bold",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {leg.pick === "home"
                          ? event?.homeTeam
                          : leg.pick === "away"
                            ? event?.awayTeam
                            : `${leg.pick.toUpperCase()}`}
                      </p>
                      <p style={{ color: "#8b949e", fontSize: "0.875rem" }}>
                        {leg.betType === "moneyline" && "Moneyline"}
                        {leg.betType === "spread" && "Spread"}
                        {leg.betType === "over_under" && "Over/Under"} @{" "}
                        {leg.odds}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLegFromParlay(leg.eventId)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#ff4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wager Section */}
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "0.75rem",
            }}
          >
            <h3 style={{ color: "#ffd700", marginBottom: "1rem" }}>
              Place Bet
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#8b949e",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                Wager Amount (SC)
              </label>
              <input
                type="number"
                value={totalWager}
                onChange={(e) => setTotalWager(Number(e.target.value))}
                min={1}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#21262d",
                  border: "1px solid #30363d",
                  borderRadius: "0.375rem",
                  color: "#f0f6fc",
                  fontSize: "1rem",
                  marginBottom: "1rem",
                }}
              />
            </div>

            {parlay.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#8b949e",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>Wager:</span>
                  <span>💎 {totalWager}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#8b949e",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>Legs:</span>
                  <span>{parlay.length}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffd700",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #30363d",
                  }}
                >
                  <span>Potential Win:</span>
                  <span>💎 {calculatePotentialPayout()}</span>
                </div>
              </div>
            )}

            <button
              onClick={placeBet}
              disabled={parlay.length === 0 || totalWager === 0}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor:
                  parlay.length === 0 || totalWager === 0 ? "#666" : "#00d966",
                color: "#000",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1.125rem",
                fontWeight: "bold",
                cursor:
                  parlay.length === 0 || totalWager === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Place Parlay Bet
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1.5rem",
              color: "#ffd700",
            }}
          >
            Your Betting History
          </h2>
          <div
            style={{
              padding: "2rem",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "0.75rem",
              textAlign: "center",
              color: "#8b949e",
            }}
          >
            <p>Your past parlays and bets will appear here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsBetting;
