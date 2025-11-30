import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Valid email is required." });
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
    name: user.name ?? undefined,
  };

  res.json({
    message: "Logged in.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
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
