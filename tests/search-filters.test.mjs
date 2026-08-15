import test from "node:test";
import assert from "node:assert/strict";
import { FACILITY_FILTER_OPTIONS, FACILITY_TYPES } from "../src/facilityTypes.js";
import { DEFAULT_SEARCH_FILTERS, matchesHospitalFilters } from "../src/searchFilters.js";

const hospital = {
  name: "Ridgeline中央病院",
  area: "横浜市西区",
  region: "横浜市",
  station: "横浜駅から徒歩8分",
  type: "総合病院",
  tags: ["託児所あり", "ブランク可"],
  role: "正職員 看護師",
  salary: "月給 320,000円〜",
  shift: "2交替・夜勤あり",
  holidays: "年間休日125日",
};

test("default search conditions include every facility", () => {
  assert.equal(matchesHospitalFilters(hospital, DEFAULT_SEARCH_FILTERS), true);
});

test("matches common nurse job conditions from managed facility fields", () => {
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, workStyle: "2交替" }), true);
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, preference: "月給30万円以上" }), true);
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, preference: "年間休日120日以上" }), true);
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, preference: "駅徒歩10分以内" }), true);
});

test("rejects facilities that do not satisfy selected conditions", () => {
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, area: "川崎市" }), false);
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, workStyle: "3交替" }), false);
  assert.equal(matchesHospitalFilters(hospital, { ...DEFAULT_SEARCH_FILTERS, preference: "寮あり" }), false);
  assert.equal(matchesHospitalFilters({ ...hospital, holidays: "2026年7月確認" }, { ...DEFAULT_SEARCH_FILTERS, preference: "年間休日120日以上" }), false);
});

test("offers nurse workplace types in public search and administration", () => {
  assert.equal(FACILITY_FILTER_OPTIONS[0], "すべて");
  assert.deepEqual(FACILITY_FILTER_OPTIONS.slice(1), FACILITY_TYPES);
  assert.equal(new Set(FACILITY_TYPES).size, FACILITY_TYPES.length);
  assert.equal(FACILITY_TYPES.includes("訪問看護ステーション"), true);
  assert.equal(FACILITY_TYPES.includes("介護老人保健施設"), true);
  assert.equal(FACILITY_TYPES.includes("特別養護老人ホーム"), true);
  assert.equal(FACILITY_TYPES.includes("企業・産業保健"), true);
});

test("matches a home-visit nursing station by facility type", () => {
  const homeVisitNursing = { ...hospital, name: "Ridgeline訪問看護ステーション", type: "訪問看護ステーション" };
  assert.equal(
    matchesHospitalFilters(homeVisitNursing, { ...DEFAULT_SEARCH_FILTERS, facility: "訪問看護ステーション" }),
    true,
  );
});
