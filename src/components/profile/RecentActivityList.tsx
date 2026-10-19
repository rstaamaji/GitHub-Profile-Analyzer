import React from 'react';
import { Clock, Star, GitFork, ExternalLink, ArrowRight, Info } from 'lucide-react';
import type { GitHubRepo } from '../../types/github';
import { getSafeRepoTimestamp } from '../../utils/repoFilterSort';

interface RecentActivityListProps {
  repos: GitHubRepo[];
  onSelectRepo?: (repo: GitHubRepo) => void;
  onViewAllRepos?: () => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = React.memo(({
  repos,
  onSelectRepo,
  onViewAllRepos,
}) => {
  // Sort deterministically: latest push desc, then name asc
  const recentRepos = React.useMemo(() => {
    return [...repos]
      .sort((a, b) => {
        const timeA = getSafeRepoTimestamp(a);
        const timeB = getSafeRepoTimestamp(b);
        if (timeB !== timeA) return timeB - timeA;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [repos]);

  if (recentRepos.length === 0) {
    return (
      <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl text-neutral-400 text-sm">
        Belum ada repository yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <section aria-labelledby="recent-activity-section-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 id="recent-activity-section-heading" className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span>Aktivitas Repository Terbaru</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Daftar repository publik yang baru saja menerima push kode atau pembaruan.
          </p>
        </div>

        {onViewAllRepos && (
          <button
            type="button"
            onClick={onViewAllRepos}
            className="text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer font-medium self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md px-1 py-0.5"
          >
            <span>Buka Repository Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentRepos.map((repo) => {
          const pushDate = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={repo.id}
              className="flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-[#8b949e]/40 transition"
            >
              <div>
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
                          aria-label={`Buka ${repo.name} di GitHub (buka di tab baru)`}
                          className="text-base font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1.5 break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm"
                        >
                          <span>{repo.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                        </a>
                      )}

                      {repo.fork && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded bg-[#21262d] text-neutral-400 border border-[#30363d]">
                          Fork
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Buka ${repo.name} di GitHub (buka di tab baru)`}
                    title="Buka langsung di GitHub"
                    className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] rounded transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>

                {repo.description ? (
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic mb-3">Tidak ada deskripsi.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
                {repo.language && (
                  <div className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{repo.language}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 font-mono text-neutral-300">
                  <Star className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  <span>{repo.stargazers_count.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1 font-mono text-neutral-300">
                  <GitFork className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  <span>{repo.forks_count.toLocaleString()}</span>
                </div>

                <div className="ml-auto text-[11px] font-mono text-neutral-400">
                  Pushed: {pushDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catatan transparan mengenai makna timestamps */}
      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#21262d] flex items-start gap-2 text-xs text-neutral-400 leading-relaxed">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <strong>Catatan Aktivitas:</strong> Waktu update dan push di atas mencerminkan riwayat event publik pada repository, bukan bukti atau jaminan kontribusi commit personal tunggal.
        </span>
      </div>
    </section>
  );
});

RecentActivityList.displayName = 'RecentActivityList';
