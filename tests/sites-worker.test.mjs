import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { parseJobs } from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("reports that the Hello Work connection is awaiting credentials", async () => {
  const statusResponse = await worker.fetch(new Request("https://example.test/api/hellowork/status"), {
    ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
  });
  const jobsResponse = await worker.fetch(new Request("https://example.test/api/hellowork/jobs?hospital=横浜市民病院"), {
    ASSETS: { fetch: async () => new Response("missing", { status: 404 }) },
  });

  assert.equal(statusResponse.status, 200);
  assert.equal((await statusResponse.json()).configured, false);
  assert.equal(jobsResponse.status, 503);
  assert.deepEqual((await jobsResponse.json()).jobs, []);
});

test("normalizes a matching nursing job from the official XML shape", () => {
  const xml = `
    <result><count>1</count><data>
      <kjno>14010-12345671</kjno>
      <jgshmei>地方独立行政法人 横浜市立市民病院</jgshmei>
      <sksu>正看護師</sksu>
      <shigoto_ny>病棟での看護業務</shigoto_ny>
      <koyokeitai_n>正社員</koyokeitai_n>
      <sikg_aplusbkagen>245,000円</sikg_aplusbkagen>
      <sikg_aplusbjgn>310,000円</sikg_aplusbjgn>
      <chgn>月給</chgn>
      <shgbsjusho>神奈川県横浜市</shgbsjusho>
      <shgjn1_open_close>8:30〜17:15</shgjn1_open_close>
      <kyjs>週休二日制</kyjs>
      <nenkankjsu_n>122</nenkankjsu_n>
      <menkyo_skkuyohi1_n>看護師 必須</menkyo_skkuyohi1_n>
    </data></result>`;

  const [job] = parseJobs(xml, "横浜市立市民病院");
  assert.equal(job.jobNumber, "14010-12345671");
  assert.equal(job.salary, "月給 245,000円〜310,000円");
  assert.equal(job.qualifications, "看護師 必須");
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
