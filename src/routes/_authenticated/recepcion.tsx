import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import {
  useClientes,
  useConvertirRecepcionEnOrden,
  useCreateRecepcion,
  useMotocicletas,
  useRecepciones,
  useTecnicos,
} from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel, formatDateTime } from "@/lib/format";
import type { ChecklistEstado, ChecklistItem } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/recepcion")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Recepcion de motocicletas | MotoManager" },
      { name: "description", content: "Registro de ingreso con checklist, kilometraje y combustible." },
    ],
  }),
  component: RecepcionPage,
});

const CHECKLIST_BASE = [
  "Espejos",
  "Luces",
  "Frenos",
  "Llantas",
  "Bateria",
  "Documentos",
  "Herramientas",
  "Casco",
];

const ESTADOS: ChecklistEstado[] = ["ok", "falla", "no_aplica", "no_revisado"];

function RecepcionPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const clientes = useClientes("");
  const motos = useMotocicletas("");
  const tecnicos = useTecnicos();
  const recepciones = useRecepciones(page);
  const create = useCreateRecepcion();
  const convertir = useConvertirRecepcionEnOrden();

  const [clienteId, setClienteId] = useState("");
  const [motoId, setMotoId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 16));
  const [km, setKm] = useState("");
  const [combustible, setCombustible] = useState("1/2");
  const [tecnicoId, setTecnicoId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    CHECKLIST_BASE.map((item) => ({ item, estado: "no_revisado" as ChecklistEstado })),
  );

  const motosCliente = useMemo(
    () => (motos.data?.results ?? []).filter((m) => !clienteId || m.cliente?.id === clienteId),
    [motos.data, clienteId],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const rec = await create.mutateAsync({
        cliente_id: clienteId,
        motocicleta_id: motoId,
        fecha_recepcion: new Date(fecha).toISOString(),
        ...(tecnicoId ? { tecnico_sugerido_id: tecnicoId } : {}),
        kilometraje: km ? Number(km) : null,
        nivel_combustible: combustible,
        motivo_ingreso: motivo,
        observaciones: observaciones || null,
        checklist,
      });
      toast.success(`Recepcion ${rec.numero ?? ""} registrada`);
      setMotivo("");
      setObservaciones("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar la recepcion");
    }
  }

  const disabled = !clienteId || !motoId || !motivo.trim() || create.isPending;

  return (
    <div>
      <PageHeader title="Recepcion" subtitle="Registrar el ingreso de una motocicleta al taller" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nueva recepcion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente *</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    setMotoId("");
                  }}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.data?.results.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} — {c.documento}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motocicleta *</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={motoId}
                  onChange={(e) => setMotoId(e.target.value)}
                >
                  <option value="">Selecciona una moto</option>
                  {motosCliente.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.placa} — {m.marca} {m.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de recepcion *</Label>
                <Input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tecnico sugerido</Label>
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
                <Label className="text-xs">Kilometraje</Label>
                <Input type="number" value={km} onChange={(e) => setKm(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nivel de combustible</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={combustible}
                  onChange={(e) => setCombustible(e.target.value)}
                >
                  {["Reserva", "1/4", "1/2", "3/4", "Lleno"].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Motivo de ingreso *</Label>
                <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Observaciones</Label>
                <Textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs">Checklist de ingreso</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {checklist.map((c, idx) => (
                    <div key={c.item} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span className="text-sm">{c.item}</span>
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={c.estado}
                        onChange={(e) => {
                          const next = [...checklist];
                          next[idx] = { ...c, estado: e.target.value as ChecklistEstado };
                          setChecklist(next);
                        }}
                      >
                        {ESTADOS.map((es) => (
                          <option key={es} value={es}>
                            {estadoLabel(es)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Button type="submit" disabled={disabled}>
                  {create.isPending ? "Guardando..." : "Registrar recepcion"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recepciones recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recepciones.isLoading ? (
              <TableSkeleton rows={3} />
            ) : recepciones.isError ? (
              <ErrorState error={recepciones.error} onRetry={() => recepciones.refetch()} />
            ) : (recepciones.data?.results ?? []).length === 0 ? (
              <EmptyState message="Aun no hay recepciones registradas" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Moto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recepciones.data?.results.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.numero}</TableCell>
                        <TableCell>
                          <div className="font-medium">{r.motocicleta?.placa}</div>
                          <div className="text-xs text-muted-foreground">{r.cliente?.nombre}</div>
                        </TableCell>
                        <TableCell className="text-xs">{formatDateTime(r.fecha_recepcion)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {estadoLabel(r.estado)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={convertir.isPending}
                            onClick={async () => {
                              try {
                                const orden = await convertir.mutateAsync(r.id);
                                toast.success(`Orden ${orden.numero ?? ""} creada`);
                                navigate({ to: "/ordenes/$id", params: { id: orden.id } });
                              } catch (err) {
                                toast.error(err instanceof ApiError ? err.message : "No se pudo convertir");
                              }
                            }}
                          >
                            Convertir en orden
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationControls
                  data={recepciones.data}
                  page={page}
                  onPageChange={setPage}
                  isLoading={recepciones.isFetching}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
