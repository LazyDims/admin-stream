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
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground shadow-subtle">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-sans text-xl font-bold leading-none tracking-tight">SIPELAK</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layanan Administrasi Kecamatan</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#layanan" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Layanan</a>
            <a href="#alur" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Alur</a>
            <Link to="/verifikasi" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Verifikasi Dokumen</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="font-medium"><Link to="/auth">Masuk</Link></Button>
            <Button asChild size="sm" className="bg-primary font-medium hover:bg-primary/90"><Link to="/auth">Daftar Sekarang</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-border bg-secondary/20 py-16 lg:py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Portal Resmi E-Government
              </div>
              <h1 className="mt-6 font-sans text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Pelayanan Administrasi <span className="text-primary">Kecamatan Digital</span> Terpadu.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Sistem informasi modern untuk pengajuan surat, pelacakan status real-time, dan verifikasi dokumen secara online. Cepat, transparan, dan terpercaya.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-primary px-8 text-primary-foreground shadow-solid hover:bg-primary/95">
                  <Link to="/auth">Ajukan Surat Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-8">
                  <Link to="/verifikasi">Verifikasi Dokumen</Link>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock4 className="h-5 w-5 text-primary" /> Efisien</div>
                <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-5 w-5 text-primary" /> Terenkripsi</div>
                <div className="flex items-center gap-2 text-sm font-medium"><QrCode className="h-5 w-5 text-primary" /> Validitas QR</div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg border border-border bg-card p-8 shadow-solid">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preview Dokumen</p>
                    <p className="mt-1 font-sans text-xl font-bold">Surat Keterangan Domisili</p>
                  </div>
                  <span className="rounded bg-success/10 px-3 py-1 text-xs font-bold text-success border border-success/20">TERVERIFIKASI</span>
                </div>
                <div className="mt-6 space-y-4 text-sm">
                  <Row label="No. Registrasi" value="REG/SKD/2026/001" />
                  <Row label="Nama Pemohon" value="Drs. Budi Santoso" />
                  <Row label="Tanggal Terbit" value="18 Juni 2026" />
                  <Row label="Otentikasi Hash" value="SHA256-8A2F...C9E1" mono />
                </div>
                <div className="mt-8 flex items-center gap-6 rounded-md border border-border bg-muted/50 p-5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded border border-border bg-white p-1 shadow-subtle">
                    <QrCode className="h-full w-full text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scan Verifikasi</p>
                    <p className="mt-1 truncate text-sm font-semibold">Validasi keaslian dokumen melalui sistem SIPELAK</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
                      <BadgeCheck className="h-3 w-3" /> Dokumen Asli Terdaftar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan */}
      <section id="layanan" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Katalog Pelayanan</p>
            <h2 className="mt-4 font-sans text-3xl font-bold tracking-tight sm:text-4xl">Jenis Layanan Surat Online</h2>
            <div className="mt-4 h-1 w-20 bg-primary" />
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "SKD", n: "Keterangan Domisili", d: "Untuk keperluan administrasi kependudukan." },
              { k: "SKU", n: "Keterangan Usaha", d: "Legalitas untuk pelaku usaha mikro/menengah." },
              { k: "SPNG", n: "Surat Pengantar", d: "Pengantar untuk dokumen kependudukan lainnya." },
              { k: "SKTM", n: "Keterangan Tidak Mampu", d: "Akses bantuan sosial bagi warga pra-sejahtera." },
            ].map((s) => (
              <div key={s.k} className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-solid">
                <div className="grid h-12 w-12 place-items-center rounded bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <FileSignature className="h-6 w-6" />
                </div>
                <p className="mt-6 text-[10px] font-bold tracking-widest text-muted-foreground">{s.k}</p>
                <p className="mt-1 font-bold text-foreground">{s.n}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur */}
      <section id="alur" className="border-t border-border bg-secondary/10 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Prosedur Layanan</p>
            <h2 className="mt-4 font-sans text-3xl font-bold tracking-tight sm:text-4xl">Tahapan Pengajuan Mandiri</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-4">
            {[
              { i: "1", t: "Registrasi Akun", d: "Mendaftar dengan NIK dan data diri valid." },
              { i: "2", t: "Input Pengajuan", d: "Mengisi form dan unggah dokumen persyaratan." },
              { i: "3", t: "Verifikasi Berkas", d: "Validasi oleh petugas administrasi kecamatan." },
              { i: "4", t: "Selesai & Unduh", d: "Surat terbit dengan QR Code resmi siap digunakan." },
            ].map((s) => (
              <div key={s.i} className="relative flex flex-col items-start rounded-lg border border-border bg-card p-6 shadow-subtle">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {s.i}
                </div>
                <p className="mt-6 font-bold">{s.t}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="font-sans text-3xl font-bold sm:text-4xl leading-tight">Pastikan Keaslian Dokumen Anda</h2>
              <p className="mt-4 text-lg text-primary-foreground/80 leading-relaxed">
                Setiap dokumen yang diterbitkan melalui SIPELAK dilengkapi dengan tanda tangan elektronik dan kode verifikasi unik untuk menjamin keaslian data.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="px-8 font-bold">
                <Link to="/verifikasi">Cek Validitas Surat</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-bold text-foreground">SIPELAK</p>
            <p className="mt-1 text-sm text-muted-foreground">© {new Date().getFullYear()} Sistem Informasi Pelayanan Administrasi Kecamatan</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success" /> Server Aktif • Indonesia Maju
          </div>
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
