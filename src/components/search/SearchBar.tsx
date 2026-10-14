import React, { useRef, useState } from 'react';
import { Search, ArrowRight, X, Command, Loader2, AlertCircle } from 'lucide-react';

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
  const [emptyHint, setEmptyHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if initialValue changes externally without cascading effect setState
  if (prevInitialValue !== initialValue) {
    setPrevInitialValue(initialValue);
    setUsername(initialValue);
    setEmptyHint(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const clean = username.trim().replace(/^@/, '');
    if (!clean) {
      setEmptyHint('Please enter a GitHub username to analyze.');
      inputRef.current?.focus();
      return;
    }

    setEmptyHint(null);
    onSearch(clean);
  };

  const handleClear = () => {
    setUsername('');
    setEmptyHint(null);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="GitHub profile search"
        className="relative group"
        noValidate
      >
        <div className="relative flex items-center">
          {/* Leading search icon */}
          <label htmlFor="github-username-input" className="sr-only">
            GitHub username
          </label>
          <div
            className="absolute left-4 pointer-events-none text-neutral-400 group-focus-within:text-emerald-400 transition-colors"
            aria-hidden="true"
          >
            <Search className="w-5 h-5" />
          </div>

          {/* Search input field */}
          <input
            ref={inputRef}
            id="github-username-input"
            type="text"
            name="username"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            aria-invalid={Boolean(emptyHint)}
            aria-describedby={emptyHint ? 'search-empty-hint' : 'search-helper-note'}
            value={username}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (emptyHint) {
                  setEmptyHint(null);
                } else if (username) {
                  handleClear();
                }
              }
            }}
            onChange={(e) => {
              setUsername(e.target.value);
              if (emptyHint) setEmptyHint(null);
            }}
            placeholder="Search GitHub username (e.g. torvalds, vercel, shadcn)..."
            disabled={isLoading}
            className={`w-full bg-[#161b22] text-neutral-100 placeholder-neutral-400 pl-12 pr-28 sm:pr-36 py-3.5 rounded-xl border focus:outline-none focus:ring-2 text-sm sm:text-base font-normal transition duration-150 shadow-inner disabled:opacity-60 disabled:cursor-not-allowed ${
              emptyHint
                ? 'border-amber-500/60 focus:border-amber-400 focus:ring-amber-500/30'
                : 'border-[#30363d] focus:border-neutral-400 focus:ring-emerald-500/40'
            }`}
          />

          {/* Action buttons on the right */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {username && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear username input"
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              aria-label="Analyze GitHub Profile"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#238636] hover:bg-[#2ea043] active:bg-[#238636] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg transition duration-150 cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 motion-safe:animate-spin" aria-hidden="true" />
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation feedback for empty input */}
        {emptyHint && (
          <div
            id="search-empty-hint"
            role="alert"
            className="mt-2 px-1 flex items-center gap-1.5 text-xs text-amber-300 text-left"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>{emptyHint}</span>
          </div>
        )}

        {/* Input helper & keyboard shortcut note */}
        <div
          id="search-helper-note"
          className="mt-2.5 px-1 flex items-center justify-between text-xs text-neutral-400"
        >
          <div className="flex items-center gap-1.5">
            <span>Direct GitHub REST v3 queries</span>
            {hasActiveData && (
              <span className="text-emerald-400 font-mono text-[11px]">• Profile active</span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-neutral-300 flex items-center gap-1">
              <Command className="w-3 h-3 text-neutral-400" aria-hidden="true" />
              <span>Enter to query</span>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

