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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Database API routes
  app.use("/api", apiRoutes);

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Admin initialization route
  app.use("/api", initAdminRoutes);

  // Database seeding route
  app.use("/api", seedRoutes);

  // Payment processing routes
  app.use("/api/payments", paymentRoutes);

  return app;
}
