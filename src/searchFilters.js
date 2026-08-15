export const DEFAULT_SEARCH_FILTERS = {
  area: "神奈川県",
  facility: "すべて",
  workStyle: "こだわらない",
  preference: "指定なし",
};

const compact = (value) => String(value ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, "");

const searchableText = (hospital) => compact([
  hospital.name,
  hospital.area,
  hospital.region,
  hospital.station,
  hospital.type,
  ...(Array.isArray(hospital.tags) ? hospital.tags : []),
  hospital.role,
  hospital.salary,
  hospital.shift,
  hospital.holidays,
].join(" "));

const hasAny = (text, words) => words.some((word) => text.includes(compact(word)));

const workStyleMatchers = {
  "こだわらない": () => true,
  "常勤": (text) => hasAny(text, ["常勤", "正職員", "正社員"]),
  "日勤のみ": (text) => hasAny(text, ["日勤のみ", "日勤常勤", "夜勤なし"]),
  "夜勤あり": (text) => hasAny(text, ["夜勤", "2交替", "二交替", "3交替", "三交替"]),
  "夜勤専従": (text) => hasAny(text, ["夜勤専従", "夜勤専門"]),
  "2交替": (text) => hasAny(text, ["2交替", "二交替"]),
  "3交替": (text) => hasAny(text, ["3交替", "三交替"]),
};

const firstNumber = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const monthlySalary = (value) => {
  const normalized = String(value ?? "").replace(/,/g, "");
  const tenThousands = normalized.match(/(\d+(?:\.\d+)?)\s*万/);
  return tenThousands ? Number(tenThousands[1]) * 10000 : firstNumber(normalized);
};

const annualHolidays = (value) => {
  const normalized = compact(value);
  const match = normalized.match(/年間休日(?:数)?(?:は)?(\d+)日?/);
  return match ? Number(match[1]) : null;
};

const preferenceMatchers = {
  "指定なし": () => true,
  "月給30万円以上": (text, hospital) => {
    const salary = monthlySalary(hospital.salary);
    return hasAny(text, ["高給与", "高収入"]) || (salary !== null && salary >= 300000);
  },
  "年間休日120日以上": (text, hospital) => {
    const holidays = annualHolidays(hospital.holidays);
    return hasAny(text, ["休日120日", "年間休日120日"]) || (holidays !== null && holidays >= 120);
  },
  "土日祝休み": (text) => hasAny(text, ["土日祝休み", "土日休み", "完全週休2日"]),
  "託児所あり": (text) => hasAny(text, ["託児所", "院内保育", "保育室"]),
  "寮あり": (text) => hasAny(text, ["寮あり", "看護師寮", "職員寮"]),
  "駅徒歩10分以内": (text, hospital) => {
    const station = compact(hospital.station);
    const minutes = station.match(/徒歩(?:約)?(\d+)分/);
    return hasAny(text, ["駅近", "駅チカ"]) || (minutes ? Number(minutes[1]) <= 10 : false);
  },
  "未経験可": (text) => hasAny(text, ["未経験可", "未経験歓迎", "経験不問"]),
  "ブランク可": (text) => hasAny(text, ["ブランク可", "復職支援", "ブランク歓迎"]),
};

export function matchesHospitalFilters(hospital, values) {
  if (values.area !== "神奈川県" && hospital.region !== values.area) return false;
  if (values.facility !== "すべて" && hospital.type !== values.facility) return false;

  const text = searchableText(hospital);
  const workStyleMatch = workStyleMatchers[values.workStyle] ?? workStyleMatchers["こだわらない"];
  const preferenceMatch = preferenceMatchers[values.preference] ?? preferenceMatchers["指定なし"];

  return workStyleMatch(text, hospital) && preferenceMatch(text, hospital);
}
