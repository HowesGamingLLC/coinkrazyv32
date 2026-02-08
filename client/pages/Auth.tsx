import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            username: formData.username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Authentication failed");
        return;
      }

      if (data.success) {
        if (isLogin) {
          // Store token and user info
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/");
        } else {
          setError("Check your email to verify your account");
          setTimeout(() => setIsLogin(true), 2000);
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#161b22",
          borderRadius: "1rem",
          border: "1px solid #30363d",
          padding: "2rem",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
            CoinKrazy
          </h1>
          <p
            style={{
              color: "#8b949e",
              fontSize: "0.875rem",
              margin: "0.5rem 0 0 0",
            }}
          >
            {isLogin ? "Welcome Back!" : "Join the Fun!"}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#3d2d2d",
              border: "1px solid #8b4444",
              color: "#ff6b6b",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: "0.5rem",
              color: "#f0f6fc",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: "0.5rem",
              color: "#f0f6fc",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
            onBlur={(e) => (e.target.style.borderColor = "#30363d")}
          />

          {!isLogin && (
            <>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#f0f6fc",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />

              <input
                type="text"
                name="firstName"
                placeholder="First Name (optional)"
                value={formData.firstName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#f0f6fc",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />

              <input
                type="text"
                name="lastName"
                placeholder="Last Name (optional)"
                value={formData.lastName}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#f0f6fc",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />

              <input
                type="date"
                name="dateOfBirth"
                placeholder="Date of Birth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#f0f6fc",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#ffd700")}
                onBlur={(e) => (e.target.style.borderColor = "#30363d")}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#666" : "#ffd700",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "1rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#ffed4e";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#ffd700";
            }}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <p style={{ color: "#8b949e", fontSize: "0.875rem", margin: 0 }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#ffd700",
                fontSize: "0.875rem",
                cursor: "pointer",
                marginLeft: "0.5rem",
                textDecoration: "underline",
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
