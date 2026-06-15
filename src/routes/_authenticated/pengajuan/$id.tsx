import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, FileText, QrCode, Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTanggal, sha256 } from "@/lib/sipelak";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pengajuan/$id")({
  component: PengajuanDetail,
});

function PengajuanDetail() {
  const { id } = Route.useParams();
  const { user, roles } = useAuth();
  const isStaff = roles.includes("petugas") || roles.includes("admin");
  const qc = useQueryClient();
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pengajuan", id],
    queryFn: async () => {
      const { data: p, error } = await supabase
        .from("pengajuan_surat")
        .select("*, jenis_surat:jenis_surat_id(*), profiles:user_id(nama, nik, alamat, no_hp, email)")
        .eq("id", id).single();
      if (error) throw error;
      const { data: dok } = await supabase.from("dokumen_persyaratan").select("*").eq("pengajuan_id", id);
      return { p, dok: dok ?? [] };
    },
  });

  const updateStatus = async (status: string, terimaCatatan?: string) => {
    if (!user || !data) return;
    setBusy(true);
    const patch: Record<string, any> = { status, petugas_id: user.id };
    if (terimaCatatan !== undefined) patch.catatan_petugas = terimaCatatan;
    if (status === "selesai") {
      patch.completed_at = new Date().toISOString();
      const content = `${data.p.nomor}|${data.p.jenis_surat?.kode}|${data.p.user_id}|${data.p.created_at}`;
      patch.hash_sha256 = await sha256(content);
    }
    const { error } = await supabase.from("pengajuan_surat").update(patch).eq("id", id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await supabase.from("audit_logs").insert({
      user_id: user.id, action: `update_status_${status}`, entity: "pengajuan_surat", entity_id: id,
      metadata: { catatan: terimaCatatan ?? null },
    });
    toast.success(`Status diubah ke ${status}`);
    qc.invalidateQueries({ queryKey: ["pengajuan", id] });
    qc.invalidateQueries({ queryKey: ["pengajuan-list"] });
    setBusy(false);
  };

  if (isLoading) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data) return <p>Pengajuan tidak ditemukan.</p>;
  const { p, dok } = data;
  const verifUrl = typeof window !== "undefined" ? `${window.location.origin}/verifikasi?token=${p.qr_token}` : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/pengajuan"><ArrowLeft className="h-4 w-4" /> Kembali</Link></Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60 p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{p.nomor}</p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{p.jenis_surat?.nama}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Diajukan {formatTanggal(p.created_at)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Pemohon" value={p.profiles?.nama ?? "-"} />
              <Field label="NIK" value={p.profiles?.nik ?? "-"} />
              <Field label="No. HP" value={p.profiles?.no_hp ?? "-"} />
              <Field label="Email" value={p.profiles?.email ?? "-"} />
              <div className="sm:col-span-2"><Field label="Alamat" value={p.profiles?.alamat ?? "-"} /></div>
              <div className="sm:col-span-2"><Field label="Keperluan" value={p.keperluan} /></div>
              {p.catatan_petugas && <div className="sm:col-span-2"><Field label="Catatan Petugas" value={p.catatan_petugas} /></div>}
            </div>
          </Card>

          <Card className="border-border/60 p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold">Dokumen Persyaratan</h3>
            <div className="mt-3 divide-y divide-border">
              {dok.length === 0 && <p className="py-4 text-sm text-muted-foreground">Tidak ada dokumen.</p>}
              {dok.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">{d.nama}</span>
                  </div>
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Buka</a>
                </div>
              ))}
            </div>
          </Card>

          {isStaff && p.status !== "selesai" && p.status !== "ditolak" && (
            <Card className="border-border/60 p-6 shadow-soft">
              <h3 className="font-display text-lg font-bold">Aksi Petugas</h3>
              <Textarea className="mt-3" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (opsional untuk setujui, wajib untuk tolak)" rows={3} />
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === "menunggu_verifikasi" && (
                  <Button disabled={busy} onClick={() => updateStatus("diproses", catatan || undefined)} variant="outline">Tandai Diproses</Button>
                )}
                <Button disabled={busy} onClick={() => updateStatus("disetujui", catatan || undefined)} className="bg-success text-success-foreground hover:bg-success/90">
                  <CheckCircle2 className="h-4 w-4" /> Setujui
                </Button>
                <Button disabled={busy} onClick={() => updateStatus("selesai", catatan || undefined)} className="bg-gradient-hero text-primary-foreground hover:opacity-95">
                  Terbitkan & Selesai
                </Button>
                <Button disabled={busy || !catatan.trim()} onClick={() => updateStatus("ditolak", catatan)} variant="destructive">
                  <XCircle className="h-4 w-4" /> Tolak
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold">Verifikasi Dokumen</h3>
            <p className="mt-1 text-xs text-muted-foreground">QR & hash hanya tersedia setelah surat selesai.</p>
            {p.status === "selesai" ? (
              <div className="mt-4 space-y-3">
                <div className="grid place-items-center rounded-xl bg-foreground p-6 text-background">
                  <QrCode className="h-32 w-32" />
                </div>
                <div className="rounded-lg bg-secondary p-3 text-xs">
                  <p className="text-muted-foreground">Token</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate font-mono">{p.qr_token}</code>
                    <button onClick={() => { navigator.clipboard.writeText(p.qr_token!); toast.success("Tersalin"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-xs">
                  <p className="text-muted-foreground">Hash SHA-256</p>
                  <code className="break-all font-mono">{p.hash_sha256}</code>
                </div>
                <a href={verifUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">Halaman Verifikasi Publik</Button>
                </a>
                <Button className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> Cetak / Simpan PDF
                </Button>
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                Surat belum diterbitkan.
              </p>
            )}
          </Card>

          <Card className="border-border/60 p-6 shadow-soft">
            <h3 className="font-display text-lg font-bold">Linimasa</h3>
            <ol className="mt-3 space-y-3 text-sm">
              <TL label="Diajukan" t={p.created_at} active />
              <TL label="Update terakhir" t={p.updated_at} active />
              {p.completed_at && <TL label="Diterbitkan" t={p.completed_at} active />}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
function TL({ label, t, active }: { label: string; t: string; active?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${active ? "bg-primary" : "bg-border"}`} />
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{formatTanggal(t)}</p>
      </div>
    </li>
  );
}
