# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Cloudflare deployment was explicitly authorized by the owner on 2026-08-14. Keep repository access limited to `sugita-spec/ridgeline`; do not expose secrets or unrelated repositories.

The career-support contact form targets `sugita@kameya-hldgs.com` and submits through the Cloudflare Pages Function at `/api/contact`, which sends with Resend. Keep `RESEND_API_KEY` only in Cloudflare encrypted secrets; never commit it. Until that secret is configured, the endpoint must fail closed rather than claim successful delivery.

The hospital-search filter bar contains location, facility type, work style, and preference filters; do not restore the information-verification filter. Work style and preference filters must match the managed facility fields (tags, salary, shift, holidays, and access) rather than inventing unsupported facility facts.

Use the supplied nurse bust portrait as Ridgeline's image model in the career-support hero, keeping the treatment natural and professional.

Keep the image model's current right-side placement; visual refinements should feel clean, editorial, and slightly premium rather than decorative or flashy.

The facility administration UI lives at `/admin`. It uses email one-time codes sent only to `sugita@kameya-hldgs.com`, stores sessions in an HttpOnly cookie, and persists facility records in the Cloudflare D1 binding `RIDGELINE_DB`. Keep `ADMIN_SESSION_SECRET` encrypted in Cloudflare and never commit it. Public users may read only records where `published = 1`; do not expose admin navigation on the public site.


Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
