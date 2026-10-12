import React from 'react';
import { Star, GitFork, ExternalLink } from 'lucide-react';
import type { GitHubRepo } from '../../types/github';

interface RepoListProps {
  repos: GitHubRepo[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
};

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
          <div
            key={repo.id}
            className="flex flex-col justify-between p-5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#8b949e]/40 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-blue-400 hover:underline flex items-center gap-1.5 break-all"
                >
                  <span>{repo.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </a>

                {repo.fork && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#21262d] text-neutral-400 border border-[#30363d] shrink-0">
                    Fork
                  </span>
                )}
              </div>

              {repo.description && (
                <p className="text-xs text-neutral-300 leading-relaxed mb-4 line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
              {repo.language && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: LANGUAGE_COLORS[repo.language] || '#8b949e',
                    }}
                  />
                  <span>{repo.language}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-neutral-300">
                <Star className="w-3.5 h-3.5 text-neutral-400" />
                <span>{repo.stargazers_count.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-1 text-neutral-300">
                <GitFork className="w-3.5 h-3.5 text-neutral-400" />
                <span>{repo.forks_count.toLocaleString()}</span>
              </div>

              <div className="ml-auto text-[11px] text-neutral-500">
                Updated {new Date(repo.pushed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
