import React, { useState, useEffect } from "react";
import { loadSquareWebPayments } from "@square/web-payments-sdk";

interface Package {
  id: string;
  name: string;
  goldCoins: number;
  bonusCoins: number;
  priceUsd: number;
  description: string;
}

export const CoinStore = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [web, setWeb] = useState<any>(null);
  const [card, setCard] = useState<any>(null);

  // Initialize Square Web Payments SDK
  useEffect(() => {
    const initSquare = async () => {
      try {
        const webPayments = await loadSquareWebPayments();
        setWeb(webPayments);
      } catch (error) {
        console.error("Error loading Square SDK:", error);
        setError("Failed to load payment system");
      }
    };

    initSquare();
    fetchPackages();
  }, []);

  // Initialize Card input when web is loaded
  useEffect(() => {
    if (!web) return;

    const initializeCard = async () => {
      try {
        const cardElement = await web.payments(
          process.env.VITE_PUBLIC_SQUARE_APPLICATION_ID || ""
        ).card();
        await cardElement.attach("#card-container");
        setCard(cardElement);
      } catch (error) {
        console.error("Error initializing card:", error);
        setError("Failed to initialize payment form");
      }
    };

    initializeCard();
  }, [web]);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/square/packages");
      const data = await response.json();

      if (data.success) {
        setPackages(data.packages);
        setSelectedPackage(data.packages[0]);
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage || !card || !web) {
      setError("Payment form not ready");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Request a nonce from the card
      const result = await card.requestIdempotencyKey();
      const idempotencyKey = result;

      const { nonce, error } = await web.card.tokenize(card);

      if (error) {
        setError(error.message || "Failed to tokenize card");
        return;
      }

      // Send payment to server
      const response = await fetch("/api/square/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          nonce,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Payment successful
        alert(
          `Success! You purchased ${data.coinsAwarded} coins for $${data.amount.toFixed(2)}`
        );
        setSelectedPackage(null);
        // Refresh user balance in parent
        window.location.reload();
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError("Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
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
        <div style={{ color: "#f0f6fc" }}>Loading coin packages...</div>
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
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#ffd700",
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Gold Coin Store
        </h1>

        <p
          style={{
            color: "#8b949e",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          Purchase Gold Coins and get bonus coins instantly!
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#3d2d2d",
              border: "1px solid #8b4444",
              color: "#ff6b6b",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "2rem",
              maxWidth: "600px",
              margin: "0 auto 2rem auto",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              style={{
                backgroundColor: "#161b22",
                borderRadius: "0.75rem",
                border:
                  selectedPackage?.id === pkg.id
                    ? "2px solid #ffd700"
                    : "1px solid #30363d",
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
                transform: selectedPackage?.id === pkg.id ? "scale(1.05)" : "",
              }}
              onMouseEnter={(e) => {
                if (selectedPackage?.id !== pkg.id) {
                  e.currentTarget.style.borderColor = "#ffd700";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPackage?.id !== pkg.id) {
                  e.currentTarget.style.borderColor = "#30363d";
                }
              }}
            >
              <h3
                style={{
                  color: "#ffd700",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {pkg.name}
              </h3>

              <div
                style={{
                  backgroundColor: "#0d1117",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#ffd700",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  {pkg.goldCoins.toLocaleString()} 🪙
                </div>
                <div
                  style={{
                    color: "#7c3aed",
                    fontSize: "0.875rem",
                  }}
                >
                  + {pkg.bonusCoins.toLocaleString()} Bonus
                </div>
              </div>

              <p
                style={{
                  color: "#8b949e",
                  fontSize: "0.875rem",
                  margin: "0 0 1rem 0",
                  minHeight: "2.5rem",
                }}
              >
                {pkg.description}
              </p>

              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "#f0f6fc",
                  textAlign: "center",
                }}
              >
                ${pkg.priceUsd.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {selectedPackage && (
          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
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
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              Complete Your Purchase
            </h2>

            <div
              style={{
                backgroundColor: "#0d1117",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
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
                You're purchasing:
              </div>
              <h3
                style={{
                  color: "#ffd700",
                  fontSize: "1.25rem",
                  margin: 0,
                }}
              >
                {selectedPackage.name}
              </h3>
              <div
                style={{
                  color: "#f0f6fc",
                  fontSize: "1.75rem",
                  fontWeight: "bold",
                  marginTop: "0.5rem",
                }}
              >
                ${selectedPackage.priceUsd.toFixed(2)}
              </div>
            </div>

            <div
              id="card-container"
              style={{
                marginBottom: "1.5rem",
              }}
            ></div>

            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: "100%",
                padding: "1rem",
                backgroundColor: processing ? "#666" : "#ffd700",
                color: "#000",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: processing ? "not-allowed" : "pointer",
                marginBottom: "1rem",
              }}
              onMouseEnter={(e) => {
                if (!processing) e.currentTarget.style.backgroundColor = "#ffed4e";
              }}
              onMouseLeave={(e) => {
                if (!processing) e.currentTarget.style.backgroundColor = "#ffd700";
              }}
            >
              {processing
                ? "Processing..."
                : `Buy ${selectedPackage.name} for $${selectedPackage.priceUsd.toFixed(2)}`}
            </button>

            <p
              style={{
                color: "#8b949e",
                fontSize: "0.75rem",
                textAlign: "center",
                margin: 0,
              }}
            >
              Secure payment powered by Square
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinStore;
