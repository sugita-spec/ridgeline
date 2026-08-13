import { requireAdmin, sameOrigin } from "../../../../server/admin-auth.js";
import { hospitalValues, json, normalizeHospital, rowToHospital, validateHospital } from "../../../../server/hospitals.js";

function numericId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function onRequestPut({ request, env, params }) {
  if (!sameOrigin(request)) return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = numericId(params.id);
  if (!id) return json({ message: "施設IDが正しくありません。" }, { status: 400 });
  const hospital = normalizeHospital(await request.json().catch(() => ({})));
  const error = validateHospital(hospital);
  if (error) return json({ message: error }, { status: 400 });
  await env.RIDGELINE_DB.prepare(`
    UPDATE hospitals SET
      name = ?, area = ?, region = ?, station = ?, type = ?, tags = ?, role = ?, salary = ?, shift = ?, holidays = ?,
      official_url = ?, recruit_url = ?, maps_url = ?, image = ?, image_note = ?, published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(...hospitalValues(hospital), id).run();
  const row = await env.RIDGELINE_DB.prepare("SELECT * FROM hospitals WHERE id = ?").bind(id).first();
  return row ? json({ hospital: rowToHospital(row) }) : json({ message: "施設が見つかりません。" }, { status: 404 });
}

export async function onRequestDelete({ request, env, params }) {
  if (!sameOrigin(request)) return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const id = numericId(params.id);
  if (!id) return json({ message: "施設IDが正しくありません。" }, { status: 400 });
  await env.RIDGELINE_DB.prepare("DELETE FROM hospitals WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
