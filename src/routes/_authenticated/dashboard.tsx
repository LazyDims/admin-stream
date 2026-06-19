import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Cell, Pie, PieChart, Legend,
} from "recharts";
import {
  FileText, FilePlus2, CheckCircle2, XCircle, Clock, Users, ArrowRight,
  FileSearch, Settings2, ShieldCheck, Archive, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

const PIE_COLORS = ["#fbbf24", "#3b82f6", "#22c55e", "#ef4444", "#6366f1", "#a855f7"];

function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("petugas")) return "petugas";
  return "warga";
}

function DashboardPage() {
  const { roles } = useAuth();
  const role = primaryRole(roles);

  if (role === "admin") return <AdminDashboard />;
  if (role === "petugas") return <PetugasDashboard />;
  return <WargaDashboard />;
}

/* =========================== WARGA =========================== */
function WargaDashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dash-warga", user?.id],
    queryFn: async () => {
      const { data: list } = await supabase
        .from("pengajuan_surat")
        .select("id, status, created_at, jenis_surat:jenis_surat_id(nama, kode)")
        .order("created_at", { ascending: false });
      const items = list ?? [];
      const byStatus = items.reduce<Record<string, number>>((a, p: any) => {
        a[p.status] = (a[p.status] ?? 0) + 1; return a;
      }, {});
      return { items, byStatus };
    },
  });
  const items = data?.items ?? [];
  const byStatus = data?.byStatus ?? {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Warga"
        subtitle="Status pengajuan administrasi pribadi Anda."
        cta={
          <Button asChild className="bg-primary px-6 font-semibold shadow-solid hover:bg-primary/95">
            <Link to="/pengajuan/baru"><FilePlus2 className="h-4 w-4" /> Ajukan Surat Baru</Link>
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Pengajuan Saya" value={items.length} tone="primary" />
        <StatCard icon={Clock} label="Menunggu Verifikasi" value={byStatus["menunggu_verifikasi"] ?? 0} tone="warning" />
        <StatCard icon={CheckCircle2} label="Selesai Terbit" value={byStatus["selesai"] ?? 0} tone="success" />
        <StatCard icon={XCircle} label="Ditolak" value={byStatus["ditolak"] ?? 0} tone="destructive" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <QuickAction to="/pengajuan/baru" icon={FilePlus2} title="Ajukan Surat Baru" desc="Buat permohonan administrasi" />
        <QuickAction to="/pengajuan" icon={FileText} title="Pengajuan Saya" desc="Lacak status permohonan" />
        <QuickAction to="/arsip" icon={Archive} title="Arsip Surat" desc="Unduh surat yang terbit" />
      </div>

      <RecentTable items={items} title="Pengajuan Terakhir Saya" emptyText="Belum ada pengajuan. Mulai dengan menekan Ajukan Surat Baru." />
    </div>
  );
}

