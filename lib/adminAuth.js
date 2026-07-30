import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "lecture_admin_session";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function verifyAdminPassword(password) {
  if (!isAdminConfigured()) return false;
  return safeEqual(password, process.env.ADMIN_PASSWORD);
}

export function createAdminToken(now = Date.now()) {
  if (!isAdminConfigured()) throw new Error("Administration non configurée");
  const payload = Buffer.from(JSON.stringify({ exp: now + ADMIN_SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token, now = Date.now()) {
  if (!isAdminConfigured() || !token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number.isFinite(data.exp) && data.exp > now;
  } catch {
    return false;
  }
}
