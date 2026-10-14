import React from 'react';
import {
  Star,
  GitFork,
  CircleDot,
  ExternalLink,
  Archive,
  GitFork as ForkIcon,
  Tag,
  Scale,
} from 'lucide-react';
import type { GitHubRepo } from '../../types/github';

interface RepoCardProps {
  repo: GitHubRepo;
  onSelectRepo?: (repo: GitHubRepo) => void;
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
  Dart: '#00B4AB',
  Vue: '#41b883',
  Scala: '#c22d40',
};

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onSelectRepo }) => {
  const updatedDate = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      aria-label={`Repository ${repo.name}`}
      className={`flex flex-col justify-between p-5 rounded-xl bg-[#161b22] border transition duration-150 ${
        repo.archived
          ? 'border-amber-900/40 bg-[#161b22]/70 opacity-90'
          : 'border-[#30363d] hover:border-[#8b949e]/50'
      }`}
    >
      <div>
        {/* Card Header: Name + Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {onSelectRepo ? (
                <button
                  type="button"
                  onClick={() => onSelectRepo(repo)}
                  className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5 break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm text-left cursor-pointer"
                >
                  <span>{repo.name}</span>
                </button>
              ) : (
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5 break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                >
                  <span>{repo.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                </a>
              )}

              {/* Public Badge */}
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full border border-[#30363d] text-neutral-400 bg-[#21262d]">
                Public
              </span>
            </div>
          </div>

            {/* Fork / Archived Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onSelectRepo && (
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${repo.name} on GitHub (opens in a new tab)`}
                title="Open on GitHub"
                className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {repo.fork && (
              <span
                title="Forked repository"
                className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#21262d] text-neutral-400 border border-[#30363d]"
              >
                <ForkIcon className="w-3 h-3 text-neutral-400" aria-hidden="true" />
                <span>Fork</span>
              </span>
            )}
            {repo.archived && (
              <span
                title="Archived repository: read-only"
                className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/40"
              >
                <Archive className="w-3 h-3" aria-hidden="true" />
                <span>Archived</span>
              </span>
            )}
          </div>
        </div>


        {/* Repository Description */}
        {repo.description ? (
          <p className="text-xs text-neutral-300 leading-relaxed mb-4 line-clamp-2">
            {repo.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-500 italic mb-4">No description provided</p>
        )}

        {/* Topics / Tags if available */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="Repository topics">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-500/30"
              >
                <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                <span>{topic}</span>
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] font-mono text-neutral-500 self-center">
                +{repo.topics.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Metadata Metrics */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
        {/* Primary Language */}
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: LANGUAGE_COLORS[repo.language] || '#8b949e',
              }}
              aria-hidden="true"
            />
            <span>{repo.language}</span>
          </div>
        )}

        {/* Stars */}
        <div
          title={`${repo.stargazers_count.toLocaleString()} stars`}
          className="flex items-center gap-1 text-neutral-300"
        >
          <Star className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          <span className="font-mono">{repo.stargazers_count.toLocaleString()}</span>
        </div>

        {/* Forks */}
        <div
          title={`${repo.forks_count.toLocaleString()} forks`}
          className="flex items-center gap-1 text-neutral-300"
        >
          <GitFork className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          <span className="font-mono">{repo.forks_count.toLocaleString()}</span>
        </div>

        {/* Open Issues */}
        {repo.open_issues_count > 0 && (
          <div
            title={`${repo.open_issues_count.toLocaleString()} open issues`}
            className="flex items-center gap-1 text-neutral-300"
          >
            <CircleDot className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            <span className="font-mono">{repo.open_issues_count.toLocaleString()}</span>
          </div>
        )}

        {/* License */}
        {repo.license && (
          <div
            title={`License: ${repo.license.name}`}
            className="hidden sm:flex items-center gap-1 text-neutral-400 truncate max-w-[120px]"
          >
            <Scale className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{repo.license.spdx_id || repo.license.name}</span>
          </div>
        )}

        {/* Last updated */}
        <div className="ml-auto text-[11px] text-neutral-400">Updated {updatedDate}</div>
      </div>
    </article>
  );
};
