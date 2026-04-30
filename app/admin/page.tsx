'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { Metrics } from '@/types';
import { isAdmin, authenticateAdmin, logoutAdmin } from '@/lib/admin';

const MetricsChart = dynamic(() => import('@/components/MetricsChart'), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-zinc-800 rounded-2xl shimmer" />
  ),
});

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const [metricsRes, healthRes] = await Promise.allSettled([
        fetch('/api/metrics'),
        fetch('/api/health'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const metricsData = await metricsRes.value.json();
        setMetrics({
          totalUsers: metricsData.totalUsers ?? 0,
          dau: metricsData.dau ?? 0,
          totalTransactions: metricsData.totalTransactions ?? 0,
          totalVolume: metricsData.totalVolume ?? 0,
        });
      } else {
        setMetrics({ totalUsers: 0, dau: 0, totalTransactions: 0, totalVolume: 0 });
      }

      if (healthRes.status === 'fulfilled') {
        const healthData = await healthRes.value.json();
        setHealth(healthData);
      } else {
        setHealth({ status: 'degraded', checks: { horizon: 'unknown', supabase: 'unknown' } });
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // Fallback: show zeros so the dashboard still renders
      setMetrics({ totalUsers: 0, dau: 0, totalTransactions: 0, totalVolume: 0 });
      setHealth({ status: 'degraded', checks: {} });
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    // Check if user is already authorized
    async function checkAuth() {
      const admin = await isAdmin();
      setIsAuthorized(admin);
      setLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [fetchData, isAuthorized]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    try {
      const result = await authenticateAdmin(password);
      if (result.success) {
        setIsAuthorized(true);
        setPassword('');
        fetchData();
      } else {
        setAuthError(result.error || 'Invalid password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthorized(false);
    setMetrics(null);
    setHealth(null);
    setLastUpdated('');
    router.replace('/admin');
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
        },
        {
          label: 'Daily Active',
          value: metrics.dau,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
        },
        {
          label: 'Transactions',
          value: metrics.totalTransactions,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          ),
        },
        {
          label: 'Total Volume',
          value: `$${(metrics.totalVolume || 0).toFixed(2)}`,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ]
    : [];

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="structured-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-6 border border-zinc-700">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-50 mb-2">Admin Access Required</h1>
          <p className="text-zinc-500 text-sm mb-6">
            This portal is public, but dashboard access requires the admin password.
          </p>
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4 font-medium">
              {authError}
            </div>
          )}
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              className="input-field w-full px-4 py-3 rounded-lg placeholder:text-zinc-600 transition-all text-sm font-medium"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="btn-primary w-full py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Unlocking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Unlock Portal
                </>
              )}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors font-medium"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-1">
            Admin Dashboard
          </h1>
          <p className="text-zinc-500 text-sm">
            Platform metrics &amp; system health
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-zinc-500 font-medium">
              Updated: {lastUpdated}
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span className="text-xs text-zinc-400 font-medium">
              {health?.status === 'healthy' ? 'Systems Normal' : 'Degraded'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-lg transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Health Checks */}
      {health && (
        <div className="structured-card rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider">
            System Health
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {Object.entries(health.checks).map(([service, statusVal]) => (
              <div key={service} className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <span className="text-sm font-medium text-zinc-300 capitalize flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      statusVal === 'connected'
                        ? 'bg-emerald-500'
                        : statusVal === 'not_configured'
                        ? 'bg-zinc-500'
                        : 'bg-red-500'
                    }`}
                  />
                  {service}
                </span>
                <span
                  className={`text-xs font-semibold uppercase ${
                    statusVal === 'connected'
                      ? 'text-emerald-500'
                      : statusVal === 'not_configured'
                      ? 'text-zinc-500'
                      : 'text-red-500'
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
              <div key={i} className="h-28 bg-zinc-800 rounded-xl shimmer" />
            ))}
          </div>
          <div className="h-80 bg-zinc-800 rounded-xl shimmer" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="structured-card rounded-xl p-5 flex flex-col justify-center"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                  <div className="text-blue-500 opacity-80">
                    {stat.icon}
                  </div>
                </div>
                <p className="text-3xl font-bold text-zinc-50">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="structured-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-zinc-50 mb-6">
              Platform Overview
            </h2>
            {metrics && <MetricsChart metrics={metrics} />}
          </div>
        </>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-8 text-center border-t border-zinc-800 pt-6">
        <p className="text-xs font-medium text-zinc-500">
          Auto-refreshing every 30 seconds •{' '}
          <Link
            href="/api/health"
            target="_blank"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            Health API
          </Link>{' '}
          •{' '}
          <Link
            href="/api/metrics"
            target="_blank"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            Metrics API
          </Link>
        </p>
      </div>
    </div>
  );
}  );
}
