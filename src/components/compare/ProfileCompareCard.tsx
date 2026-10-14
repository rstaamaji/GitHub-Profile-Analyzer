import React from 'react';
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Star,
  GitFork,
  BookOpen,
  Users,
  UserCheck,
  Flame,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import type { ComparedProfileSlot, DashboardOverviewStats } from '../../types/github';
import { getLanguageColor } from '../../utils/languageAnalytics';

interface ProfileCompareCardProps {
  slotLabel: 'Developer A' | 'Developer B';
  accentColor: 'emerald' | 'sky';
  slot: ComparedProfileSlot;
  stats: DashboardOverviewStats | null;
  onRetry: () => void;
  onLoadMoreRepos: () => void;
}

export const ProfileCompareCard: React.FC<ProfileCompareCardProps> = ({
  slotLabel,
  accentColor,
  slot,
  stats,
  onRetry,
  onLoadMoreRepos,
}) => {
  const badgeClasses =
    accentColor === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-sky-500/10 text-sky-400 border-sky-500/30';

  const topBorderClass =
    accentColor === 'emerald' ? 'border-t-emerald-500/70' : 'border-t-sky-500/70';

  // 1. Loading State (Content-Matched Skeleton to prevent layout shift)
  if (slot.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] border-t-2 ${topBorderClass} flex flex-col justify-between space-y-5 shadow-sm motion-safe:animate-pulse`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${badgeClasses}`}
            >
              {slotLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
              <Loader2
                className={`w-3.5 h-3.5 motion-safe:animate-spin ${
                  accentColor === 'emerald' ? 'text-emerald-400' : 'text-sky-400'
                }`}
                aria-hidden="true"
              />
              <span className="font-mono">@{slot.username}</span>
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#21262d] border border-[#30363d] shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 bg-[#21262d] rounded w-1/2" />
              <div className="h-3.5 bg-[#21262d] rounded w-1/3" />
              <div className="h-3.5 bg-[#21262d] rounded w-4/5 mt-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="h-3 bg-[#21262d] rounded w-12" />
                <div className="h-4 bg-[#21262d] rounded w-10" />
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="h-3 bg-[#21262d] rounded w-36" />
            <div className="h-4 bg-[#21262d] rounded w-1/2" />
            <div className="h-3 bg-[#21262d] rounded w-3/4" />
          </div>
        </div>

        <div className="pt-3 border-t border-[#30363d] flex items-center justify-between">
          <div className="h-3.5 bg-[#21262d] rounded w-40" />
          <div className="h-3.5 bg-[#21262d] rounded w-20" />
        </div>
      </div>
    );
  }

  // 2. Per-Profile Error State
  if (slot.status === 'error' || !slot.user || !stats) {
    return (
      <div
        className={`p-6 rounded-xl bg-[#161b22] border border-red-500/30 border-t-2 border-t-red-500/70 flex flex-col justify-between min-h-[320px] space-y-4`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${badgeClasses}`}
            >
              {slotLabel}
            </span>
            {slot.error?.status && (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/60 text-red-300 border border-red-500/30">
                HTTP {slot.error.status}
              </span>
            )}
          </div>

          <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-semibold text-neutral-100">
                Failed to load <span className="font-mono text-red-300">@{slot.username}</span>
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {slot.error?.message || 'Unable to retrieve profile data from GitHub.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-neutral-100 border border-[#30363d] transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry @{slot.username}</span>
          </button>
        </div>
      </div>
    );
  }

  const { user } = slot;
  const joinYear = user.created_at ? new Date(user.created_at).getFullYear() : null;
  const mostStarred = stats.mostStarredRepo;

  return (
    <div
      className={`p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] border-t-2 ${topBorderClass} flex flex-col justify-between space-y-5 shadow-sm`}
    >
      <div className="space-y-4">
        {/* Top Slot Badge, Cache Status & External Link */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${badgeClasses}`}
            >
              {slotLabel}
            </span>
            {slot.fromCache && !slot.isStale && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0d1117] text-neutral-400 border border-[#30363d]">
                Cached
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRetry}
              type="button"
              title={`Refresh @${user.login} data from GitHub API`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-medium text-neutral-300 hover:text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>Refresh</span>
            </button>

            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${user.login}'s profile on GitHub (opens in a new tab)`}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Stale Cache Fallback Notice */}
        {slot.isStale && (
          <div
            role="alert"
            className="p-2.5 rounded-lg bg-amber-950/35 border border-amber-500/40 flex items-start gap-2 text-[11px] text-amber-200"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong className="text-amber-100">Cached fallback (may be outdated):</strong> Live
              refresh failed{slot.staleReason ? ` (${slot.staleReason})` : ''}.
            </span>
          </div>
        )}

        {/* Profile Identity Row */}
        <div className="flex items-start gap-4">
          <img
            src={user.avatar_url}
            alt={`${user.name || user.login}'s profile picture`}
            className="w-16 h-16 rounded-full border border-[#30363d] bg-[#0d1117] shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-neutral-100 truncate">
              {user.name || user.login}
            </h3>
            <p className="text-xs font-mono text-neutral-400 truncate">@{user.login}</p>

            {user.bio ? (
              <p className="text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed">
                {user.bio}
              </p>
            ) : (
              <p className="text-xs text-neutral-400 italic mt-2">No public bio provided</p>
            )}
          </div>
        </div>

        {/* Metadata Pills (Company, Location, Joined Year) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400 pt-1">
          {user.company && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{user.company}</span>
            </span>
          )}
          {user.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[180px]">{user.location}</span>
            </span>
          )}
          {joinYear && !Number.isNaN(joinYear) && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
              <span>Joined {joinYear}</span>
            </span>
          )}
        </div>

        {/* 4 Key Profile Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              <span>Repos</span>
            </div>
            <div className="text-sm font-bold font-mono text-neutral-100 mt-1">
              {user.public_repos.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Followers</span>
            </div>
            <div className="text-sm font-bold font-mono text-neutral-100 mt-1">
              {user.followers.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <span>Following</span>
            </div>
            <div className="text-sm font-bold font-mono text-neutral-100 mt-1">
              {user.following.toLocaleString()}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
              <span>Gists</span>
            </div>
            <div className="text-sm font-bold font-mono text-neutral-100 mt-1">
              {user.public_gists.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Most Starred Repository Highlight */}
        <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="font-semibold uppercase tracking-wider text-neutral-400">
              Top Starred Repository {stats.isPartial ? '(In Loaded Sample)' : ''}
            </span>
            {mostStarred && (
              <span className="inline-flex items-center gap-1 font-mono text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400/20" aria-hidden="true" />
                {mostStarred.stargazers_count.toLocaleString()}
              </span>
            )}
          </div>

          {mostStarred ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={mostStarred.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-400 hover:underline truncate inline-flex items-center gap-1"
                >
                  <span className="truncate">{mostStarred.name}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                </a>

                <div className="flex items-center gap-2.5 text-xs text-neutral-400 shrink-0">
                  {mostStarred.language && (
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getLanguageColor(mostStarred.language) }}
                        aria-hidden="true"
                      />
                      <span>{mostStarred.language}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-mono">
                    <GitFork className="w-3 h-3 text-neutral-500" aria-hidden="true" />
                    {mostStarred.forks_count.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2">
                {mostStarred.description || 'No description provided for this repository.'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              No public repositories available on this account.
            </p>
          )}
        </div>
      </div>

      {/* Dataset Coverage & Pagination Footer */}
      <div className="pt-3 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-2 text-xs">
        {stats.isPartial ? (
          <div className="flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>
              Loaded <strong className="font-mono">{stats.totalLoadedRepos}</strong> of{' '}
              <strong className="font-mono">{stats.totalPublicRepos}</strong> public repos (partial)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-neutral-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>
              All <strong className="font-mono text-neutral-200">{stats.totalLoadedRepos}</strong>{' '}
              public repos loaded
            </span>
          </div>
        )}

        {slot.hasMoreRepos && (
          <button
            onClick={onLoadMoreRepos}
            disabled={slot.isLoadingMore}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[11px] font-semibold text-neutral-200 border border-[#30363d] transition disabled:opacity-50 cursor-pointer"
          >
            {slot.isLoadingMore ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" aria-hidden="true" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-neutral-400" aria-hidden="true" />
                <span>Load more repos</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
