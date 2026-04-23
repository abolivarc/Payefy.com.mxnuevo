"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  CreditCard,
  Database,
  LayoutDashboard,
  LogOut,
  Percent,
  Store,
  Users,
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
} from "@/components/ui/sidebar";
import { logoutAction } from "@/app/(auth)/login/actions";

type Role =
  | "admin"
  | "director_comercial"
  | "agente_comercial"
  | "onboarding"
  | "cliente";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

const NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "director_comercial", "agente_comercial", "onboarding"],
  },
  {
    href: "/app/leads/tpv",
    label: "Leads TPV",
    icon: Store,
    roles: ["admin", "director_comercial", "agente_comercial", "onboarding"],
  },
  {
    href: "/app/leads/tarjetas",
    label: "Leads Tarjetas",
    icon: CreditCard,
    roles: ["admin", "director_comercial", "agente_comercial", "onboarding"],
  },
  {
    href: "/app/cotizador",
    label: "Cotizador",
    icon: Calculator,
    roles: ["admin", "director_comercial", "agente_comercial"],
  },
  {
    href: "/app/base-datos",
    label: "Base de datos",
    icon: Database,
    roles: ["admin", "director_comercial", "agente_comercial", "onboarding"],
  },
  {
    href: "/app/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["admin", "director_comercial", "onboarding"],
  },
  {
    href: "/app/mi-comision",
    label: "Mi comisión",
    icon: Percent,
    roles: ["agente_comercial"],
  },
  {
    href: "/app/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["admin"],
  },
];

export function AppSidebar({
  role,
  fullName,
  email,
}: {
  role: Role;
  fullName: string | null;
  email: string;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-green-600 text-white font-bold">
            P
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Payefy Panel</div>
            <div className="text-xs text-neutral-500">
              {roleLabel(role)}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={<Link href={item.href} />}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <div className="mb-2 text-xs">
          <div className="font-medium">{fullName ?? email}</div>
          <div className="text-neutral-500">{email}</div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-900"
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}

function roleLabel(role: Role) {
  switch (role) {
    case "admin":
      return "Administrador";
    case "director_comercial":
      return "Director Comercial";
    case "agente_comercial":
      return "Agente Comercial";
    case "onboarding":
      return "Onboarding";
    case "cliente":
      return "Cliente";
  }
}
