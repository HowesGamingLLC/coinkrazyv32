import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    role: string;
    isAdmin: boolean;
  };
}

// Middleware to authenticate JWT token
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    ) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      isAdmin: decoded.role === "admin",
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

// Middleware to require admin privileges
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // First authenticate the token
  authenticateToken(req, res, (err) => {
    if (err) return;

    // Check if user is admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin privileges required",
      });
    }

    next();
  });
};

// Middleware to require staff or admin privileges
export const requireStaff = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  authenticateToken(req, res, (err) => {
    if (err) return;

    if (!req.user || !["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Staff privileges required",
      });
    }

    next();
  });
};

// Middleware to validate user can access resource
export const validateUserAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  authenticateToken(req, res, (err) => {
    if (err) return;

    const userId = parseInt(req.params.userId || (req.query.userId as string));

    // Admin can access any user's data
    if (req.user?.isAdmin) {
      return next();
    }

    // User can only access their own data
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    next();
  });
};

// Alias for authenticateToken for convenience
export const verifyToken = authenticateToken;
