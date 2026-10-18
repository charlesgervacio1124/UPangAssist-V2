const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { hashPassword, verifyPassword, signToken, verifyToken } = require("../src/auth");

test("passwords are salted and verified without storing the original", () => {
  const password = "correct horse battery staple";
  const firstHash = hashPassword(password);
  const secondHash = hashPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.notEqual(firstHash, password);
  assert.equal(verifyPassword(password, firstHash), true);
  assert.equal(verifyPassword("incorrect password", firstHash), false);
  assert.equal(verifyPassword(password, "invalid-hash"), false);
});

test("signed tokens authenticate only their unmodified claims", () => {
  const token = signToken({ _id: "user-123", accountType: "student" });

  assert.equal(verifyToken(token).sub, "user-123");
  assert.equal(verifyToken(token).role, "student");
  assert.equal(verifyToken(`${token}tampered`), null);
  assert.equal(verifyToken("not-a-token"), null);
});

test("production startup rejects a signing secret shorter than 32 bytes", () => {
  const serverPath = JSON.stringify(require.resolve("../src/server"));
  const result = spawnSync(process.execPath, ["-e", [
    'process.env.NODE_ENV = "production";',
    'process.env.AUTH_TOKEN_SECRET = "too-short";',
    `require(${serverPath});`
  ].join(" ")], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /AUTH_TOKEN_SECRET must be configured with at least 32 bytes/);
});
