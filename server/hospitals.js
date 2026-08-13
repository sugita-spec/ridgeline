import { hospitals as seedHospitals } from "../src/data.js";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    region TEXT NOT NULL,
    station TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '総合病院',
    tags TEXT NOT NULL DEFAULT '[]',
    role TEXT NOT NULL DEFAULT '看護師採用情報',
    salary TEXT NOT NULL DEFAULT '公式サイトで確認',
    shift TEXT NOT NULL DEFAULT '採用条件は公式サイトへ',
    holidays TEXT NOT NULL DEFAULT '',
    official_url TEXT NOT NULL,
    recruit_url TEXT NOT NULL,
    maps_url TEXT NOT NULL,
    image TEXT,
    image_note TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS ridgeline_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_codes (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    requested_at INTEGER NOT NULL
  )`,
];

export async function ensureDatabase(db) {
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  const seeded = await db.prepare("SELECT value FROM ridgeline_meta WHERE key = 'hospitals_seeded'").first();
  if (seeded) return;

  const inserts = seedHospitals.map((hospital) => db.prepare(`
    INSERT OR IGNORE INTO hospitals (
      id, name, area, region, station, type, tags, role, salary, shift, holidays,
      official_url, recruit_url, maps_url, image, image_note, published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).bind(
    hospital.id,
    hospital.name,
    hospital.area,
    hospital.region,
    hospital.station,
    hospital.type,
    JSON.stringify(hospital.tags),
    hospital.role,
    hospital.salary,
    hospital.shift,
    hospital.holidays,
    hospital.officialUrl,
    hospital.recruitUrl,
    hospital.mapsUrl,
    hospital.image,
    hospital.imageNote,
  ));
  await db.batch(inserts);
  await db.prepare("INSERT OR REPLACE INTO ridgeline_meta (key, value) VALUES ('hospitals_seeded', '1')").run();
}

export function rowToHospital(row) {
  let tags = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    region: row.region,
    station: row.station,
    type: row.type,
    tags,
    role: row.role,
    salary: row.salary,
    shift: row.shift,
    holidays: row.holidays,
    officialUrl: row.official_url,
    recruitUrl: row.recruit_url,
    mapsUrl: row.maps_url,
    image: row.image,
    imageNote: row.image_note,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clean(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeUrl(value, fallback = "") {
  const text = clean(value, 1_000);
  if (!text) return fallback;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeHospital(input) {
  const name = clean(input?.name, 140);
  const officialUrl = safeUrl(input?.officialUrl);
  const tags = Array.isArray(input?.tags)
    ? input.tags.map((tag) => clean(tag, 60)).filter(Boolean).slice(0, 8)
    : clean(input?.tags, 500).split(/[,、\n]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
  return {
    name,
    area: clean(input?.area, 180),
    region: clean(input?.region, 80),
    station: clean(input?.station, 180),
    type: clean(input?.type, 80) || "総合病院",
    tags,
    role: clean(input?.role, 120) || "看護師採用情報",
    salary: clean(input?.salary, 160) || "公式サイトで確認",
    shift: clean(input?.shift, 160) || "採用条件は公式サイトへ",
    holidays: clean(input?.holidays, 160),
    officialUrl,
    recruitUrl: safeUrl(input?.recruitUrl, officialUrl),
    mapsUrl: safeUrl(input?.mapsUrl, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`),
    image: safeUrl(input?.image) || (clean(input?.image, 1_000).startsWith("/assets/") ? clean(input.image, 1_000) : null),
    imageNote: clean(input?.imageNote, 180) || "管理画面から登録した外観画像",
    published: input?.published !== false,
  };
}

export function validateHospital(hospital) {
  if (!hospital.name || !hospital.area || !hospital.region || !hospital.officialUrl) {
    return "施設名、所在地、エリア、公式サイトは必須です。";
  }
  return "";
}

export function hospitalValues(hospital) {
  return [
    hospital.name, hospital.area, hospital.region, hospital.station, hospital.type,
    JSON.stringify(hospital.tags), hospital.role, hospital.salary, hospital.shift,
    hospital.holidays, hospital.officialUrl, hospital.recruitUrl, hospital.mapsUrl,
    hospital.image, hospital.imageNote, hospital.published ? 1 : 0,
  ];
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

