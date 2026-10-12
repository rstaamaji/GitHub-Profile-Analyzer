import React from 'react';
import { Activity, ShieldCheck, Terminal } from 'lucide-react';
import type { RateLimitInfo } from '../../types/github';

interface HeaderProps {
  rateLimit?: RateLimitInfo | null;
  onResetToHome?: () => void;
  activeUsername?: string;
}

export const Header: React.FC<HeaderProps> = ({ rateLimit, onResetToHome, activeUsername }) => {
  return (
    <header className="border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={onResetToHome}
          type="button"
          aria-label="GitHub Profile Analyzer Home"
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80 rounded-lg p-1 cursor-pointer group transition"
        >
          <div className="w-8 h-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-white group-hover:border-[#8b949e] transition">
            <Terminal className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-neutral-100 flex items-center gap-1.5">
              <span>GitHub Profile Analyzer</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-[#21262d] text-emerald-400 border border-emerald-500/30 rounded">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 hidden sm:block">
              {activeUsername ? (
                <span className="text-neutral-400 font-mono">Analyzing @{activeUsername}</span>
              ) : (
                'Public Developer Intelligence'
              )}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {rateLimit && (
            <div
              title={`API calls remaining: ${rateLimit.remaining}/${rateLimit.limit}`}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#161b22] border border-[#30363d] text-xs font-mono text-neutral-300"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-neutral-400">Rate Limit:</span>
              <span className={rateLimit.remaining < 10 ? 'text-amber-400 font-bold' : 'text-neutral-200'}>
                {rateLimit.remaining}
              </span>
              <span className="text-neutral-500">/ {rateLimit.limit}</span>
            </div>
          )}

          <a
            href="https://docs.github.com/en/rest"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>GitHub REST v3</span>
          </a>
        </div>
      </div>
    </header>
  );
};
