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
import { Label } from "@radix-ui/react-label";

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
        .select("*, jenis_surat:jenis_surat_id(*)")
        .eq("id", id).single();
      if (error) throw error;
      const { data: prof } = await supabase
        .from("profiles").select("nama, nik, alamat, no_hp, email").eq("id", p.user_id).maybeSingle();
      const { data: dok } = await supabase.from("dokumen_persyaratan").select("*").eq("pengajuan_id", id);
      return { p: { ...p, profiles: prof }, dok: dok ?? [] };
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
    const { error } = await supabase.from("pengajuan_surat").update(patch as any).eq("id", id);
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
  if (!data) return <p className="p-8 text-center font-bold">DATA TIDAK DITEMUKAN</p>;
  const { p, dok } = data;
  const verifUrl = typeof window !== "undefined" ? `${window.location.origin}/verifikasi?token=${p.qr_token}` : "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="font-bold"><Link to="/pengajuan"><ArrowLeft className="h-4 w-4" /> KEMBALI</Link></Button>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistem Pemantauan Real-time</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="border-border p-8 shadow-subtle">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6 mb-8">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{p.nomor}</p>
                <h1 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-foreground">{p.jenis_surat?.nama}</h1>
                <p className="mt-2 text-sm font-medium text-muted-foreground">Tanggal Registrasi: {formatTanggal(p.created_at)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nama Pemohon" value={p.profiles?.nama ?? "-"} />
              <Field label="Nomor Induk Kependudukan" value={p.profiles?.nik ?? "-"} />
              <Field label="Kontak Telepon" value={p.profiles?.no_hp ?? "-"} />
              <Field label="Alamat Email" value={p.profiles?.email ?? "-"} />
              <div className="sm:col-span-2"><Field label="Alamat Sesuai KTP" value={p.profiles?.alamat ?? "-"} /></div>
              <div className="sm:col-span-2 border-t border-border pt-6 mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Deskripsi Keperluan</p>
                <div className="mt-3 rounded border border-border bg-secondary/30 p-4">
                  <p className="text-sm leading-relaxed font-medium">{p.keperluan}</p>
                </div>
              </div>
              {p.catatan_petugas && (
                <div className="sm:col-span-2 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-destructive">Catatan dari Petugas</p>
                  <div className="mt-3 rounded border border-destructive/20 bg-destructive/5 p-4">
                    <p className="text-sm leading-relaxed font-semibold text-destructive">{p.catatan_petugas}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-border shadow-subtle">
            <div className="border-b border-border p-6 bg-secondary/10">
              <h3 className="font-sans text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Berkas Persyaratan Terlampir
              </h3>
            </div>
            <div className="p-6 divide-y divide-border">
              {dok.length === 0 && <p className="py-8 text-center text-sm font-medium text-muted-foreground">Tidak ada lampiran berkas.</p>}
              {dok.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 group">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded bg-secondary text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm">{d.nama}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">File Dokumen</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="font-bold">
                    <a href={d.file_url} target="_blank" rel="noreferrer">LIHAT BERKAS</a>
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {isStaff && p.status !== "selesai" && p.status !== "ditolak" && (
            <Card className="border-primary/20 border-2 p-8 shadow-solid">
              <h3 className="font-sans text-xl font-extrabold tracking-tight border-b border-border pb-4 mb-6">Panel Kendali Petugas</h3>
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider">Berikan Catatan / Feedback</Label>
                <Textarea className="rounded-sm border-border focus:ring-primary/20" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tuliskan catatan untuk warga jika diperlukan..." rows={3} />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {p.status === "menunggu_verifikasi" && (
                  <Button disabled={busy} onClick={() => updateStatus("diproses", catatan || undefined)} variant="outline" className="font-bold px-6">Tandai Diproses</Button>
                )}
                <Button disabled={busy} onClick={() => updateStatus("disetujui", catatan || undefined)} className="bg-success text-white font-bold hover:bg-success/90 px-6">
                  <CheckCircle2 className="h-4 w-4" /> SETUJUI BERKAS
                </Button>
                <Button disabled={busy} onClick={() => updateStatus("selesai", catatan || undefined)} className="bg-primary text-white font-bold hover:bg-primary/95 px-6 shadow-solid">
                  TERBITKAN SURAT
                </Button>
                <Button disabled={busy || !catatan.trim()} onClick={() => updateStatus("ditolak", catatan)} variant="destructive" className="font-bold px-6">
                  <XCircle className="h-4 w-4" /> TOLAK
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-border p-8 shadow-solid bg-card overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2">
              <div className="h-2 w-2 rounded-full bg-primary/20" />
            </div>
            <h3 className="font-sans text-lg font-bold border-b border-border pb-4 mb-6">Otentikasi Digital</h3>
            {p.status === "selesai" ? (
              <div className="space-y-6">
                <div className="grid place-items-center rounded border-2 border-dashed border-border bg-white p-8">
                  <QrCode className="h-32 w-32 text-foreground" />
                </div>
                <div className="space-y-4">
                  <div className="rounded border border-border bg-secondary/50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Digital Signature Token</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <code className="truncate font-mono text-xs font-bold text-primary">{p.qr_token}</code>
                      <button className="text-muted-foreground hover:text-primary transition-colors" onClick={() => { navigator.clipboard.writeText(p.qr_token!); toast.success("Token tersalin"); }}>
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="rounded border border-border bg-secondary/50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SHA-256 Integrity Hash</p>
                    <code className="mt-2 block break-all font-mono text-[10px] leading-relaxed font-bold text-foreground">{p.hash_sha256}</code>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full font-bold h-12">
                  <a href={verifUrl} target="_blank" rel="noreferrer">HALAMAN VERIFIKASI PUBLIK</a>
                </Button>
                <Button className="w-full bg-primary text-white font-bold h-12 shadow-solid" onClick={() => window.print()}>
                  <Download className="h-4 w-4" /> CETAK SURAT RESMI
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center rounded border border-dashed border-border bg-secondary/10">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Menunggu Penerbitan</p>
                <p className="mt-2 text-xs text-muted-foreground px-4 leading-relaxed">Fitur verifikasi akan aktif setelah pengajuan diselesaikan oleh petugas.</p>
              </div>
            )}
          </Card>

          <Card className="border-border p-8 shadow-subtle">
            <h3 className="font-sans text-lg font-bold border-b border-border pb-4 mb-6">Log Aktivitas</h3>
            <ol className="relative space-y-6 border-l border-border ml-2">
              <TL label="Registrasi Pengajuan" t={p.created_at} active />
              <TL label="Pembaruan Terakhir" t={p.updated_at} active />
              {p.completed_at && <TL label="Surat Diterbitkan" t={p.completed_at} active />}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-bold text-foreground">{value}</p>
    </div>
  );
}

function TL({ label, t, active }: { label: string; t: string; active?: boolean }) {
  return (
    <li className="ml-6 flex flex-col">
      <span className={`absolute -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-background ${active ? "bg-primary" : "bg-border"}`} />
      <p className="font-bold text-sm leading-none">{label}</p>
      <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{formatTanggal(t)}</p>
    </li>
  );
}

