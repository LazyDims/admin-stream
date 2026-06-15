import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTanggal } from "@/lib/sipelak";

export const Route = createFileRoute("/_authenticated/arsip")({
  component: ArsipPage,
});

function ArsipPage() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["arsip"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pengajuan_surat")
        .select("id, nomor, hash_sha256, qr_token, completed_at, created_at, jenis_surat:jenis_surat_id(nama, kode)")
        .eq("status", "selesai")
        .order("completed_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((p: any) => !q ||
    p.nomor.toLowerCase().includes(q.toLowerCase()) ||
    p.jenis_surat?.nama?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Arsip Surat</h1>
        <p className="text-sm text-muted-foreground">Semua surat yang telah diterbitkan dan terverifikasi.</p>
      </div>

      <Card className="border-border/60 p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nomor / jenis surat..." className="pl-9" />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p: any) => (
          <Link key={p.id} to="/pengajuan/$id" params={{ id: p.id }}>
            <Card className="h-full border-border/60 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
              <p className="font-mono text-[10px] text-muted-foreground">{p.jenis_surat?.kode}</p>
              <p className="mt-1 font-display text-lg font-bold leading-tight">{p.jenis_surat?.nama}</p>
              <p className="mt-2 font-mono text-xs">{p.nomor}</p>
              <p className="mt-1 text-xs text-muted-foreground">Diterbitkan {formatTanggal(p.completed_at)}</p>
              <div className="mt-3 truncate rounded bg-secondary px-2 py-1 font-mono text-[10px]">
                #{p.hash_sha256?.slice(0, 24)}…
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            Belum ada surat di arsip.
          </Card>
        )}
      </div>
    </div>
  );
}
