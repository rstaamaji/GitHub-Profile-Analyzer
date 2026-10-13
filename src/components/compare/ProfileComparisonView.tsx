import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GitCompare,
  ArrowLeftRight,
  Search,
  AlertCircle,
  Scale,
  Info,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type {
  ApiError,
  ComparedProfileSlot,
  GitHubRepo,
  GitHubUser,
  RateLimitInfo,
} from '../../types/github';
import { githubService } from '../../services/githubService';
import {
  calculateProfileComparison,
  validateComparisonInputs,
} from '../../utils/comparisonAnalytics';
import { ProfileCompareCard } from './ProfileCompareCard';
import { LanguageComparisonSection } from './LanguageComparisonSection';

interface ProfileComparisonViewProps {
  activeUser?: GitHubUser | null;
  activeRepos?: GitHubRepo[];
  onRateLimitUpdate?: (info: RateLimitInfo) => void;
}

const EXAMPLE_PAIRS: Array<{ label: string; userA: string; userB: string; note: string }> = [
  {
    label: 'torvalds vs gvanrossum',
    userA: 'torvalds',
    userB: 'gvanrossum',
    note: 'Systems & language creators',
  },
  {
    label: 'gaearon vs yyx990803',
    userA: 'gaearon',
    userB: 'yyx990803',
    note: 'Frontend ecosystem authors',
  },
  {
    label: 'sindresorhus vs tj',
    userA: 'sindresorhus',
    userB: 'tj',
    note: 'Open-source library maintainers',
  },
];

const INITIAL_SLOT: ComparedProfileSlot = {
  username: '',
  status: 'idle',
  user: null,
  repos: [],
  page: 1,
  hasMoreRepos: false,
  isLoadingMore: false,
  error: null,
};

