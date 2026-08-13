import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../functions/api/contact.js";

function submission(overrides = {}) {
  return {
    name: "山田 花子",
    email: "hanako@example.com",
    subject: "転職相談",
    message: "相談を希望します。",
    website: "",
    submissionId: "f3dc7ad2-fab5-40ad-84b6-5476d037143e",
    startedAt: Date.now() - 5_000,
    answers: {
      保有資格: "看護師",
      希望の働き方: "常勤（日勤のみ）",
      転職希望時期: "3ヶ月以内",
    },
    ...overrides,
  };
}

test("sends a validated inquiry through Resend", async () => {
  const originalFetch = globalThis.fetch;
  let outbound;
  globalThis.fetch = async (url, init) => {
    outbound = { url, init };
    return Response.json({ id: "email_123" });
  };

  try {
    const request = new Request("https://ridgeline.example/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://ridgeline.example" },
      body: JSON.stringify(submission()),
    });
    const response = await onRequestPost({ request, env: { RESEND_API_KEY: "test_key" } });
    const email = JSON.parse(outbound.init.body);

    assert.equal(response.status, 200);
    assert.equal(outbound.url, "https://api.resend.com/emails");
    assert.equal(outbound.init.headers.authorization, "Bearer test_key");
    assert.equal(email.to[0], "sugita@kameya-hldgs.com");
    assert.equal(email.reply_to, "hanako@example.com");
    assert.match(email.text, /希望の働き方: 常勤（日勤のみ）/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects invalid submissions before calling Resend", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ id: "unexpected" });
  };

  try {
    const request = new Request("https://ridgeline.example/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://ridgeline.example" },
      body: JSON.stringify(submission({ email: "invalid" })),
    });
    const response = await onRequestPost({ request, env: { RESEND_API_KEY: "test_key" } });

    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
