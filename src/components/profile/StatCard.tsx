import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, hint }) => {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex flex-col justify-between hover:border-[#8b949e]/40 transition-colors">
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-xs font-semibold tracking-wide uppercase">{label}</span>
        <div className="text-neutral-400">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold font-mono tracking-tight text-neutral-100">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {hint && <div className="text-[11px] text-neutral-500 mt-1">{hint}</div>}
      </div>
    </div>
  );
};
