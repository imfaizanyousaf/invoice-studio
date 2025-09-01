"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/* -------------------------------- helpers ------------------------------- */

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const fmtCompact = (n: number) =>
  Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1,221 83% 53%))",
  "hsl(var(--chart-2,12 76% 61%))",
  "hsl(var(--chart-3,142 71% 45%))",
  "hsl(var(--chart-4,45 93% 47%))",
  "hsl(var(--chart-5,291 70% 50%))",
  "hsl(var(--chart-6,199 89% 48%))",
];

/** Normalize server month field to "YYYY-MM" for axes; handles odd values like "2025-107". */
function normalizeMonth(m?: string): string {
  if (!m) return "Unknown";
  const digits = m.replace(/[^\d]/g, "");
  if (digits.length >= 6) {
    const year = digits.slice(0, 4);
    let monthNum = digits.slice(-2);
    let mi = parseInt(monthNum, 10);
    if (mi < 1 || mi > 12) {
      monthNum = digits.slice(4, 6);
      mi = parseInt(monthNum, 10);
      if (isNaN(mi) || mi < 1 || mi > 12) return m;
    }
    return `${year}-${String(mi).padStart(2, "0")}`;
  }
  const parts = m.split(/[^0-9]/).filter(Boolean);
  if (parts.length >= 2) {
    const [y, mo] = parts;
    const mi = parseInt(mo, 10);
    if (!isNaN(mi)) return `${y}-${String(mi).padStart(2, "0")}`;
  }
  return m;
}

function parseISODate(d?: string): Date | null {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

function monthStringToDateStart(ym: string): Date | null {
  const [y, m] = ym.split("-");
  const yi = parseInt(y, 10);
  const mi = parseInt(m, 10);
  if (isNaN(yi) || isNaN(mi)) return null;
  return new Date(Date.UTC(yi, mi - 1, 1));
}

/** Keep last N months for a monthly array based on latest month present. */
function clampMonthly<T extends { month: string }>(arr: T[], monthsBack: number): T[] {
  if (!arr.length) return arr;
  const normed = arr
    .map((x) => ({ ...x, norm: normalizeMonth(x.month) }))
    .filter((x) => monthStringToDateStart(x.norm))
    .sort((a, b) => a.norm.localeCompare(b.norm));
  if (!normed.length) return [];
  const latest = normed[normed.length - 1].norm;
  const latestDate = monthStringToDateStart(latest)!;
  const gate = new Date(Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth() - (monthsBack - 1), 1));
  return normed.filter((x) => {
    const d = monthStringToDateStart(x.norm)!;
    return d >= gate;
  });
}

/** Keep last N months for daily growth based on latest date present. */
function clampGrowthByMonths<T extends { date: string }>(arr: T[], monthsBack: number): T[] {
  if (!arr.length) return arr;
  const withDates = arr
    .map((x) => ({ ...x, dt: parseISODate(x.date) }))
    .filter((x) => x.dt) as Array<T & { dt: Date }>;
  if (!withDates.length) return [];
  withDates.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  const latest = withDates[withDates.length - 1].dt;
  const gate = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth() - (monthsBack - 1), 1));
  return withDates.filter((x) => x.dt >= gate);
}

/* -------------------------------- types --------------------------------- */

type ApiEnvelope<T> = { success: boolean; data: T };

type OverviewResp = {
  overview: { totalUsers: number; totalPackages: number; totalInvoices: number };
  users: { byStatus: Record<string, number>; byRole: Record<string, number> };
  packages: { totalValue: number; totalRequests: number; averagePrice: number };
  invoices: { totalAmount: number; totalVAT: number; averageInvoice: number };
  recentActivity: { newUsers: number; newPackages: number; newInvoices: number };
};

type InvoicesMonthly = { month: string; count: number; totalAmount: number; totalVAT: number };
type InvoicesResp = {
  summary: {
    totalInvoices: number;
    totalAmount: number;
    totalVAT: number;
    totalSubtotal?: number;
    averageInvoice: number;
    averageVAT?: number;
    invoiceRange: { min: number; max: number };
    period: string;
  };
  trends: { monthly: InvoicesMonthly[] };
  distribution: { byAmount: Array<{ range: string; count: number; totalValue: number }> };
  topVendors: Array<{ name: string; invoiceCount: number; totalAmount: number; averageAmount: number }>;
  topUsers: Array<{ userId: string; name?: string; email?: string; invoiceCount: number; totalAmount: number; averageAmount: number }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    vendor: string;
    amount: string | number;
    invoiceDate: string;
    user: { name: string; email: string };
    createdAt: string;
  }>;
};

