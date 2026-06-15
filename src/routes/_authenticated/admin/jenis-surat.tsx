import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/jenis-surat")({
  component: AdminJenisSurat,
});

function AdminJenisSurat() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const [form, setForm] = useState({ kode: "", nama: "", deskripsi: "", persyaratan: "" });
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["jenis-surat-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("jenis_surat").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!isAdmin) return <p className="text-sm text-muted-foreground">Hanya admin yang dapat mengakses halaman ini.</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode || !form.nama) { toast.error("Kode & nama wajib"); return; }
    setBusy(true);
    const persyaratan = form.persyaratan.split("\n").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("jenis_surat").insert({
      kode: form.kode.toUpperCase(), nama: form.nama, deskripsi: form.deskripsi, persyaratan,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Jenis surat ditambahkan");
    setForm({ kode: "", nama: "", deskripsi: "", persyaratan: "" });
    qc.invalidateQueries({ queryKey: ["jenis-surat-admin"] });
  };

  const toggle = async (id: string, aktif: boolean) => {
    await supabase.from("jenis_surat").update({ aktif: !aktif }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["jenis-surat-admin"] });
  };
  const hapus = async (id: string) => {
    if (!confirm("Hapus jenis surat ini?")) return;
    const { error } = await supabase.from("jenis_surat").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["jenis-surat-admin"] }); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Kelola Jenis Surat</h1>
        <p className="text-sm text-muted-foreground">Tambah dan kelola jenis layanan surat yang tersedia.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card className="border-border/60 p-5 shadow-soft">
          <h3 className="font-display text-lg font-bold">Tambah Jenis Surat</h3>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <div><Label>Kode</Label><Input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} placeholder="mis. SKBN" /></div>
            <div><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="mis. Surat Keterangan Belum Nikah" /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} rows={2} /></div>
            <div><Label>Persyaratan (satu per baris)</Label>
              <Textarea value={form.persyaratan} onChange={(e) => setForm({ ...form, persyaratan: e.target.value })} rows={4} placeholder={"Scan KTP\nScan KK"} /></div>
            <Button type="submit" disabled={busy} className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah
            </Button>
          </form>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">Kode</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Persyaratan</th><th className="px-4 py-3">Aktif</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data ?? []).map((j: any) => (
                  <tr key={j.id}>
                    <td className="px-4 py-3 font-mono text-xs">{j.kode}</td>
                    <td className="px-4 py-3 font-medium">{j.nama}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{Array.isArray(j.persyaratan) ? j.persyaratan.length : 0} item</td>
                    <td className="px-4 py-3"><Switch checked={j.aktif} onCheckedChange={() => toggle(j.id, j.aktif)} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => hapus(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
