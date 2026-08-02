import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useReporteOperativo, useTecnicos } from "@/lib/hooks";
import { estadoLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reportes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reportes operativos | MotoManager" },
      { name: "description", content: "Reporte operativo del taller con filtros por fecha, tecnico y estado." },
      { property: "og:title", content: "Reportes operativos | MotoManager" },
      {
        property: "og:description",
        content: "Reporte operativo del taller con filtros por fecha, tecnico y estado.",
      },
    ],
  }),
  component: ReportesPage,
});

const ESTADOS = [
  "recibida",
  "en_diagnostico",
  "cotizacion_enviada",
  "aprobada",
  "en_reparacion",
  "control_calidad",
  "lista_entrega",
  "entregada",
  "cancelada",
];

function cellValue(v: unknown) {
  if (v === null || v === undefined) return "-";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function ReportesPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tecnicoId, setTecnicoId] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [applied, setApplied] = useState<{
    fecha_desde?: string | undefined;
    fecha_hasta?: string | undefined;
    tecnico_id?: string | undefined;
    estado?: string | undefined;
  }>({});
  const [enabled, setEnabled] = useState(false);

  const tecnicos = useTecnicos();
  const query = useReporteOperativo(applied, enabled);

  function aplicar() {
    setApplied({
      fecha_desde: desde || undefined,
      fecha_hasta: hasta || undefined,
      tecnico_id: tecnicoId === "todos" ? undefined : tecnicoId,
      estado: estado === "todos" ? undefined : estado,
    });
    setEnabled(true);
  }

  const kpis = Object.entries(query.data?.kpis ?? {});
  const rows = query.data?.rows ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0] as Record<string, unknown>) : [];

  return (
    <div>
      <PageHeader title="Reportes" subtitle="Reporte operativo con filtros de fecha, tecnico y estado." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-2">
            <Label htmlFor="desde">Desde</Label>
            <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hasta">Hasta</Label>
            <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Tecnico</Label>
            <Select value={tecnicoId} onValueChange={setTecnicoId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(tecnicos.data?.results ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre_visible}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {estadoLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={aplicar} disabled={query.isFetching}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {query.isFetching ? "Generando..." : "Generar reporte"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!enabled ? (
        <EmptyState message="Selecciona los filtros y genera el reporte operativo" />
      ) : query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <div className="space-y-6">
          {kpis.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map(([k, v]) => (
                <Card key={k}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {k.replace(/_/g, " ")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{cellValue(v)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <EmptyState message="El reporte no devolvio filas para los filtros seleccionados" />
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap capitalize">
                          {c.replace(/_/g, " ")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((c) => (
                          <TableCell key={c} className="whitespace-nowrap">
                            {cellValue(row[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
