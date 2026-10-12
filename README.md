# GitHub Profile Analyzer

A developer analytics web application for inspecting public GitHub profiles and repositories using the GitHub REST API. Built with React 19, TypeScript, Vite, and Tailwind CSS.

---

## Features

- **Public Profile Intelligence**: Inspect developer details including bio, company, location, social links, and account age.
- **Repository Momentum**: Load recent public repositories with primary languages, stargazer counts, fork counts, and push recency.
- **Strictly Real Metrics**: Computes statistics directly from raw GitHub API responses without fabricated analytics or mock data.
- **Rate Limit Transparency**: Real-time GitHub REST API rate-limit monitoring (60 req/hr unauthenticated, or up to 5,000 req/hr with a token).
- **Graceful Error States**: Built-in state machine providing distinctive, user-friendly feedback for not-found profiles (404), rate limit thresholds (403), network drops, and empty repository lists.
- **Modular Service Layer**: Decoupled API abstraction (`src/services/githubService.ts`) ready for future backend server or proxy integration.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts / Viz Ready**: [Recharts](https://recharts.org/) installed for next-stage distribution graphs
- **Linter**: [oxlint](https://oxc.rs/)

---

## Architecture & Project Structure

```text
src/
├── types/
│   └── github.ts             # Strongly typed GitHub entities & API state models
├── services/
│   └── githubService.ts      # Dedicated REST API client with header and rate-limit extraction
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Top navigation with live rate limit status badge
│   │   └── Footer.tsx        # Responsive product footer
│   ├── common/
│   │   ├── LoadingState.tsx  # Responsive skeleton placeholders
│   │   ├── ErrorState.tsx    # 404, 403 rate-limit, and network recovery UI
│   │   └── EmptyState.tsx    # Initial landing UI with quick developer suggestions
│   ├── search/
│   │   └── SearchBar.tsx     # Username query input with quick submission
│   └── profile/
│       ├── ProfileHeader.tsx # Developer biography, location, company, and links
│       ├── StatCard.tsx      # Reusable metrics card
│       ├── RepoList.tsx      # Public repositories list with language badges and metrics
│       └── ProfileOverview.tsx # Overview container coordinating metrics calculations
├── App.tsx                   # Main state machine (idle | loading | success | error)
├── index.css                 # Base theme styles and Tailwind v4 directives
└── main.tsx                  # React entry point
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ or v20+)
- npm or pnpm / yarn

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd "GitHub Profile Analyzer"

# 2. Install dependencies
npm install
```

### Environment Configuration (Optional)

Unauthenticated requests to the GitHub REST API are limited to 60 requests per hour per IP. To increase this limit to 5,000 requests per hour, create a `.env` file:

```bash
cp .env.example .env
```

Add your personal GitHub token:
```env
VITE_GITHUB_TOKEN=ghp_yourPersonalAccessTokenHere
```

### Running Locally

```bash
# Start local development server
npm run dev
```

The application will be served at `http://localhost:5173`.

### Quality & Build Checks

```bash
# Run lint check
npm run lint

# Run TypeScript compilation and production build
npm run build

# Preview production build locally
npm run preview
```

---

## Next Implementation Stage

1. **Visual Language & Commit Distribution**: Implement language breakdown charts and activity breakdowns using Recharts in `ProfileOverview`.
2. **Repository Filtering & Sorting**: Add client-side filters for primary language, minimum stars, forks, and sort by star count vs last updated.
3. **Pagination & Expanded Batches**: Support paging beyond the initial 30 repositories for high-volume contributors.
4. **Export Report**: Provide a clean JSON or Markdown export of the analyzed developer summary.
