import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const rootEnvPath = path.resolve(__dirname, "../../.env");
const localEnvPath = path.resolve(__dirname, ".env");
const examplePath = path.resolve(__dirname, ".env.example");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (!fs.existsSync(rootEnvPath) && fs.existsSync(examplePath)) {
  dotenv.config({ path: examplePath });
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["vibhaag.localhost", "localhost", "127.0.0.1", "web"],
  },
});
