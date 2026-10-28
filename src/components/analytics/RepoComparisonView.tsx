import React, { useState, useMemo } from 'react';
import {
  Star,
  GitFork,
  AlertCircle,
  HardDrive,
  BarChart3,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { GitHubRepo, RepoComparisonMetric } from '../../types/github';
import {
  buildRepoComparisonSummary,
  METRIC_CONFIG,
} from '../../utils/repoComparisonAnalytics';

interface RepoComparisonViewProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  hasMoreRepos?: boolean;
  isLoadingMore?: boolean;
  onFetchMoreRepos?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
}

export const RepoComparisonView: React.FC<RepoComparisonViewProps> = React.memo(
  ({
    repos,
    totalPublicRepos,
    username,
    hasMoreRepos = false,
    isLoadingMore = false,
    onFetchMoreRepos,
    onSelectRepo,
  }) => {
    const [selectedMetric, setSelectedMetric] = useState<RepoComparisonMetric>('stars');
    const [displayLimit, setDisplayLimit] = useState<number>(10);

    const summary = useMemo(() => {
      return buildRepoComparisonSummary(repos, selectedMetric, displayLimit);
    }, [repos, selectedMetric, displayLimit]);

    const isPartial = repos.length < totalPublicRepos;

    const METRIC_TABS: Array<{
      key: RepoComparisonMetric;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { key: 'stars', label: 'Stars', icon: Star },
      { key: 'forks', label: 'Forks', icon: GitFork },
      { key: 'issues', label: 'Issues', icon: AlertCircle },
      { key: 'size', label: 'Size (KB)', icon: HardDrive },
    ];

    if (repos.length === 0) {
      return (
        <div className="p-12 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
            <BarChart3 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">
            No Repositories to Compare
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            There are currently no loaded public repositories for @{username} to compare.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-100">
                Repository Comparative Analytics
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-sky-400 border border-sky-500/30">
                Ranked by {summary.metricLabel}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Comparing {summary.items.length} of {summary.totalReposAvailable} loaded repositories
              for <span className="font-mono text-neutral-300">@{username}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Switcher */}
            <div
              role="radiogroup"
              aria-label="Comparative Metric"
              className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]"
            >
              {METRIC_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedMetric === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedMetric(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isSelected
                        ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scope / Limit Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <label htmlFor="limit-select" className="sr-only">
                Number of repositories to show
              </label>
              <select
                id="limit-select"
                value={displayLimit}
                onChange={(e) => setDisplayLimit(Number(e.target.value))}
                className="bg-[#0d1117] text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg border border-[#30363d] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={100}>All Loaded ({repos.length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partial Dataset Notice */}
        {isPartial && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-neutral-200">Partial Dataset: </span>
                <span>
                  Comparison reflects <strong className="font-mono">{repos.length}</strong> of{' '}
                  <strong className="font-mono">{totalPublicRepos}</strong> public repositories.
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
                    <Loader2 className="w-3.5 h-3.5 motion-safe:animate-spin text-emerald-400" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Load more repos</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Metric Summary Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="text-xs text-neutral-400 mb-1">Batch Highest</div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {summary.maxValue.toLocaleString()}{' '}
              <span className="text-xs font-normal text-neutral-400">{summary.unit}</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
              {summary.items[0]?.name || 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="text-xs text-neutral-400 mb-1">Median Value</div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {summary.medianValue.toLocaleString()}{' '}
              <span className="text-xs font-normal text-neutral-400">{summary.unit}</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Middle of compared set</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="text-xs text-neutral-400 mb-1">Average (Mean)</div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {summary.averageValue.toLocaleString()}{' '}
              <span className="text-xs font-normal text-neutral-400">{summary.unit}</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Across compared repos</div>
          </div>

          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
            <div className="text-xs text-neutral-400 mb-1">Zero Values</div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {summary.zeroCount}{' '}
              <span className="text-xs font-normal text-neutral-400">
                ({Math.round((summary.zeroCount / summary.items.length) * 100)}%)
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Repos with 0 {summary.unit}
            </div>
          </div>
        </div>

        {/* Screen Reader Table */}
        <table className="sr-only">
          <caption>
            Repository comparison by {summary.metricLabel} for @{username}
          </caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Repository</th>
              <th scope="col">{summary.metricLabel}</th>
              <th scope="col">Primary Language</th>
            </tr>
          </thead>
          <tbody>
            {summary.items.map((item, idx) => {
              const val =
                selectedMetric === 'stars'
                  ? item.stars
                  : selectedMetric === 'forks'
                    ? item.forks
                    : selectedMetric === 'issues'
                      ? item.openIssues
                      : item.sizeKb;
              return (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>
                    {val} {summary.unit}
                  </td>
                  <td>{item.language || 'Unspecified'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Visual Comparative Bars */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-[#21262d]">
            <span>Repository & Language</span>
            <span className="font-mono">
              Relative to Peak ({summary.maxValue.toLocaleString()} {summary.unit})
            </span>
          </div>

          <div className="space-y-3" role="list" aria-label="Repository comparison rankings">
            {summary.items.map((item, index) => {
              const val =
                selectedMetric === 'stars'
                  ? item.stars
                  : selectedMetric === 'forks'
                    ? item.forks
                    : selectedMetric === 'issues'
                      ? item.openIssues
                      : item.sizeKb;

              const matchingRepo = repos.find((r) => r.id === item.id);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-neutral-400 font-mono text-xs w-5 shrink-0">
                        #{index + 1}
                      </span>
                      {matchingRepo && onSelectRepo ? (
                        <button
                          type="button"
                          onClick={() => onSelectRepo(matchingRepo)}
                          className="font-semibold text-neutral-100 hover:text-emerald-400 transition truncate text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <a
                          href={item.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-neutral-100 hover:text-emerald-400 transition truncate inline-flex items-center gap-1"
                        >
                          <span>{item.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}

                      {item.language && (
                        <span className="text-[10px] font-medium text-neutral-400 bg-[#161b22] px-2 py-0.5 rounded-full border border-[#21262d] shrink-0">
                          {item.language}
                        </span>
                      )}

                      {item.isFork && (
                        <span className="text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.2 rounded border border-sky-500/30 shrink-0">
                          fork
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs shrink-0 self-end sm:self-auto">
                      <span className="text-neutral-200 font-bold">
                        {val.toLocaleString()} {summary.unit}
                      </span>
                      <span className="text-neutral-400 text-[11px] w-12 text-right">
                        {item.ratioToMax}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#161b22] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedMetric === 'stars'
                          ? 'bg-amber-400'
                          : selectedMetric === 'forks'
                            ? 'bg-sky-400'
                            : selectedMetric === 'issues'
                              ? 'bg-red-400'
                              : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.max(item.ratioToMax, val > 0 ? 2 : 0)}%` }}
                      role="progressbar"
                      aria-valuenow={val}
                      aria-valuemin={0}
                      aria-valuemax={summary.maxValue}
                      aria-label={`${item.name}: ${val} ${summary.unit}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

RepoComparisonView.displayName = 'RepoComparisonView';
