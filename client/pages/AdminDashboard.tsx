import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  activeGames: number;
  todayRevenue: number;
}

interface Payment {
  id: string;
  user_id: number;
  amount_usd: number;
  status: string;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  gold_coins: number;
  sweeps_coins: number;
  created_at: string;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRevenue: 0,
    activeGames: 0,
    todayRevenue: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "users" | "games"
  >("overview");

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== "admin") {
      navigate("/");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch payment stats
      const statsResponse = await fetch("/api/square/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats({
          totalUsers: 0,
          totalRevenue: statsData.stats.totalRevenue,
          activeGames: 0,
          todayRevenue: 0,
        });
      }

      // Fetch recent payments
      const paymentsResponse = await fetch("/api/api/recent-transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.rows?.slice(0, 10) || []);
      }

      // Fetch users
      const usersResponse = await fetch("/api/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.rows?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
        <div style={{ color: "#f0f6fc" }}>Loading admin dashboard...</div>
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
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1
          style={{
            color: "#ffd700",
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "2rem",
          }}
        >
          Admin Dashboard
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: "#3d2d2d",
              border: "1px solid #8b4444",
              color: "#ff6b6b",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "2rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            borderBottom: "1px solid #30363d",
          }}
        >
          {(["overview", "payments", "users", "games"] as const).map((tab) => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
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
                  backgroundColor: "#161b22",
                  borderRadius: "0.75rem",
                  border: "1px solid #30363d",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Revenue
                </div>
                <div
                  style={{
                    color: "#ffd700",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  ${stats.totalRevenue.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "0.75rem",
                  border: "1px solid #30363d",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Payments
                </div>
                <div
                  style={{
                    color: "#f0f6fc",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  {recentPayments.length}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#161b22",
                  borderRadius: "0.75rem",
                  border: "1px solid #30363d",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    color: "#8b949e",
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Total Users
                </div>
                <div
                  style={{
                    color: "#f0f6fc",
                    fontSize: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  {users.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
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
              Recent Payments
            </h2>

            <div
              style={{
                overflowX: "auto",
              }}
            >
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
                      Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      style={{
                        borderBottom: "1px solid #30363d",
                      }}
                    >
                      <td style={{ padding: "1rem", color: "#f0f6fc" }}>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffd700",
                          fontWeight: "600",
                        }}
                      >
                        ${payment.amount_usd.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color:
                            payment.status === "completed"
                              ? "#4ade80"
                              : "#8b949e",
                        }}
                      >
                        {payment.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
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
              Users
            </h2>

            <div
              style={{
                overflowX: "auto",
              }}
            >
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
                      Username
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Gold Coins
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#8b949e",
                        fontWeight: "600",
                      }}
                    >
                      Sweeps Coins
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid #30363d",
                      }}
                    >
                      <td style={{ padding: "1rem", color: "#f0f6fc" }}>
                        {user.username}
                      </td>
                      <td style={{ padding: "1rem", color: "#8b949e" }}>
                        {user.email}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffd700",
                          fontWeight: "600",
                        }}
                      >
                        {(user.gold_coins / 1000).toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#7c3aed",
                          fontWeight: "600",
                        }}
                      >
                        {user.sweeps_coins.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === "games" && (
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
              Game Management
            </h2>

            <p style={{ color: "#8b949e" }}>
              Game management features coming soon. You can view and manage
              games, their RTP, volatility, and payouts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
