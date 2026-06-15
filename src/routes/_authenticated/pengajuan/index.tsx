import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, FilePlus2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTanggal } from "@/lib/sipelak";

export const Route = createFileRoute("/_authenticated/pengajuan/")({
  component: PengajuanList,
});

function PengajuanList() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["pengajuan-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pengajuan_surat")
        .select("id, nomor, status, keperluan, created_at, jenis_surat:jenis_surat_id(nama, kode)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((p: any) => {
    const matchQ = !q || p.nomor.toLowerCase().includes(q.toLowerCase()) ||
      p.jenis_surat?.nama?.toLowerCase().includes(q.toLowerCase()) ||
      p.keperluan.toLowerCase().includes(q.toLowerCase());
    const matchS = !statusFilter || p.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pengajuan Saya</h1>
          <p className="text-sm text-muted-foreground">Lacak status setiap pengajuan surat Anda.</p>
        </div>
        <Button asChild className="bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95">
          <Link to="/pengajuan/baru"><FilePlus2 className="h-4 w-4" /> Ajukan Baru</Link>
        </Button>
      </div>

      <Card className="border-border/60 p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor / jenis / keperluan..." className="pl-9" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Semua status</option>
            <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
            <option value="diproses">Diproses</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </Card>

      <Card className="border-border/60 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Jenis Surat</th>
                <th className="px-4 py-3">Keperluan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Memuat...</td></tr>)}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada pengajuan.</td></tr>
              )}
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{p.nomor}</td>
                  <td className="px-4 py-3 font-medium">{p.jenis_surat?.nama}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{p.keperluan}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTanggal(p.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm"><Link to="/pengajuan/$id" params={{ id: p.id }}>Detail</Link></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
