import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Upload, FileSignature, CheckCircle2 } from "lucide-react";
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
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
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
    
    // Validate all requirements have files
    const missing = persyaratan.filter(p => !fileMap[p]);
    if (missing.length > 0) {
      toast.error(`Harap unggah berkas: ${missing.join(", ")}`);
      return;
    }

    setBusy(true);
    const nomor = generateNomor(jenis.kode);
    const qr_token = generateToken();

    try {
      // 1. Create pengajuan
      const { data: ins, error } = await supabase.from("pengajuan_surat").insert({
        nomor, user_id: user.id, jenis_surat_id: jenis.id, keperluan, qr_token,
        status: "menunggu_verifikasi",
      }).select("id").single();
      
      if (error) throw error;

      // 2. Upload files & create dokumen records
      const dokRows = [];
      for (const [nama, file] of Object.entries(fileMap)) {
        if (!file) continue;
        const ext = file.name.split(".").pop();
        // Path: userId/pengajuanId/requirement_name.ext
        const safeName = nama.replace(/\s+/g, "_").toLowerCase();
        const path = `${user.id}/${ins.id}/${safeName}.${ext}`;
        
        const { error: upErr } = await supabase.storage
          .from("dokumen")
          .upload(path, file);
        
        if (upErr) throw upErr;

        // Get public URL (or path if using signed URLs later)
        const { data: { publicUrl } } = supabase.storage.from("dokumen").getPublicUrl(path);

        dokRows.push({
          pengajuan_id: ins.id,
          nama,
          file_url: publicUrl,
        });
      }

      if (dokRows.length > 0) {
        const { error: dokErr } = await supabase.from("dokumen_persyaratan").insert(dokRows);
        if (dokErr) throw dokErr;
      }

      // 3. Audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id, action: "create_pengajuan", entity: "pengajuan_surat", entity_id: ins.id,
        metadata: { nomor, jenis: jenis.kode },
      });

      toast.success("Pengajuan berhasil dikirim");
      navigate({ to: "/pengajuan/$id", params: { id: ins.id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengirim pengajuan");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-sans text-3xl font-extrabold tracking-tight">Ajukan Surat Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">Silakan pilih jenis layanan dan lengkapi berkas persyaratan.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card className="border-border p-6 shadow-subtle">
          <Label className="text-xs font-bold uppercase tracking-wider">Pilih Jenis Layanan Surat</Label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(jenisList ?? []).map((j) => (
              <button type="button" key={j.id} onClick={() => { setJenisId(j.id); setFileMap({}); }}
                className={`group relative rounded border p-5 text-left transition-all ${jenisId === j.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-solid" : "border-border bg-card hover:border-primary/50"}`}>
                <div className="flex items-start gap-4">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded ${jenisId === j.id ? "bg-primary text-white" : "bg-secondary text-primary"}`}>
                    <FileSignature className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground">{j.kode}</p>
                    <p className="mt-0.5 font-bold text-foreground">{j.nama}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{j.deskripsi}</p>
                  </div>
                </div>
                {jenisId === j.id && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className="border-border p-6 shadow-subtle">
          <Label htmlFor="keperluan" className="text-xs font-bold uppercase tracking-wider">Keperluan / Keterangan</Label>
          <Textarea id="keperluan" className="mt-4 rounded-sm border-border focus:ring-primary/20" value={keperluan} onChange={(e) => setKeperluan(e.target.value)}
            placeholder="Jelaskan secara rinci tujuan pengajuan surat ini..." rows={4} maxLength={500} />
          <div className="mt-2 flex justify-end">
            <span className={`text-[10px] font-bold ${keperluan.length > 450 ? "text-destructive" : "text-muted-foreground"}`}>{keperluan.length}/500</span>
          </div>
        </Card>

        {jenis && persyaratan.length > 0 && (
          <Card className="border-border p-6 shadow-subtle">
            <Label className="text-xs font-bold uppercase tracking-wider">Unggah Berkas Persyaratan (PDF/JPG/PNG)</Label>
            <p className="mt-1 text-xs text-muted-foreground">Pastikan dokumen terbaca dengan jelas. Ukuran maksimal 5MB per berkas.</p>
            <div className="mt-6 space-y-6">
              {persyaratan.map((p) => (
                <div key={p} className="rounded border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded bg-background border border-border text-muted-foreground">
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-foreground">{p}</span>
                    </div>
                    <div className="w-full sm:max-w-xs">
                      <Input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="h-9 rounded-sm bg-background px-2 py-1 text-xs file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-[10px] file:font-bold file:text-primary hover:file:bg-primary/20"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setFileMap({ ...fileMap, [p]: file });
                        }} 
                      />
                    </div>
                  </div>
                  {fileMap[p] && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{fileMap[p]?.name} Terpilih</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button type="button" variant="ghost" className="font-bold" onClick={() => navigate({ to: "/pengajuan" })}>BATALKAN</Button>
          <Button type="submit" disabled={busy || !jenisId} className="bg-primary px-10 font-bold shadow-solid hover:bg-primary/95">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "KIRIM PENGAJUAN"}
          </Button>
        </div>
      </form>
    </div>
  );
}
