import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ActivityBucket } from '../../types/github';

interface ActivityChartProps {
  buckets: ActivityBucket[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 shadow-xl text-xs space-y-1.5">
        <div className="font-semibold text-neutral-100 border-b border-[#30363d] pb-1">
          {label}
        </div>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 font-mono">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold text-neutral-100">{entry.value} repos</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ buckets }) => {
  return (
    <div className="w-full h-72 sm:h-80" aria-label="Repository activity cadence bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis
            dataKey="periodLabel"
            stroke="#8b949e"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#30363d' }}
          />
          <YAxis
            stroke="#8b949e"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#30363d' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#161b22', opacity: 0.5 }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', color: '#8b949e' }}
          />
          <Bar
            name="Distinct Repos Pushed"
            dataKey="pushCount"
            fill="#238636"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            name="Distinct Repos Updated"
            dataKey="updateCount"
            fill="#58a6ff"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
