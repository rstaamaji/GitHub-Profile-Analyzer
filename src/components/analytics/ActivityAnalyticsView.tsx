import React, { useMemo, useState } from 'react';
import {
  Activity,
  GitCommit,
  Clock,
  Calendar,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  FolderGit2,
} from 'lucide-react';
import type { GitHubRepo, ActivityTimeRange } from '../../types/github';
import { calculateActivityAnalytics } from '../../utils/activityAnalytics';
import { ActivityChart } from './ActivityChart';

interface ActivityAnalyticsViewProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  hasMoreRepos?: boolean;
  isLoadingMore?: boolean;
  onFetchMoreRepos?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
}

export const ActivityAnalyticsView: React.FC<ActivityAnalyticsViewProps> = ({
  repos,
  totalPublicRepos,
  username,
  hasMoreRepos = false,
  isLoadingMore = false,
  onFetchMoreRepos,
  onSelectRepo,
}) => {
  const [timeRange, setTimeRange] = useState<ActivityTimeRange>('30d');

  const analytics = useMemo(() => {
    return calculateActivityAnalytics(repos, {
      range: timeRange,
      totalPublicRepos,
    });
  }, [repos, timeRange, totalPublicRepos]);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Time Range Selector & Disclaimers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-neutral-100">
              Activity Cadence for @{username}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-emerald-400 border border-emerald-500/30">
              Pushed vs Updated
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
            Measures timestamps when repositories had code pushes or metadata updates.
            Counts <strong className="text-neutral-300">distinct repositories</strong> per interval, not individual commit counts.
          </p>
        </div>


        {/* Range Buttons */}
        <div
          role="radiogroup"
          aria-label="Activity Time Range"
          className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d] self-start sm:self-auto shrink-0"
        >
          <button
            type="button"
            role="radio"
            aria-checked={timeRange === '30d'}
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              timeRange === '30d'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Past 30 Days
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={timeRange === '90d'}
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              timeRange === '90d'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Past 90 Days
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={timeRange === '12m'}
            onClick={() => setTimeRange('12m')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              timeRange === '12m'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Past 12 Months
          </button>
        </div>
      </div>

      {/* Dataset Completeness Banner */}
      {analytics.isPartial ? (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-neutral-200">Partial Repository Dataset: </span>
              <span>
                Activity currently calculated across <strong className="font-mono">{repos.length}</strong> of{' '}
                <strong className="font-mono">{totalPublicRepos}</strong> public repositories. Older or non-paged repositories are not yet included.
              </span>
            </div>
          </div>

          {hasMoreRepos && onFetchMoreRepos && (
            <button
              onClick={onFetchMoreRepos}
              disabled={isLoadingMore}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition disabled:opacity-50 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin text-emerald-400" aria-hidden="true" />
                  <span>Loading batch...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  <span>Load more repositories</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>
            Complete Coverage: All <strong className="font-mono">{totalPublicRepos}</strong> public repositories evaluated for recent activity.
          </span>
        </div>
      )}

      {/* Activity Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Active Repos in Window</span>
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.activeReposCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Had push or update events
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Code Pushed Repos</span>
            <GitCommit className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.pushedReposCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Distinct repos with git push
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Metadata / Updated Only</span>
            <Clock className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.updatedOnlyReposCount}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Issues/stars/details modified
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Dormant in Window</span>
            <Calendar className="w-4 h-4 text-neutral-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {Math.max(0, analytics.totalReposInDataset - analytics.activeReposCount)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            No events in selected timeframe
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart of Cadence */}
      <section
        aria-labelledby="activity-chart-heading"
        className="p-6 sm:p-8 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#30363d] pb-4">
          <div>
            <h3 id="activity-chart-heading" className="text-sm font-bold text-neutral-100">
              Temporal Activity Distribution
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Breakdown of distinct repositories touched over time intervals in this window.
            </p>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Interval: {timeRange === '12m' ? 'Monthly' : timeRange === '90d' ? 'Bi-weekly' : 'Weekly'}
          </span>
        </div>

        {/* Screen-reader Accessible Data Table */}
        <table className="sr-only">
          <caption>Repository activity cadence for @{username} ({timeRange === '12m' ? 'Past 12 Months' : timeRange === '90d' ? 'Past 90 Days' : 'Past 30 Days'})</caption>
          <thead>
            <tr>
              <th scope="col">Interval Period</th>
              <th scope="col">Distinct Repos Pushed</th>
              <th scope="col">Distinct Repos Updated</th>
            </tr>
          </thead>
          <tbody>
            {analytics.buckets.map((b) => (
              <tr key={b.periodKey}>
                <td>{b.periodLabel}</td>
                <td>{b.pushCount}</td>
                <td>{b.updateCount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ActivityChart buckets={analytics.buckets} />

        <div className="text-[11px] text-neutral-400 pt-2 border-t border-[#21262d] leading-relaxed">
          * Notice: Public repository events do not represent all of a user&apos;s contributions. Private commits, organizational contributions without public membership, and commits on forks are not counted here.
        </div>
      </section>

      {/* Recently Touched Repositories Table */}
      <section
        aria-labelledby="recent-activity-heading"
        className="p-6 sm:p-8 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
          <div>
            <h3 id="recent-activity-heading" className="text-sm font-bold text-neutral-100">
              Recently Active Repositories in Period
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Repositories with the latest code pushes and updates within the past {timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : '12 months'}.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {analytics.recentActiveRepos.length} displayed
          </span>
        </div>

        {analytics.recentActiveRepos.length > 0 ? (
          <div className="space-y-3" role="list" aria-label="Recently active repositories">
            {analytics.recentActiveRepos.map((item) => {
              const pushDate = new Date(item.pushedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const updateDate = new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {onSelectRepo ? (
                        <button
                          type="button"
                          onClick={() => {
                            const fullRepo = repos.find((r) => r.id === item.id);
                            if (fullRepo) onSelectRepo(fullRepo);
                          }}
                          className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline text-left cursor-pointer truncate max-w-xs sm:max-w-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <a
                          href={item.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${item.name} on GitHub (opens in a new tab)`}
                          className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 truncate max-w-xs sm:max-w-md rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          <span>{item.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
                        </a>
                      )}

                      {item.language && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#21262d] text-neutral-300 border border-[#30363d]">
                          {item.language}
                        </span>
                      )}

                      {item.fork && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#21262d] text-neutral-400 border border-[#30363d]">
                          Fork
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#21262d]">
                    <div className="text-right">
                      <div className="text-neutral-300 flex items-center gap-1 sm:justify-end">
                        <GitCommit className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                        <span>Pushed: {pushDate}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1 sm:justify-end">
                        <Clock className="w-3 h-3 text-blue-400" aria-hidden="true" />
                        <span>Updated: {updateDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2">
            <FolderGit2 className="w-6 h-6 text-neutral-400 mx-auto" aria-hidden="true" />
            <h4 className="text-xs font-semibold text-neutral-300">
              No Repository Activity in Selected Period
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              None of the analyzed public repositories have had recorded code pushes or updates in the past {timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : '12 months'}. Try choosing a broader period (e.g. Past 12 Months).
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
