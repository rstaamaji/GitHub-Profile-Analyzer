import React, { useState } from 'react';
import { Code2, Activity, BarChart3 } from 'lucide-react';
import type { GitHubRepo } from '../../types/github';
import { LanguageAnalyticsView } from './LanguageAnalyticsView';
import { ActivityAnalyticsView } from './ActivityAnalyticsView';
import { RepoComparisonView } from './RepoComparisonView';

interface AnalyticsContainerProps {
  repos: GitHubRepo[];
  totalPublicRepos: number;
  username: string;
  hasMoreRepos?: boolean;
  isLoadingMore?: boolean;
  onFetchMoreRepos?: () => void;
  onSelectRepo?: (repo: GitHubRepo) => void;
}

export const AnalyticsContainer: React.FC<AnalyticsContainerProps> = ({
  repos,
  totalPublicRepos,
  username,
  hasMoreRepos,
  isLoadingMore,
  onFetchMoreRepos,
  onSelectRepo,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'languages' | 'activity' | 'comparison'>(
    'languages'
  );
  const langTabRef = React.useRef<HTMLButtonElement>(null);
  const actTabRef = React.useRef<HTMLButtonElement>(null);
  const compTabRef = React.useRef<HTMLButtonElement>(null);

  const tabs: Array<{
    key: 'languages' | 'activity' | 'comparison';
    ref: React.RefObject<HTMLButtonElement | null>;
  }> = [
    { key: 'languages', ref: langTabRef },
    { key: 'activity', ref: actTabRef },
    { key: 'comparison', ref: compTabRef },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = tabs.findIndex((t) => t.key === activeSubTab);
      const nextIndex =
        e.key === 'ArrowRight'
          ? (currentIndex + 1) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length;

      const nextTab = tabs[nextIndex];
      setActiveSubTab(nextTab.key);
      nextTab.ref.current?.focus();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#30363d]">
        <div
          role="tablist"
          aria-label="Analytics view options"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#161b22] border border-[#30363d] rounded-xl"
        >
          <button
            ref={langTabRef}
            id="subtab-languages"
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'languages'}
            aria-controls="subtabpanel-languages"
            tabIndex={activeSubTab === 'languages' ? 0 : -1}
            onClick={() => setActiveSubTab('languages')}
            onKeyDown={handleKeyDown}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              activeSubTab === 'languages'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>Languages Distribution</span>
          </button>

          <button
            ref={actTabRef}
            id="subtab-activity"
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'activity'}
            aria-controls="subtabpanel-activity"
            tabIndex={activeSubTab === 'activity' ? 0 : -1}
            onClick={() => setActiveSubTab('activity')}
            onKeyDown={handleKeyDown}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              activeSubTab === 'activity'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>Activity Cadence</span>
          </button>

          <button
            ref={compTabRef}
            id="subtab-comparison"
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'comparison'}
            aria-controls="subtabpanel-comparison"
            tabIndex={activeSubTab === 'comparison' ? 0 : -1}
            onClick={() => setActiveSubTab('comparison')}
            onKeyDown={handleKeyDown}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              activeSubTab === 'comparison'
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Repository Comparisons</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs text-neutral-400 font-mono">
          Public Developer Intelligence
        </span>
      </div>

      {/* Render selected view wrapped in accessible tabpanel */}
      <div
        role="tabpanel"
        id="subtabpanel-languages"
        aria-labelledby="subtab-languages"
        hidden={activeSubTab !== 'languages'}
      >
        {activeSubTab === 'languages' && (
          <LanguageAnalyticsView
            repos={repos}
            totalPublicRepos={totalPublicRepos}
            username={username}
            hasMoreRepos={hasMoreRepos}
            isLoadingMore={isLoadingMore}
            onFetchMoreRepos={onFetchMoreRepos}
          />
        )}
      </div>

      <div
        role="tabpanel"
        id="subtabpanel-activity"
        aria-labelledby="subtab-activity"
        hidden={activeSubTab !== 'activity'}
      >
        {activeSubTab === 'activity' && (
          <ActivityAnalyticsView
            repos={repos}
            totalPublicRepos={totalPublicRepos}
            username={username}
            hasMoreRepos={hasMoreRepos}
            isLoadingMore={isLoadingMore}
            onFetchMoreRepos={onFetchMoreRepos}
            onSelectRepo={onSelectRepo}
          />
        )}
      </div>

      <div
        role="tabpanel"
        id="subtabpanel-comparison"
        aria-labelledby="subtab-comparison"
        hidden={activeSubTab !== 'comparison'}
      >
        {activeSubTab === 'comparison' && (
          <RepoComparisonView
            repos={repos}
            totalPublicRepos={totalPublicRepos}
            username={username}
            hasMoreRepos={hasMoreRepos}
            isLoadingMore={isLoadingMore}
            onFetchMoreRepos={onFetchMoreRepos}
            onSelectRepo={onSelectRepo}
          />
        )}
      </div>
    </div>
  );
};

