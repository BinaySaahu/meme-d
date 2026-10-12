import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./services/campaignCache";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import submissionRoutes from "./routes/submissionRoutes";

const app = express();
const port = Number(process.env.PORT) || 5000;
const frontendUrl = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: frontendUrl || "http://localhost:3000",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/submissions", submissionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  await connectDatabase();
  void connectRedis();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error: unknown) => {
    console.error("Failed to start API server", error);
    process.exitCode = 1;
  });
}

export { app };
