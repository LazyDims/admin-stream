import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck, ShieldCheck, FileSignature, QrCode, Clock4, FileSearch, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIPELAK — Pelayanan Administrasi Kecamatan Digital" },
      { name: "description", content: "Ajukan surat, lacak status real-time, dan verifikasi keaslian dokumen kecamatan secara online." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-soft">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none">SIPELAK</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Layanan Kecamatan</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#layanan" className="text-sm text-muted-foreground hover:text-foreground">Layanan</a>
            <a href="#alur" className="text-sm text-muted-foreground hover:text-foreground">Alur</a>
            <Link to="/verifikasi" className="text-sm text-muted-foreground hover:text-foreground">Verifikasi Dokumen</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Masuk</Link></Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90"><Link to="/auth">Daftar</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.08]" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> E-Government • Transformasi Digital
              </div>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
                Pelayanan administrasi <span className="bg-gradient-hero bg-clip-text text-transparent">kecamatan modern</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Ajukan surat, unggah dokumen persyaratan, dan pantau status pengajuan secara real-time. Setiap surat dilengkapi QR Code & hash SHA-256 untuk verifikasi keaslian.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-hero text-primary-foreground shadow-elegant hover:opacity-95">
                  <Link to="/auth">Mulai Ajukan Surat <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/verifikasi">Verifikasi Dokumen</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock4 className="h-4 w-4 text-primary" /> Proses cepat</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Aman & terenkripsi</div>
                <div className="flex items-center gap-2"><QrCode className="h-4 w-4 text-primary" /> Verifikasi QR</div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-elegant">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Pengajuan Surat</p>
                    <p className="font-display text-lg font-bold">Surat Keterangan Domisili</p>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success border border-success/40">Selesai</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <Row label="Nomor" value="SKD/202506/1284" />
                  <Row label="Pemohon" value="Budi Santoso" />
                  <Row label="Tanggal" value="15 Jun 2026" />
                  <Row label="Hash SHA-256" value="9f3a…b7e2" mono />
                </div>
                <div className="mt-5 flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-foreground text-background">
                    <QrCode className="h-10 w-10" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Verifikasi</p>
                    <p className="truncate text-sm font-medium">Pindai QR atau buka /verifikasi</p>
                    <p className="text-xs text-success">✓ Terverifikasi Asli</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan */}
      <section id="layanan" className="border-t border-border/60 bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Layanan Tersedia</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Empat layanan surat utama</h2>
            <p className="mt-3 text-muted-foreground">Tersedia digital, dapat ditambah kapan saja oleh administrator.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "SKD", n: "Surat Keterangan Domisili" },
              { k: "SKU", n: "Surat Keterangan Usaha" },
              { k: "SPNG", n: "Surat Pengantar" },
              { k: "SKTM", n: "Surat Keterangan Tidak Mampu" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border/60 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileSignature className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-mono text-muted-foreground">{s.k}</p>
                <p className="mt-1 font-semibold">{s.n}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur */}
      <section id="alur" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Alur Pelayanan</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Empat langkah, satu sistem</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              { i: "01", t: "Registrasi", d: "Buat akun warga dengan NIK dan data dasar." },
              { i: "02", t: "Ajukan Surat", d: "Pilih jenis surat, isi keperluan, unggah persyaratan." },
              { i: "03", t: "Verifikasi", d: "Petugas memeriksa dan menyetujui/menolak." },
              { i: "04", t: "Unduh & Verifikasi", d: "Unduh PDF ber-QR & hash, dapat diverifikasi publik." },
            ].map((s) => (
              <div key={s.i} className="relative rounded-xl border border-border/60 bg-gradient-card p-5">
                <p className="font-display text-3xl font-extrabold text-primary/20">{s.i}</p>
                <p className="mt-2 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA verifikasi */}
      <section className="border-t border-border/60 bg-gradient-hero py-16 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <FileSearch className="h-3.5 w-3.5" /> Cek Keaslian Surat
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Verifikasi dokumen dalam hitungan detik</h2>
            <p className="mt-2 max-w-xl text-primary-foreground/80">Masukkan nomor atau token QR yang tercetak pada surat.</p>
          </div>
          <Button asChild size="lg" variant="secondary"><Link to="/verifikasi">Buka Halaman Verifikasi</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} SIPELAK — Sistem Informasi Pelayanan Administrasi Kecamatan</p>
          <p>Mendukung E-Government Indonesia</p>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`truncate font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
