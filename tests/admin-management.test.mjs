import test from "node:test";
import assert from "node:assert/strict";
import { createSession, isAdmin, sessionCookie } from "../server/admin-auth.js";
import { normalizeHospital, validateHospital } from "../server/hospitals.js";

test("normalizes a manually entered hospital", () => {
  const hospital = normalizeHospital({
    name: "  Ridgeline病院  ",
    area: "横浜市中区1-1",
    region: "横浜市",
    tags: "総合病院、駅近",
    officialUrl: "https://example.com/hospital",
    published: false,
  });

  assert.equal(hospital.name, "Ridgeline病院");
  assert.deepEqual(hospital.tags, ["総合病院", "駅近"]);
  assert.equal(hospital.published, false);
  assert.equal(validateHospital(hospital), "");
  assert.match(hospital.mapsUrl, /^https:\/\/www\.google\.com\/maps\/search/);
});

test("rejects incomplete or unsafe facility entries", () => {
  const hospital = normalizeHospital({
    name: "テスト病院",
    area: "横浜市",
    region: "横浜市",
    officialUrl: "http://example.com",
  });

  assert.equal(hospital.officialUrl, "");
  assert.match(validateHospital(hospital), /必須/);
});

test("creates and verifies an admin session cookie", async () => {
  const secret = "test-secret-value-that-is-long-enough";
  const token = await createSession(secret);
  const request = new Request("https://ridgeline.example/api/admin/session", {
    headers: { cookie: sessionCookie(token).split(";")[0] },
  });

  assert.equal(await isAdmin(request, { ADMIN_SESSION_SECRET: secret }), true);
  assert.equal(await isAdmin(request, { ADMIN_SESSION_SECRET: "wrong-secret" }), false);
});

