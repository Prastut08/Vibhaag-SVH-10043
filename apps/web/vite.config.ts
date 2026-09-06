import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(process.cwd(), ".env");
const examplePath = path.resolve(process.cwd(), ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  dotenv.config({ path: examplePath });
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@vibhaag/shared": path.resolve(currentDir, "../../packages/shared/src/index.ts"),
    },
  },
  envDir: path.resolve(currentDir, "../../"),
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["vibhaag.localhost", "localhost", "127.0.0.1", "web"],
  },
});
