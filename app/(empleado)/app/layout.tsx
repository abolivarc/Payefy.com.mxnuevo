import { redirect } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function EmpleadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  if (profile.role === "cliente") redirect("/cliente");

  return (
    <SidebarProvider>
      <AppSidebar
        role={profile.role}
        fullName={profile.full_name}
        email={profile.email}
      />
      <main className="flex-1 min-h-dvh">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <SidebarTrigger />
        </header>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