type PackagesResp = {
  summary: {
    totalPackages: number;
    totalValue: number;
    totalRequests: number;
    averagePrice: number;
    averageRequests: number;
    priceRange: { min: number; max: number };
    period: string;
  };
  distribution: {
    byPriceRange: Array<{ range: string; count: number }>;
    byRequestRange: Array<{ range: string; count: number }>;
  };
  growth: Array<{ date: string; count: number; totalValue: number }>;
  topPackages: {
    byPrice: Array<{ id: string; name: string; price: number; requests: number; owner: any; createdAt: string }>;
    byRequests: Array<{ id: string; name: string; price: number; requests: number; owner: any; createdAt: string }>;
  };
  topUsers: Array<{ userId: string; name?: string; email?: string; packageCount: number; totalValue: number; totalRequests: number }>;
};

type UsersResp = {
  summary: { totalUsers: number; activeUsers: number; inactiveUsers: number; period: string };
  breakdown: {
    byStatus: Record<string, number>;
    byRole: Record<string, number>;
    byProvider: Record<string, number>;
  };
  growth: Array<{ date: string; count: number }>;
  recentUsers: Array<{ id: string; name?: string; email?: string; joinedDate: string }>;
};

/* ------------------------------ component ------------------------------- */

type Props = { invoices?: any }; // backward-friendly; ignored now

