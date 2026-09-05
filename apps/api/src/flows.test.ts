import { describe, test, expect } from "bun:test";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("Admin Route Protection", () => {
  test("GET /admin/overview without token returns 401", async () => {
    const res = await request(app).get("/admin/overview");
    expect(res.status).toBe(401);
  });

  test("GET /admin/branches without token returns 401", async () => {
    const res = await request(app).get("/admin/branches");
    expect(res.status).toBe(401);
  });

  test("POST /admin/users/student without token returns 401", async () => {
    const res = await request(app).post("/admin/users/student").send({
      enrollmentNumber: "23BCS1001",
      name: "Test Student",
    });
    expect(res.status).toBe(401);
  });

  test("POST /admin/users/teacher without token returns 401", async () => {
    const res = await request(app).post("/admin/users/teacher").send({
      teacherIdentifier: "T001",
      name: "Test Teacher",
    });
    expect(res.status).toBe(401);
  });
});
