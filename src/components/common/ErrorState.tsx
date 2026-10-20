import React from 'react';
import { AlertCircle, Clock, FileWarning, RefreshCw, RotateCcw, ServerOff, WifiOff } from 'lucide-react';
import type { ApiError } from '../../types/github';

interface ErrorStateProps {
  error: ApiError | null;
  searchedUsername?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onRestorePrevious?: () => void;
  previousUsername?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  searchedUsername,
  onRetry,
  onReset,
  onRestorePrevious,
  previousUsername,
}) => {
  const isAuthError = Boolean(error?.isAuthError) || error?.status === 401;
  const isRateLimit =
    Boolean(error?.isRateLimit) ||
    (!isAuthError && (error?.status === 403 || error?.status === 429));
  const isNotFound = error?.status === 404;
  const isServerError = Boolean(error?.isServerError) || (Boolean(error?.status) && (error?.status ?? 0) >= 500);
  const isInvalidResponse = Boolean(error?.isInvalidResponse);
  const isNetworkError = !error?.status && !isInvalidResponse;

  const title = isNotFound
    ? 'GitHub User Not Found'
    : isRateLimit
      ? 'GitHub API Rate Limit Reached'
      : isAuthError
        ? 'GitHub Access Restricted'
        : isServerError
          ? `GitHub Service Outage (HTTP ${error?.status || 500})`
          : isInvalidResponse
            ? 'Unexpected API Response Format'
            : isNetworkError
              ? 'Network Connection Issue'
              : 'Unable to Retrieve Profile';

  const resetTimeFormatted =
    isRateLimit && error?.resetTime instanceof Date && !Number.isNaN(error.resetTime.getTime())
      ? error.resetTime.toLocaleTimeString()
      : null;

  return (
    <div
      role="alert"
      className="w-full max-w-xl mx-auto my-8 p-6 md:p-8 rounded-xl bg-[#161b22] border border-[#30363d] text-center shadow-lg space-y-4"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
        {isRateLimit ? (
          <Clock className="w-6 h-6 text-amber-400" aria-hidden="true" />
        ) : isServerError ? (
          <ServerOff className="w-6 h-6 text-amber-400" aria-hidden="true" />
        ) : isInvalidResponse ? (
          <FileWarning className="w-6 h-6 text-amber-400" aria-hidden="true" />
        ) : isNetworkError ? (
          <WifiOff className="w-6 h-6 text-red-400" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-400" aria-hidden="true" />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>

        {searchedUsername && isNotFound && (
          <p className="text-xs font-mono text-neutral-400">
            Queried handle: <span className="text-neutral-200">@{searchedUsername}</span>
          </p>
        )}

        <p className="text-sm text-neutral-300 leading-relaxed max-w-md mx-auto">
          {error?.message ||
            'An unexpected error occurred while communicating with the GitHub REST API.'}
        </p>

        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          {isNotFound
            ? 'Double-check the username spelling, or select a featured developer after returning to the home view.'
            : isRateLimit
              ? 'Public GitHub API allows 60 unauthenticated requests per hour. Previously visited profiles remain accessible from session cache until the quota resets.'
              : isAuthError
                ? 'This resource requires elevated permissions or has been restricted by GitHub.'
                : isServerError
                  ? 'GitHub servers are currently undergoing technical difficulties or high load. Please try again shortly.'
                  : isInvalidResponse
                    ? 'The API returned an unexpected or malformed payload. Please try again.'
                    : 'Verify your internet connection and click Try Again to repeat the request.'}
        </p>
      </div>

      {isRateLimit && resetTimeFormatted && (
        <div className="py-2 px-3 bg-[#0d1117] border border-[#30363d] rounded-md inline-block text-xs text-neutral-300">
          Quota resets at:{' '}
          <span className="font-mono text-amber-400">{resetTimeFormatted}</span>
        </div>
      )}

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22]"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        )}

        {onRestorePrevious && previousUsername && (
          <button
            onClick={onRestorePrevious}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-[#30363d] rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restore @{previousUsername}</span>
          </button>
        )}

        {onReset && (
          <button
            onClick={onReset}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-neutral-200 border border-[#30363d] rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161b22]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Back to Home</span>
          </button>
        )}
      </div>
    </div>
  );
};

