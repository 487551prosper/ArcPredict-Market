import { Router } from "express";
import {
  registerCode,
  resolveCode,
  completeReferral,
  collectPoints,
  getReferralStats,
} from "../lib/referral-store";

const router = Router();

router.post("/referrals/register", (req, res) => {
  const { address } = req.body as { address?: string };
  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "address required" });
  }
  const code = address.toLowerCase().replace(/^0x/, "").slice(0, 8);
  registerCode(code, address);
  return res.json({ code });
});

router.post("/referrals/complete", (req, res) => {
  const { refCode, newUserAddress } = req.body as {
    refCode?: string;
    newUserAddress?: string;
  };
  if (!refCode || !newUserAddress) {
    return res.status(400).json({ error: "refCode and newUserAddress required" });
  }
  const referrerAddress = resolveCode(refCode);
  if (!referrerAddress) {
    return res.status(404).json({ error: "Referral code not found" });
  }
  const success = completeReferral(referrerAddress, newUserAddress);
  return res.json({ success, referrerAddress });
});

router.get("/referrals/stats/:address", (req, res) => {
  const stats = getReferralStats(req.params.address);
  return res.json(stats);
});

router.post("/referrals/collect/:address", (req, res) => {
  const pts = collectPoints(req.params.address);
  return res.json({ collected: pts });
});

export default router;
