const User = require("../models/User");
const { verifyToken } = require("../auth");

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: "A valid sign-in is required." });

  try {
    const user = await User.findById(claims.sub).select("_id name email course accountType");
    if (!user || user.accountType !== claims.role) {
      return res.status(401).json({ error: "This account is no longer available." });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.accountType !== "admin") {
    return res.status(403).json({ error: "Administrator access is required." });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
