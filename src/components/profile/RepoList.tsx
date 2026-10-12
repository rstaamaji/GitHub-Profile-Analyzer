import React from 'react';
import type { GitHubRepo } from '../../types/github';
import { RepoCard } from './RepoCard';

interface RepoListProps {
  repos: GitHubRepo[];
}

export const RepoList: React.FC<RepoListProps> = ({ repos }) => {
  if (repos.length === 0) {
    return (
      <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl text-neutral-400 text-sm">
        No public repositories found for this account.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-200">
          Public Repositories <span className="text-neutral-500 font-normal">({repos.length} loaded)</span>
        </h3>
        <span className="text-xs text-neutral-400">Sorted by recent activity</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
};

