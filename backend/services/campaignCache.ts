import { createClient } from "redis";

const LIVE_CAMPAIGNS_CACHE_KEY = "campaigns:live:v1";
const CACHE_TTL_SECONDS = 60;

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let warnedUnavailable = false;

function warnUnavailable(message: string, error?: unknown): void {
  if (warnedUnavailable) {
    return;
  }
  warnedUnavailable = true;
  console.warn(message, error);
}

function getReadyClient(): RedisClient | null {
  if (!redisClient?.isReady) {
    warnUnavailable(
      "Redis is unavailable; campaign list cache is bypassed and MongoDB will be used."
    );
    return null;
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      username: process.env.REDIS_USERNAME || "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '10625')
      }
    });
    redisClient.on("error", (error) => {
      warnUnavailable("Redis connection error; campaign cache is bypassed.", error);
    });
    redisClient.on("ready", () => {
      warnedUnavailable = false;
      console.info("Redis campaign cache is ready.");
    });
    redisClient.on("end", () => {
      warnUnavailable("Redis connection ended; campaign cache is bypassed.");
    });

    await redisClient.connect();
  } catch (error) {
    warnUnavailable(
      "Could not connect to Redis; campaign list requests will use MongoDB.",
      error
    );
  }
}

export async function getCachedLiveCampaigns<T>(): Promise<T | null> {
  const client = getReadyClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(LIVE_CAMPAIGNS_CACHE_KEY);
    return cached === null ? null : (JSON.parse(cached) as T);
  } catch (error) {
    console.warn("Failed to read live campaigns from Redis cache.", error);
    return null;
  }
}

export async function cacheLiveCampaigns(value: unknown): Promise<void> {
  const client = getReadyClient();
  if (!client) {
    return;
  }

  try {
    await client.set(LIVE_CAMPAIGNS_CACHE_KEY, JSON.stringify(value), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.warn("Failed to write live campaigns to Redis cache.", error);
  }
}

export async function invalidateLiveCampaignsCache(): Promise<void> {
  const client = getReadyClient();
  if (!client) {
    return;
  }

  try {
    await client.del(LIVE_CAMPAIGNS_CACHE_KEY);
  } catch (error) {
    console.warn("Failed to invalidate live campaigns Redis cache.", error);
  }
}
