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
  const hasActivity = data.some((item) => item.value > 0);

  if (!hasActivity) {
    return (
      <div className="flex min-h-80 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <div className="w-full max-w-2xl">
          <p className="section-label">Awaiting live rows</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950 font-display">
            No platform activity has been recorded yet.
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            The current admin metrics response contains zero users, zero active sessions, and zero transactions.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {data.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{item.name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950 font-display">
                  {item.name === 'Volume ($)' ? `$${item.value.toFixed(2)}` : item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
