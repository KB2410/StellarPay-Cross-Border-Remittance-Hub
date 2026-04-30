'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Metrics } from '@/types';

interface MetricsChartProps {
  metrics: Metrics;
}

export default function MetricsChart({ metrics }: MetricsChartProps) {
  const data = [
    {
      name: 'Users',
      value: metrics.totalUsers,
    },
    {
      name: 'DAU',
      value: metrics.dau,
    },
    {
      name: 'Transactions',
      value: metrics.totalTransactions,
    },
    {
      name: 'Volume ($)',
      value: Math.round(metrics.totalVolume * 100) / 100,
    },
  ];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#71717a', fontSize: 12 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={{ stroke: '#27272a' }}
          />
          <YAxis
            tick={{ fill: '#71717a', fontSize: 12 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={{ stroke: '#27272a' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            }}
            itemStyle={{ color: '#3b82f6' }}
            cursor={{ fill: '#27272a', opacity: 0.4 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} fill="url(#gradient-blue)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
