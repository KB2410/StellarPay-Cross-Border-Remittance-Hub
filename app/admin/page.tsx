'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, BarChart3, LockKeyhole, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { Metrics } from '@/types';
import { isAdmin, authenticateAdmin, logoutAdmin } from '@/lib/admin';

type HealthState = {
  status: string;
  checks: Record<string, string>;
};

type ApiResult<T> = {
  ok: boolean;
  status: number;
  data: T;
};

const EMPTY_METRICS: Metrics = {
  totalUsers: 0,
  dau: 0,
  totalTransactions: 0,
  totalVolume: 0,
};

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 8000): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

const MetricsChart = dynamic(() => import('@/components/MetricsChart'), {
  ssr: false,
  loading: () => (
    <div className="h-80 rounded-lg bg-slate-200 shimmer" />
  ),
});

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [health, setHealth] = useState<HealthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataMessage, setDataMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataMessage('');

    try {
      const [metricsRes, healthRes] = await Promise.allSettled([
        fetchJsonWithTimeout<Metrics & { error?: string }>('/api/metrics'),
        fetchJsonWithTimeout<HealthState>('/api/health'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const metricsData = metricsRes.value.data;
        setMetrics({
          totalUsers: metricsData.totalUsers ?? 0,
          dau: metricsData.dau ?? 0,
          totalTransactions: metricsData.totalTransactions ?? 0,
          totalVolume: metricsData.totalVolume ?? 0,
        });

        if (!metricsRes.value.ok) {
          setDataMessage(
            metricsData.error ||
              `Metrics API returned HTTP ${metricsRes.value.status}; showing safe zero values.`
          );
        }
      } else {
        setMetrics(EMPTY_METRICS);
        setDataMessage('Metrics API did not respond in time; showing safe zero values.');
      }

      if (healthRes.status === 'fulfilled') {
        const healthData = healthRes.value.data;
        setHealth({
          status: healthData.status || 'degraded',
          checks: healthData.checks || { horizon: 'unknown', supabase: 'unknown' },
        });
      } else {
        setHealth({ status: 'degraded', checks: { horizon: 'unknown', supabase: 'unknown' } });
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setMetrics(EMPTY_METRICS);
      setHealth({ status: 'degraded', checks: { horizon: 'unknown', supabase: 'unknown' } });
      setDataMessage('Admin data could not be loaded; showing safe zero values.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      const admin = await isAdmin();
      setIsAuthorized(admin);

      if (admin) {
        await fetchData();
      }

      setLoading(false);
    }
    checkAuth();
  }, [fetchData]);

  useEffect(() => {
    if (isAuthorized) {
      const interval = setInterval(fetchData, 30000);
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
        await fetchData();
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
    setDataLoading(false);
    setDataMessage('');
    setLastUpdated('');
    router.replace('/admin');
  };

  const visibleMetrics = metrics ?? EMPTY_METRICS;
  const statCards = [
    { label: 'Total Users', value: visibleMetrics.totalUsers, icon: Users },
    { label: 'Daily Active', value: visibleMetrics.dau, icon: Activity },
    { label: 'Transactions', value: visibleMetrics.totalTransactions, icon: BarChart3 },
    { label: 'Total Volume', value: `$${(visibleMetrics.totalVolume || 0).toFixed(2)}`, icon: ShieldCheck },
  ];
  const isCheckingSystem = !health && (loading || dataLoading);
  const systemStatusLabel = isCheckingSystem
    ? 'Checking'
    : health?.status === 'healthy'
    ? 'Systems normal'
    : 'Degraded';
  const systemDotClass = isCheckingSystem
    ? 'bg-blue-500'
    : health?.status === 'healthy'
    ? 'bg-emerald-500'
    : 'bg-amber-500';

  if (!isAuthorized) {
    return (
      <div className="page-shell flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-accent">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="section-label">Admin Portal</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 font-display">Access required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Metrics and health data are protected by the admin portal password.
          </p>

          {authError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              className="input-field h-12 w-full rounded-lg px-4 text-sm font-medium"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm"
            >
              {isSubmitting ? 'Unlocking portal' : 'Unlock Portal'}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="section-label">Platform Operations</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 font-display">
            Admin dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor adoption, transfer volume, and service connectivity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && (
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
              Updated {lastUpdated}
            </span>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${systemDotClass}`} />
            {systemStatusLabel}
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>

      {dataMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{dataMessage}</span>
        </div>
      )}

      {health && (
        <section className="structured-card mb-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">System Health</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Service checks</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(health.checks).map(([service, statusVal]) => (
              <div key={service} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-700">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      statusVal === 'connected'
                        ? 'bg-emerald-500'
                        : statusVal === 'not_configured'
                        ? 'bg-slate-400'
                        : 'bg-red-500'
                    }`}
                  />
                  {service}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-[0.12em] ${
                    statusVal === 'connected'
                      ? 'text-emerald-700'
                      : statusVal === 'not_configured'
                      ? 'text-slate-500'
                      : 'text-red-700'
                  }`}
                >
                  {statusVal}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading || (dataLoading && !metrics) ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-slate-200 shimmer" />
            ))}
          </div>
          <div className="h-80 rounded-lg bg-slate-200 shimmer" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="metric-card">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <p className="text-3xl font-bold text-slate-950 font-display">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <section className="structured-card p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="section-label">Metrics</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Platform overview</h2>
              </div>
              {dataLoading && (
                <span className="inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  Refreshing metrics
                </span>
              )}
            </div>
            <MetricsChart metrics={visibleMetrics} />
          </section>
        </>
      )}

      <div className="mt-8 border-t border-slate-200 pt-6 text-center">
        <p className="text-xs font-medium text-slate-500">
          Auto-refreshes every 30 seconds |{' '}
          <Link href="/api/health" target="_blank" className="font-semibold text-accent hover:text-accent-dark">
            Health API
          </Link>{' '}
          |{' '}
          <Link href="/api/metrics" target="_blank" className="font-semibold text-accent hover:text-accent-dark">
            Metrics API
          </Link>
        </p>
      </div>
    </div>
  );
}
