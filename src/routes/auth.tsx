import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { BadgeCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk / Daftar — SIPELAK" }] }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(72),
});
const registerSchema = loginSchema.extend({
  nama: z.string().trim().min(2, "Nama wajib").max(100),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit").optional().or(z.literal("")),
  no_hp: z.string().trim().max(20).optional().or(z.literal("")),
  alamat: z.string().trim().max(255).optional().or(z.literal("")),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Branding */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />
        <Link to="/" className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded bg-white/10 shadow-subtle">
            <BadgeCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="font-sans text-2xl font-bold tracking-tight">SIPELAK</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">Sistem Informasi Kecamatan</p>
          </div>
        </Link>
        <div className="relative">
          <h2 className="font-sans text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Modernisasi Pelayanan <br /> Publik Terpadu.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-primary-foreground/80">
            Akses layanan mandiri untuk pengajuan berbagai jenis surat keterangan dengan sistem verifikasi digital yang aman dan transparan.
          </p>
        </div>
        <div className="relative flex items-center gap-4 text-sm font-medium text-primary-foreground/60">
          <p>© {new Date().getFullYear()} SIPELAK</p>
          <span className="h-1 w-1 rounded-full bg-primary-foreground/30" />
          <p>Mendukung E-Gov Indonesia</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <p className="font-sans text-xl font-bold tracking-tight">SIPELAK</p>
            </Link>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-md bg-secondary p-1">
              <TabsTrigger value="login" className="rounded-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-subtle">MASUK</TabsTrigger>
              <TabsTrigger value="register" className="rounded-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-subtle">DAFTAR</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Card className="border-border p-8 shadow-subtle">
                <LoginForm />
              </Card>
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <Card className="border-border p-8 shadow-subtle">
                <RegisterForm />
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sistem Informasi Pelayanan Administrasi Kecamatan
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = loginSchema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(p.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Berhasil masuk ke sistem");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="font-sans text-2xl font-bold text-foreground">Akses Warga</h2>
        <p className="mt-1 text-sm text-muted-foreground">Silakan masuk menggunakan akun terdaftar.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Alamat Email</Label>
          <Input id="email" type="email" autoComplete="email" className="rounded-sm" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" title="Kata Sandi" className="text-xs font-bold uppercase tracking-wider">Kata Sandi</Label>
          <Input id="password" type="password" autoComplete="current-password" className="rounded-sm" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-primary font-bold shadow-solid hover:bg-primary/95">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} MASUK SEKARANG
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", password: "", nik: "", no_hp: "", alamat: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = registerSchema.safeParse(form);
    if (!p.success) { toast.error(p.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: p.data.email, password: p.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nama: p.data.nama, nik: p.data.nik || null, no_hp: p.data.no_hp || null, alamat: p.data.alamat || null },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pendaftaran berhasil. Silakan cek email atau langsung masuk.");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="font-sans text-2xl font-bold text-foreground">Registrasi Baru</h2>
        <p className="mt-1 text-sm text-muted-foreground">Lengkapi data diri untuk membuat akun warga.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">Nama Lengkap Sesuai KTP</Label>
          <Input className="rounded-sm" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Budi Santoso" /></div>
        <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">Email Aktif</Label>
          <Input className="rounded-sm" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></div>
        <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">Kata Sandi</Label>
          <Input className="rounded-sm" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">NIK (16 Digit)</Label>
          <Input className="rounded-sm" inputMode="numeric" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} /></div>
        <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">No. Telepon/WA</Label>
          <Input className="rounded-sm" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} /></div>
        <div className="col-span-2 space-y-2"><Label className="text-xs font-bold uppercase tracking-wider">Alamat Domisili</Label>
          <Input className="rounded-sm" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-primary font-bold shadow-solid hover:bg-primary/95">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} BUAT AKUN SEKARANG
      </Button>
    </form>
  );
}

