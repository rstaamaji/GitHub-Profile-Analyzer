import React from 'react';
import { Code, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#30363d] bg-[#0d1117] mt-auto py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-neutral-400" aria-hidden="true" />
          <span>Built with React 19, TypeScript, Vite & Tailwind CSS</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Data provided directly by GitHub REST API</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub website (opens in a new tab)"
            className="hover:text-neutral-200 transition flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
};

