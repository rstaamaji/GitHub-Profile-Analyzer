import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, BarChart3, Clock, FolderGit2, RefreshCw } from 'lucide-react';
import type {
  GitHubRepo,
  GitHubUser,
  RateLimitInfo,
  ViewState,
  ApiError,
  NavigationTab,
  CacheMeta,
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
import { RepoExplorer } from './components/profile/RepoExplorer';
import { RepoDetailView } from './components/profile/RepoDetailView';
import { AnalyticsContainer } from './components/analytics/AnalyticsContainer';
import { ProfileComparisonView } from './components/compare/ProfileComparisonView';



export function App() {
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [repoPage, setRepoPage] = useState<number>(1);
  const [hasMoreRepos, setHasMoreRepos] = useState<boolean>(false);
  const [isLoadingMoreRepos, setIsLoadingMoreRepos] = useState<boolean>(false);
  const [repoLoadError, setRepoLoadError] = useState<ApiError | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheMeta | null>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [error, setError] = useState<ApiError | null>(null);
  const [lastSearchedUser, setLastSearchedUser] = useState<string>('');
  // Reference to abort ongoing requests if a new one is launched or on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSearchUserRef = useRef<string>('');

  // Initial rate limit fetch on mount
  useEffect(() => {
    githubService.getRateLimit().then((info) => {
      if (info) setRateLimit(info);
    });

    const controllerRef = abortControllerRef;
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const handleSearch = useCallback(
    async (username: string, options?: { forceRefresh?: boolean }) => {
      const cleanUsername = username.trim().replace(/^@/, '');
      if (!cleanUsername) return;

      const forceRefresh = Boolean(options?.forceRefresh);

      // Prevent submitting the same username if already loading
      if (
        !forceRefresh &&
        viewState === 'loading' &&
        cleanUsername.toLowerCase() === activeSearchUserRef.current.toLowerCase()
      ) {
        return;
      }

      // Cancel any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (forceRefresh) {
        githubService.invalidateUserCache(cleanUsername);
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      activeSearchUserRef.current = cleanUsername;

      // Clear previous profile data immediately so stale data is never shown for the new username
      setCurrentUser(null);
      setRepos([]);
      setSelectedRepo(null);
      setHasMoreRepos(false);
      setRepoLoadError(null);
      setCacheMeta(null);
      setError(null);
      setViewState('loading');
      setLastSearchedUser(cleanUsername);
      setRepoPage(1);

      try {
        // 1. Fetch user profile
        const userRes = await githubService.getUser(cleanUsername, {
          signal: controller.signal,
          forceRefresh,
        });
        if (userRes.rateLimit) {
          setRateLimit(userRes.rateLimit);
        }

        setCurrentUser(userRes.data);

        // 2. Fetch initial batch of public repos (preserve user profile even if repo fetch fails)
        try {
          const reposRes = await githubService.getUserRepos(
            cleanUsername,
            30,
            1,
            'pushed',
            {
              signal: controller.signal,
              forceRefresh,
            }
          );
          if (reposRes.rateLimit) {
            setRateLimit(reposRes.rateLimit);
          }

          setRepos(reposRes.data);
          setRepoPage(1);
          setHasMoreRepos(
            Boolean(reposRes.hasNextPage) || reposRes.data.length < userRes.data.public_repos
          );
          setCacheMeta({
            fromCache: Boolean(userRes.fromCache || reposRes.fromCache),
            isStale: Boolean(userRes.isStale || reposRes.isStale),
            cachedAt: userRes.cachedAt || reposRes.cachedAt || Date.now(),
            staleReason: userRes.staleReason || reposRes.staleReason,
          });
        } catch (repoErr: unknown) {
          if (
            repoErr &&
            typeof repoErr === 'object' &&
            'name' in repoErr &&
            (repoErr as { name: string }).name === 'AbortError'
          ) {
            return;
          }
          const apiRepoErr = repoErr as ApiError;
          if (apiRepoErr.rateLimit) {
            setRateLimit(apiRepoErr.rateLimit);
          }
          setRepos([]);
          setRepoPage(0);
          setHasMoreRepos(userRes.data.public_repos > 0);
          setCacheMeta({
            fromCache: Boolean(userRes.fromCache),
            isStale: Boolean(userRes.isStale),
            cachedAt: userRes.cachedAt || Date.now(),
            staleReason: userRes.staleReason,
          });
          setRepoLoadError({
            message:
              apiRepoErr.message ||
              'Profile loaded, but initial repository list could not be retrieved.',
            status: apiRepoErr.status,
            resetTime: apiRepoErr.resetTime,
            isRateLimit: apiRepoErr.isRateLimit,
            isAuthError: apiRepoErr.isAuthError,
          });
        }

        setViewState('success');
        if (!forceRefresh) {
          setActiveTab('overview');
        }
      } catch (err: unknown) {
        // Ignore AbortError caused by new searches
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
          return;
        }

        const apiErr = err as ApiError;
        if (apiErr.rateLimit) {
          setRateLimit(apiErr.rateLimit);
        }
        setError({
          message: apiErr.message || 'Failed to retrieve profile data.',
          status: apiErr.status,
          resetTime: apiErr.resetTime,
          isRateLimit: apiErr.isRateLimit,
          isAuthError: apiErr.isAuthError,
        });
        setViewState('error');
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [viewState]
  );

  const handleLoadMoreRepos = useCallback(async () => {
    if (!currentUser || isLoadingMoreRepos || !hasMoreRepos) return;

    setIsLoadingMoreRepos(true);
    setRepoLoadError(null);
    const nextPage = repoPage + 1;

    try {
      const res = await githubService.getUserRepos(
        currentUser.login,
        30,
        nextPage,
        'pushed'
      );

      if (res.rateLimit) {
        setRateLimit(res.rateLimit);
      }

      setRepos((prev) => {
        // Prevent duplicate repository IDs when appending
        const existingIds = new Set(prev.map((r) => r.id));
        const newUniqueRepos = res.data.filter((r) => !existingIds.has(r.id));
        const combined = [...prev, ...newUniqueRepos];

        // Update whether there are further pages
        const remainingCount = currentUser.public_repos - combined.length;
        setHasMoreRepos(Boolean(res.hasNextPage) || (res.data.length === 30 && remainingCount > 0));
        return combined;
      });

      setRepoPage(nextPage);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.rateLimit) {
        setRateLimit(apiErr.rateLimit);
      }
      // Preserve existing loaded repositories and surface an inline error with retry
      setRepoLoadError({
        message: apiErr.message || 'Failed to load the next batch of repositories.',
        status: apiErr.status,
        resetTime: apiErr.resetTime,
        isRateLimit: apiErr.isRateLimit,
        isAuthError: apiErr.isAuthError,
      });
    } finally {
      setIsLoadingMoreRepos(false);
    }
  }, [currentUser, isLoadingMoreRepos, hasMoreRepos, repoPage]);

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeSearchUserRef.current = '';
    setCurrentUser(null);
    setRepos([]);
    setSelectedRepo(null);
    setRepoPage(1);
    setHasMoreRepos(false);
    setIsLoadingMoreRepos(false);
    setRepoLoadError(null);
    setCacheMeta(null);
    setViewState('idle');
    setError(null);
    setLastSearchedUser('');
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
      {/* Accessible Skip-to-Content Link for Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-600 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

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
      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-10 flex flex-col">
        {/* Single-Profile Search header container (shown on Overview, Repositories, and Analytics tabs) */}
        {activeTab !== 'compare' && (
          <section aria-label="Profile Search" className="mb-8 text-center">
            <SearchBar
              onSearch={handleSearch}
              isLoading={viewState === 'loading'}
              initialValue={lastSearchedUser}
              hasActiveData={Boolean(currentUser)}
              onClear={handleReset}
            />
          </section>
        )}

        {/* Dynamic content area */}
        <div className="flex-1 w-full">
          {/* Global Loading State for Single-Profile Tabs */}
          {activeTab !== 'compare' && viewState === 'loading' && (
            <LoadingState message={`Analyzing profile for @${lastSearchedUser}...`} />
          )}

          {/* Global Error State for Single-Profile Tabs */}
          {activeTab !== 'compare' && viewState === 'error' && (
            <ErrorState
              error={error}
              searchedUsername={lastSearchedUser}
              onRetry={lastSearchedUser ? () => handleSearch(lastSearchedUser, { forceRefresh: true }) : undefined}
              onReset={handleReset}
            />
          )}

          {/* Single-Profile Tab Views (Overview, Repositories, Analytics) */}
          {viewState !== 'loading' && viewState !== 'error' && (
            <>
              {/* Cache & Stale Data Status Strip with Manual Refresh Action */}
              {activeTab !== 'compare' && currentUser && cacheMeta && (
                <div className="w-full max-w-5xl mx-auto mb-6">
                  {cacheMeta.isStale ? (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-amber-950/35 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 text-amber-200">
                        <AlertTriangle
                          className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div>
                          <span className="font-semibold text-amber-100">
                            Showing Cached Data (May Be Outdated):{' '}
                          </span>
                          <span>
                            Live GitHub API refresh failed
                            {cacheMeta.staleReason ? ` (${cacheMeta.staleReason})` : ''}. Displaying
                            previously cached data from{' '}
                            <span className="font-mono text-amber-100">
                              {new Date(cacheMeta.cachedAt).toLocaleTimeString()}
                            </span>
                            .
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSearch(currentUser.login, { forceRefresh: true })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-amber-500/40 text-xs font-semibold text-amber-200 hover:text-white transition cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Refresh Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="px-3.5 py-2 rounded-lg bg-[#161b22] border border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Clock
                          className={`w-3.5 h-3.5 ${
                            cacheMeta.fromCache ? 'text-sky-400' : 'text-emerald-400'
                          }`}
                          aria-hidden="true"
                        />
                        <span>
                          {cacheMeta.fromCache ? (
                            <>
                              Loaded from cache for{' '}
                              <strong className="font-mono text-neutral-200">
                                @{currentUser.login}
                              </strong>{' '}
                              (cached at{' '}
                              <span className="font-mono text-neutral-300">
                                {new Date(cacheMeta.cachedAt).toLocaleTimeString()}
                              </span>
                              )
                            </>
                          ) : (
                            <>
                              Live GitHub API data for{' '}
                              <strong className="font-mono text-neutral-200">
                                @{currentUser.login}
                              </strong>{' '}
                              (updated at{' '}
                              <span className="font-mono text-neutral-300">
                                {new Date(cacheMeta.cachedAt).toLocaleTimeString()}
                              </span>
                              )
                            </>
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSearch(currentUser.login, { forceRefresh: true })}
                        title="Invalidate cached responses and fetch fresh data from GitHub API"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-medium text-neutral-200 hover:text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                        <span>Refresh data</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: OVERVIEW */}
              <div
                role="tabpanel"
                id="panel-overview"
                aria-labelledby="tab-overview"
                hidden={activeTab !== 'overview'}
              >
                {currentUser ? (
                  <ProfileOverview
                    user={currentUser}
                    repos={repos}
                    hasMoreRepos={hasMoreRepos}
                    isLoadingMore={isLoadingMoreRepos}
                    repoLoadError={repoLoadError}
                    onFetchMoreRepos={handleLoadMoreRepos}
                    onSelectRepo={(repo) => {
                      setSelectedRepo(repo);
                      setActiveTab('repositories');
                    }}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                  />
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
                {selectedRepo ? (
                  <RepoDetailView
                    owner={selectedRepo.owner?.login || currentUser?.login || lastSearchedUser}
                    repoName={selectedRepo.name}
                    onBack={() => setSelectedRepo(null)}
                    cachedRepo={selectedRepo}
                    onRateLimitUpdate={setRateLimit}
                  />
                ) : currentUser ? (
                  <RepoExplorer
                    repos={repos}
                    totalPublicRepos={currentUser.public_repos}
                    username={currentUser.login}
                    isLoadingMore={isLoadingMoreRepos}
                    hasMore={hasMoreRepos}
                    repoLoadError={repoLoadError}
                    onLoadMore={handleLoadMoreRepos}
                    onSelectRepo={(repo) => setSelectedRepo(repo)}
                  />
                ) : (
                  <TabPlaceholder
                    title="Repository Explorer"
                    badge="Ready upon search"
                    icon={FolderGit2}
                    description="Search, filter, and inspect public repositories for any GitHub user."
                    contextNote="Search for any developer above (e.g. torvalds or vercel) to load repositories."
                    plannedFeatures={[
                      'Search by repository name and description in real-time',
                      'Filter by programming language detected across repositories',
                      'Filter by source, forked, or archived status',
                      'Sort by stars, forks, name, or last push recency',
                      'Inspect complete repository details and safe README previews',
                    ]}
                  />
                )}
              </div>



              {/* TAB 3: ANALYTICS */}
              <div
                role="tabpanel"
                id="panel-analytics"
                aria-labelledby="tab-analytics"
                hidden={activeTab !== 'analytics'}
              >
                {currentUser ? (
                  <AnalyticsContainer
                    repos={repos}
                    totalPublicRepos={currentUser.public_repos}
                    username={currentUser.login}
                    hasMoreRepos={hasMoreRepos}
                    isLoadingMore={isLoadingMoreRepos}
                    onFetchMoreRepos={handleLoadMoreRepos}
                    onSelectRepo={(repo) => {
                      setSelectedRepo(repo);
                      setActiveTab('repositories');
                    }}
                  />
                ) : (
                  <TabPlaceholder
                    title="Programming Language & Activity Analytics"
                    badge="Ready upon search"
                    icon={BarChart3}
                    description="Analyze programming language shares and repository activity cadence for any public developer."
                    contextNote="Search for any developer above (e.g. torvalds, gaearon, or vercel) to view analytics."
                    plannedFeatures={[
                      'Accurate repository primary language distribution using Recharts',
                      'Repository activity cadence grouped across 30 days, 90 days, or 12 months',
                      'Clear distinction between code pushes and repository metadata updates',
                      'Full ranked breakdown with repository counts and exact percentages',
                    ]}
                  />
                )}
              </div>
            </>
          )}

          {/* TAB 4: COMPARE */}
          <div
            role="tabpanel"
            id="panel-compare"
            aria-labelledby="tab-compare"
            hidden={activeTab !== 'compare'}
          >
            <ProfileComparisonView
              activeUser={currentUser}
              activeRepos={repos}
              onRateLimitUpdate={setRateLimit}
            />
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}

export default App;

