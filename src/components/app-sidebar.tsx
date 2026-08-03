import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bike,
  CalendarDays,
  ClipboardList,
  Cog,
  FileSpreadsheet,
  FileText,
  Package,
  Receipt,
  ShoppingCart,
  Stethoscope,
  Truck,
  Users,
  UserSquare2,
  Wrench,
  LayoutDashboard,
  Globe,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";

type NavItem = {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  pendiente?: boolean;
};

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operacion",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["administrador", "recepcionista"] },
      { title: "Agenda de taller", url: "/agenda", icon: CalendarDays, roles: ["administrador", "recepcionista", "tecnico"] },
      { title: "Recepcion", url: "/recepcion", icon: ClipboardList, roles: ["administrador", "recepcionista"] },
      { title: "Ordenes de trabajo", url: "/ordenes", icon: Wrench, roles: ["administrador", "recepcionista", "tecnico", "asesor"] },
      { title: "Diagnostico", url: "/diagnostico", icon: Stethoscope, roles: ["administrador", "tecnico"] },
      { title: "Cotizaciones", url: "/cotizaciones", icon: FileText, roles: ["administrador", "asesor", "recepcionista"] },
    ],
  },
  {
    label: "Gestion",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users, roles: ["administrador", "recepcionista", "asesor"] },
      { title: "Motocicletas", url: "/motocicletas", icon: Bike, roles: ["administrador", "recepcionista", "asesor", "tecnico"] },
      { title: "Tecnicos", url: "/tecnicos", icon: UserSquare2, roles: ["administrador", "recepcionista", "asesor"] },
      { title: "Inventario", url: "/inventario", icon: Package, roles: ["administrador", "inventario", "asesor", "tecnico"] },
      { title: "Compras", url: "/compras", icon: ShoppingCart, roles: ["administrador", "inventario"] },
      { title: "Proveedores", url: "/proveedores", icon: Truck, roles: ["administrador", "inventario"] },
      { title: "Facturas y pagos", url: "/facturas", icon: Receipt, roles: ["administrador", "contador", "asesor"] },
    ],
  },
  {
    label: "Analisis",
    items: [
      { title: "Reportes", url: "/reportes", icon: BarChart3, roles: ["administrador", "contador"] },
      { title: "Exportacion Contai", url: "/contai", icon: FileSpreadsheet, roles: ["administrador", "contador"] },
      { title: "Portal cliente", url: "/portal", icon: Globe, roles: ["administrador", "recepcionista"] },
    ],
  },
  {
    label: "Sistema",
    items: [{ title: "Configuracion", url: "/configuracion", icon: Cog, roles: ["administrador"] }],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, hasRole } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src="/assets/brand/LogoMotoManager.png"
            alt="MotoManager"
            className={collapsed ? "h-8 w-8 object-cover object-left" : "h-8 w-auto object-contain"}
          />
        </div>
        {!collapsed && (
          <div className="mt-3 rounded-md bg-sidebar-accent px-3 py-2">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {user?.empresa?.nombre ?? "Empresa"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Taller principal</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => hasRole(item.roles));
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.url ? (
                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          disabled
                          tooltip={`${item.title} (proximo sprint)`}
                          className="cursor-not-allowed opacity-45"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border py-4">
        {!collapsed && (
          <div className="px-2">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">Desarrollado por</p>
            <img
              src="/assets/brand/LogoNautilusTech.png"
              alt="NautilusTech"
              loading="lazy"
              className="mt-1 h-6 w-auto object-contain opacity-80 brightness-0 invert"
            />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
