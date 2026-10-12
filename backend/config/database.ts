import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(uri);
}
