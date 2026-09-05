import { createApp } from "./app";
import { connectDb } from "./db";
import { config } from "./config";
import { bootstrapAdminAccount } from "./lib/firebase-admin";

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", async () => {
  console.log(`API server running on http://localhost:${config.port}`);
  try {
    await bootstrapAdminAccount();
  } catch (err: any) {
    console.warn("Notice: Admin bootstrap notice:", err?.message || err);
  }
});

connectDb().catch((error) => {
  console.warn("Notice: Database connection skipped:", error?.message || error);
});
