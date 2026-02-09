import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface Balance {
  gold_coins: number;
  sweeps_coins: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  currency: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [balance, setBalance] = useState<Balance>({
    gold_coins: 0,
    sweeps_coins: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "settings" | "responsible-gaming"
  >("overview");
  const [depositLimit, setDepositLimit] = useState("");
  const [lossLimit, setLossLimit] = useState("");
  const [sessionLimit, setSessionLimit] = useState("");

  useEffect(() => {
    checkAuth();
    fetchUserData();
  }, []);

  const checkAuth = () => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/auth");
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch user data
      const userResponse = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Fetch balance
      const balanceResponse = await fetch("/api/user/balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setBalance(balanceData.balance);
      }

      // Fetch transactions
      const transResponse = await fetch("/api/user/transactions?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (transResponse.ok) {
        const transData = await transResponse.json();
        setTransactions(transData.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const handleSelfExclude = async () => {
    if (
      !window.confirm(
        "Are you sure? This will disable your account for 30 days.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/self-exclude", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Account self-excluded for 30 days");
        handleLogout();
      }
    } catch (error) {
      console.error("Error excluding account:", error);
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
        <div style={{ color: "#f0f6fc" }}>Loading profile...</div>
      </div>
    );
  }

  if (!user) {
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
        <div style={{ color: "#ff6b6b" }}>Failed to load profile</div>
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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1
          style={{
            color: "#ffd700",
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          My Account
        </h1>

        {/* User Info Card */}
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
              justifyContent: "space-between",
              alignItems: "start",
              gap: "2rem",
            }}
          >
            <div>
              <h2
                style={{
                  color: "#f0f6fc",
                  fontSize: "1.5rem",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user.username}
              </h2>
              <p
                style={{
                  color: "#8b949e",
                  margin: "0 0 1rem 0",
                }}
              >
                @{user.username}
              </p>
              <p
                style={{
                  color: "#8b949e",
                  margin: "0 0 1rem 0",
                  fontSize: "0.875rem",
                }}
              >
                Joined {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ff6b6b",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Logout
            </button>
          </div>

          {/* Balance Display */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#0d1117",
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
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                }}
              >
                {(balance.gold_coins / 1000).toLocaleString()}
              </div>
              <button
                onClick={() => navigate("/shop")}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ffd700",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                Buy More
              </button>
            </div>

            <div
              style={{
                backgroundColor: "#0d1117",
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
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                }}
              >
                {balance.sweeps_coins.toLocaleString()}
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  color: "#8b949e",
                  fontSize: "0.75rem",
                }}
              >
                Earn through gameplay
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "1px solid #30363d",
          }}
        >
          {(
            ["overview", "history", "settings", "responsible-gaming"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "1rem 1.5rem",
                backgroundColor: "transparent",
                border: "none",
                color: activeTab === tab ? "#ffd700" : "#8b949e",
                fontSize: "1rem",
                fontWeight: activeTab === tab ? "600" : "400",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab ? "2px solid #ffd700" : "transparent",
              }}
            >
              {tab === "responsible-gaming"
                ? "Responsible Gaming"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div
              style={{
                backgroundColor: "#161b22",
                borderRadius: "0.75rem",
                border: "1px solid #30363d",
                padding: "1.5rem",
              }}
            >
              <h2
                style={{
                  color: "#f0f6fc",
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                }}
              >
                Account Overview
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0d1117",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div style={{ color: "#8b949e", fontSize: "0.875rem" }}>
                    Email
                  </div>
                  <div style={{ color: "#f0f6fc", fontWeight: "600" }}>
                    {user.email}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#0d1117",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div style={{ color: "#8b949e", fontSize: "0.875rem" }}>
                    Member Since
                  </div>
                  <div style={{ color: "#f0f6fc", fontWeight: "600" }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#0d1117",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div style={{ color: "#8b949e", fontSize: "0.875rem" }}>
                    Total Transactions
                  </div>
                  <div style={{ color: "#f0f6fc", fontWeight: "600" }}>
                    {transactions.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: "0.75rem",
              border: "1px solid #30363d",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                color: "#f0f6fc",
                fontSize: "1.25rem",
                marginBottom: "1rem",
              }}
            >
              Transaction History
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #30363d",
                    }}
                  >
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      style={{
                        borderBottom: "1px solid #30363d",
                      }}
                    >
                      <td style={{ padding: "1rem", color: "#f0f6fc" }}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem", color: "#8b949e" }}>
                        {transaction.transaction_type}
                      </td>
                      <td style={{ padding: "1rem", color: "#8b949e" }}>
                        {transaction.description}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          color: transaction.amount > 0 ? "#4ade80" : "#ff6b6b",
                          fontWeight: "600",
                        }}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount.toLocaleString()}{" "}
                        {transaction.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#8b949e",
                }}
              >
                No transactions yet
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: "0.75rem",
              border: "1px solid #30363d",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                color: "#f0f6fc",
                fontSize: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              Account Settings
            </h2>

            <div style={{ maxWidth: "500px" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#f0f6fc",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: "0.5rem",
                    color: "#8b949e",
                    opacity: 0.6,
                    boxSizing: "border-box",
                  }}
                />
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  Contact support to change email
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#f0f6fc",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  Change Password
                </label>
                <button
                  onClick={() =>
                    alert("Password reset email would be sent to " + user.email)
                  }
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#21262d",
                    color: "#f0f6fc",
                    border: "1px solid #30363d",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Send Reset Link
                </button>
              </div>

              <div
                style={{
                  backgroundColor: "#0d1117",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  borderLeft: "3px solid #ff6b6b",
                  marginTop: "2rem",
                }}
              >
                <h3
                  style={{
                    color: "#ff6b6b",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  Danger Zone
                </h3>
                <p
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    margin: "0 0 1rem 0",
                  }}
                >
                  Temporarily disable your account
                </p>
                <button
                  onClick={handleSelfExclude}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#ff6b6b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Self-Exclude (30 Days)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Responsible Gaming Tab */}
        {activeTab === "responsible-gaming" && (
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: "0.75rem",
              border: "1px solid #30363d",
              padding: "1.5rem",
            }}
          >
            <h2
              style={{
                color: "#f0f6fc",
                fontSize: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              Responsible Gaming Tools
            </h2>

            <div style={{ maxWidth: "600px" }}>
              <div
                style={{
                  backgroundColor: "#0d1117",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    color: "#ffd700",
                    marginTop: 0,
                  }}
                >
                  Set Your Limits
                </h3>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#f0f6fc",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Daily Deposit Limit ($)
                  </label>
                  <input
                    type="number"
                    value={depositLimit}
                    onChange={(e) => setDepositLimit(e.target.value)}
                    placeholder="No limit"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: "0.5rem",
                      color: "#f0f6fc",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#f0f6fc",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Daily Loss Limit ($)
                  </label>
                  <input
                    type="number"
                    value={lossLimit}
                    onChange={(e) => setLossLimit(e.target.value)}
                    placeholder="No limit"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: "0.5rem",
                      color: "#f0f6fc",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "#f0f6fc",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    Session Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionLimit}
                    onChange={(e) => setSessionLimit(e.target.value)}
                    placeholder="No limit"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: "0.5rem",
                      color: "#f0f6fc",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#ffd700",
                    color: "#000",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Save Limits
                </button>
              </div>

              <div
                style={{
                  backgroundColor: "#0d1117",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                }}
              >
                <h3
                  style={{
                    color: "#7c3aed",
                    marginTop: 0,
                  }}
                >
                  Resources & Support
                </h3>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    color: "#8b949e",
                  }}
                >
                  <li style={{ marginBottom: "0.75rem" }}>
                    📞 National Problem Gambling Helpline: 1-800-522-4700
                  </li>
                  <li style={{ marginBottom: "0.75rem" }}>
                    🌐 Gamblers Anonymous:{" "}
                    <a
                      href="https://www.gamblersanonymous.org"
                      style={{ color: "#7c3aed" }}
                    >
                      www.gamblersanonymous.org
                    </a>
                  </li>
                  <li style={{ marginBottom: "0.75rem" }}>
                    💬 NCPG Chat:{" "}
                    <a
                      href="https://www.ncpgambling.org"
                      style={{ color: "#7c3aed" }}
                    >
                      www.ncpgambling.org
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;
