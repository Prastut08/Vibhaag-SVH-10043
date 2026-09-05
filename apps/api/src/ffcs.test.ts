import { describe, test, expect } from "bun:test";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("FFCS Route Protection & Security Guards", () => {
  test("GET /admin/ffcs/windows without token returns 401", async () => {
    const res = await request(app).get("/admin/ffcs/windows");
    expect(res.status).toBe(401);
  });

  test("POST /admin/ffcs/windows without token returns 401", async () => {
    const res = await request(app).post("/admin/ffcs/windows").send({ semester: 1, academicYear: "2026-27" });
    expect(res.status).toBe(401);
  });

  test("GET /admin/ffcs/offerings without token returns 401", async () => {
    const res = await request(app).get("/admin/ffcs/offerings");
    expect(res.status).toBe(401);
  });

  test("GET /student/ffcs/current without token returns 401", async () => {
    const res = await request(app).get("/student/ffcs/current");
    expect(res.status).toBe(401);
  });

  test("POST /student/ffcs/applications without token returns 401", async () => {
    const res = await request(app).post("/student/ffcs/applications").send({ windowId: "win1", offeringId: "off1" });
    expect(res.status).toBe(401);
  });

  test("GET /teacher/ffcs/applications without token returns 401", async () => {
    const res = await request(app).get("/teacher/ffcs/applications");
    expect(res.status).toBe(401);
  });

  test("PATCH /teacher/ffcs/applications/:id/status without token returns 401", async () => {
    const res = await request(app).patch("/teacher/ffcs/applications/app1/status").send({ status: "allocated" });
    expect(res.status).toBe(401);
  });
});
