import { describe, test, expect } from "bun:test";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("API Health & Routing Tests", () => {
  test("GET /health returns 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("GET /auth/status returns backend user status", async () => {
    const res = await request(app).get("/auth/status");
    expect(res.status).toBe(200);
    expect(res.body.hasUsers).toBeDefined();
  });

  test("POST /auth/verify rejects request without authorization header", async () => {
    const res = await request(app).post("/auth/verify").send({ expectedRole: "admin" });
    expect(res.status).toBe(401);
  });
});
