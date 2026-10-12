import { Schema, model, Types, HydratedDocument } from "mongoose";

export const USER_ROLES = ["brand", "creator"] as const;
export type UserRole = (typeof USER_ROLES)[number];
 
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
 
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // creates a unique index; also catch E11000 in your signup handler
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
  },
  { timestamps: true }
);
 
export type UserDoc = HydratedDocument<IUser>;
export const User = model<IUser>("User", userSchema);