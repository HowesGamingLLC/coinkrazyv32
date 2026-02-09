import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import apiRoutes from "./routes/api";
import authRoutes from "./routes/auth";
import initAdminRoutes from "./routes/init-admin";
import seedRoutes from "./routes/seed";
import paymentRoutes from "./routes/payments";
import squareRoutes from "./routes/square";
import gameRoutes from "./routes/games";
import bonusFeatureRoutes from "./routes/bonus-features";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimiter";
import { validateInput, checkSQLInjection } from "./middleware/validation";

export function createServer() {
  const app = express();

  // Security Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Input validation
  app.use(validateInput);
  app.use(checkSQLInjection);

  // Rate limiting
  app.use(apiRateLimiter);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Database API routes
  app.use("/api", apiRoutes);

  // Auth routes (stricter rate limiting)
  app.use("/api/auth", authRateLimiter, authRoutes);

  // Admin initialization route
  app.use("/api", initAdminRoutes);

  // Database seeding route
  app.use("/api", seedRoutes);

  // Payment processing routes
  app.use("/api/payments", paymentRoutes);

  // Square payment routes
  app.use("/api/square", squareRoutes);

  // Game routes
  app.use("/api/games", gameRoutes);

  // Bonus features routes (leaderboards, VIP, tournaments, affiliates, social)
  app.use("/api/bonus", bonusFeatureRoutes);

  return app;
}
