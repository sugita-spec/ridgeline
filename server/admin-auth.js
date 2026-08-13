import { ensureDatabase, json } from "./hospitals.js";

const ADMIN_EMAIL = "sugita@kameya-hldgs.com";
const SESSION_COOKIE = "ridgeline_admin_session";
const encoder = new TextEncoder();

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}

export async function hashValue(secret, value) {
  return base64Url(await hmac(secret, value));
}

export async function verifyHash(secret, value, expected) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, fromBase64Url(expected), encoder.encode(value));
}

export async function createSession(secret) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1_000;
  const payload = `${ADMIN_EMAIL}:${expiresAt}`;
  return `${expiresAt}.${await hashValue(secret, payload)}`;
}

function cookieValue(request) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] || "";
}

export async function isAdmin(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const token = cookieValue(request);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiry, signature] = parts;
  if (Number(expiry) <= Date.now()) return false;
  return verifyHash(env.ADMIN_SESSION_SECRET, `${ADMIN_EMAIL}:${expiry}`, signature);
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  if (!env.RIDGELINE_DB || !env.ADMIN_SESSION_SECRET) {
    return json({ message: "管理機能は現在準備中です。" }, { status: 503 });
  }
  await ensureDatabase(env.RIDGELINE_DB);
  if (!(await isAdmin(request, env))) {
    return json({ message: "ログインが必要です。" }, { status: 401 });
  }
  return null;
}

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export { ADMIN_EMAIL };
