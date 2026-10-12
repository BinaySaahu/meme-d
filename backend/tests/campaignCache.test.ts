import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createClient } from "redis";
import {
  cacheLiveCampaigns,
  connectRedis,
  getCachedLiveCampaigns,
  invalidateLiveCampaignsCache,
} from "../services/campaignCache";

jest.mock("redis", () => ({
  createClient: jest.fn(),
}));

const redisMock = {
  isReady: true,
  on: jest.fn(),
  connect: jest.fn<() => Promise<void>>(),
  get: jest.fn<(key: string) => Promise<string | null>>(),
  set: jest.fn<
    (
      key: string,
      value: string,
      options: { EX: number }
    ) => Promise<string | null>
  >(),
  del: jest.fn<(key: string) => Promise<number>>(),
};

describe("live campaign Redis cache", () => {
  beforeAll(async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    jest
      .mocked(createClient)
      .mockReturnValue(redisMock as unknown as ReturnType<typeof createClient>);
    await connectRedis();
    expect(createClient).toHaveBeenCalledWith({
      url: "redis://localhost:6379",
    });
  });

  beforeEach(() => {
    redisMock.isReady = true;
    redisMock.get.mockReset().mockResolvedValue(null);
    redisMock.set.mockReset().mockResolvedValue("OK");
    redisMock.del.mockReset().mockResolvedValue(1);
  });

  it("returns a cache miss when no campaign list is cached", async () => {
    await expect(getCachedLiveCampaigns()).resolves.toBeNull();
    expect(redisMock.get).toHaveBeenCalledWith("campaigns:live:v1");
  });

  it("deserializes a cached campaign list", async () => {
    const campaigns = [{ _id: "campaign-1", name: "Launch" }];
    redisMock.get.mockResolvedValue(JSON.stringify(campaigns));

    await expect(getCachedLiveCampaigns()).resolves.toEqual(campaigns);
  });

  it("caches campaign lists with a 60-second expiration", async () => {
    const campaigns = [{ _id: "campaign-1" }];

    await cacheLiveCampaigns(campaigns);

    expect(redisMock.set).toHaveBeenCalledWith(
      "campaigns:live:v1",
      JSON.stringify(campaigns),
      { EX: 60 }
    );
  });

  it("invalidates the campaign list key", async () => {
    await invalidateLiveCampaignsCache();

    expect(redisMock.del).toHaveBeenCalledWith("campaigns:live:v1");
  });

  it("falls back to MongoDB when Redis is unavailable", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    redisMock.isReady = false;

    await expect(getCachedLiveCampaigns()).resolves.toBeNull();
    await cacheLiveCampaigns([]);
    await invalidateLiveCampaignsCache();

    expect(redisMock.get).not.toHaveBeenCalled();
    expect(redisMock.set).not.toHaveBeenCalled();
    expect(redisMock.del).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
