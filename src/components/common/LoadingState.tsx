import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching GitHub profile and repository metrics...',
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 space-y-8 animate-pulse">
      {/* Indicator message */}
      <div className="flex items-center justify-center gap-3 text-neutral-400 text-sm font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
        <span>{message}</span>
      </div>

      {/* User Header Skeleton */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#21262d] shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-6 bg-[#21262d] rounded-md w-1/3" />
          <div className="h-4 bg-[#21262d] rounded-md w-1/4" />
          <div className="h-4 bg-[#21262d] rounded-md w-3/4 pt-2" />
          <div className="flex gap-4 pt-3">
            <div className="h-4 bg-[#21262d] rounded w-20" />
            <div className="h-4 bg-[#21262d] rounded w-20" />
            <div className="h-4 bg-[#21262d] rounded w-24" />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3"
          >
            <div className="h-3.5 bg-[#21262d] rounded w-1/2" />
            <div className="h-7 bg-[#21262d] rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Repositories Skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-[#21262d] rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-3"
            >
              <div className="h-5 bg-[#21262d] rounded w-2/3" />
              <div className="h-3.5 bg-[#21262d] rounded w-full" />
              <div className="h-3.5 bg-[#21262d] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
