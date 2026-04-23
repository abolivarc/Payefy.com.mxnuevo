import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Hola, {profile?.full_name ?? "bienvenido"}
        </h1>
        <p className="text-neutral-500">
          Panel Payefy — rol actual:{" "}
          <span className="font-medium">{profile?.role}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leads activos</CardTitle>
            <CardDescription>Se conecta cuando hagamos S3.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expedientes por revisar</CardTitle>
            <CardDescription>S5: revisión onboarding.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activaciones del mes</CardTitle>
            <CardDescription>S7: activación.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Siguiente: S2 — Base de datos comercial</CardTitle>
          <CardDescription>
            Cargar los 46 MCCs con pisos por método, terminales, tiers de
            comisión y calculadora funcional.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
