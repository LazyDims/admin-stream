export const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  menunggu_verifikasi: { label: "MENUNGGU VERIFIKASI", tone: "bg-warning/10 text-warning-foreground border-warning/20 border font-bold" },
  diproses: { label: "SEDANG DIPROSES", tone: "bg-info/10 text-info border-info/20 border font-bold" },
  disetujui: { label: "BERKAS DISETUJUI", tone: "bg-success/10 text-success border-success/20 border font-bold" },
  ditolak: { label: "PENGAJUAN DITOLAK", tone: "bg-destructive/10 text-destructive border-destructive/20 border font-bold" },
  selesai: { label: "SURAT TERBIT", tone: "bg-primary text-primary-foreground border-primary border font-bold" },
};

export function formatTanggal(s?: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateNomor(kode: string) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${kode}/${ym}/${rand}`;
}

export function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
