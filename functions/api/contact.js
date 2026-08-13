const CONTACT_TO_EMAIL = "sugita@kameya-hldgs.com";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_REQUEST_BYTES = 16_384;
const MAX_MESSAGE_LENGTH = 4_000;
const ANSWER_LABELS = ["保有資格", "希望の働き方", "転職希望時期"];

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function readJson(request) {
  const length = Number.parseInt(request.headers.get("content-length") || "0", 10);
  if (length > MAX_REQUEST_BYTES) throw new Error("payload_too_large");

  const reader = request.body?.getReader();
  if (!reader) return {};

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error("payload_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function normalizeSubmission(input) {
  const answers = input?.answers && typeof input.answers === "object" ? input.answers : {};
  return {
    name: clean(input?.name, 100),
    email: clean(input?.email, 254),
    subject: clean(input?.subject, 160).replace(/[\r\n]+/g, " "),
    message: clean(input?.message, MAX_MESSAGE_LENGTH),
    website: clean(input?.website, 200),
    submissionId: clean(input?.submissionId, 80),
    startedAt: Number(input?.startedAt),
    answers: Object.fromEntries(ANSWER_LABELS.map((label) => [label, clean(answers[label], 100)])),
  };
}

function validateSubmission(submission) {
  if (submission.website) return "spam";
  if (!submission.name || !validEmail(submission.email) || !submission.subject) return "invalid";
  if (!submission.submissionId || !Number.isFinite(submission.startedAt)) return "invalid";
  const elapsed = Date.now() - submission.startedAt;
  if (elapsed < 2_000 || elapsed > 7_200_000) return "invalid";
  if (Object.values(submission.answers).some((value) => !value)) return "invalid";
  return "valid";
}

function buildText(submission) {
  return [
    "Ridgeline 転職サポートへのお問い合わせ",
    "",
    ...ANSWER_LABELS.map((label) => `${label}: ${submission.answers[label]}`),
    "",
    `氏名: ${submission.name}`,
    `メールアドレス: ${submission.email}`,
    "",
    "メッセージ:",
    submission.message || "（未入力）",
  ].join("\n");
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ message: "送信元を確認できませんでした。" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ message: "送信形式が正しくありません。" }, { status: 415 });
  }
  if (!env.RESEND_API_KEY) {
    return json({ message: "お問い合わせ機能は現在準備中です。" }, { status: 503 });
  }

  let submission;
  try {
    submission = normalizeSubmission(await readJson(request));
  } catch (error) {
    const status = error.message === "payload_too_large" ? 413 : 400;
    return json({ message: "入力内容を確認してください。" }, { status });
  }

  const validity = validateSubmission(submission);
  if (validity === "spam") return json({ ok: true });
  if (validity !== "valid") return json({ message: "入力内容を確認してください。" }, { status: 400 });

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `ridgeline-contact/${submission.submissionId}`,
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || "Ridgeline <onboarding@resend.dev>",
      to: [env.CONTACT_TO_EMAIL || CONTACT_TO_EMAIL],
      reply_to: submission.email,
      subject: `[Ridgeline] ${submission.subject}`,
      text: buildText(submission),
    }),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ event: "contact_email_failed", status: response.status }));
    return json({ message: "送信できませんでした。時間をおいて再度お試しください。" }, { status: 502 });
  }

  const result = await response.json();
  console.log(JSON.stringify({ event: "contact_email_sent", id: result.id }));
  return json({ ok: true, id: result.id });
}
