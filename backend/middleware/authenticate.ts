import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import type { UserRole } from "../models/User";

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.get("Authorization");
  const token = /^Bearer\s+(\S+)$/i.exec(authorizationHeader ?? "")?.[1];

  if (!token) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  const secret = getJwtSecret();
  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      (payload.role !== "brand" && payload.role !== "creator")
    ) {
      next(new AppError(401, "Invalid authentication token"));
      return;
    }

    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired authentication token"));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission to access this resource"));
      return;
    }
    next();
  };
}
