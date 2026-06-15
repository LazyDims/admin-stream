import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { formatTanggal } from "@/lib/sipelak";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) return <p className="text-sm text-muted-foreground">Hanya admin yang dapat mengakses halaman ini.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">200 aktivitas terakhir pada sistem.</p>
      </div>
      <Card className="border-border/60 shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Entitas</th><th className="px-4 py-3">Metadata</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((a: any) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatTanggal(a.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-[10px]">{a.user_id?.slice(0, 8) ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{a.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.entity}</td>
                  <td className="px-4 py-3 text-xs"><code className="break-all">{JSON.stringify(a.metadata)}</code></td>
                </tr>
              ))}
              {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada log.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
