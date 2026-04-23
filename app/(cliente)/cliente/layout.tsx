import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/login/actions";

export default async function ClienteLayout({
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
  if (profile.role !== "cliente") redirect("/app");

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-green-600 text-white font-bold">
              P
            </div>
            <span className="font-semibold">Portal Payefy</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">
              {profile.full_name ?? profile.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-sm text-neutral-500 hover:text-neutral-900"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl p-6">{children}</div>
    </div>
  );
}
