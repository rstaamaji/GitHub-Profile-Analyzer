import React, { useMemo } from 'react';
import {
  Sparkles,
  Star,
  GitFork,
  Layers,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { GitHubRepo, GitHubUser } from '../../types/github';
import { calculateDashboardInsights } from '../../utils/dashboardInsights';

interface DashboardInsightsPanelProps {
  user: GitHubUser;
  repos: GitHubRepo[];
  onNavigateToTab?: (tab: 'repositories' | 'analytics') => void;
}

export const DashboardInsightsPanel: React.FC<DashboardInsightsPanelProps> = React.memo(
  ({ user, repos, onNavigateToTab }) => {
    const data = useMemo(() => calculateDashboardInsights(user, repos), [user, repos]);

    if (repos.length === 0) {
      return null;
    }

    // Colors for Star Tiers
    const TIER_COLORS: Record<string, string> = {
      '100+': '#e3b341', // Gold / Amber
      '10-99': '#58a6ff', // Sky / Blue
      '1-9': '#3fb950', // Emerald / Green
      '0': '#484f58', // Muted Gray
    };

    return (
      <section
        aria-labelledby="dashboard-insights-heading"
        className="p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-5 shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <h3 id="dashboard-insights-heading" className="text-sm font-bold text-neutral-100">
              Evidence-Based Profile Insights
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
              {repos.length} {repos.length === 1 ? 'repo' : 'repos'} analyzed
            </span>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('analytics')}
              className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md self-start sm:self-auto"
            >
              <span>Explore Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* 4 Analytical Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Star Distribution */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-semibold text-neutral-300">Star Distribution</span>
              <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-neutral-100">
                {data.dominantRepo
                  ? `${data.starConcentrationPercentage}% in Top Repo`
                  : `${data.medianStars} median`}
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {data.dominantRepo
                  ? `${data.dominantRepo.name} holds ${data.dominantRepo.stars.toLocaleString()} of ${data.totalBatchStars.toLocaleString()} batch stars.`
                  : 'Stargazers are evenly distributed or absent.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#161b22]">
              Average: {data.averageStars} stars/repo
            </div>
          </div>

          {/* Card 2: Fork Engagement Ratio */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-semibold text-neutral-300">Community Forks</span>
              <GitFork className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-neutral-100">
                {data.forkToStarRatio !== null
                  ? `${data.forkToStarRatio} forks/star`
                  : `${data.totalBatchForks} forks`}
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {data.forkToStarRatio !== null
                  ? `Community engagement ratio: ${data.totalBatchForks.toLocaleString()} forks across ${data.totalBatchStars.toLocaleString()} stars.`
                  : 'No stargazers recorded on loaded repositories.'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#161b22]">
              Average: {data.averageForks} forks/repo
            </div>
          </div>

          {/* Card 3: Portfolio Composition */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-semibold text-neutral-300">Portfolio Mix</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-neutral-100">
                {data.originalPercentage}% Original
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {data.originalCount} source {data.originalCount === 1 ? 'repo' : 'repos'} vs{' '}
                {data.forkedCount} {data.forkedCount === 1 ? 'fork' : 'forks'}
                {data.archivedCount > 0 ? `, ${data.archivedCount} archived` : ''}.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#161b22]">
              Fork share: {data.forkedPercentage}%
            </div>
          </div>

          {/* Card 4: Push Cadence */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span className="font-semibold text-neutral-300">Push Recency</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-neutral-100">
                {data.mostRecentPushDaysAgo === null
                  ? 'No push record'
                  : data.mostRecentPushDaysAgo === 0
                    ? 'Active Today'
                    : data.mostRecentPushDaysAgo === 1
                      ? '1 day ago'
                      : `${data.mostRecentPushDaysAgo}d ago`}
              </div>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {data.pushedIn90dCount} of {data.totalLoadedRepos} repositories (
                {data.pushedIn90dPercentage}%) updated in the last 90 days.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 pt-1 border-t border-[#161b22]">
              30-day window: {data.pushedIn30dCount} pushed
            </div>
          </div>
        </div>

        {/* Star Distribution Tiers Breakdown Bar */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-200">
              Repository Star Tiers Breakdown
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {data.totalBatchStars.toLocaleString()} stars across {data.totalLoadedRepos} repos
            </span>
          </div>

          {/* Segmented Bar */}
          <div
            className="w-full h-3 rounded-full overflow-hidden flex bg-[#161b22]"
            role="progressbar"
            aria-label="Star distribution tiers breakdown"
          >
            {data.starTiers.map((tier) => {
              if (tier.count === 0) return null;
              return (
                <div
                  key={tier.rangeKey}
                  style={{
                    width: `${tier.percentage}%`,
                    backgroundColor: TIER_COLORS[tier.rangeKey],
                  }}
                  title={`${tier.label}: ${tier.count} repos (${tier.percentage}%)`}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px]">
            {data.starTiers.map((tier) => (
              <div key={tier.rangeKey} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier.rangeKey] }}
                  aria-hidden="true"
                />
                <span className="text-neutral-300">{tier.label}:</span>
                <span className="font-mono text-neutral-400">
                  {tier.count} ({tier.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Methodological & Scope Disclosure */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-[11px] text-neutral-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="text-neutral-300 font-semibold">Analytical Methodology: </span>
            <span>
              Metrics are calculated strictly from public repository metadata retrieved via the
              GitHub REST API. Percentages reflect repository counts and primary tags; they do not
              measure lines of code or infer developer proficiency.
              {data.isPartial &&
                ` Only ${data.totalLoadedRepos} of ${data.totalPublicRepos} public repositories are currently loaded.`}
            </span>
          </div>
        </div>
      </section>
    );
  }
);

DashboardInsightsPanel.displayName = 'DashboardInsightsPanel';
