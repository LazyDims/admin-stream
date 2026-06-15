import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Upload, FileSignature } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateNomor, generateToken } from "@/lib/sipelak";

export const Route = createFileRoute("/_authenticated/pengajuan/baru")({
  component: PengajuanBaru,
});

function PengajuanBaru() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jenisId, setJenisId] = useState<string>("");
  const [keperluan, setKeperluan] = useState("");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const { data: jenisList } = useQuery({
    queryKey: ["jenis-surat", "aktif"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jenis_surat").select("*").eq("aktif", true).order("nama");
      if (error) throw error;
      return data ?? [];
    },
  });

  const jenis = (jenisList ?? []).find((j) => j.id === jenisId);
  const persyaratan: string[] = Array.isArray(jenis?.persyaratan) ? (jenis!.persyaratan as string[]) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !jenis) { toast.error("Pilih jenis surat"); return; }
    if (keperluan.trim().length < 5) { toast.error("Keperluan minimal 5 karakter"); return; }
    setBusy(true);
    const nomor = generateNomor(jenis.kode);
    const qr_token = generateToken();
    const { data: ins, error } = await supabase.from("pengajuan_surat").insert({
      nomor, user_id: user.id, jenis_surat_id: jenis.id, keperluan, qr_token,
      status: "menunggu_verifikasi",
    }).select("id").single();
    if (error) { setBusy(false); toast.error(error.message); return; }

    // Insert dokumen rows
    const dokRows = Object.entries(files).filter(([, v]) => v).map(([nama, file_url]) => ({
      pengajuan_id: ins.id, nama, file_url,
    }));
    if (dokRows.length > 0) {
      await supabase.from("dokumen_persyaratan").insert(dokRows);
    }
    await supabase.from("audit_logs").insert({
      user_id: user.id, action: "create_pengajuan", entity: "pengajuan_surat", entity_id: ins.id,
      metadata: { nomor, jenis: jenis.kode },
    });
    setBusy(false);
    toast.success("Pengajuan terkirim");
    navigate({ to: "/pengajuan/$id", params: { id: ins.id } });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ajukan Surat Baru</h1>
        <p className="text-sm text-muted-foreground">Pilih jenis surat dan lengkapi persyaratan.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card className="border-border/60 p-5 shadow-soft">
          <Label>Jenis Surat</Label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(jenisList ?? []).map((j) => (
              <button type="button" key={j.id} onClick={() => setJenisId(j.id)}
                className={`group rounded-xl border p-4 text-left transition ${jenisId === j.id
                  ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${jenisId === j.id ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground">{j.kode}</p>
                    <p className="font-semibold">{j.nama}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.deskripsi}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 p-5 shadow-soft">
          <Label htmlFor="keperluan">Keperluan</Label>
          <Textarea id="keperluan" value={keperluan} onChange={(e) => setKeperluan(e.target.value)}
            placeholder="Jelaskan secara singkat keperluan surat..." rows={4} maxLength={500} />
          <p className="mt-1 text-xs text-muted-foreground">{keperluan.length}/500</p>
        </Card>

        {jenis && persyaratan.length > 0 && (
          <Card className="border-border/60 p-5 shadow-soft">
            <Label>Dokumen Persyaratan</Label>
            <p className="mt-1 text-xs text-muted-foreground">Unggah salinan dokumen (link URL atau salin nomor referensi).</p>
            <div className="mt-3 space-y-3">
              {persyaratan.map((p) => (
                <div key={p} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{p}</span>
                  </div>
                  <Input placeholder="Tempel URL dokumen atau no. referensi" value={files[p] ?? ""}
                    onChange={(e) => setFiles({ ...files, [p]: e.target.value })} />
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/pengajuan" })}>Batal</Button>
          <Button type="submit" disabled={busy || !jenisId} className="bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Kirim Pengajuan
          </Button>
        </div>
      </form>
    </div>
  );
}
