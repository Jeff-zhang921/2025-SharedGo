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
const MAX_ATTEMPTS = 5;

//SMTP configuration from env
//node js read enviornment from process.env
const SMTP_USER =process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
//SMTP_FROM: This determines what the recipient sees in the "From" field.
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "SharedGo <no-reply@sharedgo.local>";

// Secret for hashing login codes
const LOGIN_CODE_SECRET = process.env.LOGIN_CODE_SECRET || "";

//create mailer if SMTP_USER and SMTP_PASS are provided
const mailer =
  SMTP_USER && SMTP_PASS
  //using modemailer
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      })
    : null;
//return a string
function generateCode(): string {
  //** means exponent operator
  const max = 10 ** CODE_LENGTH;
  //padstart for "7" → "000007"
  return crypto.randomInt(0, max).toString().padStart(CODE_LENGTH, "0");
}


function hashCode(code: string): string {
  if (!LOGIN_CODE_SECRET) {
    throw new Error("Missing LOGIN_CODE_SECRET.");
  }

  //.update(code) Feeds the login code (e.g. "123456") into the hasher.
  return crypto.createHmac("sha256", LOGIN_CODE_SECRET).update(code).digest("hex");
}


async function sendLoginCode(name: string, email: string, code: string) {
if (!mailer) {
  throw new Error("Email login is not configured.");
}

const subject = "NO REPLY-Your SharedGo verification code";


const text = `Hello ${name},

Your SharedGo verification code is: ${code}

It expires in 10 minutes.

If you didn’t request this code, you can ignore this email.`;

const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <p>Hello ${name},</p>

    <p>Your SharedGo verification code is:</p>

    <div style="
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 6px;
      margin: 12px 0 8px 0;
    ">
      ${code}
    </div>

    <div style="font-size: 12px; color: #666; margin-top: 6px;">
      Expires in 10 minutes. You’re receiving this email because you requested access to your SharedGo account.
    </div>

    <p style="font-size: 12px; color: #666; margin-top: 16px;">
      If you didn’t request this code, you can ignore this email.
    </p>

  </div>
`;

await mailer.sendMail({
  from: SMTP_FROM,
  to: email,
  subject,
  text, 
  html, // big code + smaller text underneath
});

}

async function sendParticipantListEmail(
  name: string,
  email: string,
  eventTitle: string,
  location: string,
  startsAt: Date,
  participantEmails: string[],
) {
  if (!mailer) {
    throw new Error("Email login is not configured.");
  }

  const formattedDate = startsAt.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });

  const subject = `NO-REPLY-SharedGo participant list for ${eventTitle}`;

  const textParticipants = participantEmails.length
    ? participantEmails.map((participantEmail) => `[ ] ${participantEmail}`).join("\n")
    : "No participants have joined this event yet.";

  const htmlParticipants = participantEmails.length
    ? participantEmails
        .map((participantEmail, index) => `
          <tr>
            <td style="width:40px;padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">
              &#9744;
            </td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#111827;">
              ${index + 1}. ${participantEmail}
            </td>
          </tr>
        `)
        .join("")
    : `
        <tr>
          <td colspan="2" style="padding:12px;color:#4b5563;text-align:center;">
            No participants have joined this event yet.
          </td>
        </tr>
      `;
  
  const text = `Hello ${name},

Here is the participant list for your SharedGo event.

Event: ${eventTitle}
When: ${formattedDate}
Location: ${location}

${textParticipants}

If you didn't request this email, you can ignore it.`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #ffffff;border-radius:12px;padding:20px;">
        <h2 style="margin:0 0 12px;">SharedGo participant list</h2>
        <p style="margin:0 0 12px;">Hello ${name},</p>
        <p style="margin:0 0 16px;">
          <strong>${eventTitle}</strong><br />
          ${formattedDate}<br />
          ${location}
        </p>
        <p style="margin:0 0 12px;color:#4b5563;">Tick the box as each person arrives.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="width:40px;padding:8px;border-bottom:1px solid #e5e7eb;"></th>
                <th style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;color:#374151;">
                  Participant Emails
                </th>
              </tr>
            </thead>
            <tbody>
              ${htmlParticipants}
            </tbody>
          </table>
        <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">
          If you didn't request this email, you can ignore it.
        </p>
        </div>
      </div>
  `;
  await mailer.sendMail({
    from: SMTP_FROM,
    to: email,
    subject,
    text,
    html,
  });
}


// Endpoint to start email login (sends code)
router.post("/email/start", async (req, res) => {

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  //const name = typeof req.body?.name === "string" ? req.body.name.trim():"";
  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Valid email is required." });
    return;
  }

  if (!LOGIN_CODE_SECRET || !mailer) {
    res.status(500).json({ message: "Email login is not configured." });
    return;
  }

  const now = new Date();
  const user = await prisma.user.findFirst({
    where:{
    email: email
    },
    select:{name:true}
  })

 let name: string;
  if (!user){
    name="New User"
  }else{
    name = user.name ?? "New User";
  }

  const activeCode = await prisma.loginCode.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  // if a code is still valid, block resending
  if (activeCode?.expiresAt && activeCode.expiresAt.getTime() > now.getTime()) {
    res.status(429).json({ message: "A verification code is already active. Please wait for it to expire." });
    return;
  }

  const code = generateCode();
  //store the hascode to database
  const codeHash = hashCode(code);
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  // delete any previous codes for this email so only the newest one remains
  //$transaction is the feature that success or fail together
  await prisma.$transaction([
    prisma.loginCode.deleteMany({ where: { email } }),
    prisma.loginCode.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    }),
  ]);

//send the code via email
  try {
    if (process.env.NODE_ENV !== "test") {
      await sendLoginCode(name, email, code);
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to send verification code." });
    return;
  }

  res.json({ message: "Verification code sent." });
});



router.post("/email/verify", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  //const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;

  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ message: "Valid email is required." });
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ message: "Verification code must be 6 digits." });
    return;
  }

  if (!LOGIN_CODE_SECRET) {
    res.status(500).json({ message: "Email login is not configured." });
    return;
  }

  const loginCode = await prisma.loginCode.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!loginCode) {
    res.status(401).json({ message: "Invalid or expired code." });
    return;
  }

  if (loginCode.attempts >= MAX_ATTEMPTS) {
    res.status(429).json({ message: "Too many attempts. Request a new code." });
    return;
  }

  const providedHash = hashCode(code);
  const storedHash = loginCode.codeHash;
  //compare hashcode with user input code convert to hashcode
  const hashesMatch =
  providedHash.length === storedHash.length && providedHash === storedHash;

  if (!hashesMatch) {
    await prisma.loginCode.update({
      where: { id: loginCode.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(401).json({ message: "Invalid or expired code." });
    return;
  }

  // delete codes so they can't be reused
  await prisma.loginCode.deleteMany({ where: { email } });

//find or create user
  const user = await prisma.user.upsert({
    where: { email:email },
    update: {},
    create: { email },
  });
  
//store user in session
//The browser remembers a cookie (e.g. connect.sid=abc123...)
//On each request:
//Session middleware reads the cookie (connect.sid=...)
//It loads the session data for that session ID from the session store:
//It attaches it to req.session
//So you can do req.session.user and get the object back.

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    provider: "email",
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


router.post("/events/:eventId/participants/email", async (req, res) => {
  const sessionUser = req.session.user;

  if (!sessionUser) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const eventId = Number(req.params.eventId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    res.status(400).json({ message: "Valid event id is required." });
    return;
  }

  if (!mailer) {
    res.status(500).json({ message: "Email login is not configured." });
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      location: true,
      startsAt: true,
      hostId: true,
      participants: {
        orderBy: { joinedAt: "asc" },
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  if (event.hostId !== sessionUser.id) {
    res.status(403).json({ message: "Only the event organizer can email the participant list." });
    return;
  }

  try {
    await sendParticipantListEmail(
      sessionUser.name ?? "Organizer",
      sessionUser.email,
      event.title,
      event.location,
      event.startsAt,
      event.participants.map((participant) => participant.user.email),
    );
  } catch (error) {
    console.error("Failed to send participant list email:", error);
    res.status(500).json({ message: "Failed to send participant list." });
    return;
  }

  res.json({
    message: "Participant list emailed.",
    recipient: sessionUser.email,
    participantCount: event.participants.length,
  });
});

// Endpoint to get current user info
router.get("/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }
  res.json({ user: req.session.user });
});

// Endpoint to log out
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
