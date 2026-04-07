'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { Metrics } from '@/types';
import { isAdmin, setAdminKey, clearAdminKey } from '@/lib/admin';

const MetricsChart = dynamic(() => import('@/components/MetricsChart'), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-white/[0.03] rounded-2xl shimmer" />
  ),
});

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminKey, setAdminKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<{
    status: string;
    checks: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/health'),
      ]);
      const metricsData = await metricsRes.json();
      const healthData = await healthRes.json();
      setMetrics(metricsData);
      setHealth(healthData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // API might not be fully configured
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    // Check if user is already authorized
    if (isAdmin()) {
      setIsAuthorized(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [fetchData, isAuthorized]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (setAdminKey(adminKey)) {
      setIsAuthorized(true);
      setAuthError('');
      fetchData();
    } else {
      setAuthError('Invalid admin key');
    }
  };

  const handleLogout = () => {
    clearAdminKey();
    setIsAuthorized(false);
    setAdminKeyInput('');
    router.push('/dashboard');
  };

  const statCards = metrics
    ? [
        {
          label: 'Total Users',
          value: metrics.totalUsers,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          color: 'violet',
          gradient: 'from-violet-600 to-indigo-600',
        },
        {
          label: 'Daily Active',
          value: metrics.dau,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
          color: 'cyan',
          gradient: 'from-cyan-600 to-blue-600',
        },
        {
          label: 'Transactions',
          value: metrics.totalTransactions,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          ),
          color: 'emerald',
          gradient: 'from-emerald-600 to-green-600',
        },
        {
          label: 'Total Volume',
          value: `$${(metrics.totalVolume || 0).toFixed(2)}`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: 'amber',
          gradient: 'from-amber-600 to-orange-600',
        },
      ]
    : [];

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter your admin secret key to access the dashboard.
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Enter admin secret key"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-violet-500/20"
            >
              Access Dashboard
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Platform metrics &amp; system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-600">
              Updated: {lastUpdated}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy'
                  ? 'bg-emerald-400 pulse-glow'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-gray-400">
              {health?.status === 'healthy' ? 'All Systems Go' : 'Degraded'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-4 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Health Checks */}
      {health && (
        <div className="glass-card rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            System Health
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(health.checks).map(([service, statusVal]) => (
              <div key={service} className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    statusVal === 'connected'
                      ? 'bg-emerald-400'
                      : statusVal === 'not_configured'
                      ? 'bg-gray-500'
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-gray-300 capitalize">
                  {service}
                </span>
                <span
                  className={`text-xs ml-auto ${
                    statusVal === 'connected'
                      ? 'text-emerald-400'
                      : statusVal === 'not_configured'
                      ? 'text-gray-500'
                      : 'text-red-400'
                  }`}
                >
                  {statusVal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white/[0.03] rounded-2xl shimmer" />
            ))}
          </div>
          <div className="h-80 bg-white/[0.03] rounded-2xl shimmer" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl p-5 relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full -mr-6 -mt-6`}
                />
                <div
                  className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 flex items-center justify-center mb-3`}
                >
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Platform Overview
            </h2>
            {metrics && <MetricsChart metrics={metrics} />}
          </div>
        </>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-600">
          Auto-refreshing every 30 seconds •{' '}
          <Link
            href="/api/health"
            target="_blank"
            className="text-violet-500 hover:text-violet-400"
          >
            Health API
          </Link>{' '}
          •{' '}
          <Link
            href="/api/metrics"
            target="_blank"
            className="text-violet-500 hover:text-violet-400"
          >
            Metrics API
          </Link>
        </p>
      </div>
    </div>
  );
}
