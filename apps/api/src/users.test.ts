import { describe, test, expect } from "bun:test";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("User Management Route Guards", () => {
  test("GET /users without token returns 401", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
  });

  test("POST /users without token returns 401", async () => {
    const res = await request(app).post("/users").send({
      name: "Test User",
      email: "test@gmail.com",
      role: "student",
    });
    expect(res.status).toBe(401);
  });
});
