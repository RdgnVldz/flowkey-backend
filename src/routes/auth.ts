import express, { Request, Response } from "express";
import bs58 from "bs58";
import jwt from "jsonwebtoken";
import { PublicKey } from "@solana/web3.js";
import { getNonce, setNonce } from "../utils/nonceStore";
import verifySignature from "../utils/verifySignature";

const router = express.Router();

router.get("/token", async (req: Request, res: Response) => {
  const publicAddress = req.query.publicAddress as string;
  if (!publicAddress) return res.status(400).json({ message: "Missing address" });

  const nonce = Math.floor(Math.random() * 1000000).toString();
  setNonce(publicAddress, nonce);

  res.json({ code: nonce });
});

router.get("/verify", async (req: Request, res: Response) => {
  const publicAddress = req.query.publicAddress as string;
  const signatureBase58 = req.query.signature as string;

  if (!publicAddress || !signatureBase58) {
    return res.status(400).json({ message: "Missing address or signature" });
  }

  const nonce = getNonce(publicAddress);
  if (!nonce) {
    return res.status(400).json({ message: "No challenge found" });
  }

  const isValid = await verifySignature(publicAddress, signatureBase58, nonce);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const token = jwt.sign({ publicAddress }, process.env.JWT_SECRET!, { expiresIn: "1h" });
  res.json({ token });
});

export default router;
