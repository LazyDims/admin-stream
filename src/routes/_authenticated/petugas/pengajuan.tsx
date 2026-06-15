import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTanggal } from "@/lib/sipelak";

export const Route = createFileRoute("/_authenticated/petugas/pengajuan")({
  component: PetugasInbox,
});

function PetugasInbox() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("antrian");
  const { data } = useQuery({
    queryKey: ["petugas-pengajuan", tab],
    queryFn: async () => {
      let qb = supabase
        .from("pengajuan_surat")
        .select("id, nomor, status, keperluan, created_at, user_id, jenis_surat:jenis_surat_id(nama, kode)")
        .order("created_at", { ascending: false });
      if (tab === "antrian") qb = qb.in("status", ["menunggu_verifikasi", "diproses"]);
      if (tab === "selesai") qb = qb.eq("status", "selesai");
      if (tab === "ditolak") qb = qb.eq("status", "ditolak");
      const { data } = await qb;
      const list = data ?? [];
      const ids = Array.from(new Set(list.map((r: any) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, nama").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.nama]));
      return list.map((r: any) => ({ ...r, profiles: { nama: map.get(r.user_id) ?? "-" } }));
    },
  });

  const filtered = (data ?? []).filter((p: any) => !q ||
    p.nomor.toLowerCase().includes(q.toLowerCase()) ||
    p.profiles?.nama?.toLowerCase().includes(q.toLowerCase()) ||
    p.jenis_surat?.nama?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Verifikasi Pengajuan</h1>
        <p className="text-sm text-muted-foreground">Tinjau, setujui, atau tolak pengajuan warga.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { k: "antrian", l: "Antrian" }, { k: "selesai", l: "Selesai" }, { k: "ditolak", l: "Ditolak" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === t.k
              ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
            {t.l}
          </button>
        ))}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." className="pl-9" />
        </div>
      </div>

      <Card className="border-border/60 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nomor</th>
                <th className="px-4 py-3">Pemohon</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada data.</td></tr>)}
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{p.nomor}</td>
                  <td className="px-4 py-3 font-medium">{p.profiles?.nama}</td>
                  <td className="px-4 py-3">{p.jenis_surat?.nama}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTanggal(p.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm"><Link to="/pengajuan/$id" params={{ id: p.id }}>Tinjau</Link></Button>
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
