import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { LanguageStat } from '../../types/github';

interface LanguageChartProps {
  data: LanguageStat[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: LanguageStat;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-xl text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="font-semibold text-neutral-100">{item.language}</span>
        </div>
        <div className="text-neutral-300 font-mono">
          <span className="text-neutral-400">Repositories: </span>
          <span className="font-bold">{item.count}</span>
        </div>
        <div className="text-neutral-300 font-mono">
          <span className="text-neutral-400">Share: </span>
          <span className="font-bold text-emerald-400">{item.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const LanguageChart: React.FC<LanguageChartProps> = ({ data }) => {
  // Memoize top 8 languages + 'Other' grouping for clean visual representation
  const chartData = useMemo(() => {
    if (data.length <= 8) return data;

    const top7 = data.slice(0, 7);
    const rest = data.slice(7);
    const restCount = rest.reduce((acc, curr) => acc + curr.count, 0);
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);
    const restPercentage = totalCount > 0 ? Math.round((restCount / totalCount) * 1000) / 10 : 0;

    return [
      ...top7,
      {
        language: 'Other Languages',
        count: restCount,
        percentage: restPercentage,
        color: '#6e7681',
      },
    ];
  }, [data]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-64 sm:h-72 relative" aria-label="Language distribution donut chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={chartData.length > 1 ? 2 : 0}
            dataKey="count"
            nameKey="language"
            stroke="#0d1117"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label inside Donut */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold font-mono text-neutral-100">
          {data.length}
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
          {data.length === 1 ? 'Language' : 'Languages'}
        </span>
      </div>
    </div>
  );
};
