export const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  menunggu_verifikasi: { label: "Menunggu Verifikasi", tone: "bg-warning/15 text-warning-foreground border border-warning/40" },
  diproses: { label: "Diproses", tone: "bg-info/15 text-info border border-info/40" },
  disetujui: { label: "Disetujui", tone: "bg-success/15 text-success border border-success/40" },
  ditolak: { label: "Ditolak", tone: "bg-destructive/15 text-destructive border border-destructive/40" },
  selesai: { label: "Selesai", tone: "bg-primary/15 text-primary border border-primary/40" },
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
