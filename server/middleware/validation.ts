import { RequestHandler } from "express";

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  // Alphanumeric and underscore, 3-20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: any): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Middleware to validate and sanitize request body
 */
export const validateInput: RequestHandler = (req, res, next) => {
  // Sanitize all string inputs
  const sanitize = (obj: any): any => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === "string") {
          sanitized[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === "object") {
          sanitized[key] = sanitize(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);

  next();
};

/**
 * Validate registration data
 */
export function validateRegistration(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Invalid email address");
  }

  // Username validation
  if (!data.username || !validateUsername(data.username)) {
    errors.push(
      "Username must be 3-20 characters, alphanumeric and underscores only",
    );
  }

  // Password validation
  const passwordValidation = validatePassword(data.password || "");
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }

  // Date of birth validation
  if (!data.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      errors.push("You must be 18 or older");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate bet amount
 */
export function validateBetAmount(
  amount: any,
  minBet: number,
  maxBet: number,
): boolean {
  const betAmount = parseFloat(amount);
  return !isNaN(betAmount) && betAmount >= minBet && betAmount <= maxBet;
}

/**
 * Validate balance is non-negative
 */
export function validateBalance(balance: any): boolean {
  const balanceNum = parseFloat(balance);
  return !isNaN(balanceNum) && balanceNum >= 0;
}

/**
 * Prevent SQL injection by checking for suspicious patterns
 */
export function checkForSQLInjection(input: any): boolean {
  if (typeof input !== "string") {
    return false;
  }

  const sqlPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
    /(-{2}|\/\*|\*\/)/,
    /;(\s*DROP|\s*DELETE)/i,
    /xp_|sp_/i,
    /['"]/g,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Middleware to check for SQL injection attempts
 */
export const checkSQLInjection: RequestHandler = (req, res, next) => {
  const checkInput = (obj: any): boolean => {
    if (typeof obj === "string") {
      return checkForSQLInjection(obj);
    }

    if (typeof obj !== "object" || obj === null) {
      return false;
    }

    if (Array.isArray(obj)) {
      return obj.some(checkInput);
    }

    return Object.values(obj).some(checkInput);
  };

  if (checkInput(req.body) || checkInput(req.query)) {
    return res.status(400).json({
      error: "Invalid input detected",
    });
  }

  next();
};

export default {
  validateEmail,
  validateUsername,
  validatePassword,
  sanitizeString,
  validateInput,
  validateRegistration,
  validateBetAmount,
  validateBalance,
  checkForSQLInjection,
  checkSQLInjection,
};
