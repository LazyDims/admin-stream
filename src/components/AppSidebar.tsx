import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, FilePlus2, Archive, FileSearch,
  Settings2, ShieldCheck, LogOut, BadgeCheck, Users,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };

const NAV: Record<AppRole, { label: string; items: NavItem[] }> = {
  warga: {
    label: "Menu Warga",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Ajukan Surat", url: "/pengajuan/baru", icon: FilePlus2 },
      { title: "Pengajuan Saya", url: "/pengajuan", icon: FileText },
      { title: "Arsip Surat", url: "/arsip", icon: Archive },
    ],
  },
  petugas: {
    label: "Menu Petugas",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Verifikasi Pengajuan", url: "/petugas/pengajuan", icon: FileSearch },
      { title: "Arsip Surat", url: "/arsip", icon: Archive },
    ],
  },
  admin: {
    label: "Menu Admin",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Kelola User", url: "/admin/users", icon: Users },
      { title: "Kelola Jenis Surat", url: "/admin/jenis-surat", icon: Settings2 },
      { title: "Verifikasi Pengajuan", url: "/petugas/pengajuan", icon: FileSearch },
      { title: "Audit Log", url: "/admin/audit", icon: ShieldCheck },
      { title: "Arsip Surat", url: "/arsip", icon: Archive },

    ],
  },
};

function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("petugas")) return "petugas";
  return "warga";
}

const ROLE_LABEL: Record<AppRole, string> = {
  warga: "Warga",
  petugas: "Petugas",
  admin: "Administrator",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { roles, signOut, user } = useAuth();

  const role = primaryRole(roles);
  const nav = NAV[role];

  const isActive = (p: string) =>
    p === "/dashboard" ? pathname === p : pathname === p || pathname.startsWith(p + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-primary text-primary-foreground shadow-subtle">
            <BadgeCheck className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-sans text-lg font-bold tracking-tight">SIPELAK</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {ROLE_LABEL[role]}
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{nav.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs">
            <p className="truncate font-medium text-foreground">{user.email}</p>
            <p className="truncate text-muted-foreground">{ROLE_LABEL[role]}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => void signOut()} className="w-full justify-start">
          <LogOut className="h-4 w-4" /> {!collapsed && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
