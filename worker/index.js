const DEFAULT_DATASET = "M114";
const DEFAULT_MAX_PAGES = 6;
const PAGE_SIZE = 1000;
const MAX_RESULTS = 6;

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function configured(env) {
  return Boolean(env.HELLOWORK_API_BASE_URL && env.HELLOWORK_API_USER_ID && env.HELLOWORK_API_PASSWORD);
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(xml, ...names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = xml.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
    if (match) return decodeXml(match[1]);
  }
  return "";
}

function dataBlocks(xml) {
  return [...xml.matchAll(/<data(?:\s[^>]*)?>([\s\S]*?)<\/data>/gi)].map((match) => match[1]);
}

function compact(...values) {
  return values.filter(Boolean).join("・");
}

function formatSalary(block) {
  const unit = tagValue(block, "chgn", "chgn_n", "chingin_keitaimei") || "月額";
  const lower = tagValue(block, "sikg_aplusbkagen", "kihonkyu_kagen", "chingin_kagen");
  const upper = tagValue(block, "sikg_aplusbjgn", "kihonkyu_jogen", "chingin_jogen");
  if (!lower && !upper) return tagValue(block, "chingin", "salary");
  if (lower && upper && lower !== upper) return `${unit} ${lower}〜${upper}`;
  return `${unit} ${lower || upper}`;
}

function formatHours(block) {
  return compact(
    tagValue(block, "shgjn1_open_close", "shugyojikan1"),
    tagValue(block, "shgjn2_open_close", "shugyojikan2"),
    tagValue(block, "shgjn3_open_close", "shugyojikan3"),
    tagValue(block, "shgjn_tokki", "shugyojikan_tokki"),
  );
}

function formatQualifications(block) {
  return compact(
    tagValue(block, "menkyo_skkuyohi1_n", "menkyo1"),
    tagValue(block, "menkyo_skkuyohi2_n", "menkyo2"),
    tagValue(block, "menkyo_skkuyohi3_n", "menkyo3"),
    tagValue(block, "hynamenkyo_snta", "sonota_menkyo"),
  );
}

function normalizeForMatch(value) {
  return value
    .normalize("NFKC")
    .replace(/[\s　・･,，.。\-ー()（）［］【】]/g, "")
    .replace(/(医療法人|社会医療法人|公益財団法人|一般財団法人|独立行政法人|地方独立行政法人|学校法人|社会福祉法人|医療法人社団|医療法人財団)/g, "")
    .toLowerCase();
}

function isMatchingNurseJob(block, hospitalName) {
  const occupation = compact(
    tagValue(block, "sksu", "shokushu"),
    tagValue(block, "shigoto_ny", "shigotonaiyo"),
    formatQualifications(block),
  );
  if (!/(看護師|准看護師|助産師|保健師|看護職)/.test(occupation)) return false;

  const target = normalizeForMatch(hospitalName);
  const record = normalizeForMatch(compact(
    tagValue(block, "jgshmei", "jigyoshomei"),
    tagValue(block, "shigoto_ny", "shigotonaiyo"),
    tagValue(block, "shgbsjusho", "shugyobasho_jusho"),
  ));
  return target.length >= 3 && (record.includes(target) || target.includes(record));
}

export function parseJobs(xml, hospitalName) {
  return dataBlocks(xml)
    .filter((block) => isMatchingNurseJob(block, hospitalName))
    .map((block) => {
      const annualHolidays = tagValue(block, "nenkankjsu_n", "nenkan_kyujitsu");
      const holidays = tagValue(block, "kyjs", "kyujitsu");
      const received = tagValue(block, "uktkymd", "uketsuke_nengappi");
      const expires = tagValue(block, "shokaikigen", "yukokigen_nengappi", "yukokigen");
      return {
        jobNumber: tagValue(block, "kjno", "kyujin_bango"),
        employer: tagValue(block, "jgshmei", "jigyoshomei"),
        occupation: tagValue(block, "sksu", "shokushu"),
        description: tagValue(block, "shigoto_ny", "shigotonaiyo").slice(0, 420),
        employmentType: tagValue(block, "koyokeitai_n", "koyokeitai"),
        salary: formatSalary(block),
        workplace: compact(
          tagValue(block, "shgbsjusho", "shugyobasho_jusho"),
          tagValue(block, "shgbs_myremjr", "moyorieki"),
        ),
        workingHours: formatHours(block),
        holidays: compact(holidays, annualHolidays ? `年間休日 ${annualHolidays}日` : ""),
        qualifications: formatQualifications(block),
        insurance: tagValue(block, "knyhkn_n", "kanyuhoken", "kanyuhoken_n"),
        period: compact(received ? `受付 ${received}` : "", expires ? `有効期限 ${expires}` : ""),
      };
    })
    .filter((job) => job.jobNumber);
}

