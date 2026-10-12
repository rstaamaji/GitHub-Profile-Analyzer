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
} from 'lucide-react';
import type { GitHubRepo, GitHubUser } from '../../types/github';
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
  onFetchMoreRepos?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
  onNavigateToTab?: (tab: 'repositories' | 'analytics') => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({
  user,
  repos,
  hasMoreRepos = false,
  isLoadingMore = false,
  onFetchMoreRepos,
  onSelectRepo,
  onNavigateToTab,
}) => {
  // Aggregate real statistics derived exclusively from fetched data
  const stats = useMemo(() => {
    return calculateOverviewStats(user, repos);
  }, [user, repos]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Profile Summary Card */}
      <ProfileHeader user={user} />

      {/* 2. Indikator Partial Dataset jika ada repositori yang belum ter-load */}
      {stats.isPartial && (
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Memuat batch...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Muat lebih banyak</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 3. Primary Key Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Public Repos"
          value={user.public_repos}
          icon={<BookOpen className="w-4 h-4 text-blue-400" />}
          hint={`${stats.originalReposCount} original, ${stats.forkedReposCount} fork`}
        />
        <StatCard
          label="Followers"
          value={user.followers}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Following"
          value={user.following}
          icon={<UserCheck className="w-4 h-4 text-purple-400" />}
        />
        <StatCard
          label="Batch Stars"
          value={stats.totalBatchStars}
          icon={<Star className="w-4 h-4 text-amber-400" />}
          hint={`Dari ${repos.length} repo termuat`}
        />
        <StatCard
          label="Batch Forks"
          value={stats.totalBatchForks}
          icon={<GitFork className="w-4 h-4 text-sky-400" />}
          hint={`Dari ${repos.length} repo termuat`}
        />
        <StatCard
          label="Public Gists"
          value={user.public_gists}
          icon={<Flame className="w-4 h-4 text-orange-400" />}
        />
      </div>

      {/* 4. Repository Insights (Most Starred, Recently Updated, Top Language) */}
      <RepositoryInsightsCards
        mostStarredRepo={stats.mostStarredRepo}
        mostRecentlyPushedRepo={stats.mostRecentlyPushedRepo}
        topLanguage={stats.topLanguage}
        onSelectRepo={onSelectRepo}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 5. Recent Activity List */}
      <RecentActivityList
        repos={repos}
        onSelectRepo={onSelectRepo}
        onViewAllRepos={onNavigateToTab ? () => onNavigateToTab('repositories') : undefined}
      />
    </div>
  );
};


