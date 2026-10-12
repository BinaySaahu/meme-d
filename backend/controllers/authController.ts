import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(["brand", "creator"]),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(128),
});

function issueToken(id: string, role: "brand" | "creator"): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign({ role }, secret, {
    subject: id,
    expiresIn: (process.env.JWT_EXPIRE || "1d") as SignOptions["expiresIn"],
  });
}

export const signup: RequestHandler = async (req, res) => {
  const input = signupSchema.parse(req.body);
  const existing = await User.exists({ email: input.email });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });

  res.status(201).json({
    token: issueToken(user.id, user.role),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  res.status(200).json({
    token: issueToken(user.id, user.role),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};
