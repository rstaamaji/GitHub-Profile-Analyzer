import React, { useState } from 'react';
import { Code2, Activity } from 'lucide-react';
import type { GitHubRepo } from '../../types/github';
import { LanguageAnalyticsView } from './LanguageAnalyticsView';
import { ActivityAnalyticsView } from './ActivityAnalyticsView';

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
  const [activeSubTab, setActiveSubTab] = useState<'languages' | 'activity'>('languages');
  const langTabRef = React.useRef<HTMLButtonElement>(null);
  const actTabRef = React.useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (activeSubTab === 'languages') {
        setActiveSubTab('activity');
        actTabRef.current?.focus();
      } else {
        setActiveSubTab('languages');
        langTabRef.current?.focus();
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* Sub-navigation Tabs: Languages vs Repository Activity */}
      <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
        <div
          role="tablist"
          aria-label="Analytics view options"
          className="flex items-center gap-1.5 p-1 bg-[#161b22] border border-[#30363d] rounded-xl"
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
    </div>
  );
};
