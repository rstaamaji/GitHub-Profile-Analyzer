import React from 'react';
import { Search, Code2, GitFork, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSelectSuggestion?: (username: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    { username: 'torvalds', label: 'Linus Torvalds', desc: 'Creator of Linux & Git' },
    { username: 'gaearon', label: 'Dan Abramov', desc: 'React core contributor' },
    { username: 'sindresorhus', label: 'Sindre Sorhus', desc: 'Prolific OSS creator' },
    { username: 'tj', label: 'TJ Holowaychuk', desc: 'Apex & Express creator' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto my-12 text-center px-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-neutral-300 mb-6 shadow-sm">
        <Search className="w-6 h-6 text-neutral-400" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mb-3">
        Analyze Any Public GitHub Developer Profile
      </h2>
      <p className="text-neutral-400 text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
        Enter a GitHub handle above to inspect public repository activity, top technologies, 
        and key developer metrics with real GitHub REST data.
      </p>

      {/* Feature pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]/80">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-emerald-400 mb-3">
            <Code2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200 mb-1">Authentic Metrics</h3>
          <p className="text-xs text-neutral-400">
            Real follower, star, and repository calculations directly from official GitHub REST APIs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]/80">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-blue-400 mb-3">
            <GitFork className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200 mb-1">Repository Pulse</h3>
          <p className="text-xs text-neutral-400">
            Inspect top starred works, primary coding languages, and recent push momentum.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]/80">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-purple-400 mb-3">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200 mb-1">Portfolio Ready</h3>
          <p className="text-xs text-neutral-400">
            Clean, decoupled architecture designed for production-level frontend engineering.
          </p>
        </div>
      </div>

      {/* Suggested profiles */}
      {onSelectSuggestion && (
        <div className="border-t border-[#30363d] pt-6">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Try a featured developer profile
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((item) => (
              <button
                key={item.username}
                onClick={() => onSelectSuggestion(item.username)}
                type="button"
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <span className="text-neutral-500 group-hover:text-emerald-400 transition" aria-hidden="true">@</span>
                <span>{item.username}</span>
                <span className="text-neutral-500 text-[11px] hidden sm:inline">({item.label})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
