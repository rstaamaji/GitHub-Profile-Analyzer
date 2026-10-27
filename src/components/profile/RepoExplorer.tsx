import React, { useCallback, useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  ChevronDown,
  Info,
  Star,
  FolderGit2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type {
  ApiError,
  GitHubRepo,
  GitHubUser,
  RepoFilterOptions,
  RepoFilterType,
  RepoSortOption,
} from '../../types/github';
import { extractAvailableLanguages, filterAndSortRepos } from '../../utils/repoFilterSort';
import { RepoCard } from './RepoCard';
import { ExportMenu } from '../common/ExportMenu';

interface RepoExplorerProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  user?: GitHubUser | null;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  repoLoadError?: ApiError | null;
  onLoadMore?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
  initialFilters?: RepoFilterOptions;
}

const MIN_STAR_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'All Stars', value: 0 },
  { label: '★ 1+', value: 1 },
  { label: '★ 10+', value: 10 },
  { label: '★ 50+', value: 50 },
  { label: '★ 100+', value: 100 },
  { label: '★ 500+', value: 500 },
  { label: '★ 1,000+', value: 1000 },
];

export const RepoExplorer: React.FC<RepoExplorerProps> = ({
  repos,
  totalPublicRepos,
  username,
  user,
  isLoadingMore = false,
  hasMore = false,
  repoLoadError = null,
  onLoadMore,
  onSelectRepo,
  initialFilters,
}) => {
  const [prevUsername, setPrevUsername] = useState(username);
  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery ?? '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialFilters?.language ?? 'all');
  const [filterType, setFilterType] = useState<RepoFilterType>(initialFilters?.type ?? 'all');
  const [minStars, setMinStars] = useState<number>(initialFilters?.minStars ?? 0);
  const [sortBy, setSortBy] = useState<RepoSortOption>(initialFilters?.sortBy ?? 'pushed');

  // Reset filters cleanly if the active profile changes
  if (prevUsername !== username) {
    setPrevUsername(username);
    setSearchQuery('');
    setSelectedLanguage('all');
    setFilterType('all');
    setMinStars(0);
    setSortBy('pushed');
  }

  // Dynamically compute languages present in the fetched dataset
  const availableLanguages = useMemo(() => extractAvailableLanguages(repos), [repos]);

  // Client-side filtering and sorting across the loaded repository set
  const filteredAndSortedRepos = useMemo(
    () =>
      filterAndSortRepos(repos, {
        searchQuery,
        language: selectedLanguage,
        type: filterType,
        minStars,
        sortBy,
      }),
    [repos, searchQuery, selectedLanguage, filterType, minStars, sortBy]
  );

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedLanguage !== 'all' ||
    filterType !== 'all' ||
    minStars > 0;

  const isDefaultSort = sortBy === 'pushed';

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedLanguage('all');
    setFilterType('all');
    setMinStars(0);
    setSortBy('pushed');
  }, []);

  const isPartialDataset = repos.length < totalPublicRepos;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Repositories for</span>
            <span className="font-mono text-emerald-400">@{username}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1" aria-live="polite">
            Showing{' '}
            <span className="font-mono text-neutral-200 font-semibold">
              {filteredAndSortedRepos.length}
            </span>{' '}
            matching of{' '}
            <span className="font-mono text-neutral-200 font-semibold">{repos.length}</span> loaded
            repositories (account has{' '}
            <span className="font-mono text-neutral-200 font-semibold">{totalPublicRepos}</span>{' '}
            total public)
          </p>
        </div>

        {/* Scope & Pagination Note Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-neutral-400 self-start sm:self-auto">
          <Info
            className={`w-3.5 h-3.5 shrink-0 ${isPartialDataset ? 'text-amber-400' : 'text-blue-400'}`}
            aria-hidden="true"
          />
          <span>
            {isPartialDataset
              ? `Filtering ${repos.length} of ${totalPublicRepos} loaded repos (load more below for full coverage)`
              : 'Filters & sorting apply to all public repositories'}
          </span>
        </div>
      </div>

      {/* Partial Repository Load Error Banner */}
      {repoLoadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-neutral-100">
                Failed to load repository batch:{' '}
              </span>
              <span>
                {repoLoadError.message || 'Unable to retrieve repositories from GitHub API.'}
              </span>
            </div>
          </div>

          {onLoadMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-100 transition disabled:opacity-50 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin text-emerald-400' : ''}`}
                aria-hidden="true"
              />
              <span>{isLoadingMore ? 'Retrying...' : 'Retry'}</span>
            </button>
          )}
        </div>
      )}

      {/* Empty Profile State (0 public repositories on account or initial repo fetch failed) */}
      {repos.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="w-11 h-11 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
            <FolderGit2 className="w-5 h-5 text-neutral-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">
            {totalPublicRepos > 0
              ? 'Repositories could not be loaded yet'
              : 'No public repositories available'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            {totalPublicRepos > 0 ? (
              <>
                Account <span className="font-mono text-neutral-300">@{username}</span> has{' '}
                <span className="font-mono text-neutral-200">{totalPublicRepos}</span> public
                repositories, but the repository list request did not complete.
              </>
            ) : (
              <>
                The GitHub profile <span className="font-mono text-neutral-300">@{username}</span>{' '}
                does not have any public repositories to display or filter.
              </>
            )}
          </p>
          {totalPublicRepos > 0 && onLoadMore && (
            <div className="pt-2">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-xs font-semibold text-white rounded-lg transition disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isLoadingMore ? 'Loading repositories...' : 'Retry loading repositories'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter and Control Bar */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3.5 shadow-sm">
            {/* Top Search Input */}
            <div className="relative">
              <label htmlFor="repo-filter-search" className="sr-only">
                Search repositories by name or description
              </label>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Search className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="repo-filter-search"
                type="text"
                value={searchQuery}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && searchQuery) {
                    setSearchQuery('');
                  }
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories by name or description..."
                className="w-full bg-[#0d1117] text-neutral-100 placeholder-neutral-400 pl-10 pr-10 py-2.5 rounded-lg border border-[#30363d] focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-emerald-500 text-sm transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  type="button"
                  aria-label="Clear repository search query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200 rounded cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Language Dropdown */}
                <div className="relative">
                  <label htmlFor="repo-language-select" className="sr-only">
                    Filter by primary programming language
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[38px] bg-[#0d1117] border border-[#30363d] focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/40 rounded-lg text-xs text-neutral-300 transition">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                    <span className="text-neutral-400 hidden sm:inline">Language:</span>
                    <select
                      id="repo-language-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1 max-w-[120px] sm:max-w-none"
                    >
                      <option value="all" className="bg-[#161b22] text-neutral-200">
                        All Languages ({repos.length})
                      </option>
                      {availableLanguages.map(([lang, count]) => (
                        <option key={lang} value={lang} className="bg-[#161b22] text-neutral-200">
                          {lang} ({count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type Filter Dropdown */}
                <div className="relative">
                  <label htmlFor="repo-type-select" className="sr-only">
                    Filter by repository type
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[38px] bg-[#0d1117] border border-[#30363d] focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/40 rounded-lg text-xs text-neutral-300 transition">
                    <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                    <span className="text-neutral-400 hidden sm:inline">Type:</span>
                    <select
                      id="repo-type-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as RepoFilterType)}
                      className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all" className="bg-[#161b22] text-neutral-200">
                        All Types
                      </option>
                      <option value="sources" className="bg-[#161b22] text-neutral-200">
                        Original Only
                      </option>
                      <option value="forks" className="bg-[#161b22] text-neutral-200">
                        Forks Only
                      </option>
                      <option value="archived" className="bg-[#161b22] text-neutral-200">
                        Archived Only
                      </option>
                    </select>
                  </div>
                </div>

                {/* Minimum Stars Filter Dropdown */}
                <div className="relative">
                  <label htmlFor="repo-min-stars-select" className="sr-only">
                    Filter by minimum stars
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[38px] bg-[#0d1117] border border-[#30363d] focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/40 rounded-lg text-xs text-neutral-300 transition">
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                    <span className="text-neutral-400 hidden sm:inline">Stars:</span>
                    <select
                      id="repo-min-stars-select"
                      value={minStars}
                      onChange={(e) => setMinStars(Number(e.target.value))}
                      className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1"
                    >
                      {MIN_STAR_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-[#161b22] text-neutral-200"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear All Filters Button */}
                {(hasActiveFilters || !isDefaultSort) && (
                  <button
                    onClick={resetFilters}
                    type="button"
                    aria-label="Reset all repository filters and sorting to defaults"
                    className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[38px] rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset filters</span>
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="relative self-start sm:self-auto sm:ml-auto flex items-center gap-2">
                <div className="relative">
                  <label htmlFor="repo-sort-select" className="sr-only">
                    Sort repositories
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[38px] bg-[#0d1117] border border-[#30363d] focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/40 rounded-lg text-xs text-neutral-300 transition">
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                    <span className="text-neutral-400 hidden sm:inline">Sort:</span>
                    <select
                      id="repo-sort-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as RepoSortOption)}
                      className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="pushed" className="bg-[#161b22] text-neutral-200">
                        Last Updated (Newest)
                      </option>
                      <option value="pushed_asc" className="bg-[#161b22] text-neutral-200">
                        Last Updated (Oldest)
                      </option>
                      <option value="stars" className="bg-[#161b22] text-neutral-200">
                        Most Stars
                      </option>
                      <option value="forks" className="bg-[#161b22] text-neutral-200">
                        Most Forks
                      </option>
                      <option value="name" className="bg-[#161b22] text-neutral-200">
                        Name (A–Z)
                      </option>
                      <option value="name_desc" className="bg-[#161b22] text-neutral-200">
                        Name (Z–A)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Export Repos Action */}
                <ExportMenu
                  user={user ?? null}
                  repos={filteredAndSortedRepos.length > 0 ? filteredAndSortedRepos : repos}
                  mode="repositories-only"
                  variant="compact"
                  align="right"
                />
              </div>

            </div>
          </div>

          {/* Repositories Cards Grid or Filter Empty State */}
          {filteredAndSortedRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} onSelectRepo={onSelectRepo} />
              ))}
            </div>
          ) : (
            /* Empty Filter Results State (Account has repos, but 0 match active filters) */
            <div className="p-10 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
                <Filter className="w-5 h-5 text-neutral-400" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-neutral-200">
                No matching repositories found
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                None of the <span className="font-mono text-neutral-300">{repos.length}</span>{' '}
                loaded repositories matched your current search or filter combination.
                {isPartialDataset &&
                  ` Note: ${totalPublicRepos - repos.length} additional public repositories have not been loaded yet.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={resetFilters}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-neutral-200 rounded-lg border border-[#30363d] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset all filters</span>
                </button>
              </div>
            </div>
          )}

          {/* Skeleton Cards while loading next page */}
          {isLoadingMore && (
            <div
              role="status"
              aria-label="Loading more repositories"
              className="grid grid-cols-1 md:grid-cols-2 gap-4 motion-safe:animate-pulse"
            >
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-[#21262d] rounded w-1/2" />
                    <div className="h-4 bg-[#21262d] rounded w-12" />
                  </div>
                  <div className="h-3.5 bg-[#21262d] rounded w-full" />
                  <div className="h-3.5 bg-[#21262d] rounded w-2/3" />
                  <div className="pt-3 border-t border-[#21262d] flex gap-4">
                    <div className="h-3 bg-[#21262d] rounded w-16" />
                    <div className="h-3 bg-[#21262d] rounded w-10" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Incremental Load More Control */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2
                      className="w-4 h-4 motion-safe:animate-spin text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>Loading more repositories...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                    <span>
                      Load more repositories ({repos.length} of {totalPublicRepos} loaded)
                    </span>
                  </>
                )}
              </button>
              <div className="text-[11px] text-neutral-400 mt-2 font-mono">
                Fetches next 30 repositories via GitHub REST API pagination
              </div>
            </div>
          )}

          {/* All Repositories Loaded Indicator */}
          {!hasMore && repos.length > 0 && repos.length >= totalPublicRepos && (
            <div className="text-center py-4 text-xs text-neutral-400 font-mono">
              ✓ All {repos.length} public repositories loaded
            </div>
          )}
        </>
      )}
    </div>
  );
};

