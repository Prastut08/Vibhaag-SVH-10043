import crypto from "node:crypto";
import { Router } from "express";

const router = Router();

router.get("/auth", (_req, res) => {
  const token = (_req.query.token as string) || crypto.randomUUID();
  const expire = (_req.query.expire as string) || String(Math.floor(Date.now() / 1000) + 1800);
  const privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY ||
    process.env.VITE_IMAGEKIT_PRIVATE_KEY ||
    "private_zYKMkYEh5PMQ+HexRLXx679lP/M=";
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.VITE_IMAGEKIT_PUBLIC_KEY ||
    "public_tLQ8M3XofX7TqrOmYu8E5H1uDlI=";

  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  res.json({
    token,
    expire: Number(expire),
    signature,
    publicKey,
  });
});

export default router;
