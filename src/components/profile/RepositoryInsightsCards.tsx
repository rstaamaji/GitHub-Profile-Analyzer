import React from 'react';
import {
  Star,
  GitFork,
  ExternalLink,
  Code2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { GitHubRepo } from '../../types/github';

interface RepositoryInsightsCardsProps {
  mostStarredRepo: GitHubRepo | null;
  mostRecentlyPushedRepo: GitHubRepo | null;
  topLanguage: { language: string; count: number; percentage: number; color: string } | null;
  onSelectRepo?: (repo: GitHubRepo) => void;
  onNavigateToTab?: (tab: 'repositories' | 'analytics') => void;
}

export const RepositoryInsightsCards: React.FC<RepositoryInsightsCardsProps> = React.memo(({
  mostStarredRepo,
  mostRecentlyPushedRepo,
  topLanguage,
  onSelectRepo,
  onNavigateToTab,
}) => {
  return (
    <section aria-labelledby="repo-insights-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 id="repo-insights-heading" className="text-sm font-bold text-neutral-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Repository Insights</span>
        </h3>
        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab('analytics')}
            className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md px-1 py-0.5"
          >
            <span>Lihat Analisis Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Most Starred Repository */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bintang Terbanyak</span>
              </span>
              <span className="font-mono text-neutral-300 font-bold">
                {mostStarredRepo ? `${mostStarredRepo.stargazers_count.toLocaleString()} stars` : '0 stars'}
              </span>
            </div>

            {mostStarredRepo ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {onSelectRepo ? (
                    <button
                      type="button"
                      onClick={() => onSelectRepo(mostStarredRepo)}
                      className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline text-left cursor-pointer truncate max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                    >
                      {mostStarredRepo.name}
                    </button>
                  ) : (
                    <a
                      href={mostStarredRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${mostStarredRepo.name} on GitHub (opens in a new tab)`}
                      className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate max-w-full inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                    >
                      <span>{mostStarredRepo.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-3">
                  {mostStarredRepo.description || 'Tidak ada deskripsi.'}
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-400 italic">Belum ada repository.</p>
            )}
          </div>

          {mostStarredRepo && (
            <div className="flex items-center gap-3 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
              {mostStarredRepo.language && (
                <span className="flex items-center gap-1 text-neutral-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{mostStarredRepo.language}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-neutral-400">
                <GitFork className="w-3 h-3" aria-hidden="true" />
                <span>{mostStarredRepo.forks_count}</span>
              </span>
            </div>
          )}
        </div>

        {/* 2. Most Recently Pushed Repository */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Baru Diperbarui</span>
              </span>
              <span className="font-mono text-neutral-400 text-[11px]">
                {mostRecentlyPushedRepo
                  ? new Date(mostRecentlyPushedRepo.pushed_at || mostRecentlyPushedRepo.updated_at).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' }
                    )
                  : '-'}
              </span>
            </div>

            {mostRecentlyPushedRepo ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {onSelectRepo ? (
                    <button
                      type="button"
                      onClick={() => onSelectRepo(mostRecentlyPushedRepo)}
                      className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline text-left cursor-pointer truncate max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                    >
                      {mostRecentlyPushedRepo.name}
                    </button>
                  ) : (
                    <a
                      href={mostRecentlyPushedRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${mostRecentlyPushedRepo.name} on GitHub (opens in a new tab)`}
                      className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline truncate max-w-full inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                    >
                      <span>{mostRecentlyPushedRepo.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-3">
                  {mostRecentlyPushedRepo.description || 'Tidak ada deskripsi.'}
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-400 italic">Belum ada repository.</p>
            )}
          </div>

          {mostRecentlyPushedRepo && (
            <div className="flex items-center gap-3 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
              {mostRecentlyPushedRepo.language && (
                <span className="flex items-center gap-1 text-neutral-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span>{mostRecentlyPushedRepo.language}</span>
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-neutral-400">
                <Star className="w-3 h-3" aria-hidden="true" />
                <span>{mostRecentlyPushedRepo.stargazers_count}</span>
              </span>
            </div>
          )}
        </div>

        {/* 3. Primary Programming Language */}
        <div className="p-5 rounded-xl bg-[#161b22] border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/40 transition">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-400 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bahasa Utama</span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold text-xs">
                {topLanguage ? `${topLanguage.percentage}% share` : 'N/A'}
              </span>
            </div>

            {topLanguage ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: topLanguage.color }}
                    aria-hidden="true"
                  />
                  <h4 className="text-xl font-bold font-mono text-neutral-100">
                    {topLanguage.language}
                  </h4>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                  Digunakan sebagai bahasa utama pada <strong className="text-neutral-200">{topLanguage.count}</strong> repository original yang telah dianalisis.
                </p>
              </>
            ) : (
              <p className="text-xs text-neutral-400 italic">Tidak ada bahasa utama terdeteksi.</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#21262d] text-[11px] text-neutral-400">
            * Dihitung berdasarkan jumlah repository yang memiliki tag bahasa.
          </div>
        </div>
      </div>
    </section>
  );
});

RepositoryInsightsCards.displayName = 'RepositoryInsightsCards';

