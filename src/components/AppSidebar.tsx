import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FileText, FilePlus2, Archive, FileSearch,
  Settings2, ShieldCheck, LogOut, BadgeCheck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { roles, signOut, user } = useAuth();

  const isPetugas = roles.includes("petugas") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  const wargaItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Ajukan Surat", url: "/pengajuan/baru", icon: FilePlus2 },
    { title: "Pengajuan Saya", url: "/pengajuan", icon: FileText },
    { title: "Arsip Surat", url: "/arsip", icon: Archive },
  ];
  const petugasItems = [
    { title: "Verifikasi Pengajuan", url: "/petugas/pengajuan", icon: FileSearch },
  ];
  const adminItems = [
    { title: "Kelola Jenis Surat", url: "/admin/jenis-surat", icon: Settings2 },
    { title: "Audit Log", url: "/admin/audit", icon: ShieldCheck },
  ];

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-soft">
            <BadgeCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold tracking-tight">SIPELAK</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">Pelayanan Kecamatan</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Warga</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {wargaItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isPetugas && (
          <SidebarGroup>
            <SidebarGroupLabel>Petugas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {petugasItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs">
            <p className="truncate font-medium text-foreground">{user.email}</p>
            <p className="truncate text-muted-foreground">{roles.join(", ") || "warga"}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => void signOut()} className="w-full justify-start">
          <LogOut className="h-4 w-4" /> {!collapsed && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
