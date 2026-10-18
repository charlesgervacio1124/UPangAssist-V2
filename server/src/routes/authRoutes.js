const express = require("express");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { hashPassword, verifyPassword, signToken } = require("../auth");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authAttempts = new Map();
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

function limitAttempts(maxAttempts, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    const attempt = authAttempts.get(key);
    if (attempt && attempt.resetAt > now && attempt.count >= maxAttempts) {
      res.setHeader("Retry-After", Math.ceil((attempt.resetAt - now) / 1000));
      return res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
    }

    if (!attempt || attempt.resetAt <= now) {
      authAttempts.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      attempt.count += 1;
    }
    if (authAttempts.size > 10000) {
      for (const [attemptKey, value] of authAttempts) {
        if (value.resetAt <= now) authAttempts.delete(attemptKey);
      }
    }
    return next();
  };
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    course: user.course || "",
    accountType: user.accountType
  };
}

function issueSession(res, user, status = 200) {
  return res.status(status).json({ token: signToken(user), user: publicUser(user) });
}

router.post("/register", limitAttempts(15, 60 * 60 * 1000), async (req, res, next) => {
  const { name, email, password, course = "" } = req.body || {};
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
  }
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return res.status(400).json({ error: "Password must be between 12 and 128 characters." });
  }
  if (typeof course !== "string" || course.length > 120) {
    return res.status(400).json({ error: "Course must be 120 characters or fewer." });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      course: course.trim(),
      accountType: "student"
    });
    return issueSession(res, user, 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return next(error);
  }
});

router.post("/login", limitAttempts(10, 15 * 60 * 1000), async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || !emailPattern.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address and password." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    return issueSession(res, user);
  } catch (error) {
    return next(error);
  }
});

router.post("/google", limitAttempts(10, 15 * 60 * 1000), async (req, res, next) => {
  if (!googleClient) {
    return res.status(503).json({ error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the API and VITE_GOOGLE_CLIENT_ID on the student app." });
  }
  const credential = typeof req.body?.credential === "string" ? req.body.credential : "";
  if (!credential || credential.length > 10000) {
    return res.status(400).json({ error: "A valid Google sign-in credential is required." });
  }

  let googleUser;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: "Google could not verify this account. Try another Google account." });
    }
    googleUser = {
      id: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: typeof payload.name === "string" ? payload.name.trim() : ""
    };
  } catch (error) {
    console.warn("Google sign-in credential verification failed:", error.message);
    return res.status(401).json({ error: "Google sign-in could not be verified. Please try again." });
  }

  if (!emailPattern.test(googleUser.email) || googleUser.email.length > 254) {
    return res.status(401).json({ error: "Google did not provide a valid email address." });
  }

  try {
    let user = await User.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email }]
    }).select("+googleId");
    if (user?.accountType === "admin") {
      return res.status(403).json({ error: "Administrator accounts must sign in with their provisioned administrator credentials." });
    }
    if (user?.googleId && user.googleId !== googleUser.id) {
      return res.status(409).json({ error: "This account is already linked to another Google account." });
    }
    if (!user) {
      user = await User.create({
        name: (googleUser.name || googleUser.email.split("@")[0]).slice(0, 100),
        email: googleUser.email,
        googleId: googleUser.id,
        passwordHash: hashPassword(crypto.randomBytes(48).toString("base64url")),
        accountType: "student",
        course: ""
      });
    } else if (!user.googleId) {
      user.googleId = googleUser.id;
      await user.save();
    }
    return issueSession(res, user);
  } catch (error) {
    if (error.code === 11000) {
      const user = await User.findOne({
        $or: [{ googleId: googleUser.id }, { email: googleUser.email }]
      }).select("+googleId");
      if (user && user.accountType !== "admin" && user.googleId === googleUser.id) {
        return issueSession(res, user);
      }
      return res.status(409).json({ error: "This Google account could not be linked. Sign in with your registered credentials first." });
    }
    return next(error);
  }
});

router.get("/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
