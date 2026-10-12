import React, { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { GitHubRepo, RepoSortOption } from '../../types/github';
import { RepoCard } from './RepoCard';

interface RepoExplorerProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const RepoExplorer: React.FC<RepoExplorerProps> = ({
  repos,
  totalPublicRepos,
  username,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<RepoSortOption>('pushed');
  const [filterType, setFilterType] = useState<'all' | 'sources' | 'forks' | 'archived'>('all');

  // Dynamically compute languages present in the fetched dataset
  const availableLanguages = useMemo(() => {
    const langCounts: Record<string, number> = {};
    for (const repo of repos) {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    }
    return Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
  }, [repos]);

  // Client-side filtering and sorting across the loaded repository set
  const filteredAndSortedRepos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return repos
      .filter((repo) => {
        // 1. Text filter (name & description)
        if (query) {
          const matchName = repo.name.toLowerCase().includes(query);
          const matchDesc = repo.description?.toLowerCase().includes(query) ?? false;
          if (!matchName && !matchDesc) return false;
        }

        // 2. Language filter
        if (selectedLanguage !== 'all' && repo.language !== selectedLanguage) {
          return false;
        }

        // 3. Type filter
        if (filterType === 'sources' && repo.fork) return false;
        if (filterType === 'forks' && !repo.fork) return false;
        if (filterType === 'archived' && !repo.archived) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stars') {
          return b.stargazers_count - a.stargazers_count;
        }
        if (sortBy === 'forks') {
          return b.forks_count - a.forks_count;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default: pushed_at (recency)
        const dateA = new Date(a.pushed_at || a.updated_at).getTime();
        const dateB = new Date(b.pushed_at || b.updated_at).getTime();
        return dateB - dateA;
      });
  }, [repos, searchQuery, selectedLanguage, sortBy, filterType]);

  const hasActiveFilters = searchQuery !== '' || selectedLanguage !== 'all' || filterType !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('all');
    setFilterType('all');
    setSortBy('pushed');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Explorer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Repositories for</span>
            <span className="font-mono text-emerald-400">@{username}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Displaying <span className="font-mono text-neutral-200 font-semibold">{filteredAndSortedRepos.length}</span>{' '}
            of <span className="font-mono text-neutral-200 font-semibold">{repos.length}</span> loaded repositories{' '}
            (account has <span className="font-mono text-neutral-200 font-semibold">{totalPublicRepos}</span> total public)
          </p>
        </div>

        {/* Scope Note Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-neutral-400 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span>Filters apply to all loaded repositories</span>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3.5 shadow-sm">
        {/* Top Search Input */}
        <div className="relative">
          <label htmlFor="repo-filter-search" className="sr-only">
            Filter repositories by name or description
          </label>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="repo-filter-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter repositories by name or description..."
            className="w-full bg-[#0d1117] text-neutral-100 placeholder-neutral-500 pl-10 pr-10 py-2.5 rounded-lg border border-[#30363d] focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-emerald-500 text-sm transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              aria-label="Clear filter search query"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-200 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Language Dropdown */}
            <div className="relative">
              <label htmlFor="repo-language-select" className="sr-only">
                Filter by programming language
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-neutral-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                <span className="text-neutral-500">Language:</span>
                <select
                  id="repo-language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#161b22] text-neutral-200">
                    All ({repos.length})
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-neutral-300">
                <Filter className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                <span className="text-neutral-500">Type:</span>
                <select
                  id="repo-type-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#161b22] text-neutral-200">
                    All Sources
                  </option>
                  <option value="sources" className="bg-[#161b22] text-neutral-200">
                    Original Sources Only
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

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset filters</span>
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="relative ml-auto">
            <label htmlFor="repo-sort-select" className="sr-only">
              Sort repositories
            </label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
              <span className="text-neutral-500">Sort:</span>
              <select
                id="repo-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as RepoSortOption)}
                className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer font-medium"
              >
                <option value="pushed" className="bg-[#161b22] text-neutral-200">
                  Recently Updated
                </option>
                <option value="stars" className="bg-[#161b22] text-neutral-200">
                  Most Stars
                </option>
                <option value="forks" className="bg-[#161b22] text-neutral-200">
                  Most Forks
                </option>
                <option value="name" className="bg-[#161b22] text-neutral-200">
                  Name (A-Z)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      {filteredAndSortedRepos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        /* Empty Filter Results State */
        <div className="p-10 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
            <Filter className="w-5 h-5 text-neutral-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">No matching repositories found</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            No loaded repositories matched your current filter query. Try clearing search keywords or selecting a different programming language.
          </p>
          <button
            onClick={resetFilters}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-neutral-200 rounded-lg border border-[#30363d] transition cursor-pointer"
          >
            <span>Clear all filters</span>
          </button>
        </div>
      )}

      {/* Incremental Load More Control */}
      {hasMore && (
        <div className="pt-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" aria-hidden="true" />
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
          <div className="text-[11px] text-neutral-500 mt-2 font-mono">
            Fetches next 30 repositories via GitHub REST API pagination
          </div>
        </div>
      )}

      {/* All Repositories Loaded Indicator */}
      {!hasMore && repos.length > 0 && repos.length >= totalPublicRepos && (
        <div className="text-center py-4 text-xs text-neutral-500 font-mono">
          ✓ All {repos.length} public repositories loaded
        </div>
      )}
    </div>
  );
};
