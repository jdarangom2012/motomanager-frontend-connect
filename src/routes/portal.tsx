import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/states";
import { usePortalEstado, useSolicitarCitaPortal } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Portal cliente | MotoManager" },
      {
        name: "description",
        content: "Consulta el estado de tu moto por placa o numero de orden y solicita una cita en el taller.",
      },
      { property: "og:title", content: "Portal cliente | MotoManager" },
      {
        property: "og:description",
        content: "Consulta el estado de tu moto por placa o numero de orden y solicita una cita en el taller.",
      },
    ],
  }),
  component: PortalPage,
});

function PortalPage() {
  const [placa, setPlaca] = useState("");
  const [numeroOrden, setNumeroOrden] = useState("");
  const [consulta, setConsulta] = useState<{ placa?: string; numero_orden?: string } | null>(null);
  const estado = usePortalEstado(consulta);

  const [cita, setCita] = useState({
    servicio_id: "",
    fecha_inicio: "",
    nombre_cliente: "",
    celular: "",
    correo: "",
    placa: "",
    motocicleta_descripcion: "",
    observaciones: "",
  });
  const solicitar = useSolicitarCitaPortal();

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setConsulta({
      ...(placa ? { placa } : {}),
      ...(numeroOrden ? { numero_orden: numeroOrden } : {}),
    });
  }

  async function enviarCita(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await solicitar.mutateAsync({
        servicio_id: cita.servicio_id,
        fecha_inicio: new Date(cita.fecha_inicio).toISOString(),
        nombre_cliente: cita.nombre_cliente,
        placa: cita.placa,
        ...(cita.celular ? { celular: cita.celular } : {}),
        ...(cita.correo ? { correo: cita.correo } : {}),
        ...(cita.motocicleta_descripcion ? { motocicleta_descripcion: cita.motocicleta_descripcion } : {}),
        ...(cita.observaciones ? { observaciones: cita.observaciones } : {}),
      });
      toast.success(res?.mensaje ?? "Cita solicitada");
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo solicitar la cita");
    }
  }

  const data = estado.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <img src="/assets/brand/LogoMotoManager.png" alt="MotoManager" className="mx-auto h-10 w-auto object-contain" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Portal cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta el estado de tu moto o solicita una cita sin iniciar sesion.
        </p>
      </header>

      <Tabs defaultValue="estado">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="estado" className="flex-1">
            Estado de mi moto
          </TabsTrigger>
          <TabsTrigger value="cita" className="flex-1">
            Solicitar cita
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultar estado</CardTitle>
              <CardDescription>Ingresa la placa o el numero de orden.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={buscar} className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="placa">Placa</Label>
                  <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="orden">Numero de orden</Label>
                  <Input id="orden" value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={!placa && !numeroOrden}>
                    <Search className="mr-2 h-4 w-4" /> Consultar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {estado.isError && (
            <div className="mt-6">
              <ErrorState error={estado.error} onRetry={() => estado.refetch()} />
            </div>
          )}

          {data && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Orden {data.orden_numero}</CardTitle>
                    <CardDescription>
                      {data.motocicleta} - {data.placa}
                    </CardDescription>
                  </div>
                  <Badge>{estadoLabel(data.estado_actual)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-sm">
                  <span className="text-muted-foreground">Entrega estimada: </span>
                  <span className="font-medium">{formatDateTime(data.fecha_estimada_entrega)}</span>
                </div>

                {(data.timeline ?? []).length > 0 && (
                  <ol className="space-y-4 border-l pl-4">
                    {data.timeline!.map((t, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="text-sm font-medium">{estadoLabel(t.estado)}</p>
                        <p className="text-sm text-muted-foreground">{t.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.fecha)}</p>
                      </li>
                    ))}
                  </ol>
                )}

                {(data.adjuntos_visibles ?? []).length > 0 && (
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Adjuntos</p>
                    {data.adjuntos_visibles!.map((a) => (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4"
                      >
                        {a.nombre_original}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cita">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Solicitar cita</CardTitle>
              <CardDescription>
                El catalogo de servicios no es publico en el contrato actual, por eso el identificador del servicio se
                ingresa manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={enviarCita} className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="servicio">ID de servicio *</Label>
                  <Input
                    id="servicio"
                    value={cita.servicio_id}
                    onChange={(e) => setCita({ ...cita, servicio_id: e.target.value })}
                    placeholder="UUID del servicio"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha y hora *</Label>
                  <Input
                    id="fecha"
                    type="datetime-local"
                    value={cita.fecha_inicio}
                    onChange={(e) => setCita({ ...cita, fecha_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="placa-cita">Placa *</Label>
                  <Input
                    id="placa-cita"
                    value={cita.placa}
                    onChange={(e) => setCita({ ...cita, placa: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={cita.nombre_cliente}
                    onChange={(e) => setCita({ ...cita, nombre_cliente: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={cita.celular}
                    onChange={(e) => setCita({ ...cita, celular: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={cita.correo}
                    onChange={(e) => setCita({ ...cita, correo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="moto">Descripcion de la moto</Label>
                  <Input
                    id="moto"
                    value={cita.motocicleta_descripcion}
                    onChange={(e) => setCita({ ...cita, motocicleta_descripcion: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="obs">Observaciones</Label>
                  <Textarea
                    id="obs"
                    rows={3}
                    value={cita.observaciones}
                    onChange={(e) => setCita({ ...cita, observaciones: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={
                      !cita.servicio_id || !cita.fecha_inicio || !cita.nombre_cliente || !cita.placa || solicitar.isPending
                    }
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {solicitar.isPending ? "Enviando..." : "Solicitar cita"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
