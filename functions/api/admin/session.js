import { clearSessionCookie, requireAdmin } from "../../../server/admin-auth.js";
import { json } from "../../../server/hospitals.js";

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  return denied || json({ authenticated: true });
}

export async function onRequestDelete() {
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } });
}

