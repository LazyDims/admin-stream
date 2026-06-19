import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon, label, value, tone = "primary",
}: { icon: LucideIcon; label: string; value: string | number; tone?: "primary" | "success" | "warning" | "destructive" | "info" }) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    success: "bg-success/10 text-success border-success/20 border",
    warning: "bg-warning/10 text-warning-foreground border-warning/20 border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20 border",
    info: "bg-info/10 text-info border-info/20 border",
  };
  return (
    <Card className="relative overflow-hidden border-border bg-card p-6 shadow-subtle transition hover:shadow-solid">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-sans text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded ${toneMap[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

