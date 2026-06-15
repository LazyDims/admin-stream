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
      <div className="relative hidden overflow-hidden bg-gradient-hero text-primary-foreground lg:block">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2), transparent 40%)",
        }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-xl font-bold">SIPELAK</p>
              <p className="text-xs text-primary-foreground/80">Pelayanan Administrasi Kecamatan</p>
            </div>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Layanan kecamatan, kini di genggaman.
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              Pengajuan surat lebih cepat, transparan, dan aman dengan verifikasi dokumen digital berbasis QR & SHA-256.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/70">© SIPELAK — Mendukung E-Government Indonesia</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <p className="font-display text-lg font-bold">SIPELAK</p>
            </Link>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="mt-4 border-border/60 p-6 shadow-soft">
                <LoginForm />
              </Card>
            </TabsContent>
            <TabsContent value="register">
              <Card className="mt-4 border-border/60 p-6 shadow-soft">
                <RegisterForm />
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, Anda menyetujui kebijakan layanan SIPELAK.
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
    toast.success("Berhasil masuk");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Selamat datang kembali</h2>
        <p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengelola pengajuan Anda.</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="warga@email.com" />
      </div>
      <div>
        <Label htmlFor="password">Kata Sandi</Label>
        <Input id="password" type="password" autoComplete="current-password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Masuk
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
    toast.success("Akun berhasil dibuat. Silakan masuk.");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Buat akun warga</h2>
        <p className="mt-1 text-sm text-muted-foreground">Daftar gratis untuk mengajukan surat secara online.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Nama Lengkap</Label>
          <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Budi Santoso" /></div>
        <div className="col-span-2"><Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="warga@email.com" /></div>
        <div className="col-span-2"><Label>Kata Sandi</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div><Label>NIK (16 digit)</Label>
          <Input inputMode="numeric" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} /></div>
        <div><Label>No. HP</Label>
          <Input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} /></div>
        <div className="col-span-2"><Label>Alamat</Label>
          <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} /></div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-soft hover:opacity-95">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Daftar Sekarang
      </Button>
    </form>
  );
}
