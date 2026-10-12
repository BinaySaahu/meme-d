import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { app } from "../index";

let baseUrl: string;
let server: ReturnType<typeof app.listen>;
const jwtSecret = "api-test-secret";

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function token(role: "brand" | "creator"): string {
  return jwt.sign({ role }, jwtSecret, {
    subject: new Types.ObjectId().toString(),
  });
}

async function request(
  path: string,
  method: string,
  body?: unknown,
  accessToken?: string
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("API request validation", () => {
  it("responds to health checks without a database connection", async () => {
    const response = await request("/health", "GET");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("validates signup and login bodies", async () => {
    const signupResponse = await request("/auth/signup", "POST", {
      name: "Invalid",
      email: "not-an-email",
      password: "short",
      role: "creator",
    });
    const loginResponse = await request("/auth/login", "POST", {
      email: "not-an-email",
      password: "",
    });

    expect(signupResponse.status).toBe(400);
    expect(loginResponse.status).toBe(400);
  });

  it("enforces authentication and brand-only campaign access", async () => {
    const unauthenticated = await request("/campaigns/mine", "GET");
    const creatorRequest = await request(
      "/campaigns",
      "POST",
      {},
      token("creator")
    );
    const invalidBrandRequest = await request(
      "/campaigns",
      "POST",
      {},
      token("brand")
    );

    expect(unauthenticated.status).toBe(401);
    expect(creatorRequest.status).toBe(403);
    expect(invalidBrandRequest.status).toBe(400);
  });

  it("enforces creator access and validates submission requests", async () => {
    const brandRequest = await request(
      "/submissions",
      "POST",
      {},
      token("brand")
    );
    const invalidUrl = await request(
      "/submissions",
      "POST",
      {
        campaignId: new Types.ObjectId().toString(),
        postUrl: "javascript:alert(1)",
      },
      token("creator")
    );
    const negativeViews = await request(
      `/submissions/${new Types.ObjectId().toString()}/views`,
      "PATCH",
      { views: -1 },
      token("creator")
    );

    expect(brandRequest.status).toBe(403);
    expect(invalidUrl.status).toBe(400);
    expect(negativeViews.status).toBe(400);
  });

  it("uses the centralized not-found response for unknown routes", async () => {
    const response = await request("/not-a-route", "GET");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Route not found" });
  });
});