/* =========================== PETUGAS =========================== */
function PetugasDashboard() {
  const { data } = useQuery({
    queryKey: ["dash-petugas"],
    queryFn: async () => {
      const { data: list } = await supabase
        .from("pengajuan_surat")
        .select("id, status, created_at, jenis_surat:jenis_surat_id(nama, kode)")
        .order("created_at", { ascending: false });
      const items = list ?? [];
      const byStatus = items.reduce<Record<string, number>>((a, p: any) => {
        a[p.status] = (a[p.status] ?? 0) + 1; return a;
      }, {});
      const months: { label: string; total: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const total = items.filter((p: any) => {
          const pd = new Date(p.created_at);
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
        }).length;
        months.push({ label: d.toLocaleString("id-ID", { month: "short" }), total });
      }
      return { items, byStatus, months };
    },
  });
  const items = data?.items ?? [];
  const byStatus = data?.byStatus ?? {};
  const months = data?.months ?? [];
  const antrian = (byStatus["menunggu_verifikasi"] ?? 0) + (byStatus["diproses"] ?? 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Petugas"
        subtitle="Pantau antrian verifikasi dan progres pelayanan."
        cta={
          <Button asChild className="bg-primary px-6 font-semibold shadow-solid hover:bg-primary/95">
            <Link to="/petugas/pengajuan"><FileSearch className="h-4 w-4" /> Buka Antrian Verifikasi</Link>
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Antrian Perlu Diproses" value={antrian} tone="warning" />
        <StatCard icon={CheckCircle2} label="Selesai Terbit" value={byStatus["selesai"] ?? 0} tone="success" />
        <StatCard icon={XCircle} label="Ditolak" value={byStatus["ditolak"] ?? 0} tone="destructive" />
        <StatCard icon={FileText} label="Total Pengajuan" value={items.length} tone="primary" />
      </div>

      <Card className="border-border p-6 shadow-subtle">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="font-sans text-lg font-bold">Tren Pengajuan Masuk</h3>
            <p className="text-xs text-muted-foreground tracking-wide">6 bulan terakhir</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <RecentTable items={items} title="Pengajuan Terbaru" emptyText="Belum ada pengajuan masuk." linkLabel="Buka Antrian" linkTo="/petugas/pengajuan" />
    </div>
  );
}

/* =========================== ADMIN =========================== */
function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["dash-admin"],
    queryFn: async () => {
      const [{ data: list }, { count: totalUsers }, { count: totalJenis }, { data: audit }] = await Promise.all([
        supabase.from("pengajuan_surat").select("id, status, created_at, jenis_surat:jenis_surat_id(nama, kode)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("jenis_surat").select("id", { count: "exact", head: true }),
        supabase.from("audit_logs").select("id, action, created_at, table_name").order("created_at", { ascending: false }).limit(6),
      ]);
      const items = list ?? [];
      const byStatus = items.reduce<Record<string, number>>((a, p: any) => {
        a[p.status] = (a[p.status] ?? 0) + 1; return a;
      }, {});
      const byJenis = items.reduce<Record<string, number>>((a, p: any) => {
        const k = p.jenis_surat?.kode ?? "—";
        a[k] = (a[k] ?? 0) + 1; return a;
      }, {});
      return {
        items, byStatus, byJenis,
        totalUsers: totalUsers ?? 0,
        totalJenis: totalJenis ?? 0,
        audit: audit ?? [],
      };
    },
  });
  const s = data ?? { items: [] as any[], byStatus: {} as Record<string, number>, byJenis: {} as Record<string, number>, totalUsers: 0, totalJenis: 0, audit: [] as any[] };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Administrator"
        subtitle="Konfigurasi sistem & pemantauan menyeluruh SIPELAK."
        cta={
          <Button asChild className="bg-primary px-6 font-semibold shadow-solid hover:bg-primary/95">
            <Link to="/admin/jenis-surat"><Settings2 className="h-4 w-4" /> Kelola Jenis Surat</Link>
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Pengguna" value={s.totalUsers} tone="info" />
        <StatCard icon={Layers} label="Jenis Surat Aktif" value={s.totalJenis} tone="primary" />
        <StatCard icon={FileText} label="Total Pengajuan" value={s.items.length} tone="primary" />
        <StatCard icon={CheckCircle2} label="Selesai Terbit" value={s.byStatus["selesai"] ?? 0} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border p-6 shadow-subtle lg:col-span-2">
          <h3 className="font-sans text-lg font-bold border-b border-border pb-4 mb-6">Distribusi Jenis Surat</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={Object.entries(s.byJenis).map(([k, v]) => ({ name: k, value: v }))}
                  dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5} stroke="none">
                  {Object.keys(s.byJenis).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border shadow-subtle">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h3 className="font-sans text-lg font-bold">Audit Terakhir</h3>
            <Button asChild variant="ghost" size="sm"><Link to="/admin/audit"><ShieldCheck className="h-4 w-4" /></Link></Button>
          </div>
          <ul className="divide-y divide-border">
            {s.audit.map((a: any) => (
              <li key={a.id} className="px-6 py-3 text-sm">
                <p className="font-semibold">{a.action}</p>
                <p className="text-xs text-muted-foreground">{a.table_name} · {new Date(a.created_at).toLocaleString("id-ID")}</p>
              </li>
            ))}
            {s.audit.length === 0 && <li className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas audit.</li>}
          </ul>
        </Card>
      </div>

      <RecentTable items={s.items} title="Pengajuan Terbaru Sistem" emptyText="Belum ada pengajuan di sistem." />
    </div>
  );
}

/* =========================== SHARED =========================== */
function PageHeader({ title, subtitle, cta }: { title: string; subtitle: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="font-sans text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {cta}
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: typeof FileText; title: string; desc: string }) {
  return (
    <Link to={to} className="group">
      <Card className="border-border p-6 shadow-subtle transition-all hover:border-primary hover:shadow-solid">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function RecentTable({
  items, title, emptyText, linkLabel = "Semua Pengajuan", linkTo = "/pengajuan",
}: { items: any[]; title: string; emptyText: string; linkLabel?: string; linkTo?: string }) {
  return (
    <Card className="border-border shadow-subtle">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="font-sans text-lg font-bold">{title}</h3>
        <Button asChild variant="outline" size="sm" className="font-semibold">
          <Link to={linkTo}>{linkLabel} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      <div className="p-2">
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
            {items.slice(0, 5).map((p: any) => (
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
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground font-medium">{emptyText}</p>
        )}
      </div>
    </Card>
  );
}
