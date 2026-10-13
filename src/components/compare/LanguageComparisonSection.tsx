import React from 'react';
import { Code2, Info, GitFork } from 'lucide-react';
import type {
  LanguageAnalyticsResult,
  LanguageComparisonRow,
} from '../../types/github';
import { LanguageChart } from '../analytics/LanguageChart';

interface LanguageComparisonSectionProps {
  usernameA: string;
  usernameB: string;
  languageAnalyticsA: LanguageAnalyticsResult | null;
  languageAnalyticsB: LanguageAnalyticsResult | null;
  sharedLanguages: string[];
  uniqueLanguagesA: string[];
  uniqueLanguagesB: string[];
  languageRows: LanguageComparisonRow[];
  excludeForks: boolean;
  onToggleExcludeForks: (exclude: boolean) => void;
}

export const LanguageComparisonSection: React.FC<LanguageComparisonSectionProps> = ({
  usernameA,
  usernameB,
  languageAnalyticsA,
  languageAnalyticsB,
  sharedLanguages,
  uniqueLanguagesA,
  uniqueLanguagesB,
  languageRows,
  excludeForks,
  onToggleExcludeForks,
}) => {
  return (
    <section
      aria-label="Programming Language Comparison"
      className="p-5 sm:p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-6 shadow-sm"
    >
      {/* Header & Fork Exclusion Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Primary Programming Language Comparison</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Distribution of primary languages across loaded public repositories
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-neutral-300 cursor-pointer select-none self-start sm:self-auto">
          <input
            type="checkbox"
            checked={excludeForks}
            onChange={(e) => onToggleExcludeForks(e.target.checked)}
            className="rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-emerald-500/40 cursor-pointer"
          />
          <GitFork className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          <span>Exclude forked repositories</span>
        </label>
      </div>

      {/* Methodology & Competency Disclaimer */}
      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-start gap-2.5 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="text-neutral-200">Methodology Note:</strong> GitHub assigns a single
          primary language to each repository based on the largest byte share of source files. These
          figures show repository counts and shares within loaded public repositories — they are{' '}
          <strong className="text-neutral-200">not</strong> a direct measure of total lines of code
          written or a developer&apos;s proficiency in a language.
        </p>
      </div>

      {/* Shared vs Unique Language Summary Pills */}
      {languageRows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Shared Primary Languages ({sharedLanguages.length})
            </div>
            {sharedLanguages.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sharedLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-[#161b22] text-neutral-200 border border-[#30363d]"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">No overlapping primary languages</p>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              Only in @{usernameA} ({uniqueLanguagesA.length})
            </div>
            {uniqueLanguagesA.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {uniqueLanguagesA.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/30 text-emerald-300 border border-emerald-500/30"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">None unique to @{usernameA}</p>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
              Only in @{usernameB} ({uniqueLanguagesB.length})
            </div>
            {uniqueLanguagesB.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {uniqueLanguagesB.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-sky-950/30 text-sky-300 border border-sky-500/30"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">None unique to @{usernameB}</p>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Donut Charts using existing LanguageChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Developer A Chart */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="text-xs font-mono font-semibold text-emerald-400">@{usernameA}</span>
            {languageAnalyticsA && (
              <span className="text-[11px] text-neutral-400 font-mono">
                {languageAnalyticsA.totalWithLanguage} language-tagged of{' '}
                {languageAnalyticsA.totalAnalyzed} analyzed repos
                {languageAnalyticsA.isPartial ? ' (partial)' : ''}
              </span>
            )}
          </div>

          {languageAnalyticsA && languageAnalyticsA.breakdown.length > 0 ? (
            <LanguageChart data={languageAnalyticsA.breakdown} />
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-neutral-500 italic text-center px-4">
              {languageAnalyticsA
                ? `No repositories with a detected primary language for @${usernameA}.`
                : `Language data unavailable for @${usernameA}.`}
            </div>
          )}
        </div>

        {/* Developer B Chart */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="text-xs font-mono font-semibold text-sky-400">@{usernameB}</span>
            {languageAnalyticsB && (
              <span className="text-[11px] text-neutral-400 font-mono">
                {languageAnalyticsB.totalWithLanguage} language-tagged of{' '}
                {languageAnalyticsB.totalAnalyzed} analyzed repos
                {languageAnalyticsB.isPartial ? ' (partial)' : ''}
              </span>
            )}
          </div>

          {languageAnalyticsB && languageAnalyticsB.breakdown.length > 0 ? (
            <LanguageChart data={languageAnalyticsB.breakdown} />
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-neutral-500 italic text-center px-4">
              {languageAnalyticsB
                ? `No repositories with a detected primary language for @${usernameB}.`
                : `Language data unavailable for @${usernameB}.`}
            </div>
          )}
        </div>
      </div>

      {/* Consistent-Scale Language Share Comparison Table / Bars */}
      {languageRows.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">
              Side-by-Side Share Breakdown (0% – 100% Scale)
            </span>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />@{usernameA}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />@{usernameB}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {languageRows.map((row) => (
              <div
                key={row.language}
                className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400">
                    {row.countA} {row.countA === 1 ? 'repo' : 'repos'} ({row.percentageA}%)
                  </span>

                  <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-100">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span>{row.language}</span>
                  </span>

                  <span className="font-mono text-sky-400">
                    {row.countB} {row.countB === 1 ? 'repo' : 'repos'} ({row.percentageB}%)
                  </span>
                </div>

                {/* Consistent 0-100% Dual Bars */}
                <div className="grid grid-cols-2 gap-2 items-center">
                  {/* Developer A bar (grows right-to-left towards center on desktop) */}
                  <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden flex justify-end">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, row.percentageA))}%` }}
                    />
                  </div>

                  {/* Developer B bar (grows left-to-right from center) */}
                  <div className="w-full h-2 bg-[#161b22] rounded-full overflow-hidden flex justify-start">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, row.percentageB))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
