import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useCreateDiagnostico, useDiagnosticos, useRecepciones, useTecnicos } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Diagnostico tecnico | MotoManager" },
      { name: "description", content: "Registro del diagnostico tecnico sobre una recepcion u orden." },
    ],
  }),
  component: DiagnosticoPage,
});

function DiagnosticoPage() {
  const recepciones = useRecepciones();
  const tecnicos = useTecnicos();
  const diagnosticos = useDiagnosticos();
  const create = useCreateDiagnostico();

  const [recepcionId, setRecepcionId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");
  const [horas, setHoras] = useState("");
  const [notas, setNotas] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        ...(recepcionId ? { recepcion_id: recepcionId } : {}),
        ...(tecnicoId ? { tecnico_id: tecnicoId } : {}),
        descripcion_problema: descripcion,
        recomendaciones: recomendaciones || null,
        tiempo_estimado_horas: horas ? Number(horas) : null,
        observaciones_tecnicas: notas || null,
      });
      toast.success("Diagnostico registrado");
      setDescripcion("");
      setRecomendaciones("");
      setHoras("");
      setNotas("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar el diagnostico");
    }
  }

  return (
    <div>
      <PageHeader title="Diagnostico" subtitle="Registro tecnico del problema detectado" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuevo diagnostico</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Recepcion</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={recepcionId}
                  onChange={(e) => setRecepcionId(e.target.value)}
                >
                  <option value="">Sin recepcion asociada</option>
                  {recepciones.data?.results.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.numero} — {r.motocicleta?.placa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tecnico</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {tecnicos.data?.results.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre_visible}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripcion del problema *</Label>
                <Textarea rows={3} required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recomendaciones</Label>
                <Textarea rows={2} value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tiempo estimado (horas)</Label>
                <Input type="number" step="0.5" value={horas} onChange={(e) => setHoras(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observaciones tecnicas</Label>
                <Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
              <Button type="submit" disabled={!descripcion.trim() || create.isPending}>
                {create.isPending ? "Guardando..." : "Guardar diagnostico"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnosticos recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosticos.isLoading ? (
              <TableSkeleton rows={3} />
            ) : diagnosticos.isError ? (
              <ErrorState error={diagnosticos.error} onRetry={() => diagnosticos.refetch()} />
            ) : (diagnosticos.data?.results ?? []).length === 0 ? (
              <EmptyState message="Aun no hay diagnosticos registrados" />
            ) : (
              diagnosticos.data?.results.map((d) => (
                <div key={d.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{d.descripcion_problema}</p>
                    <Badge variant="outline">{estadoLabel(d.estado)}</Badge>
                  </div>
                  {d.recomendaciones && <p className="mt-1 text-xs text-muted-foreground">{d.recomendaciones}</p>}
                  {d.tiempo_estimado_horas != null && (
                    <p className="mt-1 text-xs text-muted-foreground">Estimado: {d.tiempo_estimado_horas} h</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
