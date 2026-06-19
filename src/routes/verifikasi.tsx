import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { ShieldCheck, ShieldAlert, ArrowLeft, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTanggal } from "@/lib/sipelak";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/verifikasi")({
  head: () => ({
    meta: [
      { title: "Verifikasi Dokumen — SIPELAK" },
      { name: "description", content: "Periksa keaslian surat yang diterbitkan SIPELAK melalui token QR atau nomor surat." },
    ],
  }),
  validateSearch: searchSchema,
  component: VerifikasiPage,
});

function VerifikasiPage() {
  const search = useSearch({ from: "/verifikasi" });
  const [token, setToken] = useState(search.token ?? "");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<null | { ok: boolean; data?: any; msg?: string }>(null);

  const cek = async (t: string) => {
    if (!t.trim()) return;
    setLoading(true); setHasil(null);
    const { data, error } = await supabase
      .from("pengajuan_surat")
      .select("nomor, status, hash_sha256, completed_at, created_at, qr_token, user_id, jenis_surat:jenis_surat_id(nama, kode)")
      .or(`qr_token.eq.${t.trim()},nomor.eq.${t.trim()}`)
      .maybeSingle();
    setLoading(false);
    if (error || !data) { setHasil({ ok: false, msg: "Dokumen tidak ditemukan dalam database SIPELAK." }); return; }
    const { data: prof } = await supabase.from("profiles").select("nama").eq("id", data.user_id).maybeSingle();
    const enriched: any = { ...data, profiles: prof };
    if (data.status !== "selesai") { setHasil({ ok: false, data: enriched, msg: "Dokumen ini masih dalam proses dan belum diterbitkan secara resmi." }); return; }
    setHasil({ ok: true, data: enriched });
  };

  useEffect(() => { if (search.token) cek(search.token); }, [search.token]);

  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Portal Utama
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistem Verifikasi Online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded bg-primary text-primary-foreground shadow-solid">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-sans text-3xl font-extrabold tracking-tight">Verifikasi Dokumen Resmi</h1>
          <p className="mt-2 text-muted-foreground">Validasi keaslian dokumen digital melalui Token QR atau Nomor Registrasi.</p>
        </div>

        <Card className="mt-10 border-border p-6 shadow-solid">
          <form onSubmit={(e) => { e.preventDefault(); cek(token); }} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                placeholder="Masukkan Token QR atau Nomor Surat" 
                className="h-12 pl-11 rounded-sm border-border focus:ring-primary/20"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 bg-primary px-8 font-bold shadow-subtle hover:bg-primary/95">
              {loading ? "MEMPROSES..." : "VERIFIKASI SEKARANG"}
            </Button>
          </form>
        </Card>

        {hasil && (
          <Card className={`mt-8 border p-8 shadow-solid ${hasil.ok ? "border-success/30 bg-card" : "border-destructive/30 bg-card"}`}>
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6 border-b border-border pb-8">
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded ${hasil.ok ? "bg-success text-white" : "bg-destructive text-white"}`}>
                {hasil.ok ? <ShieldCheck className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
              </div>
              <div className="min-w-0">
                <p className={`font-sans text-2xl font-extrabold tracking-tight ${hasil.ok ? "text-success" : "text-destructive"}`}>
                  {hasil.ok ? "DOKUMEN TERVERIFIKASI ASLI" : "DOKUMEN TIDAK VALID"}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{hasil.msg ?? "Data dokumen ditemukan dan valid sesuai rekaman database SIPELAK."}</p>
              </div>
            </div>

            {hasil.data && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Nomor Registrasi" value={hasil.data.nomor} mono />
                <Field label="Klasifikasi Surat" value={hasil.data.jenis_surat?.nama ?? "-"} />
                <Field label="Nama Pemohon" value={hasil.data.profiles?.nama ?? "-"} />
                <Field label="Waktu Terbit" value={formatTanggal(hasil.data.completed_at ?? hasil.data.created_at)} />
                {hasil.data.hash_sha256 && (
                  <div className="sm:col-span-2"><Field label="SHA-256 Digital Signature" value={hasil.data.hash_sha256} mono /></div>
                )}
              </div>
            )}
            
            {hasil.ok && (
              <div className="mt-8 rounded border border-border bg-secondary/50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Catatan Keamanan</p>
                <p className="mt-1 text-xs text-muted-foreground">Data ini diambil langsung dari database pusat SIPELAK Kecamatan.</p>
              </div>
            )}
          </Card>
        )}
      </main>

      <footer className="mt-12 border-t border-border py-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        SIPELAK — Secure Government Information System
      </footer>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded border border-border bg-secondary/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 break-all font-bold ${mono ? "font-mono text-[10px] text-primary" : "text-sm text-foreground"}`}>{value}</p>
    </div>
  );
}

