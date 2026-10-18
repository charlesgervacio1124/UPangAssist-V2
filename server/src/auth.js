const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 60 * 60 * 12;
const PASSWORD_ITERATIONS = 210000;
const configuredTokenSecret = process.env.AUTH_TOKEN_SECRET;
const hasConfiguredTokenSecret = Buffer.byteLength(configuredTokenSecret || "", "utf8") >= 32;
const tokenSecret = hasConfiguredTokenSecret ? configuredTokenSecret : crypto.randomBytes(32);

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512");
  return `${PASSWORD_ITERATIONS}:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

function verifyPassword(password, storedHash) {
  const [iterationText, saltText, hashText] = (storedHash || "").split(":");
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations < 100000 || !saltText || !hashText) return false;

  const expected = Buffer.from(hashText, "base64url");
  const actual = crypto.pbkdf2Sync(password, Buffer.from(saltText, "base64url"), iterations, expected.length, "sha512");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: String(user._id),
    role: user.accountType,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", tokenSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = crypto.createHmac("sha256", tokenSecret).update(payload).digest();
  let provided;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.sub !== "string" || !["student", "employee", "admin"].includes(claims.role)) return null;
    if (!Number.isInteger(claims.exp) || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function getTokenSecretStatus() {
  return hasConfiguredTokenSecret;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, getTokenSecretStatus };
