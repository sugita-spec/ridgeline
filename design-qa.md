# Design QA — Career support integration

## Evidence

- Source visual truth path: `work/career-support-capture/source-mobile-step1.png`
- Source completion-form path: `work/career-support-capture/source-mobile-completion.png`
- Implementation screenshot path: `work/career-support-capture/local-career-desktop-final.png`
- Implementation form path: `work/career-support-capture/local-career-form.png`
- Implementation mobile paths: `work/career-support-capture/local-career-mobile-final.png`, `work/career-support-capture/local-career-mobile-form.png`
- Full-view comparison evidence: `work/career-support-capture/qa-desktop-comparison.png`
- Focused form comparison evidence: `work/career-support-capture/qa-form-comparison.png`
- Viewport: desktop 1280 × 720 CSS px; mobile 390 × 844 CSS px
- Pixel dimensions and normalization:
  - Source question: 1280 × 1211 px, full-page capture at 1× density.
  - Source form: 1280 × 1221 px, full-page capture at 1× density.
  - Implementation question: 1280 × 1417 px, full-page capture at 1× density.
  - Implementation mobile question: 390 px wide full-page capture at 1× density.
  - Both desktop comparisons use equal 1280 px widths without density resampling; shorter captures are top-aligned on a white canvas.
- State: question 1 of 3 with no selection; completion form after valid selections.

## Findings

- No actionable P0/P1/P2 findings remain.
- Fonts and typography: the Japanese sans-serif hierarchy, dark navy headings, compact utility text, and readable form labels preserve the source structure. Ridgeline's existing Avenir-style Latin brand treatment is intentionally retained for the integrated service labels.
- Spacing and layout rhythm: the centered two-column question grid, step count, action row, pale-blue form intro, vertically spaced form fields, and footer order match the source. The added framed surface and summary row are intentional Ridgeline-system integrations and do not reduce source-content fidelity.
- Colors and visual tokens: source lavender imagery, blue actions, pale-blue completion panel, and dark body text are preserved while using Ridgeline's existing blue/teal tokens for navigation and focus states.
- Image quality and asset fidelity: all 16 original career-support PNG assets are stored locally and rendered at their native aspect ratio. No source imagery is hotlinked or replaced with CSS/SVG approximations.
- Copy and content: all three source questions, all 16 answer labels, form headings, field labels, and primary actions are present. The Astra theme credit was not carried over because the integrated React implementation is not powered by Astra.
- Responsiveness and accessibility: the grid remains usable at 390 px, fields remain full-width, tap targets are at least 44 px where applicable, controls have semantic labels, selected/disabled states are exposed, focus outlines are visible, and reduced-motion preferences are respected.
- States and interactions: next is disabled until a choice is made; three-step forward navigation, back navigation, answer retention, required fields, email validation, registration success, and restart were exercised.
- Console: no browser warnings or errors were recorded in the final desktop pass.

## Comparison History

1. [P2] Question images were initially cropped too tightly and the labels appeared twice.
   - Fix: removed the duplicate rendered text, made each card's accessible name explicit, and restored the original PNG aspect ratio.
   - Post-fix evidence: `work/career-support-capture/qa-desktop-comparison.png` and `work/career-support-capture/local-career-mobile-final.png` show each complete source asset once.
2. [P2] Mobile header icon buttons lost accessible names when their visible labels were hidden at the breakpoint.
   - Fix: added explicit `aria-label` values to the career, favorites, and saved-search controls.
   - Post-fix evidence: the 390 px DOM snapshot exposes “転職サポート”/“病院を探す”, and the complete mobile flow was operable by semantic locators.

## Open Questions

- Production submission still needs the user's preferred backend or form endpoint. The local preview intentionally shows a clear no-send demo confirmation.

## Implementation Checklist

- [x] Preserve the existing 50-hospital directory and Ridgeline navigation.
- [x] Add the three-question career flow and locally stored image assets.
- [x] Add the completion form, validation, success, and restart states.
- [x] Verify desktop and mobile layouts and core interactions.
- [x] Verify build, worker tests, and browser console.

## Follow-up Polish

- [P3] Connect the registration action to the selected production form service once the endpoint and privacy copy are supplied.

final result: passed
