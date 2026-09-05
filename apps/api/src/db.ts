import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(config.mongoUrl);
}
