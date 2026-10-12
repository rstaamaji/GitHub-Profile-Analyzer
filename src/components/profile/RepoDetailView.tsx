import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  GitFork,
  Eye,
  CircleDot,
  ExternalLink,
  Calendar,
  Globe,
  Tag,
  Scale,
  Archive,
  GitFork as ForkIcon,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { GitHubRepo, ReadmeData, ApiError } from '../../types/github';
import { githubService } from '../../services/githubService';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface RepoDetailViewProps {
  owner: string;
  repoName: string;
  onBack: () => void;
  cachedRepo?: GitHubRepo | null;
}

export const RepoDetailView: React.FC<RepoDetailViewProps> = ({
  owner,
  repoName,
  onBack,
  cachedRepo,
}) => {
  const [repo, setRepo] = useState<GitHubRepo | null>(cachedRepo || null);
  const [readme, setReadme] = useState<ReadmeData | null>(null);
  const [isLoadingRepo, setIsLoadingRepo] = useState<boolean>(!cachedRepo);
  const [isLoadingReadme, setIsLoadingReadme] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 1. Fetch Repository Details if not already cached or to refresh
    const fetchRepo = async () => {

      try {
        const repoRes = await githubService.getRepoDetail(owner, repoName, controller.signal);
        setRepo(repoRes.data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
          return;
        }
        const apiErr = err as ApiError;
        setError(apiErr);
      } finally {
        setIsLoadingRepo(false);
      }
    };

    // 2. Fetch README Content
    const fetchReadme = async () => {
      setIsLoadingReadme(true);
      try {
        const readmeRes = await githubService.getRepoReadme(owner, repoName, controller.signal);
        setReadme(readmeRes.data);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
          return;
        }
        // README errors (e.g. 404) are handled gracefully without blocking the whole page
        setReadme(null);
      } finally {
        setIsLoadingReadme(false);
      }
    };

    fetchRepo();
    fetchReadme();

    return () => {
      controller.abort();
    };
  }, [owner, repoName]);

  const handleRetry = () => {
    setIsLoadingRepo(true);
    setIsLoadingReadme(true);
    setError(null);
    githubService.getRepoDetail(owner, repoName)
      .then((res) => setRepo(res.data))
      .catch((err) => setError(err as ApiError))
      .finally(() => setIsLoadingRepo(false));

    githubService.getRepoReadme(owner, repoName)
      .then((res) => setReadme(res.data))
      .catch(() => setReadme(null))
      .finally(() => setIsLoadingReadme(false));
  };

  // Error State for Repository Details
  if (error && !repo) {
    return (
      <div className="w-full max-w-4xl mx-auto my-10 p-8 rounded-xl bg-[#161b22] border border-[#30363d] text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">
          Repository Unavailable
        </h3>
        <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
          {error.message || `Unable to load repository ${owner}/${repoName}. It may be private or deleted.`}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-neutral-300 rounded-lg text-xs font-semibold border border-[#30363d] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Repositories</span>
          </button>
          <button
            onClick={handleRetry}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading State while fetching metadata
  if (isLoadingRepo && !repo) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-6 bg-[#21262d] rounded w-36 mb-4" />
        <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="h-8 bg-[#21262d] rounded w-1/3" />
          <div className="h-4 bg-[#21262d] rounded w-2/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-[#21262d] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!repo) return null;

  const createdDate = new Date(repo.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const updatedDate = new Date(repo.pushed_at || repo.updated_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          aria-label="Back to repositories list"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          <span>Back to Repositories</span>
        </button>

        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-neutral-200 hover:text-white transition"
        >
          <span>View on GitHub</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
        </a>
      </div>

      {/* Main Repository Header Card */}
      <section
        aria-labelledby="repo-detail-heading"
        className="p-6 sm:p-8 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-neutral-400 text-sm font-mono">{owner} /</span>
              <h1
                id="repo-detail-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100"
              >
                {repo.name}
              </h1>

              {/* Status Badges */}
              <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-[#30363d] text-neutral-400 bg-[#21262d]">
                {repo.private ? 'Private' : 'Public'}
              </span>

              {repo.fork && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-[#21262d] text-neutral-400 border border-[#30363d]">
                  <ForkIcon className="w-3 h-3 text-neutral-400" aria-hidden="true" />
                  <span>Forked</span>
                </span>
              )}

              {repo.archived && (
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-600/40">
                  <Archive className="w-3 h-3" aria-hidden="true" />
                  <span>Archived</span>
                </span>
              )}
            </div>

            {repo.description ? (
              <p className="text-sm text-neutral-300 leading-relaxed mt-3 max-w-3xl">
                {repo.description}
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic mt-3">No description provided</p>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Stars</span>
              <Star className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {repo.stargazers_count.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Forks</span>
              <GitFork className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {repo.forks_count.toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Watchers</span>
              <Eye className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {(repo.watchers_count || repo.subscribers_count || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
              <span>Open Issues</span>
              <CircleDot className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-100">
              {repo.open_issues_count.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metadata Badges & External Resources */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-neutral-400 pt-3 border-t border-[#21262d]">
          {repo.language && (
            <div className="flex items-center gap-1.5 font-medium text-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{repo.language}</span>
            </div>
          )}

          {repo.license && (
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
              <span>{repo.license.name || repo.license.spdx_id}</span>
            </div>
          )}

          {repo.homepage && (
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
              <a
                href={repo.homepage.startsWith('http') ? repo.homepage : `https://${repo.homepage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 underline underline-offset-2 truncate max-w-[200px]"
              >
                {repo.homepage.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
            <span>Created {createdDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
            <span>Updated {updatedDate}</span>
          </div>
        </div>

        {/* Topics List */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Topics
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Repository topics">
              {repo.topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-950/40 text-blue-300 border border-blue-500/30"
                >
                  <Tag className="w-3 h-3" aria-hidden="true" />
                  <span>{topic}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* README Preview Section */}
      <section
        aria-labelledby="readme-heading"
        className="p-6 sm:p-8 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#30363d] mb-6">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-neutral-400" aria-hidden="true" />
            <h2 id="readme-heading" className="text-base font-bold text-neutral-100">
              README.md
            </h2>
            {readme?.name && (
              <span className="text-[11px] font-mono text-neutral-500">({readme.name})</span>
            )}
          </div>

          {readme?.html_url && (
            <a
              href={readme.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-blue-400 flex items-center gap-1 transition"
            >
              <span>Raw on GitHub</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>

        {isLoadingReadme ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Loading README from repository...</span>
          </div>
        ) : readme && readme.content ? (
          <MarkdownRenderer content={readme.content} />
        ) : (
          <div className="py-8 text-center text-neutral-400 text-xs italic">
            This repository does not have a README or it could not be retrieved.
          </div>
        )}
      </section>
    </div>
  );
};
