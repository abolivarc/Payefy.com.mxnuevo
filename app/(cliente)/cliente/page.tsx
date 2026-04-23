import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido a Payefy</h1>
        <p className="text-neutral-500">
          Aquí completarás tu alta. El wizard de onboarding llega en S4.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Selección de producto, datos del negocio, subida de documentos,
            seguimiento de revisión y descarga del contrato.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          Por ahora estás viendo esta pantalla porque tu usuario está registrado
          con rol <strong>cliente</strong> pero aún no hay un lead asociado.
          Cuando el equipo comercial te cree un lead, verás aquí tu onboarding.
        </CardContent>
      </Card>
    </div>
  );
}
