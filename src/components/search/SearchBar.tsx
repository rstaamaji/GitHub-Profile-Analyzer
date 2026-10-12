import React, { useState } from 'react';
import { Search, ArrowRight, X, Command } from 'lucide-react';

interface SearchBarProps {
  onSearch: (username: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  hasActiveData?: boolean;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  initialValue = '',
  hasActiveData = false,
  onClear,
}) => {
  const [username, setUsername] = useState(initialValue);
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);

  // Sync if initialValue changes externally without cascading effect setState
  if (prevInitialValue !== initialValue) {
    setPrevInitialValue(initialValue);
    setUsername(initialValue);
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim();
    if (clean) {
      onSearch(clean);
    }
  };

  const handleClear = () => {
    setUsername('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="GitHub profile search"
        className="relative group"
      >
        <div className="relative flex items-center">
          {/* Leading search icon */}
          <label htmlFor="github-username-input" className="sr-only">
            GitHub username
          </label>
          <div
            className="absolute left-4.5 pointer-events-none text-neutral-400 group-focus-within:text-emerald-400 transition-colors"
            aria-hidden="true"
          >
            <Search className="w-5 h-5" />
          </div>

          {/* Search input field */}
          <input
            id="github-username-input"
            type="text"
            name="username"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Search GitHub username (e.g. torvalds, vercel, shadcn)..."
            disabled={isLoading}
            className="w-full bg-[#161b22] text-neutral-100 placeholder-neutral-500 pl-12 pr-28 sm:pr-36 py-3.5 rounded-xl border border-[#30363d] focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-emerald-500/40 text-sm sm:text-base font-normal transition duration-150 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {/* Action buttons on the right */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {username && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear username input"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              aria-label="Analyze GitHub Profile"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg transition duration-150 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22]"
            >
              <span>{isLoading ? 'Analyzing' : 'Analyze'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Input helper & keyboard shortcut note */}
        <div className="mt-2.5 px-1 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <span>Direct GitHub REST v3 queries</span>
            {hasActiveData && (
              <span className="text-emerald-400 font-mono text-[11px]">• Profile active</span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] flex items-center gap-0.5">
              <Command className="w-3 h-3 text-neutral-400" />
              <span>Enter to query</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};