function apiUrl(baseUrl, path, params) {
  const url = new URL(path, `${baseUrl.replace(/\/$/, "")}/`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (url.protocol !== "https:") throw new Error("HELLOWORK_API_BASE_URL must use HTTPS");
  return url;
}

async function postXml(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/xml, text/xml" },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`ハローワークAPIが ${response.status} を返しました`);
  return body;
}

async function fetchHelloWorkJobs(env, hospitalName) {
  const baseUrl = env.HELLOWORK_API_BASE_URL;
  const dataset = env.HELLOWORK_DATA_ID || DEFAULT_DATASET;
  const requestedMaxPages = Number.parseInt(env.HELLOWORK_MAX_PAGES || DEFAULT_MAX_PAGES, 10);
  const maxPages = Number.isFinite(requestedMaxPages) ? Math.min(Math.max(requestedMaxPages, 1), 30) : DEFAULT_MAX_PAGES;

  const tokenXml = await postXml(apiUrl(baseUrl, "teikyo/api/2.0/auth/getToken", {
    id: env.HELLOWORK_API_USER_ID,
    pass: env.HELLOWORK_API_PASSWORD,
  }));
  const token = tagValue(tokenXml, "token");
  if (!token) throw new Error("ハローワークAPIの認証トークンを取得できませんでした");

  let totalPages = 1;
  const jobs = [];
  try {
    for (let page = 1; page <= Math.min(totalPages, maxPages) && jobs.length < MAX_RESULTS; page += 1) {
      const xml = await postXml(apiUrl(baseUrl, `teikyo/api/2.0/kyujin/${dataset}/${page}`, { token }));
      if (page === 1) {
        const count = Number.parseInt(tagValue(xml, "count") || "0", 10);
        totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
      }
      jobs.push(...parseJobs(xml, hospitalName));
    }
  } finally {
    try {
      await postXml(apiUrl(baseUrl, "teikyo/api/2.0/auth/delToken", { token }));
    } catch {
      // A token expires the same day. Cleanup failure must not hide retrieved jobs.
    }
  }

  return {
    jobs: jobs.slice(0, MAX_RESULTS),
    dataset,
    partial: totalPages > maxPages,
  };
}

async function handleHelloWork(request, env, url) {
  if (request.method !== "GET") return json({ message: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });

  if (url.pathname === "/api/hellowork/status") {
    return json({
      configured: configured(env),
      provider: "ハローワーク求人情報提供サービス",
      dataset: env.HELLOWORK_DATA_ID || DEFAULT_DATASET,
    });
  }

  if (url.pathname !== "/api/hellowork/jobs") return null;
  const hospitalName = url.searchParams.get("hospital")?.trim();
  if (!hospitalName) return json({ configured: configured(env), jobs: [], message: "病院名を指定してください。" }, { status: 400 });
  if (!configured(env)) {
    return json({
      configured: false,
      jobs: [],
      message: "ハローワークの利用承認後に発行される接続情報を設定すると、公式求人を表示できます。",
    }, { status: 503 });
  }

  try {
    const result = await fetchHelloWorkJobs(env, hospitalName);
    return json({ configured: true, provider: "ハローワーク求人情報提供サービス", ...result });
  } catch (error) {
    console.error("Hello Work API request failed", error);
    return json({ configured: true, jobs: [], message: "求人情報の取得に失敗しました。" }, { status: 502 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/hellowork/")) {
      const apiResponse = await handleHelloWork(request, env, url);
      if (apiResponse) return apiResponse;
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
