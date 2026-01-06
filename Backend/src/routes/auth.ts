import { Router } from "express";
import { PrismaClient } from "@prisma/client";
//generate random int
import crypto from "crypto";
//Library to send emails via SMTP (like Gmail SMTP).
import nodemailer from "nodemailer";

const router = Router();
const prisma = new PrismaClient();

// email regex source: https://emailregex.com/
//something@something.domain
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;
// Time to live for a login code (10 minutes)
const CODE_TTL_MS = 10 * 60 * 1000;
// Minimum time between resending codes (1 minute)
const RESEND_WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

//SMTP configuration from env
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "ShareGo <no-reply@sharedgo.local>";

// Secret for hashing login codes
const LOGIN_CODE_SECRET = process.env.LOGIN_CODE_SECRET || "";
//create mailer if SMTP_USER and SMTP_PASS are provided
const mailer =
  SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    : null;

function generateCode(): string {
  const max = 10 ** CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(CODE_LENGTH, "0");
}


function hashCode(code: string): string {
  if (!LOGIN_CODE_SECRET) {
    throw new Error("Missing LOGIN_CODE_SECRET.");
  }

  //.update(code) Feeds the login code (e.g. "123456") into the hasher.
  return crypto.createHmac("sha256", LOGIN_CODE_SECRET).update(code).digest("hex");
}


async function sendLoginCode(email: string, code: string) {
  if (!mailer) {
    throw new Error("Email login is not configured.");
  }

  await mailer.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Your ShareGo verification code",
    text: `Your ShareGo verification code is ${code}. It expires in 10 minutes.`,
  });
}
