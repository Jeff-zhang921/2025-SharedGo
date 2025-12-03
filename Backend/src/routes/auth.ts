import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { firebaseAdmin } from "../firebaseAdmin";

const router = Router();
const prisma = new PrismaClient();

//email regex source: https://emailregex.com/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Define allowed providers
const ALLOWED_PROVIDERS = ["google", "apple"] as const;
// Define OAuthProvider type
type OAuthProvider = (typeof ALLOWED_PROVIDERS)[number];

function isAllowedProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "apple";
}

router.post("/login", async (req, res) => {
  const providerRaw =
    typeof req.body?.provider === "string" ? req.body.provider.trim().toLowerCase() : "";
  const providerUserId =
    typeof req.body?.providerUserId === "string" ? req.body.providerUserId.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;

  if (!isAllowedProvider(providerRaw)) {
    res.status(400).json({ message: "provider must be google or apple." });
    return;
  }

  if (providerUserId.length === 0) {
    res.status(400).json({ message: "providerUserId is required." });
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Valid email from provider is required." });
    return;
  }

  // Auto-provision users from OAuth providers; no manual signup step.
  const user = await prisma.user.upsert({
    where: { email },
    update: name ? { name } : {},
    create: { email, name: name ?? undefined },
  });

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    provider: providerRaw,
    providerUserId,
  };

  res.json({
    message: `Logged in with ${providerRaw}.`,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: providerRaw,
    },
  });
});

router.get("/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  res.json({ user: req.session.user });
});

router.post("/firebase-login", async (req, res) => {
  const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!idToken) {
    res.status(401).json({ message: "Missing Firebase ID token (Authorization: Bearer <token>)." });
    return;
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const email = decoded.email?.trim() || "";
    const name = decoded.name?.trim() || null;
    const providerId = decoded.firebase?.sign_in_provider || "firebase";
    const uid = decoded.uid;

    if (!email) {
      res.status(400).json({ message: "Verified token did not include an email." });
      return;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: name ? { name } : {},
      create: { email, name: name ?? undefined },
    });

    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      provider: "firebase",
      providerUserId: uid,
      providerId,
    };

    res.json({
      message: "Logged in with Firebase.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: "firebase",
        providerId,
      },
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid Firebase ID token." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "Failed to log out." });
      return;
    }
    res.status(204).end();
  });
});

export default router;
