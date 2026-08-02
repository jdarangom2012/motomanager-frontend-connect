import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import {
  useClientes,
  useConvertirCotizacionEnOrden,
  useCotizaciones,
  useCreateCotizacion,
  useMotocicletas,
} from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel, formatMoney } from "@/lib/format";
import type { DocumentoDetalleWrite } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/cotizaciones")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cotizaciones | MotoManager" },
      { name: "description", content: "Creacion de cotizaciones con mano de obra, repuestos e IVA." },
    ],
  }),
  component: CotizacionesPage,
});

const emptyLine: DocumentoDetalleWrite = {
  tipo: "mano_obra",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  iva_porcentaje: 19,
};

function CotizacionesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const moneda = user?.empresa?.moneda ?? "COP";
  const clientes = useClientes("");
  const motos = useMotocicletas("");
  const cotizaciones = useCotizaciones();
  const create = useCreateCotizacion();
  const convertir = useConvertirCotizacionEnOrden();

  const [clienteId, setClienteId] = useState("");
  const [motoId, setMotoId] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [lineas, setLineas] = useState<DocumentoDetalleWrite[]>([{ ...emptyLine }]);

  const motosCliente = useMemo(
    () => (motos.data?.results ?? []).filter((m) => !clienteId || m.cliente?.id === clienteId),
    [motos.data, clienteId],
  );

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio_unitario, 0);
    const iva = lineas.reduce((s, l) => s + (l.cantidad * l.precio_unitario * (l.iva_porcentaje ?? 0)) / 100, 0);
    return { subtotal, iva, total: subtotal + iva };
  }, [lineas]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const cot = await create.mutateAsync({
        cliente_id: clienteId,
        motocicleta_id: motoId,
        vigencia_hasta: vigencia || null,
        detalles: lineas.filter((l) => l.descripcion.trim()),
      });
      toast.success(`Cotizacion ${cot.numero ?? ""} creada`);
      setLineas([{ ...emptyLine }]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la cotizacion");
    }
  }

  const disabled = !clienteId || !motoId || lineas.every((l) => !l.descripcion.trim()) || create.isPending;

  return (
    <div>
      <PageHeader title="Cotizaciones" subtitle="Mano de obra, repuestos, IVA y vigencia" />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Nueva cotizacion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  <option value="">Selecciona</option>
                  {clientes.data?.results.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
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
                  <option value="">Selecciona</option>
                  {motosCliente.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.placa} — {m.marca} {m.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vigencia hasta</Label>
                <Input type="date" value={vigencia} onChange={(e) => setVigencia(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              {lineas.map((l, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-12">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm sm:col-span-2"
                    value={l.tipo}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[idx] = { ...l, tipo: e.target.value as "mano_obra" | "repuesto" };
                      setLineas(next);
                    }}
                  >
                    <option value="mano_obra">Mano de obra</option>
                    <option value="repuesto">Repuesto</option>
                  </select>
                  <Input
                    className="sm:col-span-4"
                    placeholder="Descripcion"
                    value={l.descripcion}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[idx] = { ...l, descripcion: e.target.value };
                      setLineas(next);
                    }}
                  />
                  <Input
                    className="sm:col-span-2"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Cant."
                    value={l.cantidad}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[idx] = { ...l, cantidad: Number(e.target.value) };
                      setLineas(next);
                    }}
                  />
                  <Input
                    className="sm:col-span-2"
                    type="number"
                    min="0"
                    placeholder="Precio"
                    value={l.precio_unitario}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[idx] = { ...l, precio_unitario: Number(e.target.value) };
                      setLineas(next);
                    }}
                  />
                  <Input
                    className="sm:col-span-1"
                    type="number"
                    min="0"
                    placeholder="IVA %"
                    value={l.iva_porcentaje ?? 0}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[idx] = { ...l, iva_porcentaje: Number(e.target.value) };
                      setLineas(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:col-span-1"
                    onClick={() => setLineas(lineas.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setLineas([...lineas, { ...emptyLine }])}>
                <Plus className="mr-1 h-4 w-4" /> Agregar linea
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="text-sm text-muted-foreground">
                Subtotal {formatMoney(totales.subtotal, moneda)} · IVA {formatMoney(totales.iva, moneda)} ·{" "}
                <span className="font-semibold text-foreground">Total {formatMoney(totales.total, moneda)}</span>
              </div>
              <Button type="submit" disabled={disabled}>
                {create.isPending ? "Guardando..." : "Crear cotizacion"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cotizaciones registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {cotizaciones.isLoading ? (
            <TableSkeleton />
          ) : cotizaciones.isError ? (
            <ErrorState error={cotizaciones.error} onRetry={() => cotizaciones.refetch()} />
          ) : (cotizaciones.data?.results ?? []).length === 0 ? (
            <EmptyState message="Aun no hay cotizaciones registradas" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Moto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotizaciones.data?.results.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                      <TableCell>{c.cliente?.nombre}</TableCell>
                      <TableCell>{c.motocicleta?.placa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{estadoLabel(c.estado)}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(c.total, moneda)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={convertir.isPending}
                          onClick={async () => {
                            try {
                              const orden = await convertir.mutateAsync(c.id);
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
