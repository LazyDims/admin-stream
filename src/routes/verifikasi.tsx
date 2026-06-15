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
    if (error || !data) { setHasil({ ok: false, msg: "Dokumen tidak ditemukan." }); return; }
    const { data: prof } = await supabase.from("profiles").select("nama").eq("id", data.user_id).maybeSingle();
    const enriched: any = { ...data, profiles: prof };
    if (data.status !== "selesai") { setHasil({ ok: false, data: enriched, msg: "Dokumen belum diterbitkan resmi." }); return; }
    setHasil({ ok: true, data: enriched });
  };

  useEffect(() => { if (search.token) cek(search.token); }, [search.token]);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-elegant">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Verifikasi Keaslian Dokumen</h1>
          <p className="mt-2 text-sm text-muted-foreground">Masukkan token QR atau nomor surat yang tercetak.</p>
        </div>

        <Card className="mt-8 border-border/60 p-5 shadow-elegant">
          <form onSubmit={(e) => { e.preventDefault(); cek(token); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token QR atau Nomor Surat" className="pl-9" />
            </div>
            <Button type="submit" disabled={loading} className="bg-gradient-hero text-primary-foreground hover:opacity-95">Verifikasi</Button>
          </form>
        </Card>

        {hasil && (
          <Card className={`mt-6 border p-6 shadow-soft ${hasil.ok ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
            <div className="flex items-start gap-3">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${hasil.ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                {hasil.ok ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <p className={`font-display text-xl font-bold ${hasil.ok ? "text-success" : "text-destructive"}`}>
                  {hasil.ok ? "Terverifikasi & Dokumen Asli" : "Dokumen Tidak Valid"}
                </p>
                <p className="text-sm text-muted-foreground">{hasil.msg ?? "Data dokumen tercatat di sistem SIPELAK."}</p>
              </div>
            </div>

            {hasil.data && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Nomor Surat" value={hasil.data.nomor} mono />
                <Field label="Jenis" value={hasil.data.jenis_surat?.nama ?? "-"} />
                <Field label="Pemohon" value={hasil.data.profiles?.nama ?? "-"} />
                <Field label="Diterbitkan" value={formatTanggal(hasil.data.completed_at ?? hasil.data.created_at)} />
                {hasil.data.hash_sha256 && (
                  <div className="sm:col-span-2"><Field label="Hash SHA-256" value={hasil.data.hash_sha256} mono /></div>
                )}
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 break-all font-medium ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}
