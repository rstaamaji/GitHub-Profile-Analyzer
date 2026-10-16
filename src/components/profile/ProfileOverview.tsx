import React, { useMemo } from 'react';
import {
  BookOpen,
  Users,
  UserCheck,
  Star,
  GitFork,
  Flame,
  AlertTriangle,
  ChevronDown,
  Loader2,
  FolderGit2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { ApiError, GitHubRepo, GitHubUser } from '../../types/github';
import { ProfileHeader } from './ProfileHeader';
import { StatCard } from './StatCard';
import { RepositoryInsightsCards } from './RepositoryInsightsCards';
import { RecentActivityList } from './RecentActivityList';
import { calculateOverviewStats } from '../../utils/overviewAnalytics';

interface ProfileOverviewProps {
  user: GitHubUser;
  repos: GitHubRepo[];
  hasMoreRepos?: boolean;
  isLoadingMore?: boolean;
  repoLoadError?: ApiError | null;
  onFetchMoreRepos?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
  onNavigateToTab?: (tab: 'repositories' | 'analytics') => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  user,
  repos,
  hasMoreRepos = false,
  isLoadingMore = false,
  repoLoadError = null,
  onFetchMoreRepos,
  onSelectRepo,
  onNavigateToTab,
}) => {
  // Aggregate real statistics derived exclusively from fetched data
  const stats = useMemo(() => {
    return calculateOverviewStats(user, repos);
  }, [user, repos]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 motion-safe:animate-in motion-safe:fade-in duration-300">
      {/* 1. Profile Summary Card */}
      <ProfileHeader user={user} />

      {/* 2. Partial Failure Alert if profile succeeded but repository batch failed */}
      {repoLoadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-neutral-100">
                Incomplete Repository Data:{' '}
              </span>
              <span>
                {repoLoadError.message ||
                  'Profile loaded, but a repository batch request failed.'}{' '}
                {repos.length > 0 &&
                  `Showing ${repos.length} previously loaded repositories.`}
              </span>
            </div>
          </div>

          {onFetchMoreRepos && (
            <button
              onClick={onFetchMoreRepos}
              disabled={isLoadingMore}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-100 transition disabled:opacity-50 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingMore ? 'motion-safe:animate-spin text-emerald-400' : ''}`}
                aria-hidden="true"
              />
              <span>{isLoadingMore ? 'Retrying...' : 'Retry loading repos'}</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Indikator Partial Dataset jika ada repositori yang belum ter-load */}
      {stats.isPartial && !repoLoadError && (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-neutral-200">Data Repositori Sebagian: </span>
              <span>
                Baru memuat <strong className="font-mono text-neutral-100">{repos.length}</strong> dari{' '}
                <strong className="font-mono text-neutral-100">{user.public_repos}</strong> total repository publik akun ini.
                Metrik stars dan insight batch mencerminkan data yang telah dimuat.
              </span>
            </div>
          </div>

          {hasMoreRepos && onFetchMoreRepos && (
            <button
              onClick={onFetchMoreRepos}
              disabled={isLoadingMore}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin text-emerald-400" aria-hidden="true" />
                  <span>Memuat batch...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  <span>Muat lebih banyak</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 4. Primary Key Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <StatCard
          label="Public Repos"
          value={user.public_repos}
          icon={<BookOpen className="w-4 h-4 text-blue-400" aria-hidden="true" />}
          hint={
            repos.length > 0
              ? `${stats.originalReposCount} original, ${stats.forkedReposCount} fork`
              : user.public_repos === 0
                ? 'No public repos'
                : 'Not loaded yet'
          }
        />
        <StatCard
          label="Followers"
          value={user.followers}
          icon={<Users className="w-4 h-4 text-emerald-400" aria-hidden="true" />}
        />
        <StatCard
          label="Following"
          value={user.following}
          icon={<UserCheck className="w-4 h-4 text-purple-400" aria-hidden="true" />}
        />
        <StatCard
          label="Batch Stars"
          value={stats.totalBatchStars}
          icon={<Star className="w-4 h-4 text-amber-400" aria-hidden="true" />}
          hint={`Dari ${repos.length} repo termuat`}
        />
        <StatCard
          label="Batch Forks"
          value={stats.totalBatchForks}
          icon={<GitFork className="w-4 h-4 text-sky-400" aria-hidden="true" />}
          hint={`Dari ${repos.length} repo termuat`}
        />
        <StatCard
          label="Public Gists"
          value={user.public_gists}
          icon={<Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />}
        />
      </div>

      {/* 5. Empty State for Profiles with 0 Public Repositories vs Insights & Activity */}
      {user.public_repos === 0 && repos.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="w-11 h-11 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
            <FolderGit2 className="w-5 h-5 text-neutral-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-100">
            No Public Repositories Available
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            <span className="font-mono text-neutral-200">@{user.login}</span> has not published any
            public repositories on GitHub yet. Try searching another developer handle above or view
            their profile directly on GitHub.
          </p>
          <div className="pt-2">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${user.login}'s profile on GitHub (opens in a new tab)`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>Open @{user.login} on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Repository Insights (Most Starred, Recently Updated, Top Language) */}
          <RepositoryInsightsCards
            mostStarredRepo={stats.mostStarredRepo}
            mostRecentlyPushedRepo={stats.mostRecentlyPushedRepo}
            topLanguage={stats.topLanguage}
            onSelectRepo={onSelectRepo}
            onNavigateToTab={onNavigateToTab}
          />

          {/* Recent Activity List */}
          <RecentActivityList
            repos={repos}
            onSelectRepo={onSelectRepo}
            onViewAllRepos={onNavigateToTab ? () => onNavigateToTab('repositories') : undefined}
          />
        </>
      )}
    </div>
  );
};



