import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { useCambiarEstadoOrden, useOrden } from "@/lib/hooks";
import { estadoLabel, formatDateTime } from "@/lib/format";
import { ORDEN_ESTADOS, type OrdenEstado } from "@/lib/types";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/ordenes/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Detalle de orden | MotoManager" },
      { name: "description", content: "Timeline, actividades y cambio de estado de la orden de trabajo." },
    ],
  }),
  component: OrdenDetallePage,
});

function OrdenDetallePage() {
  const { id } = Route.useParams();
  const query = useOrden(id);
  const cambiar = useCambiarEstadoOrden(id);
  const [estado, setEstado] = useState<OrdenEstado | "">("");
  const [comentario, setComentario] = useState("");

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const orden = query.data;
  if (!orden) return <EmptyState message="Orden no encontrada" />;

  async function aplicarCambio() {
    if (!estado) return;
    try {
      await cambiar.mutateAsync({ estado_nuevo: estado, ...(comentario ? { comentario } : {}) });
      toast.success(`Orden actualizada a ${estadoLabel(estado)}`);
      setComentario("");
      setEstado("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/ordenes">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver a ordenes
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orden {orden.numero} · {orden.motocicleta?.placa}
          </h1>
          <p className="text-sm text-muted-foreground">
            {orden.cliente?.nombre} · {orden.motocicleta?.marca} {orden.motocicleta?.modelo} ·{" "}
            {orden.tecnico?.nombre_visible ?? "Sin tecnico"}
          </p>
        </div>
        <Badge className="w-fit">{estadoLabel(orden.estado)}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Timeline de estados</CardTitle>
          </CardHeader>
          <CardContent>
            {(orden.timeline ?? []).length === 0 ? (
              <EmptyState message="Sin historial de estados" />
            ) : (
              <ol className="relative space-y-4 border-l pl-5">
                {orden.timeline?.map((t, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">
                      {t.estado_anterior ? `${estadoLabel(t.estado_anterior)} → ` : ""}
                      {estadoLabel(t.estado_nuevo)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(t.changed_at)} · {t.changed_by ?? "Sistema"}
                    </p>
                    {t.comentario && <p className="mt-1 text-sm text-muted-foreground">{t.comentario}</p>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nuevo estado</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as OrdenEstado)}
                >
                  <option value="">Selecciona</option>
                  {ORDEN_ESTADOS.filter((e) => e !== orden.estado).map((e) => (
                    <option key={e} value={e}>
                      {estadoLabel(e)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comentario</Label>
                <Input value={comentario} onChange={(e) => setComentario(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!estado || cambiar.isPending} onClick={aplicarCambio}>
                {cambiar.isPending ? "Actualizando..." : "Aplicar cambio"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actividades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(orden.actividades ?? []).length === 0 ? (
                <EmptyState message="Sin actividades registradas" />
              ) : (
                orden.actividades?.map((a, i) => (
                  <div key={i} className="rounded-md border p-2 text-sm">
                    <p className="font-medium">{a.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.tipo} {a.cantidad ? `· x${a.cantidad}` : ""} {a.estado ? `· ${estadoLabel(a.estado)}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
