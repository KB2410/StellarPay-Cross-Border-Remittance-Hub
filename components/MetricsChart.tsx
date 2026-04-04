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
      fill: 'url(#gradient-users)',
    },
    {
      name: 'DAU',
      value: metrics.dau,
      fill: 'url(#gradient-dau)',
    },
    {
      name: 'Transactions',
      value: metrics.totalTransactions,
      fill: 'url(#gradient-txs)',
    },
    {
      name: 'Volume ($)',
      value: Math.round(metrics.totalVolume * 100) / 100,
      fill: 'url(#gradient-vol)',
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
            <linearGradient id="gradient-users" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="gradient-dau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="gradient-txs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="gradient-vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 15, 30, 0.95)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
