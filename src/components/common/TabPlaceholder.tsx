import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TabPlaceholderProps {
  title: string;
  badge?: string;
  icon: LucideIcon;
  description: string;
  plannedFeatures: string[];
  contextNote?: string;
}

export const TabPlaceholder: React.FC<TabPlaceholderProps> = ({
  title,
  badge = 'In Development',
  icon: Icon,
  description,
  plannedFeatures,
  contextNote,
}) => {
  return (
    <section
      aria-labelledby="tab-placeholder-heading"
      className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-10 rounded-xl bg-[#161b22] border border-[#30363d] shadow-sm animate-in fade-in duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#30363d]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-neutral-300 shrink-0">
            <Icon className="w-6 h-6 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                id="tab-placeholder-heading"
                className="text-xl font-bold tracking-tight text-neutral-100"
              >
                {title}
              </h2>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#21262d] text-neutral-400 border border-[#30363d]">
                {badge}
              </span>
            </div>
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          </div>
        </div>
      </div>

      {contextNote && (
        <div
          role="note"
          className="mt-6 p-4 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-neutral-300 leading-relaxed"
        >
          <span className="font-semibold text-neutral-200">Architecture status: </span>
          {contextNote}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
          Planned Capabilities for Stage 3
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
          {plannedFeatures.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-neutral-300 p-3 rounded-lg bg-[#0d1117]/60 border border-[#21262d]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
