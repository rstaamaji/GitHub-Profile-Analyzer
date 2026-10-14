import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching GitHub profile and repository metrics...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="w-full max-w-5xl mx-auto space-y-8 motion-safe:animate-pulse"
    >
      {/* Status Banner */}
      <div className="flex items-center justify-center gap-2.5 py-2 px-4 rounded-xl bg-[#161b22] border border-[#30363d] text-neutral-300 text-xs sm:text-sm font-medium">
        <Loader2 className="w-4 h-4 motion-safe:animate-spin text-emerald-400 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>

      {/* 1. Profile Header Skeleton (matches ProfileHeader.tsx) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#21262d] border-2 border-[#30363d] shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 w-full max-w-xs">
                <div className="h-6 bg-[#21262d] rounded-md w-2/3" />
                <div className="h-4 bg-[#21262d] rounded-md w-1/3" />
              </div>
              <div className="h-8 bg-[#21262d] rounded-lg w-28 shrink-0 hidden sm:block" />
            </div>
            <div className="h-4 bg-[#21262d] rounded-md w-4/5" />
            <div className="h-4 bg-[#21262d] rounded-md w-3/5" />
            <div className="flex flex-wrap gap-4 pt-3 border-t border-[#21262d]">
              <div className="h-3.5 bg-[#21262d] rounded w-24" />
              <div className="h-3.5 bg-[#21262d] rounded w-24" />
              <div className="h-3.5 bg-[#21262d] rounded w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. 6-Card Key Statistics Skeleton Grid (matches ProfileOverview 6-card grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 bg-[#21262d] rounded w-16" />
              <div className="w-4 h-4 bg-[#21262d] rounded" />
            </div>
            <div className="h-7 bg-[#21262d] rounded w-14" />
            <div className="h-2.5 bg-[#21262d] rounded w-20" />
          </div>
        ))}
      </div>

      {/* 3. 3-Column Repository Insights Skeleton (matches RepositoryInsightsCards.tsx) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#21262d] rounded w-36" />
          <div className="h-3.5 bg-[#21262d] rounded w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 bg-[#21262d] rounded w-24" />
                <div className="h-3 bg-[#21262d] rounded w-12" />
              </div>
              <div className="h-5 bg-[#21262d] rounded w-3/4" />
              <div className="h-3.5 bg-[#21262d] rounded w-full" />
              <div className="pt-3 border-t border-[#21262d] flex gap-3">
                <div className="h-3 bg-[#21262d] rounded w-16" />
                <div className="h-3 bg-[#21262d] rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Repositories Grid Skeleton (matches 2-col RepoCard / RecentActivityList) */}
      <div className="space-y-4">
        <div className="h-4 bg-[#21262d] rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-[#21262d] rounded w-1/2" />
                <div className="h-4 bg-[#21262d] rounded w-14" />
              </div>
              <div className="h-3.5 bg-[#21262d] rounded w-full" />
              <div className="h-3.5 bg-[#21262d] rounded w-2/3" />
              <div className="pt-3 border-t border-[#21262d] flex items-center gap-4">
                <div className="h-3 bg-[#21262d] rounded w-16" />
                <div className="h-3 bg-[#21262d] rounded w-10" />
                <div className="h-3 bg-[#21262d] rounded w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

