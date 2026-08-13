import { requireAdmin, sameOrigin } from "../../../server/admin-auth.js";
import { hospitalValues, json, normalizeHospital, rowToHospital, validateHospital } from "../../../server/hospitals.js";

export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const result = await env.RIDGELINE_DB.prepare("SELECT * FROM hospitals ORDER BY updated_at DESC, id DESC").all();
  return json({ hospitals: result.results.map(rowToHospital) });
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const hospital = normalizeHospital(await request.json().catch(() => ({})));
  const error = validateHospital(hospital);
  if (error) return json({ message: error }, { status: 400 });
  const result = await env.RIDGELINE_DB.prepare(`
    INSERT INTO hospitals (
      name, area, region, station, type, tags, role, salary, shift, holidays,
      official_url, recruit_url, maps_url, image, image_note, published, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(...hospitalValues(hospital)).run();
  const row = await env.RIDGELINE_DB.prepare("SELECT * FROM hospitals WHERE id = ?").bind(result.meta.last_row_id).first();
  return json({ hospital: rowToHospital(row) }, { status: 201 });
}

