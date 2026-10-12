import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test, { after, before } from "node:test";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { app } from "../index";

let baseUrl: string;
let server: ReturnType<typeof app.listen>;
const jwtSecret = "api-test-secret";

before(async () => {
  process.env.JWT_SECRET = jwtSecret;
  server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
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

test("health route responds without a database connection", async () => {
  const response = await request("/health", "GET");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("signup and login validate request bodies", async () => {
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

  assert.equal(signupResponse.status, 400);
  assert.equal(loginResponse.status, 400);
});

test("campaign endpoints enforce authentication and brand-only access", async () => {
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

  assert.equal(unauthenticated.status, 401);
  assert.equal(creatorRequest.status, 403);
  assert.equal(invalidBrandRequest.status, 400);
});

test("submission endpoints enforce creator access and validate input", async () => {
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

  assert.equal(brandRequest.status, 403);
  assert.equal(invalidUrl.status, 400);
  assert.equal(negativeViews.status, 400);
});

test("unknown routes use the centralized not-found response", async () => {
  const response = await request("/not-a-route", "GET");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Route not found" });
});