export default function InvoiceAnalytics(_: Props) {
  const [monthsBack, setMonthsBack] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OverviewResp | null>(null);
  const [inv, setInv] = useState<InvoicesResp | null>(null);
  const [pkgs, setPkgs] = useState<PackagesResp | null>(null);
  const [users, setUsers] = useState<UsersResp | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [o, i, p, u] = await Promise.all([
          fetch("/api/stats/overview", { cache: "no-store" }),
          fetch("/api/stats/invoices", { cache: "no-store" }),
          fetch("/api/stats/packages", { cache: "no-store" }),
          fetch("/api/stats/users?period=7", { cache: "no-store" }),
        ]);

        if (!o.ok) throw new Error(`overview ${o.status}`);
        if (!i.ok) throw new Error(`invoices ${i.status}`);
        if (!p.ok) throw new Error(`packages ${p.status}`);
        if (!u.ok) throw new Error(`users ${u.status}`);

        const oJson: ApiEnvelope<OverviewResp> = await o.json();
        const iJson: ApiEnvelope<InvoicesResp> = await i.json();
        const pJson: ApiEnvelope<PackagesResp> = await p.json();
        const uJson: ApiEnvelope<UsersResp> = await u.json();

        if (!oJson.success) throw new Error("overview: success=false");
        if (!iJson.success) throw new Error("invoices: success=false");
        if (!pJson.success) throw new Error("packages: success=false");
        if (!uJson.success) throw new Error("users: success=false");

        if (mounted) {
          setOverview(oJson.data);
          setInv(iJson.data);
          setPkgs(pJson.data);
          setUsers(uJson.data);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------------------- derive: invoices ---------------------------- */

  const invMonthly = useMemo(() => clampMonthly(inv?.trends?.monthly ?? [], monthsBack), [inv, monthsBack]);

  const byMonthForBar = useMemo(
    () =>
      invMonthly.map((m) => {
        const norm = normalizeMonth(m.month);
        const subtotal = Math.max(0, (m.totalAmount ?? 0) - (m.totalVAT ?? 0));
        return { month: norm, total: m.totalAmount ?? 0, vat: m.totalVAT ?? 0, subtotal };
      }),
    [invMonthly]
  );

  const invFlows = useMemo(
    () => byMonthForBar.map((m) => ({ month: m.month, Subtotal: m.subtotal, VAT: m.vat })),
    [byMonthForBar]
  );

  const invRunning = useMemo(() => {
    let acc = 0;
    return byMonthForBar.map((m) => {
      acc += m.total || 0;
      return { month: m.month, Cumulative: acc };
    });
  }, [byMonthForBar]);

  const byVendor = useMemo(() => {
    const src = inv?.topVendors ?? [];
    return src.slice(0, 8).map((v) => ({ name: v.name || "N/A", total: v.totalAmount || 0 }));
  }, [inv]);

  const invKpis = useMemo(() => {
    const s = inv?.summary;
    return {
      totalInvoices: s?.totalInvoices ?? 0,
      totalAmount: s?.totalAmount ?? 0,
      totalVat: s?.totalVAT ?? 0,
      avgInvoice: s?.averageInvoice ?? 0,
    };
  }, [inv]);

  /* ---------------------------- derive: packages ---------------------------- */

  const pkgGrowth = useMemo(() => clampGrowthByMonths(pkgs?.growth ?? [], monthsBack), [pkgs, monthsBack]);

  const pkgGrowthSeries = useMemo(
    () =>
      pkgGrowth.map((g) => ({
        date: g.date,
        Count: g.count ?? 0,
        "Total Value": g.totalValue ?? 0,
      })),
    [pkgGrowth]
  );

  const priceDist = useMemo(() => pkgs?.distribution?.byPriceRange ?? [], [pkgs]);
  const requestDist = useMemo(() => pkgs?.distribution?.byRequestRange ?? [], [pkgs]);

  /* ------------------------------ derive: users ----------------------------- */

  const usersGrowth = useMemo(() => clampGrowthByMonths(users?.growth ?? [], monthsBack), [users, monthsBack]);

  const usersGrowthSeries = useMemo(
    () =>
      usersGrowth.map((g) => ({
        date: g.date,
        Users: g.count ?? 0,
      })),
    [usersGrowth]
  );

  const pieFromRecord = (rec?: Record<string, number>, renameNull = "Unassigned") => {
    if (!rec) return [];
    return Object.entries(rec).map(([k, v]) => ({
      name: k === "null" ? renameNull : k,
      value: v ?? 0,
    }));
  };

  const usersByRole = useMemo(() => pieFromRecord(users?.breakdown?.byRole, "Unassigned"), [users]);
  const usersByStatus = useMemo(() => pieFromRecord(users?.breakdown?.byStatus, "Unassigned"), [users]);

  /* -------------------------------- actions -------------------------------- */

  const exportInvoicesMonthlyCsv = () => {
    const header = ["Month", "Subtotal", "VAT", "Total"];
    const lines = byMonthForBar.map((r) => [r.month, r.subtotal, r.vat, r.total]);
    const csv = [header, ...lines].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_monthly_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* -------------------------------- UI bits -------------------------------- */

  const EmptyState = ({ label }: { label: string }) => (
    <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">{label}</div>
  );

  if (loading) return <div className="text-sm text-muted-foreground">Loading analytics…</div>;
  if (error) return <div className="text-sm text-red-500">Failed to load analytics: {error}</div>;

  return (
    <div className="space-y-8">
      {/* Header + range control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
        {/* <div className="flex items-center gap-2">
          {[3, 6, 12, 24].map((m) => (
            <Button
              key={m}
              variant="outline"
              onClick={() => setMonthsBack(m)}
              className={cx(monthsBack === m && "border-primary text-primary")}
            >
              {m}M
            </Button>
          ))}
        </div> */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Users</div>
          <div className="text-2xl font-bold">{overview?.overview?.totalUsers ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Packages</div>
          <div className="text-2xl font-bold">{overview?.overview?.totalPackages ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Invoices</div>
          <div className="text-2xl font-bold">{overview?.overview?.totalInvoices ?? 0}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Invoice Amount</div>
          <div className="text-2xl font-bold">{fmtCompact(invKpis.totalAmount)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Invoice VAT</div>
          <div className="text-2xl font-bold">{fmtCompact(invKpis.totalVat)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Avg Invoice</div>
          <div className="text-2xl font-bold">{fmtCompact(invKpis.avgInvoice)}</div>
        </Card>
      </div>

      {/* ------------------------------- Invoices ------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Invoices</h3>
          <Button onClick={exportInvoicesMonthlyCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Monthly CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly totals */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Monthly Total Amount</div>
            {byMonthForBar.length === 0 ? (
              <EmptyState label="No invoice data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byMonthForBar}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Vendor share */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Vendor Share (by Total)</div>
            {byVendor.length === 0 ? (
              <EmptyState label="No vendor data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byVendor} dataKey="total" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} label>
                      {byVendor.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Subtotal vs VAT */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Subtotal vs VAT (Monthly)</div>
            {invFlows.length === 0 ? (
              <EmptyState label="No monthly flow data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={invFlows}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Area type="monotone" dataKey="Subtotal" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="VAT" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Cumulative */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Cumulative Total</div>
            {invRunning.length === 0 ? (
              <EmptyState label="No cumulative data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={invRunning}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Line type="monotone" dataKey="Cumulative" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ------------------------------- Packages ------------------------------ */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Packages</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Growth (Count + Total Value) */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Packages Growth</div>
            {!pkgGrowthSeries.length ? (
              <EmptyState label="No packages growth yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pkgGrowthSeries}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Line type="monotone" dataKey="Count" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="Total Value" stroke="hsl(var(--accent))" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Price Distribution */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Price Distribution</div>
            {!priceDist.length ? (
              <EmptyState label="No price distribution yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceDist}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="count" name="Packages" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Request Distribution */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Request Distribution</div>
            {!requestDist.length ? (
              <EmptyState label="No request distribution yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestDist}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="count" name="Packages" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* -------------------------------- Users -------------------------------- */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Users</h3>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Users Growth */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Users Growth (period: {users?.summary?.period || "—"})</div>
            {!usersGrowthSeries.length ? (
              <EmptyState label="No users growth data yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usersGrowthSeries}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                    <Area type="monotone" dataKey="Users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Roles pie */}
          <Card className="p-5">
            <div className="mb-3 font-medium">Roles</div>
            {!usersByRole.length ? (
              <EmptyState label="No role breakdown yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usersByRole} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} label>
                      {usersByRole.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Status pie */}
          {/* <Card className="p-5">
            <div className="mb-3 font-medium">Status</div>
            {!usersByStatus.length ? (
              <EmptyState label="No status breakdown yet." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usersByStatus} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} label>
                      {usersByStatus.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: `1px solid hsl(var(--border))`,
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                    />
                    <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card> */}
        </div>
      </div>
    </div>
  );
}
