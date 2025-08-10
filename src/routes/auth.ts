import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getNonce, setNonce } from "../utils/nonceStore";
import verifySignature from "../utils/verifySignature";

const router = express.Router();

// 1) Issue a nonce to sign
// GET /api/token?publicAddress=...
router.get("/token", async (req: Request, res: Response) => {
  const publicAddress = req.query.publicAddress as string;
  if (!publicAddress) return res.status(400).json({ message: "Missing address" });

  const nonce = Math.floor(Math.random() * 1_000_000).toString();
  setNonce(publicAddress, nonce);

  res.json({ code: nonce });
});

// 2) Verify signature and issue JWT
// GET /api/verify?publicAddress=...&signature=...
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

  const token = jwt.sign({ publicAddress }, process.env.JWT_SECRET!, { expiresIn: "12h" });
  res.json({ token });
});

// 3) Return minimal user profile + config expected by extension
// GET /api/me
router.get("/me", (req: Request, res: Response) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { publicAddress: string };
    // You can load a user from DB here. For now, return a minimal profile.
    return res.json({
      publicAddress: payload.publicAddress,
      username: `flowkey_${payload.publicAddress.slice(0, 4)}`,
      // Config object consumed by your extension. Disable gating to avoid "Access Denied".
      config: {
        gating: { enabled: false, reason: null },
        layouts: []
      }
    });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// 4) Accept and "save" layouts from the extension
// PUT /api/layouts  { layouts: [...] }
router.put("/layouts", (req: Request, res: Response) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    // In-memory no-op save. Replace with DB write if desired.
    return res.json({ success: true });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// 5) Optional: explicit access endpoint (always allow for now)
// GET /api/access
router.get("/access", (_req: Request, res: Response) => {
  return res.json({ access: true, reason: null });
});

export default router;
