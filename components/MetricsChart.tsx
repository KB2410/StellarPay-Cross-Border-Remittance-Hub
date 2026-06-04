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
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 24, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="gradient-teal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d7f7a" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.82} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d8dee9',
              borderRadius: '8px',
              color: '#172033',
              fontSize: '13px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
            }}
            itemStyle={{ color: '#1d7f7a' }}
            cursor={{ fill: '#f1f5f9', opacity: 0.8 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={44} fill="url(#gradient-teal)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
