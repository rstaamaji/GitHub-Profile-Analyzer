import { useState, useEffect, useCallback, useRef } from 'react';
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
import { RepoExplorer } from './components/profile/RepoExplorer';
import { RepoDetailView } from './components/profile/RepoDetailView';
import { LanguageAnalyticsView } from './components/analytics/LanguageAnalyticsView';


export function App() {
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [repoPage, setRepoPage] = useState<number>(1);
  const [hasMoreRepos, setHasMoreRepos] = useState<boolean>(false);
  const [isLoadingMoreRepos, setIsLoadingMoreRepos] = useState<boolean>(false);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
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

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSearch = useCallback(async (username: string) => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return;

    // Prevent submitting the same username if already loading
    if (viewState === 'loading' && cleanUsername.toLowerCase() === activeSearchUserRef.current.toLowerCase()) {
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeSearchUserRef.current = cleanUsername;

    setViewState('loading');
    setError(null);
    setSelectedRepo(null);
    setLastSearchedUser(cleanUsername);
    setRepoPage(1);


    try {
      // 1. Fetch user profile
      const userRes = await githubService.getUser(cleanUsername, controller.signal);
      if (userRes.rateLimit) {
        setRateLimit(userRes.rateLimit);
      }

      // 2. Fetch initial batch of public repos
      const reposRes = await githubService.getUserRepos(cleanUsername, 30, 1, 'pushed', controller.signal);
      if (reposRes.rateLimit) {
        setRateLimit(reposRes.rateLimit);
      }

      setCurrentUser(userRes.data);
      setRepos(reposRes.data);
      // Determine if there are more repositories to fetch
      setHasMoreRepos(Boolean(reposRes.hasNextPage) || reposRes.data.length < userRes.data.public_repos);
      setViewState('success');
      setActiveTab('overview');
    } catch (err: unknown) {
      // Ignore AbortError caused by new searches
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
        return;
      }

      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || 'Failed to retrieve profile data.',
        status: apiErr.status,
        resetTime: apiErr.resetTime,
      });
      setViewState('error');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [viewState]);

  const handleLoadMoreRepos = useCallback(async () => {
    if (!currentUser || isLoadingMoreRepos || !hasMoreRepos) return;

    setIsLoadingMoreRepos(true);
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
      // Do not replace the existing page view, but notify in state if appropriate
      console.error('Failed to load more repositories:', apiErr.message);
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
                {selectedRepo ? (
                  <RepoDetailView
                    owner={selectedRepo.owner?.login || currentUser?.login || lastSearchedUser}
                    repoName={selectedRepo.name}
                    onBack={() => setSelectedRepo(null)}
                    cachedRepo={selectedRepo}
                  />
                ) : currentUser ? (
                  <RepoExplorer
                    repos={repos}
                    totalPublicRepos={currentUser.public_repos}
                    username={currentUser.login}
                    isLoadingMore={isLoadingMoreRepos}
                    hasMore={hasMoreRepos}
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
                  <LanguageAnalyticsView
                    repos={repos}
                    totalPublicRepos={currentUser.public_repos}
                    username={currentUser.login}
                    hasMoreRepos={hasMoreRepos}
                    isLoadingMore={isLoadingMoreRepos}
                    onFetchMoreRepos={handleLoadMoreRepos}
                  />
                ) : (
                  <TabPlaceholder
                    title="Programming Language Analytics"
                    badge="Ready upon search"
                    icon={BarChart3}
                    description="Analyze programming language distribution and repository-count breakdown for any public developer."
                    contextNote="Search for any developer above (e.g. torvalds, gaearon, or vercel) to view language analytics."
                    plannedFeatures={[
                      'Accurate repository primary language distribution using Recharts',
                      'Excludes forked repositories by default to measure original author works',
                      'Full ranked breakdown with repository counts and exact percentages',
                      'Clear notification of partial vs complete dataset coverage',
                    ]}
                  />
                )}
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

