import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import type { ApiError } from '../../types/github';

interface ErrorStateProps {
  error: ApiError | null;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const isRateLimit = error?.status === 403;
  const isNotFound = error?.status === 404;

  return (
    <div className="w-full max-w-xl mx-auto my-12 p-6 md:p-8 rounded-xl bg-[#161b22] border border-[#30363d] text-center shadow-lg">
      <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
        {isRateLimit ? <Clock className="w-6 h-6 text-amber-400" /> : <AlertCircle className="w-6 h-6" />}
      </div>

      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        {isNotFound ? 'User Not Found' : isRateLimit ? 'API Rate Limit Reached' : 'Unable to Retrieve Profile'}
      </h3>

      <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
        {error?.message || 'An unexpected error occurred while communicating with the GitHub API.'}
      </p>

      {isRateLimit && error?.resetTime && (
        <div className="mb-6 py-2 px-3 bg-[#0d1117] border border-[#30363d] rounded-md inline-block text-xs text-neutral-300">
          Limit reset scheduled for: <span className="font-mono text-amber-400">{error.resetTime.toLocaleTimeString()}</span>
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-neutral-200 border border-[#30363d] rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};
