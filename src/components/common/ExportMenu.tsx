import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import type { GitHubRepo, GitHubUser, DashboardOverviewStats } from '../../types/github';
import {
  generateProfileSummaryCsv,
  generateRepositoriesCsv,
  generateProfileJson,
  buildExportFilename,
  triggerBlobDownload,
} from '../../utils/exportUtils';

export interface ExportMenuProps {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  stats?: DashboardOverviewStats | null;
  /** 'full' displays all export options; 'repositories-only' focuses on repo exports */
  mode?: 'full' | 'repositories-only';
  /** Button visual style variant */
  variant?: 'primary' | 'secondary' | 'compact';
  align?: 'left' | 'right';
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  user,
  repos,
  stats,
  mode = 'full',
  variant = 'secondary',
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    },
    []
  );

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const triggerFeedback = useCallback((msg: string) => {
    setFeedbackMessage(msg);
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  }, []);

  const handleExportProfileCsv = useCallback(() => {
    if (!user) return;
    try {
      const csv = generateProfileSummaryCsv(user, stats);
      const filename = buildExportFilename(user.login, 'profile-summary', 'csv');
      triggerBlobDownload(csv, filename, 'text/csv;charset=utf-8;');
      setIsOpen(false);
      triggerFeedback(`Exported ${filename}`);
    } catch {
      triggerFeedback('Failed to generate profile CSV');
    }
  }, [user, stats, triggerFeedback]);

  const handleExportReposCsv = useCallback(() => {
    if (repos.length === 0) return;
    const exportUsername = user?.login || 'github-user';
    try {
      const csv = generateRepositoriesCsv(repos, exportUsername);
      const filename = buildExportFilename(exportUsername, 'repositories', 'csv');
      triggerBlobDownload(csv, filename, 'text/csv;charset=utf-8;');
      setIsOpen(false);
      triggerFeedback(`Exported ${filename} (${repos.length} repos)`);
    } catch {
      triggerFeedback('Failed to generate repositories CSV');
    }
  }, [user, repos, triggerFeedback]);

  const handleExportFullJson = useCallback(() => {
    if (!user) return;
    try {
      const json = generateProfileJson(user, repos, stats);
      const filename = buildExportFilename(user.login, 'complete-report', 'json');
      triggerBlobDownload(json, filename, 'application/json;charset=utf-8;');
      setIsOpen(false);
      triggerFeedback(`Exported ${filename}`);
    } catch {
      triggerFeedback('Failed to generate complete JSON report');
    }
  }, [user, repos, stats, triggerFeedback]);

  const isDisabled = mode === 'repositories-only' ? repos.length === 0 : !user;

  // Button styles based on variant
  const getButtonClasses = () => {
    if (variant === 'primary') {
      return 'bg-[#238636] hover:bg-[#2ea043] text-white border-transparent';
    }
    if (variant === 'compact') {
      return 'bg-[#21262d] hover:bg-[#30363d] text-neutral-200 hover:text-white border-[#30363d] py-1.5 px-2.5 text-xs';
    }
    return 'bg-[#21262d] hover:bg-[#30363d] text-neutral-200 hover:text-white border-[#30363d] py-1.5 px-3 text-xs';
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef} onKeyDown={handleKeyDown}>
      <div className="inline-flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
          disabled={isDisabled}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={
            mode === 'repositories-only'
              ? 'Export repositories data in CSV or JSON format'
              : 'Export profile and repository analysis data in CSV or JSON format'
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${getButtonClasses()}`}
        >
          <Download className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
          <span>{mode === 'repositories-only' ? 'Export Repos' : 'Export Data'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Transient feedback toast badge */}
        {feedbackMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-medium text-emerald-300 animate-in fade-in"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[220px]">{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-30 mt-2 w-72 sm:w-80 rounded-xl bg-[#161b22] border border-[#30363d] shadow-2xl p-2 space-y-1 focus:outline-none animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-3 py-2 border-b border-[#21262d] mb-1">
            <p className="text-xs font-semibold text-neutral-200">Export Analysis Data</p>
            <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
              Available data for <span className="font-mono text-neutral-300">@{user?.login}</span>
            </p>
          </div>

          {/* Option 1: Profile Summary (CSV) */}
          {mode === 'full' && (
            <button
              type="button"
              role="menuitem"
              onClick={handleExportProfileCsv}
              className="w-full text-left p-2.5 rounded-lg hover:bg-[#21262d] flex items-start gap-3 transition cursor-pointer group focus:outline-none focus:bg-[#21262d]"
            >
              <div className="p-2 rounded-md bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-900/60">
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-neutral-100 group-hover:text-emerald-400 transition-colors">
                  Profile Summary (CSV)
                </div>
                <div className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                  Single-row spreadsheet with account info, bio, stats, and overview metrics.
                </div>
              </div>
            </button>
          )}

          {/* Option 2: Repositories List (CSV) */}
          <button
            type="button"
            role="menuitem"
            onClick={handleExportReposCsv}
            disabled={repos.length === 0}
            className="w-full text-left p-2.5 rounded-lg hover:bg-[#21262d] flex items-start gap-3 transition cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-[#21262d]"
          >
            <div className="p-2 rounded-md bg-sky-950/50 border border-sky-500/30 text-sky-400 shrink-0 mt-0.5 group-hover:bg-sky-900/60">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-100 group-hover:text-sky-400 transition-colors flex items-center justify-between">
                <span>Repositories List (CSV)</span>
                <span className="text-[10px] font-mono text-neutral-400 bg-[#21262d] px-1.5 py-0.5 rounded">
                  {repos.length} {repos.length === 1 ? 'repo' : 'repos'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                {repos.length > 0 ? (
                  <>Table of all loaded repositories with stars, forks, languages, and dates.</>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No repositories loaded yet
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Option 3: Complete Report (JSON) */}
          <button
            type="button"
            role="menuitem"
            onClick={handleExportFullJson}
            className="w-full text-left p-2.5 rounded-lg hover:bg-[#21262d] flex items-start gap-3 transition cursor-pointer group focus:outline-none focus:bg-[#21262d]"
          >
            <div className="p-2 rounded-md bg-purple-950/50 border border-purple-500/30 text-purple-400 shrink-0 mt-0.5 group-hover:bg-purple-900/60">
              <FileCode className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-100 group-hover:text-purple-400 transition-colors">
                Complete Report (JSON)
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                Structured JSON schema containing complete profile, aggregate metrics, and repository dataset.
              </div>
            </div>
          </button>

          {/* Dataset Status Note */}
          {user && stats?.isPartial && (
            <div className="p-2 mt-1 rounded bg-[#0d1117] border border-[#21262d] text-[10px] text-amber-300/90 leading-tight">
              Notice: Only {repos.length} of {user.public_repos} repositories are loaded. Use &quot;Load more repositories&quot; before exporting if you need the complete list.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
