import { ADMIN_EMAIL, createSession, sameOrigin, sessionCookie, verifyHash } from "../../../server/admin-auth.js";
import { ensureDatabase, json } from "../../../server/hospitals.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  if (!env.RIDGELINE_DB || !env.ADMIN_SESSION_SECRET) return json({ message: "管理機能は現在準備中です。" }, { status: 503 });
  await ensureDatabase(env.RIDGELINE_DB);
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").replace(/\D/g, "").slice(0, 6);
  const record = await env.RIDGELINE_DB.prepare("SELECT * FROM admin_codes WHERE email = ?").bind(ADMIN_EMAIL).first();
  if (!record || record.expires_at < Date.now() || record.attempts >= 5 || code.length !== 6) {
    return json({ message: "コードが正しくないか、有効期限が切れています。" }, { status: 401 });
  }
  if (!(await verifyHash(env.ADMIN_SESSION_SECRET, `${ADMIN_EMAIL}:${code}`, record.code_hash))) {
    await env.RIDGELINE_DB.prepare("UPDATE admin_codes SET attempts = attempts + 1 WHERE email = ?").bind(ADMIN_EMAIL).run();
    return json({ message: "コードが正しくないか、有効期限が切れています。" }, { status: 401 });
  }
  await env.RIDGELINE_DB.prepare("DELETE FROM admin_codes WHERE email = ?").bind(ADMIN_EMAIL).run();
  const token = await createSession(env.ADMIN_SESSION_SECRET);
  return json({ ok: true }, { headers: { "set-cookie": sessionCookie(token) } });
}
