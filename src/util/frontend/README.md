# Cache Flow — Data Governance (Frontend)

Cache Flow makes sensitive-data decisions **understandable, reviewable, and actionable** while protecting raw
enterprise data. This is a **frontend-only** React + TypeScript application. It sends typed requests and renders typed
responses; it never classifies data, evaluates rules, calculates confidence, or computes remediation locally. Until the
real backend is connected it runs against a realistic, API-shaped mock.

## Tech stack

React 19 · TypeScript (strict) · Vite · React Router · TanStack Query (server state) · Zustand (local UI state) ·
React Hook Form + Zod (forms) · Tailwind CSS v4 + a semantic CSS design system · Recharts (one donut chart) ·
Lucide icons · Vitest + Testing Library (tests).

## Setup

```bash
npm install      # installs deps (adds zustand + vitest tooling on top of the existing stack)
npm run dev      # start the dev server (http://localhost:5173)
npm run test     # run the test suite (Vitest)
npm run build    # type-check + production build
npm run lint     # ESLint
```

Environment (`.env`, see `.env.example`):

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK_API=true
```

## Architecture

The app is layered so that **only the API implementation changes** when the real backend arrives:

- `src/types` — all API models (tiers, statuses, evidence kinds, datasets, rules, remediation, passport…). Enums are
  string-literal unions (the tsconfig forbids `enum` via `erasableSyntaxOnly`).
- `src/api` — a typed API layer, one module per resource (`dashboardApi`, `sourcesApi`, `scansApi`, `datasetsApi`,
  `rulesApi`, `reviewsApi`, `policiesApi`, `auditApi`, `remediationApi`, `dataPassportApi`). All go through
  `apiClient.ts` `request()`, which serves the **mock** when `VITE_USE_MOCK_API` is not `false`, otherwise `fetch`es the
  real backend. **UI never knows which is active.**
- `src/mocks` — `data.ts` holds predefined, API-shaped fixtures; `db.ts` is the mutable mock "backend" that powers the
  stateful demo (create rule → reclassify → audit). No classification logic lives here — reclassification only applies a
  saved rule's *declared* target tier.
- `src/hooks` — TanStack Query hooks and mutations (`useDashboardStats`, `useDatasets`, `useClassificationRules`,
  `useCreateRule`, `usePreviewRule`, `useReclassifyDataset`, `useCheckIntendedUse`, `useRemediationPlan`,
  `usePreviewRemediation`, `useSubmitReview`, `useApproveSafeVersion`, `useDataPassport`, …).
- `src/stores` — Zustand for **local UI state only**: sidebar, open drawers/sheets, temporary rule filters, selected
  remediation transformations, demo preferences, toasts.
- `src/components` — reusable UI: `common/` (Button, TierBadge, ReviewStatusBadge, UsageStatusBadge,
  ConfidenceIndicator, Drawer, Modal, ConfirmDialog, EmptyState/ErrorState/Skeletons, Toaster), `layout/` (AppShell,
  Sidebar, Topbar), plus `classification/`, `datasets/`, `rules/`, `remediation/`, `reviews/`, `policies/`.
- `src/features` — one folder per page (dashboard, sources, scans, datasets, rules, reviews, policies, audit,
  data-passport).
- `src/routes` — `createBrowserRouter` wiring.

### Routes

`/dashboard` · `/sources` · `/sources/new` · `/sources/file/:fileId/configure` · `/scan/:scanId` · `/datasets` ·
`/datasets/:datasetId` · `/datasets/:datasetId/intended-use` · `/datasets/:datasetId/make-safe` · `/reviews` · `/rules`
· `/policies` · `/audit` · `/data-passport/:datasetId`

### Main clickable flow

Dashboard → Add Data Source → Select File → Configure File → (optionally) Add New Rule → Start Scan → Scan Progress →
Data Catalogue → Dataset Details → Inspect Evidence → Check Intended Use → Make it Safe → Select Transformations →
Updated Preview → Submit for Review → Approve Safe Version → Data Passport.

### Custom-rule demo

Open `ownergroup_mapping.csv` (Restricted, 72%, review required) → **Add New Rule** → *Owner group identity mappings*,
trigger **Field combination** (`ownergroup`, `internal_code`, `entity_alias`), target **Highly Restricted**, 95%,
Critical, human review on → **Preview Rule** (backend returns predicted Highly Restricted, 95%) → **Save and Apply**
(saves the rule, then reclassifies) → the dataset becomes Highly Restricted, the custom rule appears in the Evidence
Drawer and matched rules, and the rule creation + reclassification appear in the Audit Trail. **Make it Safe** then
recommends removing the direct mapping.

## Switching from mock mode to the real backend

1. Set `VITE_USE_MOCK_API=false` and point `VITE_API_BASE_URL` at the backend.
2. Implement the endpoints below. Response shapes must match `src/types`.
3. No component changes are required — only the `src/api/*` modules touch the network, and they already do when mock
   mode is off.

### Expected backend endpoints

```
GET    /api/stats/overview
POST   /api/sources/files
GET    /api/sources/files/:fileId
POST   /api/sources/postgresql/test
POST   /api/sources/postgresql
POST   /api/scans
GET    /api/scans/:scanId
GET    /api/datasets
GET    /api/datasets/:datasetId
GET    /api/datasets/:datasetId/fields
GET    /api/datasets/:datasetId/preview
POST   /api/datasets/:datasetId/reclassify
POST   /api/datasets/:datasetId/usage-check
POST   /api/datasets/:datasetId/remediation-plan
POST   /api/remediation-plans/:planId/preview
POST   /api/remediation-plans/:planId/submit-review
GET    /api/classification-rules
POST   /api/classification-rules
POST   /api/classification-rules/preview
PATCH  /api/classification-rules/:ruleId
DELETE /api/classification-rules/:ruleId
POST   /api/classifications/:classificationId/review
GET    /api/reviews/queue
GET    /api/policies
GET    /api/policies/:policyId
GET    /api/audit-events
GET    /api/datasets/:datasetId/data-passport
```

## Tests

`npm run test` runs Vitest + Testing Library (33 tests), covering: Add-Rule form validation, dynamic trigger fields,
Rule Preview loading/success/error, the Save-and-Apply request sequence, system rules being read-only, custom-rule
delete confirmation, catalogue filters, the Evidence Drawer rendering every evidence type, Make-it-Safe preview requests
after transformation changes, Review Queue actions, accessible drawers/forms, and backend error handling. No
classification logic is tested (there is none in the frontend).

## Deliberate frontend-only prototype limitations

- The backend is stubbed by an in-memory mock (`src/mocks`). It returns predefined responses and does **not** implement
  real profiling, classification, detectors, confidence, or remediation math.
- Reclassification/preview in mock mode apply the *declared* target tier of a saved rule; they do not infer anything.
- File uploads send only name/type/size — file contents are never read or parsed in the browser.
- "Download PDF"/"Export JSON" for the Data Passport are backend-generated in production; in mock mode the frontend
  stands in with a client-side blob download.
- The production bundle ships as a single chunk (Recharts is the largest dependency); route-level code-splitting can be
  added later if needed.
```
