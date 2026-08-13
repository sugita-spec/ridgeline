import { ADMIN_EMAIL, hashValue, sameOrigin } from "../../../server/admin-auth.js";
import { ensureDatabase, json } from "../../../server/hospitals.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  if (!env.RIDGELINE_DB || !env.ADMIN_SESSION_SECRET || !env.RESEND_API_KEY) {
    return json({ message: "管理機能は現在準備中です。" }, { status: 503 });
  }
  await ensureDatabase(env.RIDGELINE_DB);
  const body = await request.json().catch(() => ({}));
  if (String(body.email || "").trim().toLowerCase() !== ADMIN_EMAIL) {
    return json({ ok: true });
  }

  const existing = await env.RIDGELINE_DB.prepare("SELECT requested_at FROM admin_codes WHERE email = ?").bind(ADMIN_EMAIL).first();
  if (existing && Date.now() - existing.requested_at < 60_000) {
    return json({ message: "1分ほど待ってから再度お試しください。" }, { status: 429 });
  }

  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  const code = String(random[0] % 1_000_000).padStart(6, "0");
  const codeHash = await hashValue(env.ADMIN_SESSION_SECRET, `${ADMIN_EMAIL}:${code}`);
  await env.RIDGELINE_DB.prepare(`
    INSERT INTO admin_codes (email, code_hash, expires_at, attempts, requested_at)
    VALUES (?, ?, ?, 0, ?)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, requested_at = excluded.requested_at
  `).bind(ADMIN_EMAIL, codeHash, Date.now() + 10 * 60_000, Date.now()).run();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || "Ridgeline <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: "Ridgeline 管理画面ログインコード",
      text: `Ridgeline管理画面のログインコードは ${code} です。\n\nこのコードは10分間有効です。`,
    }),
  });
  if (!response.ok) {
    await env.RIDGELINE_DB.prepare("DELETE FROM admin_codes WHERE email = ?").bind(ADMIN_EMAIL).run();
    return json({ message: "ログインコードを送信できませんでした。" }, { status: 502 });
  }
  return json({ ok: true });
}

