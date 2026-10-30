# GitHub Profile Analyzer

[![CI](https://github.com/rstaamaji/GitHub-Profile-Analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/rstaamaji/GitHub-Profile-Analyzer/actions/workflows/ci.yml)

A developer analytics web application for inspecting and comparing public GitHub profiles and repositories using the [GitHub REST API v3](https://docs.github.com/en/rest). Built with React 19, TypeScript 6, Vite 8, and Tailwind CSS v4.

---

## Features

### 🔍 Profile Search
- Search any public GitHub username to instantly fetch live profile data
- Prevents duplicate in-flight requests; cancels stale requests on new search
- Clear error messages for: user not found (404), rate limit hit (403), and network failures

### 👤 Profile Overview
- Avatar, display name, bio, company, location, blog/website, and Twitter handle (when available)
- Public repository count, follower/following counts, public gists
- Account creation date and years-active summary
- Repository Insights panel: most-starred repo, most recently pushed repo, top programming language

### 📦 Advanced Search, Filtering & Repository Explorer
- Loads repositories in paginated batches with a **Load more** button and partial-coverage indicator.
- **Instant Search**: Real-time matching across repository name and description with one-click clear button and `Escape` key handling.
- **Multi-Dimensional Filtering**:
  * **Language Filter**: Dynamically aggregates detected languages present in the dataset, plus a dedicated **"No detected language"** option for unclassified repositories.
  * **Repository Type**: Filters across original sources, forks, or archived repositories.
  * **Minimum Stars**: Quick threshold filtering (All, 1+, 10+, 50+, 100+, 500+, 1,000+).
  * **Minimum Forks**: Forks threshold filtering (All, 1+, 5+, 10+, 50+, 100+).
  * **Activity Window**: Temporal filtering by push recency (Past 30 Days, Past 90 Days, Past 1 Year, Any Time).
- **8-Mode Deterministic Sorting**:
  * Last Updated (Newest / Oldest)
  * Newest Created / Oldest Created
  * Most Stars
  * Most Forks
  * Name (A–Z / Z–A)
  * Deterministic secondary tie-breaking by repository name ensures zero visual jumpiness when timestamps or counts are identical.
- **Active Filter Chips**: Visual badge bar displaying every active search and filter criterion with individual dismiss buttons and a global "Reset all filters" button.
- **Clear Match Denominator Counter**: Always displays exact counts: "Showing X matching of Y loaded repositories (account has Z total public)".
- **Resilient Empty State**: When zero repositories match active criteria, displays contextual feedback with quick reset and an inline "Load more repos" button to fetch additional public repositories from the GitHub API.

### 📄 Repository Detail View
- Opens a dedicated detail view per repository (click any repo card)
- Displays README rendered as sanitized HTML (via DOMPurify) with syntax highlighting via `<pre>` blocks
- Shows stars, forks, open issues, license, size, and creation/update dates
- Links directly to GitHub and supports manual refresh

### 📊 Analytics & Insights
- **Evidence-Based Dashboard Insights**: Dynamic profile analytics panel providing evidence-based metrics derived strictly from GitHub REST API data:
  * **Star Concentration & Reach**: Quantifies star distribution and flags dominant repositories versus evenly dispersed catalogs.
  * **Star Distribution Tiers**: Visual segmented bar categorizing repositories into 100+, 10–99, 1–9, and 0 star tiers.
  * **Community Engagement & Forks**: Calculates fork-to-star ratio and average forks per repository.
  * **Portfolio Architecture**: Composition breakdown of original source repositories versus forked and archived repositories.
  * **Maintenance Velocity**: Tracks 30-day and 90-day code push windows with exact day recency.
  * **Strict Methodological Disclosures**: Clear notices that metrics reflect public metadata and repository counts, without subjective inferences regarding code quality, line counts, or developer competency.
- **Repository Comparative Analytics**: In-depth multi-metric comparison across loaded repositories:
  * Interactive switching between Stargazers, Network Forks, Open Issues, and Repository Size (KB).
  * Scope controls for Top 5, Top 10, or All Loaded repositories.
  * Statistical summary banner calculating batch maximum, median, average (mean), and zero-value counts.
  * Visual comparative ratio bars normalized to peak values with keyboard-accessible navigation and direct repository detail inspection.
- **Language Analytics**: Donut chart of primary language distribution across loaded repositories with ranked breakdown table and explicit denominator disclosures.
- **Activity Analytics**: Bar chart of repository push and update activity across 30-day, 90-day, or 12-month windows with full accessible data table for screen readers.

### ⚖️ Profile Comparison
- Compare two public GitHub profiles side-by-side
- Metric comparison bars: public repos, followers, following, total stars (from loaded pages), total forks
- Per-metric difference badge and normalized visual bar
- Language distribution comparison with shared / unique language lists
- Load more repos per profile for more accurate star/fork totals
- Example quick-fill pairs included; swap A ↔ B button

### 📥 Data Export & Reporting (CSV/JSON)
- **Profile Summary (CSV)**: Generates RFC 4180 compliant CSV exports containing account metadata, bio, followers, repository metrics, and top programming languages.
- **Repository List (CSV)**: Exports loaded repositories with names, descriptions, URLs, stars, forks, open issues, license, and push timestamps.
- **Complete Report (JSON)**: Schema v1.0.0 structured JSON export bundling full user profile, aggregate statistics, and repository arrays with metadata timestamps.
- **Spreadsheet Security**: Implements CSV formula injection defense (neutralizing `=`, `+`, `-`, `@` triggers) and prepends UTF-8 Byte Order Mark (`\uFEFF`) for seamless UTF-8 character display in Microsoft Excel and LibreOffice Calc.
- **Lifecycle Resource Management**: Client-side object URLs (`URL.createObjectURL`) are safely revoked automatically after download initiation without persistent memory leaks or credentials in transit.
- **Multi-View Integration**: One-click accessible export controls integrated seamlessly into both Profile Overview and Repository Explorer.

### 🚀 Performance & Reliability
- **Comprehensive API Error Handling**: Graceful, user-friendly error recovery across all HTTP failure modes: 404 (Not Found), 403/429 (Rate Limit exceeded with local reset clock and remaining minutes estimate), 5xx (GitHub Service Outage / High Load), and unexpected/malformed JSON payloads.
- **Pre-Flight Input Validation**: Validates GitHub username format prior to network calls, saving valuable unauthenticated rate limit quota from being wasted on invalid inputs.
- **Race Condition & Sequence Defense**: Combines `AbortController` signal cancellation with an atomic request sequence token to guarantee stale responses never overwrite newer active queries.
- **State Recovery & Safe Snapshotting**: Automatically snapshots valid profile states before new searches, providing a 1-click "Restore Previous Profile" action if a newly queried username fails.
- **Granular Inline Retries**: Isolated retry mechanisms for paginated repository loading and repository README previews without full-page reloads.
- **Component Memoization**: `StatCard`, `RepoCard`, `RepositoryInsightsCards`, and `RecentActivityList` are memoized via `React.memo` and callback handlers are stabilized with `useCallback` to prevent cascading re-renders across list operations.
- **Code Splitting & Lazy Loading**: Heavy views (`RepoDetailView`, `AnalyticsContainer`, and `ProfileComparisonView`) are dynamically loaded on-demand via `React.lazy` and `Suspense`, dramatically accelerating initial page loads.
- **Vendor Chunk Splitting**: Vite Rollup `manualChunks` isolates `vendor-react`, `vendor-charts` (Recharts & D3), and `vendor-dompurify`. Reduces initial application JavaScript chunk from ~836 kB down to ~105 kB (~24 kB gzip), eliminating chunk size warnings.
- **TTL Caching & Bounded LRU Memory**: Dual-tier caching in memory and `sessionStorage` (profiles: 5 min, repo lists: 3 min, repo details: 5 min, README: 10 min, rate-limit: 30s) with strict capacity bounds (default 100 entries) and LRU eviction order preventing unbounded memory growth.
- **Proactive Expired Cache Pruning**: Independent cache pruning mechanism (`pruneExpiredEntries()`) that purges expired records across memory and storage tiers with automatic quota-exceeded recovery.
- **In-flight Request Deduplication**: Identical concurrent requests share one active network promise with isolated `AbortController` subscriber tracking across endpoints (including `/rate_limit`).
- **Stale-on-error Fallback**: If a fresh request fails due to rate limit, network disruption, or server downtime, cached data is surfaced safely with explicit stale freshness metadata.
- Automatic rate limit header extraction and live display in the header.
- Accessible keyboard navigation, screen reader support, and reduced-motion compliance throughout.

### 🧪 Testing
- 69 unit tests across 17 suites via Node.js built-in `--test` runner (using `tsx`).
- Covers: Advanced search & multi-filter combinations, unclassified language filtering (`language: 'none'`), minimum forks and activity date range filtering (30d/90d/1y), creation date sorting with tie-breaking, safe creation and repo timestamp parsing, dashboard analytics insights, median and concentration calculations, star distribution tier bucketing, repository comparative analytics sorting and ratios, CSV RFC 4180 escaping, spreadsheet formula injection defense, filename sanitization, UTF-8 BOM injection, profile summary and repository list CSV generation, schema-valid JSON generation, caching/deduplication, bounded cache LRU eviction, proactive expired cache pruning, rate-limit request deduplication, 5xx server errors, invalid JSON payloads, pre-flight input validation, `Retry-After` parsing, overview stats aggregation, language extraction, activity analytics, profile comparison, accessibility helpers, and username/URL security sanitizers.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Language | [TypeScript ~6.0](https://www.typescriptlang.org/) |
| Build Tool | [Vite 8](https://vitejs.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite` plugin |
| Charts | [Recharts 3](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Markdown Sanitization | [DOMPurify](https://github.com/cure53/DOMPurify) |
| Linter | [oxlint](https://oxc.rs/docs/guide/usage/linter) |
| Test Runner | Node.js built-in `--test` (via `tsx`) |

---

## Project Structure

```
src/
├── types/
│   └── github.ts                  # Strongly typed GitHub API entities & UI state models
├── services/
│   └── githubService.ts           # REST API client: caching, deduplication, stale fallback
├── utils/
│   ├── repoFilterSort.ts          # Pure filter/sort/search functions (fully tested)
│   ├── overviewAnalytics.ts       # Profile stats aggregation (stars, forks, most-starred)
│   ├── dashboardInsights.ts       # Evidence-based dashboard insights & star tiers
│   ├── repoComparisonAnalytics.ts # Repository comparative metrics & ratio scaling
│   ├── languageAnalytics.ts       # Language distribution calculations
│   ├── activityAnalytics.ts       # Push/update activity bucketing for charts
│   ├── comparisonAnalytics.ts     # Side-by-side profile metric computation
│   ├── exportUtils.ts             # CSV/JSON generation, RFC 4180 escaping, BOM injection
│   └── accessibility.ts           # Focus management & ARIA helpers
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Sticky header with live rate-limit badge
│   │   ├── Navigation.tsx         # Tab bar: Overview / Repositories / Analytics / Compare
│   │   └── Footer.tsx             # App footer
│   ├── common/
│   │   ├── ExportMenu.tsx         # Dropdown menu for CSV & JSON downloads with safe blob lifecycle
│   │   ├── LoadingState.tsx       # Skeleton placeholders
│   │   ├── ErrorState.tsx         # 404 / 403 / network error recovery UI
│   │   ├── EmptyState.tsx         # Landing screen with example usernames
│   │   ├── MarkdownRenderer.tsx   # Sanitized README renderer
│   │   └── TabPlaceholder.tsx     # Placeholder for unloaded tabs
│   ├── search/
│   │   └── SearchBar.tsx          # Username input with debounce-free submit
│   ├── profile/
│   │   ├── ProfileOverview.tsx    # Overview tab container
│   │   ├── ProfileHeader.tsx      # Avatar, bio, metadata
│   │   ├── DashboardInsightsPanel.tsx   # Evidence-based profile metrics & star tiers
│   │   ├── StatCard.tsx           # Reusable metric card
│   │   ├── RepoExplorer.tsx       # Repositories tab: search, filter, sort, pagination
│   │   ├── RepoCard.tsx           # Individual repository card
│   │   ├── RepoDetailView.tsx     # Full repository detail + README
│   │   ├── RepoList.tsx           # Repository list wrapper
│   │   ├── RepositoryInsightsCards.tsx  # Most starred / recently pushed / top language
│   │   └── RecentActivityList.tsx # Recent push activity list
│   ├── analytics/
│   │   ├── AnalyticsContainer.tsx # Analytics tab container
│   │   ├── LanguageAnalyticsView.tsx    # Language donut chart + table
│   │   ├── LanguageChart.tsx      # Recharts donut chart
│   │   ├── ActivityAnalyticsView.tsx    # Activity bar chart + controls
│   │   ├── ActivityChart.tsx      # Recharts bar chart
│   │   └── RepoComparisonView.tsx # Repository comparative analytics view
│   └── compare/
│       ├── ProfileComparisonView.tsx    # Comparison form + metric rows
│       ├── ProfileCompareCard.tsx       # Per-profile comparison card
│       └── LanguageComparisonSection.tsx # Language overlap visualization
├── App.tsx                        # Root state machine (idle | loading | success | error)
├── index.css                      # Tailwind v4 directives & base styles
└── main.tsx                       # React entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or v20+ ([download](https://nodejs.org/))
- **npm** (bundled with Node.js) — or pnpm / yarn if preferred

### Installation

```bash
# Clone the repository
git clone https://github.com/rstaamaji/GitHub-Profile-Analyzer.git
cd "GitHub-Profile-Analyzer"

# Install dependencies
npm install
```

### Environment Configuration

This application queries **public** GitHub REST API endpoints without requiring authentication. No API token or `.env` file is needed to run the app.

> **Important:** The `.env.example` file contains no active variables. Any `VITE_*` variable is compiled directly into the client bundle and is visible to all users — do **not** store GitHub Personal Access Tokens (PATs) or any secret in a `VITE_*` variable.

The unauthenticated rate limit is **60 requests per hour per IP address**, shared across all GitHub API calls from your network. The app displays remaining rate limit in real time in the header.

### Running Locally

```bash
npm run dev
```

Opens the development server at **http://localhost:5173** with hot module replacement.

---

## Available Scripts

```bash
# Start development server (HMR enabled)
npm run dev

# Run all 26 unit tests
npm test

# Run linter (oxlint)
npm run lint

# Type-check and build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## Continuous Integration (CI)

This repository enforces automated quality checks on every `push` to `main` and on all `pull_request` events targeting `main` via GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

- **Environment**: Ubuntu Latest running Node.js LTS matrix (`20.x`, `22.x`).
- **Reproducible Install**: `npm ci` leveraging npm dependency cache.
- **Linter**: `npm run lint` ([oxlint](https://oxc.rs/)) ensuring code style compliance.
- **Unit Tests**: `npm test` running 26 unit tests via Node.js native test runner.
- **Production Build**: `npm run build` validating TypeScript compilation (`tsc -b`) and Vite asset bundling.
- **Security**: Adheres to least privilege (`contents: read`), zero token secrets required, with concurrency cancellation for outdated runs.

---

## How to Use

### Searching a Profile
1. Type a GitHub username in the search bar (with or without `@` prefix).
2. Press **Enter** or click the search button.
3. The app fetches the user profile, then loads the first batch of repositories.

### Exploring Repositories
- Navigate to the **Repositories** tab.
- Use the search box to filter by name or description (instant, no network request).
- Use the **Language**, **Type**, and **Stars** dropdowns to combine filters.
- Change the sort order with the **Sort** dropdown.
- Click **Load more repositories** to fetch additional pages.
- Click any repository card to open the detail view with its README.

### Viewing Analytics
- Navigate to the **Analytics** tab.
- **Language Analytics**: see the distribution of primary languages across all loaded repositories.
- **Activity Analytics**: view push/update cadence over selectable time ranges.

### Comparing Two Profiles
- Navigate to the **Compare** tab.
- Enter two different GitHub usernames in the Developer A and Developer B fields.
- Click **Compare** to fetch both profiles simultaneously.
- Use **Load more repos** on each profile card to improve star/fork totals.
- Click **↔ Swap** to exchange the two usernames.

---

## GitHub API Limitations

| Limitation | Details |
|---|---|
| Rate limit (unauthenticated) | 60 requests/hour per IP |
| Repositories per page | Up to 100 per request |
| Pagination | App loads repos in batches; very large accounts (1000+ repos) require many page loads |
| Star totals | Calculated from loaded repository pages only — labeled "partial" if pagination is incomplete |
| Private repositories | Not accessible — only public repositories and profile data are returned |
| Real-time data | GitHub API responses may have a short propagation delay for recent changes |

---

## Troubleshooting

### "Rate limit exceeded" (403 error)
The unauthenticated limit is 60 requests/hour shared across your IP. Wait for the limit to reset (shown as a timestamp in the error message), or use a different network.

### Profile not found (404)
The username does not exist on GitHub, or it may have been renamed or deleted. Check the spelling.

### "Data may be outdated" banner
The latest request failed but a cached response is available. The app displays cached data with a warning. Retry when your connection is restored or rate limit resets.

### Repository count mismatch
The profile stat shows total public repos from the API, but repos are loaded in batches. Repositories loaded may be fewer until all pages are fetched.

### Large bundle size warning during build
Recharts (the charting library) contributes most of the bundle. This is a known trade-off. The warning does not affect functionality.

---

## Security & Privacy

This application is built with security-conscious defaults for client-side open-source intelligence:

- **Zero Client-Side Secrets**: All GitHub REST API calls target public endpoints without embedding Personal Access Tokens (PATs) or private credentials into browser bundles.
- **Dependency Audit Clean**: Continually validated via `npm audit` with **0 known vulnerabilities** across both direct and transitive dependencies.
- **Automated Security in CI**: Every PR and push to `main` executes `npm audit --audit-level=high` before testing and compilation.
- **XSS & Content Sanitization**:
  - Repository README markdown is strictly sanitized via [DOMPurify](https://github.com/cure53/DOMPurify) with forbidden script/object tags, blocked inline event handlers, and restricted URI schemes.
  - External user website and blog URLs from GitHub profiles are parsed and validated to block dangerous schemes (`javascript:`, `data:`, `vbscript:`, `file:`).
- **Username Input Constraints**: Search inputs are sanitized to enforce GitHub naming conventions, rejecting malformed, injected, or out-of-spec queries.

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes, then run lint and tests:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
4. Open a pull request against `main` with a clear description.

Please do not commit `.env` files or secrets.

---

## License

This project is not currently published under an open-source license. All rights reserved by the author.

---

## Screenshots

> Screenshots will be added in a follow-up. To capture representative views, consider recording the following screens:
> - **Home / Search**: empty state with example usernames
> - **Profile Overview**: stat cards, repository insights, recent activity
> - **Repositories Tab**: filter bar, repo cards, detail view with README
> - **Analytics Tab**: language donut chart and activity bar chart
> - **Compare Tab**: side-by-side profile metrics with comparison bars
