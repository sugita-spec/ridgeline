import { ensureDatabase, json, rowToHospital } from "../../server/hospitals.js";

export async function onRequestGet({ env }) {
  if (!env.RIDGELINE_DB) return json({ hospitals: [], configured: false });
  await ensureDatabase(env.RIDGELINE_DB);
  const result = await env.RIDGELINE_DB.prepare("SELECT * FROM hospitals WHERE published = 1 ORDER BY id").all();
  return json({ hospitals: result.results.map(rowToHospital), configured: true });
}