export const ProfileComparisonView: React.FC<ProfileComparisonViewProps> = ({
  activeUser = null,
  activeRepos = [],
  onRateLimitUpdate,
}) => {
  const [inputA, setInputA] = useState<string>('');
  const [inputB, setInputB] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [excludeForks, setExcludeForks] = useState<boolean>(true);

  const [slotA, setSlotA] = useState<ComparedProfileSlot>(INITIAL_SLOT);
  const [slotB, setSlotB] = useState<ComparedProfileSlot>(INITIAL_SLOT);

  // AbortControllers & request tokens per slot to prevent stale responses
  const abortControllerARef = useRef<AbortController | null>(null);
  const abortControllerBRef = useRef<AbortController | null>(null);
  const requestTokenARef = useRef<number>(0);
  const requestTokenBRef = useRef<number>(0);

  // Cleanup in-flight requests on unmount
  useEffect(() => {
    const refA = abortControllerARef;
    const refB = abortControllerBRef;
    return () => {
      refA.current?.abort();
      refB.current?.abort();
    };
  }, []);

  /**
   * Fetches a single profile slot (A or B), utilizing the centralized githubService cache
   * (with TTL + stale fallback) and clearing previous slot data immediately so stale profiles
   * from a different username are never shown.
   */
  const fetchSlotProfile = useCallback(
    async (
      side: 'A' | 'B',
      rawUsername: string,
      options: { bypassCache?: boolean } = {}
    ): Promise<void> => {
      const cleanUsername = rawUsername.trim().replace(/^@/, '');
      const normalizedKey = cleanUsername.toLowerCase();
      const forceRefresh = Boolean(options.bypassCache);
      const setSlot = side === 'A' ? setSlotA : setSlotB;
      const abortRef = side === 'A' ? abortControllerARef : abortControllerBRef;
      const tokenRef = side === 'A' ? requestTokenARef : requestTokenBRef;

      // Cancel any previous in-flight request for this side
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      const currentToken = ++tokenRef.current;

      if (forceRefresh) {
        githubService.invalidateUserCache(cleanUsername);
      }

      // 1. Reuse the currently active main-app profile if it already has all public repos loaded
      if (
        !forceRefresh &&
        activeUser &&
        activeUser.login.toLowerCase() === normalizedKey &&
        activeRepos.length >= activeUser.public_repos
      ) {
        setSlot({
          username: activeUser.login,
          status: 'success',
          user: activeUser,
          repos: activeRepos,
          page: 1,
          hasMoreRepos: false,
          isLoadingMore: false,
          error: null,
          fromCache: true,
          isStale: false,
          cachedAt: Date.now(),
        });
        return;
      }

      // 2. Clear old profile data immediately and enter loading state
      const controller = new AbortController();
      abortRef.current = controller;

      setSlot({
        username: cleanUsername,
        status: 'loading',
        user: null,
        repos: [],
        page: 1,
        hasMoreRepos: false,
        isLoadingMore: false,
        error: null,
      });

      try {
        const userRes = await githubService.getUser(cleanUsername, {
          signal: controller.signal,
          forceRefresh,
        });
        if (userRes.rateLimit && onRateLimitUpdate) {
          onRateLimitUpdate(userRes.rateLimit);
        }

        // Fetch up to 100 repositories in a single API call to maximize accuracy and minimize rate limit usage
        const reposRes = await githubService.getUserRepos(
          cleanUsername,
          100,
          1,
          'pushed',
          {
            signal: controller.signal,
            forceRefresh,
          }
        );
        if (reposRes.rateLimit && onRateLimitUpdate) {
          onRateLimitUpdate(reposRes.rateLimit);
        }

        // Verify this response is still the latest request for this slot
        if (tokenRef.current !== currentToken) return;

        const hasMore =
          Boolean(reposRes.hasNextPage) || reposRes.data.length < userRes.data.public_repos;

        setSlot({
          username: userRes.data.login,
          status: 'success',
          user: userRes.data,
          repos: reposRes.data,
          page: 1,
          hasMoreRepos: hasMore,
          isLoadingMore: false,
          error: null,
          fromCache: Boolean(userRes.fromCache || reposRes.fromCache),
          isStale: Boolean(userRes.isStale || reposRes.isStale),
          cachedAt: userRes.cachedAt || reposRes.cachedAt || Date.now(),
          staleReason: userRes.staleReason || reposRes.staleReason,
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err as { name: string }).name === 'AbortError'
        ) {
          return;
        }
        if (tokenRef.current !== currentToken) return;

        const apiErr = err as ApiError;
        if (apiErr.rateLimit && onRateLimitUpdate) {
          onRateLimitUpdate(apiErr.rateLimit);
        }
        setSlot({
          username: cleanUsername,
          status: 'error',
          user: null,
          repos: [],
          page: 1,
          hasMoreRepos: false,
          isLoadingMore: false,
          error: {
            message: apiErr.message || `Failed to retrieve data for @${cleanUsername}.`,
            status: apiErr.status,
            resetTime: apiErr.resetTime,
            isRateLimit: apiErr.isRateLimit,
            isAuthError: apiErr.isAuthError,
          },
        });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [activeRepos, activeUser, onRateLimitUpdate]
  );

  /**
   * Loads the next page (100 repos) for either Developer A or Developer B when pagination is partial.
   */
  const handleLoadMoreForSide = useCallback(
    async (side: 'A' | 'B') => {
      const targetSlot = side === 'A' ? slotA : slotB;
      const setSlot = side === 'A' ? setSlotA : setSlotB;

      if (!targetSlot.user || targetSlot.isLoadingMore || !targetSlot.hasMoreRepos) {
        return;
      }

      const nextPage = targetSlot.page + 1;
      const login = targetSlot.user.login;
      const totalPublic = targetSlot.user.public_repos;

      setSlot((prev) => ({ ...prev, isLoadingMore: true }));

      try {
        const res = await githubService.getUserRepos(login, 100, nextPage, 'pushed');
        if (res.rateLimit && onRateLimitUpdate) {
          onRateLimitUpdate(res.rateLimit);
        }

        setSlot((prev) => {
          if (!prev.user || prev.user.login.toLowerCase() !== login.toLowerCase()) {
            return prev;
          }
          const existingIds = new Set(prev.repos.map((r) => r.id));
          const uniqueNew = res.data.filter((r) => !existingIds.has(r.id));
          const combined = [...prev.repos, ...uniqueNew];
          const remaining = totalPublic - combined.length;
          const stillHasMore =
            Boolean(res.hasNextPage) || (res.data.length === 100 && remaining > 0);

          return {
            ...prev,
            repos: combined,
            page: nextPage,
            hasMoreRepos: stillHasMore,
            isLoadingMore: false,
            fromCache: Boolean(prev.fromCache || res.fromCache),
            isStale: Boolean(prev.isStale || res.isStale),
            staleReason: prev.staleReason || res.staleReason,
          };
        });
      } catch {
        setSlot((prev) => ({ ...prev, isLoadingMore: false }));
      }
    },
    [onRateLimitUpdate, slotA, slotB]
  );

  const executeComparison = useCallback(
    (rawA: string, rawB: string) => {
      const validation = validateComparisonInputs(rawA, rawB);
      if (!validation.isValid) {
        setValidationError(validation.errorMessage);
        return;
      }

      // Prevent duplicate simultaneous requests for the exact same pair while already loading
      const isAlreadyLoadingSamePair =
        (slotA.status === 'loading' || slotB.status === 'loading') &&
        slotA.username.toLowerCase() === validation.normalizedUserA.toLowerCase() &&
        slotB.username.toLowerCase() === validation.normalizedUserB.toLowerCase();

      if (isAlreadyLoadingSamePair) {
        return;
      }

      setValidationError(null);
      void Promise.all([
        fetchSlotProfile('A', validation.normalizedUserA),
        fetchSlotProfile('B', validation.normalizedUserB),
      ]);
    },
    [fetchSlotProfile, slotA.status, slotA.username, slotB.status, slotB.username]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeComparison(inputA, inputB);
  };

  const handleSwapInputs = () => {
    setValidationError(null);
    setInputA(inputB);
    setInputB(inputA);
    if (slotA.status !== 'idle' || slotB.status !== 'idle') {
      setSlotA(slotB);
      setSlotB(slotA);
    }
  };

  const handleResetComparison = () => {
    abortControllerARef.current?.abort();
    abortControllerBRef.current?.abort();
    requestTokenARef.current++;
    requestTokenBRef.current++;
    setValidationError(null);
    setInputA('');
    setInputB('');
    setSlotA(INITIAL_SLOT);
    setSlotB(INITIAL_SLOT);
  };

  const handleSelectExample = (userA: string, userB: string) => {
    setInputA(userA);
    setInputB(userB);
    executeComparison(userA, userB);
  };

  const isComparing = slotA.status === 'loading' || slotB.status === 'loading';
  const hasStartedComparison = slotA.status !== 'idle' || slotB.status !== 'idle';

  // Compute comparison metrics and language breakdown from loaded profile payloads
  const comparison = useMemo(() => {
    const payloadA =
      slotA.status === 'success' && slotA.user
        ? { user: slotA.user, repos: slotA.repos }
        : null;
    const payloadB =
      slotB.status === 'success' && slotB.user
        ? { user: slotB.user, repos: slotB.repos }
        : null;

    return calculateProfileComparison(payloadA, payloadB, { excludeForks });
  }, [excludeForks, slotA.repos, slotA.status, slotA.user, slotB.repos, slotB.status, slotB.user]);

  const displayUsernameA = slotA.user?.login || slotA.username || 'Developer A';
  const displayUsernameB = slotB.user?.login || slotB.username || 'Developer B';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Comparison Header & Dual Search Form */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <span>GitHub Profile Comparison</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Compare public repository metrics, follower reach, and primary language distributions
              side-by-side.
            </p>
          </div>

          {hasStartedComparison && (
            <button
              onClick={handleResetComparison}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-neutral-300 hover:text-white border border-[#30363d] transition cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset comparison</span>
            </button>
          )}
        </div>

        {/* Quick-fill chip if an active profile is already loaded in the main analyzer */}
        {activeUser && inputA.toLowerCase() !== activeUser.login.toLowerCase() && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Currently analyzing:</span>
            <button
              type="button"
              onClick={() => {
                setInputA(activeUser.login);
                setValidationError(null);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 font-mono text-xs transition cursor-pointer"
            >
              <span>Use @{activeUser.login} as Developer A</span>
            </button>
          </div>
        )}

        {/* Dual Username Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
            {/* Developer A Input */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="compare-user-a"
                className="block text-xs font-semibold text-emerald-400 font-mono"
              >
                Developer A Username
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="compare-user-a"
                  type="text"
                  value={inputA}
                  onChange={(e) => {
                    setInputA(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. torvalds"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-[#0d1117] text-neutral-100 placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-lg border border-[#30363d] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono transition"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:pb-0.5">
              <button
                type="button"
                onClick={handleSwapInputs}
                aria-label="Swap Developer A and Developer B usernames"
                title="Swap Developer A and Developer B"
                className="p-2.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] text-neutral-400 hover:text-neutral-200 border border-[#30363d] transition cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Developer B Input */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="compare-user-b"
                className="block text-xs font-semibold text-sky-400 font-mono"
              >
                Developer B Username
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="compare-user-b"
                  type="text"
                  value={inputB}
                  onChange={(e) => {
                    setInputB(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="e.g. gvanrossum"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-[#0d1117] text-neutral-100 placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-lg border border-[#30363d] focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm font-mono transition"
                />
              </div>
            </div>

            {/* Compare Submit Button */}
            <button
              type="submit"
              disabled={isComparing}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {isComparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Comparing...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" aria-hidden="true" />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. Empty State Before Comparison Begins */}
      {!hasStartedComparison && (
        <div className="p-8 sm:p-10 rounded-xl bg-[#161b22] border border-[#30363d] text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-emerald-400">
            <Scale className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-base font-bold text-neutral-100">
              Ready to Compare Two GitHub Profiles
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter two distinct GitHub usernames above to inspect their public repository counts,
              top-starred projects, and primary programming language distributions side-by-side
              using live GitHub REST API data.
            </p>
          </div>

          {/* Quick Example Pairs */}
          <div className="pt-2 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Try an example comparison</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {EXAMPLE_PAIRS.map((pair) => (
                <button
                  key={pair.label}
                  type="button"
                  onClick={() => handleSelectExample(pair.userA, pair.userB)}
                  className="px-3.5 py-2 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-mono font-semibold text-neutral-200 group-hover:text-emerald-400 transition">
                    @{pair.userA} <span className="text-neutral-500">vs</span> @{pair.userB}
                  </div>
                  <div className="text-[11px] text-neutral-500">{pair.note}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Active Comparison Content */}
      {hasStartedComparison && (
        <>
          {/* Two-Column Desktop / Stacked Mobile Profile Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProfileCompareCard
              slotLabel="Developer A"
              accentColor="emerald"
              slot={slotA}
              stats={comparison.statsA}
              onRetry={() => fetchSlotProfile('A', slotA.username, { bypassCache: true })}
              onLoadMoreRepos={() => handleLoadMoreForSide('A')}
            />

            <ProfileCompareCard
              slotLabel="Developer B"
              accentColor="sky"
              slot={slotB}
              stats={comparison.statsB}
              onRetry={() => fetchSlotProfile('B', slotB.username, { bypassCache: true })}
              onLoadMoreRepos={() => handleLoadMoreForSide('B')}
            />
          </div>

          {/* 4. Objective Metric Comparison Bars (Shown when at least one profile is loaded) */}
          {(comparison.statsA || comparison.statsB) && (
            <section
              aria-label="Key Statistics Comparison"
              className="p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#30363d]">
                <div>
                  <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>Side-by-Side Metric Comparison</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Objective numerical comparison normalized to a consistent visual scale
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />@{displayUsernameA}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sky-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />@{displayUsernameB}
                  </span>
                </div>
              </div>

              {/* Disclaimer: Metrics are not a measure of developer skill */}
              <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-start gap-2.5 text-xs text-neutral-400">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  <strong className="text-neutral-200">Interpretation Context:</strong> Follower
                  counts, star totals, and repository counts reflect public open-source visibility,
                  account tenure, and project type. They are{' '}
                  <strong className="text-neutral-200">
                    not a definitive measure of engineering ability
                  </strong>{' '}
                  or private/enterprise contributions.
                </p>
              </div>

              {/* Partial Pagination Warning Banner if either profile has unloaded repos */}
              {(comparison.statsA?.isPartial || comparison.statsB?.isPartial) && (
                <div className="p-3.5 rounded-lg bg-amber-950/25 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="leading-relaxed">
                    <strong className="text-amber-100">Partial Repository Pagination:</strong>{' '}
                    Repository star and fork sums below are calculated from the currently loaded
                    repositories (
                    {comparison.statsA
                      ? `@${displayUsernameA}: ${comparison.statsA.totalLoadedRepos}/${comparison.statsA.totalPublicRepos}`
                      : ''}
                    {comparison.statsA && comparison.statsB ? ', ' : ''}
                    {comparison.statsB
                      ? `@${displayUsernameB}: ${comparison.statsB.totalLoadedRepos}/${comparison.statsB.totalPublicRepos}`
                      : ''}
                    ). Use the <strong>Load more repos</strong> button on a profile card above to
                    fetch additional pages.
                  </p>
                </div>
              )}

              {/* Metric Rows */}
              <div className="space-y-3">
                {comparison.metrics.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2.5"
                  >
                    {/* Top Row: Value A | Metric Label & Objective Diff Badge | Value B */}
                    <div className="grid grid-cols-3 items-center gap-2">
                      {/* Left Value (Developer A) */}
                      <div className="text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">
                            {item.formattedA}
                          </span>
                          {item.isPartialA && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-500/30">
                              Partial
                            </span>
                          )}
                        </div>
                        {item.subLabelA && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{item.subLabelA}</p>
                        )}
                      </div>

                      {/* Center Label & Objective Numeric Difference */}
                      <div className="text-center space-y-1">
                        <div className="text-xs font-semibold text-neutral-200">{item.label}</div>
                        {item.higherSide !== 'unavailable' && item.diffFormatted && (
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${
                                item.higherSide === 'A'
                                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                                  : item.higherSide === 'B'
                                    ? 'bg-sky-950/30 text-sky-300 border-sky-500/30'
                                    : 'bg-[#161b22] text-neutral-400 border-[#30363d]'
                              }`}
                            >
                              {item.higherSide === 'A'
                                ? `@${displayUsernameA} (${item.diffFormatted})`
                                : item.higherSide === 'B'
                                  ? `@${displayUsernameB} (${item.diffFormatted})`
                                  : 'Equal'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Value (Developer B) */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {item.isPartialB && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-500/30">
                              Partial
                            </span>
                          )}
                          <span className="text-sm sm:text-base font-bold font-mono text-sky-400">
                            {item.formattedB}
                          </span>
                        </div>
                        {item.subLabelB && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{item.subLabelB}</p>
                        )}
                      </div>
                    </div>

                    {/* Consistent Scale Visual Bars */}
                    <div className="grid grid-cols-2 gap-2 items-center pt-0.5">
                      <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden flex justify-end">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.ratioA}%` }}
                        />
                      </div>
                      <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden flex justify-start">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-300"
                          style={{ width: `${item.ratioB}%` }}
                        />
                      </div>
                    </div>

                    {item.footnote && (
                      <p className="text-[11px] text-neutral-500 text-center pt-0.5">
                        {item.footnote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Primary Programming Language Comparison */}
          {(comparison.languageAnalyticsA || comparison.languageAnalyticsB) && (
            <LanguageComparisonSection
              usernameA={displayUsernameA}
              usernameB={displayUsernameB}
              languageAnalyticsA={comparison.languageAnalyticsA}
              languageAnalyticsB={comparison.languageAnalyticsB}
              sharedLanguages={comparison.sharedLanguages}
              uniqueLanguagesA={comparison.uniqueLanguagesA}
              uniqueLanguagesB={comparison.uniqueLanguagesB}
              languageRows={comparison.languageRows}
              excludeForks={excludeForks}
              onToggleExcludeForks={setExcludeForks}
            />
          )}
        </>
      )}
    </div>
  );
};
