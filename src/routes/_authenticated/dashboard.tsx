import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Cell, Pie, PieChart, Legend,
} from "recharts";
import { FileText, FilePlus2, CheckCircle2, XCircle, Clock, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const STATUS_COLORS = ["#fbbf24", "#3b82f6", "#22c55e", "#ef4444", "#6366f1"];

function DashboardPage() {
  const { user, roles } = useAuth();
  const isStaff = roles.includes("petugas") || roles.includes("admin");

  const { data } = useQuery({
    queryKey: ["dashboard-stats", user?.id, isStaff],
    queryFn: async () => {
      // For warga: only own pengajuan (RLS handles). For staff: all.
      const { data: pengajuan } = await supabase
        .from("pengajuan_surat")
        .select("id, status, created_at, jenis_surat:jenis_surat_id(nama, kode)")
        .order("created_at", { ascending: false });
      const list = pengajuan ?? [];
      const byStatus = list.reduce<Record<string, number>>((acc, p: any) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
      }, {});
      const byJenis = list.reduce<Record<string, number>>((acc, p: any) => {
        const k = p.jenis_surat?.kode ?? "—";
        acc[k] = (acc[k] ?? 0) + 1; return acc;
      }, {});
      const months: { label: string; total: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString("id-ID", { month: "short" });
        const total = list.filter((p: any) => {
          const pd = new Date(p.created_at);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        }).length;
        months.push({ label, total });
      }
      let totalUsers = 0;
      if (isStaff) {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        totalUsers = count ?? 0;
      }
      return { list, byStatus, byJenis, months, totalUsers };
    },
  });

  const stats = data ?? { list: [], byStatus: {}, byJenis: {}, months: [], totalUsers: 0 };
  const total = stats.list.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isStaff ? "Ringkasan seluruh pelayanan kecamatan." : "Ringkasan pengajuan surat Anda."}
          </p>
        </div>
        <Button asChild className="bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95">
          <Link to="/pengajuan/baru"><FilePlus2 className="h-4 w-4" /> Ajukan Surat Baru</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Pengajuan" value={total} tone="primary" />
        <StatCard icon={Clock} label="Menunggu" value={stats.byStatus["menunggu_verifikasi"] ?? 0} tone="warning" />
        <StatCard icon={CheckCircle2} label="Selesai" value={stats.byStatus["selesai"] ?? 0} tone="success" />
        <StatCard
          icon={isStaff ? Users : XCircle}
          label={isStaff ? "Total Warga" : "Ditolak"}
          value={isStaff ? stats.totalUsers : (stats.byStatus["ditolak"] ?? 0)}
          tone={isStaff ? "info" : "destructive"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/60 p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">Pengajuan per Bulan</h3>
              <p className="text-xs text-muted-foreground">Tren 6 bulan terakhir</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={stats.months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" className="fill-muted-foreground" fontSize={12} />
                <YAxis className="fill-muted-foreground" fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: "oklch(0.55 0.16 255 / 0.08)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Bar dataKey="total" fill="oklch(0.55 0.17 255)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border/60 p-5 shadow-soft">
          <h3 className="font-display text-lg font-bold">Statistik Jenis Surat</h3>
          <p className="text-xs text-muted-foreground">Distribusi berdasarkan kode</p>
          <div className="mt-2 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={Object.entries(stats.byJenis).map(([k, v]) => ({ name: k, value: v }))}
                  dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={3}>
                  {Object.keys(stats.byJenis).map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-border/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Pengajuan Terbaru</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/pengajuan">Lihat semua <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="mt-3 divide-y divide-border">
          {stats.list.slice(0, 5).map((p: any) => (
            <Link key={p.id} to="/pengajuan/$id" params={{ id: p.id }} className="flex items-center justify-between gap-3 py-3 hover:bg-secondary/40 rounded px-2 -mx-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.jenis_surat?.nama ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("id-ID")}</p>
              </div>
              <span className="text-xs text-muted-foreground">{p.status}</span>
            </Link>
          ))}
          {stats.list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pengajuan.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
