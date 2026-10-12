import { useState, useEffect, useCallback } from 'react';
import type { GitHubRepo, GitHubUser, RateLimitInfo, ViewState, ApiError } from './types/github';
import { githubService } from './services/githubService';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SearchBar } from './components/search/SearchBar';
import { EmptyState } from './components/common/EmptyState';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';
import { ProfileOverview } from './components/profile/ProfileOverview';

export function App() {
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
      <Header rateLimit={rateLimit} onResetToHome={handleReset} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col">
        {/* Search header container */}
        <section className="mb-10 text-center">
          <SearchBar
            onSearch={handleSearch}
            isLoading={viewState === 'loading'}
            initialValue={lastSearchedUser}
          />
        </section>

        {/* Content area based on view state */}
        <div className="flex-1 flex flex-col items-center justify-start">
          {viewState === 'idle' && (
            <EmptyState onSelectSuggestion={handleSearch} />
          )}

          {viewState === 'loading' && (
            <LoadingState message={`Analyzing profile for @${lastSearchedUser}...`} />
          )}

          {viewState === 'error' && (
            <ErrorState
              error={error}
              onRetry={lastSearchedUser ? () => handleSearch(lastSearchedUser) : undefined}
            />
          )}

          {viewState === 'success' && currentUser && (
            <ProfileOverview user={currentUser} repos={repos} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
