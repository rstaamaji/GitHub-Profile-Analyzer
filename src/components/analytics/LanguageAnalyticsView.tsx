import React, { useMemo, useState } from 'react';
import {
  Code2,
  PieChart as PieIcon,
  GitFork,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { GitHubRepo } from '../../types/github';
import { calculateLanguageAnalytics } from '../../utils/languageAnalytics';
import { LanguageChart } from './LanguageChart';

interface LanguageAnalyticsViewProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  hasMoreRepos?: boolean;
  isLoadingMore?: boolean;
  onFetchMoreRepos?: () => void;
}

export const LanguageAnalyticsView: React.FC<LanguageAnalyticsViewProps> = ({
  repos,
  totalPublicRepos,
  username,
  hasMoreRepos = false,
  isLoadingMore = false,
  onFetchMoreRepos,
}) => {
  const [excludeForks, setExcludeForks] = useState<boolean>(true);

  // Compute analytics deterministically based on repos and fork toggle
  const analytics = useMemo(() => {
    return calculateLanguageAnalytics(repos, {
      excludeForks,
      totalPublicRepos,
    });
  }, [repos, excludeForks, totalPublicRepos]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <span>Language Analytics for</span>
            <span className="font-mono text-emerald-400">@{username}</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Calculated from public repository primary languages metadata.
          </p>
        </div>

        {/* Fork Exclusion Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#161b22] border border-[#30363d] px-3 py-1.5 rounded-lg text-xs">
          <label htmlFor="fork-toggle" className="text-neutral-300 flex items-center gap-1.5 cursor-pointer select-none">
            <GitFork className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            <span>Exclude forked repositories</span>
          </label>
          <input
            id="fork-toggle"
            type="checkbox"
            checked={excludeForks}
            onChange={(e) => setExcludeForks(e.target.checked)}
            className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Scope / Coverage Status Banner */}
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
                Analysis currently reflects <strong className="font-mono">{repos.length}</strong> of{' '}
                <strong className="font-mono">{totalPublicRepos}</strong> total public repositories on this account.
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
                  <span>Loading batch...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Load more to refine</span>
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
            Complete Coverage: All <strong className="font-mono">{totalPublicRepos}</strong> public repositories are loaded and analyzed.
          </span>
        </div>
      )}

      {/* Key Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Repositories Analyzed</span>
            <Code2 className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.totalAnalyzed.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {excludeForks ? `${analytics.forksExcludedCount} forks omitted` : 'Including forked repos'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Distinct Languages</span>
            <PieIcon className="w-4 h-4 text-purple-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.distinctLanguagesCount}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Detected primary tags
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Primary Focus</span>
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-100 truncate">
            {analytics.topLanguage ? analytics.topLanguage.language : 'None'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {analytics.topLanguage
              ? `${analytics.topLanguage.percentage}% of categorized repos`
              : 'No primary languages'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Uncategorized</span>
            <Info className="w-4 h-4 text-neutral-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100">
            {analytics.totalWithoutLanguage.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Markdown, config, or assets
          </div>
        </div>
      </div>

      {/* Main Visualization & Breakdown Card */}
      {analytics.breakdown.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm">
          {/* Donut Chart View */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#30363d] pb-6 lg:pb-0 lg:pr-6">
            <h3 className="text-sm font-semibold text-neutral-200 mb-2">
              Primary Language Share
            </h3>
            <p className="text-xs text-neutral-400 text-center mb-4 max-w-xs">
              Percentage breakdown calculated by repository count.
            </p>
            <LanguageChart data={analytics.breakdown} />
          </div>

          {/* Ranked Breakdown Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">
                Ranked Language Breakdown
              </h3>
              <span className="text-xs text-neutral-500 font-mono">
                {analytics.totalWithLanguage} categorized repos
              </span>
            </div>

            <div className="space-y-3" role="list" aria-label="Programming language rankings">
              {analytics.breakdown.map((item, idx) => (
                <div
                  key={item.language}
                  className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-mono w-4">#{idx + 1}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-neutral-200">{item.language}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-neutral-300">
                      <span>{item.count} {item.count === 1 ? 'repo' : 'repos'}</span>
                      <span className="text-emerald-400 font-bold w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Accessible Visual Progress Bar */}
                  <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                      role="progressbar"
                      aria-valuenow={item.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.language} represents ${item.percentage}% of categorized repositories`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Note clarifying metric semantics */}
            <div className="text-[11px] text-neutral-500 pt-2 border-t border-[#21262d] leading-relaxed">
              * Note: Percentages represent the proportion of repositories where a language is designated as the primary language by GitHub, distinct from source code byte volume.
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-400">
            <Code2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-neutral-200">
            No Primary Language Data Available
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
            None of the analyzed repositories for @{username} currently contain a designated primary language, or all available repositories are forks and fork exclusion is enabled.
          </p>
          {excludeForks && analytics.forksExcludedCount > 0 && (
            <button
              onClick={() => setExcludeForks(false)}
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-neutral-200 rounded-lg border border-[#30363d] transition cursor-pointer"
            >
              <span>Include {analytics.forksExcludedCount} forked repositories</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
