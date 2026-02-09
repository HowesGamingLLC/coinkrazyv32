import React, { useState, useEffect } from "react";

export const BonusFeatures = () => {
  const [activeTab, setActiveTab] = useState<
    "leaderboards" | "vip" | "tournaments" | "affiliates" | "social"
  >("leaderboards");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      switch (activeTab) {
        case "leaderboards":
          const leaderRes = await fetch("/api/bonus/leaderboards/weekly", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const leaderData = await leaderRes.json();
          setData(leaderData.leaderboard);
          break;

        case "vip":
          const vipRes = await fetch("/api/bonus/vip/status", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const vipData = await vipRes.json();
          setData(vipData.status);
          break;

        case "tournaments":
          const tournRes = await fetch("/api/bonus/tournaments");
          const tournData = await tournRes.json();
          setData(tournData.tournaments);
          break;

        case "affiliates":
          const affRes = await fetch("/api/bonus/affiliate/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const affData = await affRes.json();
          setData(affData.profile);
          break;

        case "social":
          const socRes = await fetch("/api/bonus/social/guilds");
          const socData = await socRes.json();
          setData(socData.guilds);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1
          style={{
            color: "#ffd700",
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Bonus Features 🎁
        </h1>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "1px solid #30363d",
            overflowX: "auto",
            paddingBottom: "1rem",
          }}
        >
          {(
            ["leaderboards", "vip", "tournaments", "affiliates", "social"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                border: "none",
                color: activeTab === tab ? "#ffd700" : "#8b949e",
                fontSize: "0.95rem",
                fontWeight: activeTab === tab ? "600" : "400",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab ? "2px solid #ffd700" : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {tab === "leaderboards" && "🏆 Leaderboards"}
              {tab === "vip" && "💎 VIP"}
              {tab === "tournaments" && "🏅 Tournaments"}
              {tab === "affiliates" && "💰 Affiliates"}
              {tab === "social" && "👥 Social"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#f0f6fc",
              padding: "2rem",
            }}
          >
            Loading...
          </div>
        ) : (
          <>
            {/* Leaderboards */}
            {activeTab === "leaderboards" && data && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "1rem",
                  border: "1px solid #30363d",
                  padding: "2rem",
                }}
              >
                <h2
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1.5rem",
                    marginTop: 0,
                    marginBottom: "1.5rem",
                  }}
                >
                  🏆 Weekly Leaderboard
                </h2>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #30363d" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem",
                            color: "#8b949e",
                            fontWeight: "600",
                          }}
                        >
                          Rank
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem",
                            color: "#8b949e",
                            fontWeight: "600",
                          }}
                        >
                          Player
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "1rem",
                            color: "#8b949e",
                            fontWeight: "600",
                          }}
                        >
                          Wins
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "1rem",
                            color: "#8b949e",
                            fontWeight: "600",
                          }}
                        >
                          Winnings
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((entry: any, index: number) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #30363d",
                          }}
                        >
                          <td
                            style={{
                              padding: "1rem",
                              color:
                                entry.rank === 1
                                  ? "#ffd700"
                                  : entry.rank === 2
                                  ? "#c0c0c0"
                                  : entry.rank === 3
                                  ? "#cd7f32"
                                  : "#f0f6fc",
                              fontWeight: "bold",
                            }}
                          >
                            {entry.rank === 1 && "🥇"}
                            {entry.rank === 2 && "🥈"}
                            {entry.rank === 3 && "🥉"}
                            {entry.rank > 3 && `#${entry.rank}`}
                          </td>
                          <td style={{ padding: "1rem", color: "#f0f6fc" }}>
                            {entry.username}
                          </td>
                          <td style={{ padding: "1rem", color: "#ffd700" }}>
                            {entry.winCount}
                          </td>
                          <td
                            style={{
                              padding: "1rem",
                              textAlign: "right",
                              color: "#4ade80",
                              fontWeight: "600",
                            }}
                          >
                            {entry.totalWinnings.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIP Status */}
            {activeTab === "vip" && data && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "1rem",
                  border: "1px solid #30363d",
                  padding: "2rem",
                }}
              >
                <h2
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1.5rem",
                    marginTop: 0,
                  }}
                >
                  💎 VIP Status
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "3rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {data.tier.icon}
                    </div>
                    <div
                      style={{
                        color: "#ffd700",
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                      }}
                    >
                      {data.tier.name}
                    </div>
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Total Spent: ${data.totalSpent.toFixed(2)}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                    }}
                  >
                    <h4
                      style={{
                        color: "#f0f6fc",
                        margin: "0 0 1rem 0",
                      }}
                    >
                      Benefits
                    </h4>
                    <ul
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        margin: 0,
                        paddingLeft: "1.5rem",
                      }}
                    >
                      <li>
                        {data.tier.benefits.depositBonus}% Deposit Bonus
                      </li>
                      <li>
                        {data.tier.benefits.cashbackRate}% Cashback Rate
                      </li>
                      <li>
                        {data.tier.benefits.spinMultiplier}x Spin Multiplier
                      </li>
                      {data.tier.benefits.prioritySupport && (
                        <li>Priority Support ⭐</li>
                      )}
                    </ul>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      VIP Points
                    </div>
                    <div
                      style={{
                        color: "#ffd700",
                        fontSize: "2rem",
                        fontWeight: "bold",
                      }}
                    >
                      {data.pointsBalance}
                    </div>
                    <button
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#ffd700",
                        color: "#000",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Redeem Points
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tournaments */}
            {activeTab === "tournaments" && data && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "1rem",
                  border: "1px solid #30363d",
                  padding: "2rem",
                }}
              >
                <h2
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1.5rem",
                    marginTop: 0,
                    marginBottom: "1.5rem",
                  }}
                >
                  🏅 Active Tournaments
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {data.map((tournament: any) => (
                    <div
                      key={tournament.id}
                      style={{
                        backgroundColor: "#0d1117",
                        borderRadius: "0.75rem",
                        padding: "1.5rem",
                        border: "1px solid #30363d",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        {tournament.icon}
                      </div>
                      <h3
                        style={{
                          color: "#ffd700",
                          fontSize: "1.1rem",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        {tournament.name}
                      </h3>
                      <p
                        style={{
                          color: "#8b949e",
                          fontSize: "0.875rem",
                          margin: "0 0 1rem 0",
                        }}
                      >
                        {tournament.description}
                      </p>
                      <div
                        style={{
                          color: "#8b949e",
                          fontSize: "0.875rem",
                          marginBottom: "1rem",
                        }}
                      >
                        Prize Pool: ${tournament.totalPrizePool.toLocaleString()}
                      </div>
                      <button
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          backgroundColor: "#ffd700",
                          color: "#000",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Join Tournament
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affiliates */}
            {activeTab === "affiliates" && data && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "1rem",
                  border: "1px solid #30363d",
                  padding: "2rem",
                }}
              >
                <h2
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1.5rem",
                    marginTop: 0,
                    marginBottom: "1.5rem",
                  }}
                >
                  💰 Affiliate Program
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Affiliate Code
                    </div>
                    <div
                      style={{
                        color: "#ffd700",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                      }}
                    >
                      {data.affiliateCode}
                    </div>
                    <button
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#21262d",
                        color: "#f0f6fc",
                        border: "1px solid #30363d",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Copy Code
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Total Referrals
                    </div>
                    <div
                      style={{
                        color: "#f0f6fc",
                        fontSize: "2rem",
                        fontWeight: "bold",
                      }}
                    >
                      {data.totalReferrals}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#0d1117",
                      borderRadius: "0.75rem",
                      padding: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        color: "#8b949e",
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Pending Balance
                    </div>
                    <div
                      style={{
                        color: "#4ade80",
                        fontSize: "2rem",
                        fontWeight: "bold",
                      }}
                    >
                      ${data.pendingBalance.toFixed(2)}
                    </div>
                    <button
                      style={{
                        marginTop: "1rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#4ade80",
                        color: "#000",
                        border: "none",
                        borderRadius: "0.375rem",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                      }}
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Social/Guilds */}
            {activeTab === "social" && data && (
              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "1rem",
                  border: "1px solid #30363d",
                  padding: "2rem",
                }}
              >
                <h2
                  style={{
                    color: "#f0f6fc",
                    fontSize: "1.5rem",
                    marginTop: 0,
                    marginBottom: "1.5rem",
                  }}
                >
                  👥 Guilds
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {data.map((guild: any) => (
                    <div
                      key={guild.id}
                      style={{
                        backgroundColor: "#0d1117",
                        borderRadius: "0.75rem",
                        padding: "1.5rem",
                        border: "1px solid #30363d",
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                        {guild.icon}
                      </div>
                      <h3
                        style={{
                          color: "#ffd700",
                          fontSize: "1.1rem",
                          margin: "0 0 0.5rem 0",
                        }}
                      >
                        {guild.name}
                      </h3>
                      <p
                        style={{
                          color: "#8b949e",
                          fontSize: "0.875rem",
                          margin: "0 0 1rem 0",
                        }}
                      >
                        {guild.description}
                      </p>
                      <div
                        style={{
                          color: "#8b949e",
                          fontSize: "0.875rem",
                          marginBottom: "1rem",
                        }}
                      >
                        👥 {guild.memberCount} Members
                      </div>
                      <button
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          backgroundColor: "#ffd700",
                          color: "#000",
                          border: "none",
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Join Guild
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BonusFeatures;
