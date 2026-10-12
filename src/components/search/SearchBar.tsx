import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch: (username: string) => void;
  isLoading?: boolean;
  initialValue?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  initialValue = '',
}) => {
  const [username, setUsername] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSearch(username.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-neutral-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter a GitHub username (e.g. torvalds, vercel)..."
          disabled={isLoading}
          className="w-full bg-[#161b22] text-neutral-100 placeholder-neutral-500 pl-12 pr-28 py-3.5 rounded-xl border border-[#30363d] focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 text-sm md:text-base transition duration-150 shadow-inner"
        />
        <div className="absolute right-2">
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition duration-150 cursor-pointer shadow-sm"
          >
            <span>Analyze</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};
