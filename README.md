# GitHub Profile Analyzer

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

### 📦 Repository Explorer
- Loads repositories in paginated batches with a **Load more** button
- **Search** repositories by name and description (client-side, instant)
- **Filter** by programming language, repository type (original / fork / archived), and minimum star count
- **Sort** by: Last Updated (newest / oldest), Most Stars, Most Forks, Name A–Z / Z–A
- Null-safe sorting — repositories with missing dates or zero stars handled correctly
- Result count display and filter reset button

### 📄 Repository Detail View
- Opens a dedicated detail view per repository (click any repo card)
- Displays README rendered as sanitized HTML (via DOMPurify) with syntax highlighting via `<pre>` blocks
- Shows stars, forks, open issues, license, size, and creation/update dates
- Links directly to GitHub and supports manual refresh

### 📊 Analytics
- **Language Analytics**: donut chart of primary language distribution across loaded repositories, with a ranked breakdown table
- **Activity Analytics**: bar chart of repository push/update activity by time period (6 months / 12 months / 3 years), with full accessible data table for screen readers

### ⚖️ Profile Comparison
- Compare two public GitHub profiles side-by-side
- Metric comparison bars: public repos, followers, following, total stars (from loaded pages), total forks
- Per-metric difference badge and normalized visual bar
- Language distribution comparison with shared / unique language lists
- Load more repos per profile for more accurate star/fork totals
- Example quick-fill pairs included; swap A ↔ B button

### 🚀 Performance & Reliability
- **TTL caching** in `sessionStorage` (profiles: 5 min, repo lists: 3 min, repo details: 5 min, README: 10 min)
- **In-flight request deduplication** — identical concurrent requests share one network call
- **Stale-on-error fallback** — if a fresh request fails but a cache entry exists, the cached data is shown with a clear "data may be outdated" label
- Automatic rate limit header extraction and live display in the header
- Accessible keyboard navigation, screen reader support, and reduced-motion compliance throughout

### 🧪 Testing
- 26 unit tests via Node.js built-in `--test` runner (no external framework required)
- Covers: overview stats aggregation, repository filter/sort/search, language extraction, null/edge-case handling

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
│   ├── languageAnalytics.ts       # Language distribution calculations
│   ├── activityAnalytics.ts       # Push/update activity bucketing for charts
│   ├── comparisonAnalytics.ts     # Side-by-side profile metric computation
│   └── accessibility.ts           # Focus management & ARIA helpers
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Sticky header with live rate-limit badge
│   │   ├── Navigation.tsx         # Tab bar: Overview / Repositories / Analytics / Compare
│   │   └── Footer.tsx             # App footer
│   ├── common/
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
│   │   └── ActivityChart.tsx      # Recharts bar chart
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
