import { useState, useEffect, useCallback } from 'react';
import { BarChart3, GitCompare, FolderGit2 } from 'lucide-react';
import type {
  GitHubRepo,
  GitHubUser,
  RateLimitInfo,
  ViewState,
  ApiError,
  NavigationTab,
} from './types/github';
import { githubService } from './services/githubService';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { SearchBar } from './components/search/SearchBar';
import { EmptyState } from './components/common/EmptyState';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';
import { TabPlaceholder } from './components/common/TabPlaceholder';
import { ProfileOverview } from './components/profile/ProfileOverview';
import { RepoList } from './components/profile/RepoList';

export function App() {
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [error, setError] = useState<ApiError | null>(null);
  const [lastSearchedUser, setLastSearchedUser] = useState<string>('');

  // Initial rate limit fetch on mount
  useEffect(() => {
    githubService.getRateLimit().then((info) => {
      if (info) setRateLimit(info);
    });
  }, []);

  const handleSearch = useCallback(async (username: string) => {
    if (!username.trim()) return;

    setViewState('loading');
    setError(null);
    setLastSearchedUser(username);

    try {
      // 1. Fetch user profile
      const userRes = await githubService.getUser(username);
      if (userRes.rateLimit) {
        setRateLimit(userRes.rateLimit);
      }

      // 2. Fetch recent public repos
      const reposRes = await githubService.getUserRepos(username, 30);
      if (reposRes.rateLimit) {
        setRateLimit(reposRes.rateLimit);
      }

      setCurrentUser(userRes.data);
      setRepos(reposRes.data);
      setViewState('success');
      // Default to overview on fresh search
      setActiveTab('overview');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || 'Failed to retrieve profile data.',
        status: apiErr.status,
        resetTime: apiErr.resetTime,
      });
      setViewState('error');
    }
  }, []);

  const handleReset = () => {
    setCurrentUser(null);
    setRepos([]);
    setViewState('idle');
    setError(null);
    setLastSearchedUser('');
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
      {/* 1. Header with live rate limit status */}
      <Header
        rateLimit={rateLimit}
        onResetToHome={handleReset}
        activeUsername={currentUser?.login}
      />

      {/* 2. Top Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reposCount={repos.length}
        hasUserLoaded={Boolean(currentUser)}
      />

      {/* 3. Main content shell */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-10 flex flex-col">
        {/* Search header container */}
        <section aria-label="Profile Search" className="mb-8 text-center">
          <SearchBar
            onSearch={handleSearch}
            isLoading={viewState === 'loading'}
            initialValue={lastSearchedUser}
            hasActiveData={Boolean(currentUser)}
            onClear={handleReset}
          />
        </section>

        {/* Dynamic content area */}
        <div className="flex-1 w-full">
          {/* Global Loading State */}
          {viewState === 'loading' && (
            <LoadingState message={`Analyzing profile for @${lastSearchedUser}...`} />
          )}

          {/* Global Error State */}
          {viewState === 'error' && (
            <ErrorState
              error={error}
              onRetry={lastSearchedUser ? () => handleSearch(lastSearchedUser) : undefined}
            />
          )}

          {/* Tab Views */}
          {viewState !== 'loading' && viewState !== 'error' && (
            <>
              {/* TAB 1: OVERVIEW */}
              <div
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                hidden={activeTab !== 'overview'}
              >
                {currentUser ? (
                  <ProfileOverview user={currentUser} repos={repos} />
                ) : (
                  <EmptyState onSelectSuggestion={handleSearch} />
                )}
              </div>

              {/* TAB 2: REPOSITORIES */}
              <div
                role="tabpanel"
                id="panel-repositories"
                aria-labelledby="tab-repositories"
                hidden={activeTab !== 'repositories'}
              >
                {currentUser ? (
                  <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
                      <div>
                        <h2 className="text-lg font-bold text-neutral-100">
                          Repositories for @{currentUser.login}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Showing {repos.length} repositories sorted by recent push activity
                        </p>
                      </div>
                    </div>
                    <RepoList repos={repos} />
                  </div>
                ) : (
                  <TabPlaceholder
                    title="Repository Deep-Dive"
                    badge="Ready upon search"
                    icon={FolderGit2}
                    description="Inspect and filter public repositories for any GitHub user."
                    contextNote="Search for any developer above (e.g. torvalds or vercel) to load repositories."
                    plannedFeatures={[
                      'Sort repositories by stars, forks, or latest update',
                      'Filter by primary programming language',
                      'Inspect fork vs source repository ratios',
                      'Direct link to GitHub issues and discussions',
                    ]}
                  />
                )}
              </div>

              {/* TAB 3: ANALYTICS (Transparent placeholder) */}
              <div
                role="tabpanel"
                id="panel-analytics"
                aria-labelledby="tab-analytics"
                hidden={activeTab !== 'analytics'}
              >
                <TabPlaceholder
                  title="Developer Analytics & Visualizations"
                  badge="Stage 3 Implementation"
                  icon={BarChart3}
                  description="Language composition breakdowns, repository activity patterns, and stargazer distribution graphs."
                  contextNote={
                    currentUser
                      ? `Recharts data structures will be bound to @${currentUser.login}'s authentic repository payload.`
                      : 'Search a developer above to analyze language distributions once charts are connected.'
                  }
                  plannedFeatures={[
                    'Language distribution donut chart powered by Recharts',
                    'Stars per repository bar distribution',
                    'Commit recency and repository momentum score',
                    'Aggregated byte counts and top open-source licensing',
                  ]}
                />
              </div>

              {/* TAB 4: COMPARE (Transparent placeholder) */}
              <div
                role="tabpanel"
                id="panel-compare"
                aria-labelledby="tab-compare"
                hidden={activeTab !== 'compare'}
              >
                <TabPlaceholder
                  title="Developer Profile Comparison"
                  badge="Planned Stage 4"
                  icon={GitCompare}
                  description="Side-by-side metric comparison between two public GitHub accounts."
                  contextNote="Will query two distinct GitHub user payloads and correlate follower counts, star totals, and language footprints side-by-side without mock numbers."
                  plannedFeatures={[
                    'Dual-user search input with comparative metrics',
                    'Radar chart of language specialization',
                    'Repository volume and star velocity comparison',
                    'Export comparative summary report as Markdown',
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

export default App;

