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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight">Ringkasan Layanan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isStaff ? "Pemantauan aktivitas pelayanan administrasi kecamatan." : "Status pengajuan administrasi pribadi Anda."}
          </p>
        </div>
        <Button asChild className="bg-primary px-6 font-semibold shadow-solid hover:bg-primary/95">
          <Link to="/pengajuan/baru"><FilePlus2 className="h-4 w-4" /> Ajukan Surat Baru</Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Pengajuan" value={total} tone="primary" />
        <StatCard icon={Clock} label="Menunggu Verifikasi" value={stats.byStatus["menunggu_verifikasi"] ?? 0} tone="warning" />
        <StatCard icon={CheckCircle2} label="Selesai Terbit" value={stats.byStatus["selesai"] ?? 0} tone="success" />
        <StatCard
          icon={isStaff ? Users : XCircle}
          label={isStaff ? "Total Registrasi" : "Pengajuan Ditolak"}
          value={isStaff ? stats.totalUsers : (stats.byStatus["ditolak"] ?? 0)}
          tone={isStaff ? "info" : "destructive"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border p-6 shadow-subtle lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div>
              <h3 className="font-sans text-lg font-bold">Tren Pengajuan</h3>
              <p className="text-xs text-muted-foreground tracking-wide">Volume per bulan (6 bulan terakhir)</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={stats.months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" className="fill-muted-foreground font-medium" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis className="fill-muted-foreground font-medium" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--color-secondary)" }} contentStyle={{ borderRadius: 4, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border p-6 shadow-subtle">
          <h3 className="font-sans text-lg font-bold border-b border-border pb-4 mb-6">Distribusi Jenis Surat</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={Object.entries(stats.byJenis).map(([k, v]) => ({ name: k, value: v }))}
                  dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5} stroke="none">
                  {Object.keys(stats.byJenis).map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="border-border shadow-subtle">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h3 className="font-sans text-lg font-bold">Aktivitas Terkini</h3>
          <Button asChild variant="outline" size="sm" className="font-semibold"><Link to="/pengajuan">Semua Pengajuan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
        <div className="p-2">
          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Jenis Surat</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Tanggal</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.list.slice(0, 5).map((p: any) => (
                  <tr key={p.id} className="group hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 font-bold">{p.jenis_surat?.nama ?? "-"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td>
                    <td className="px-4 py-4 uppercase text-[10px] font-bold tracking-widest">{p.status.replace("_", " ")}</td>
                    <td className="px-4 py-4 text-right">
                      <Button asChild variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to="/pengajuan/$id" params={{ id: p.id }}>Detail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.list.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground font-medium">Belum ada aktivitas pengajuan.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

