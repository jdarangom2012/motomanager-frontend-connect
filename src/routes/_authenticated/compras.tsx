import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useCompras, useConfirmarCompra, useCreateCompra, useProveedores, useRepuestos } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel, formatMoney } from "@/lib/format";
import type { CompraDetalleWrite } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/compras")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Compras a proveedores | MotoManager" },
      { name: "description", content: "Registra compras de repuestos y confirma la entrada de stock." },
      { property: "og:title", content: "Compras a proveedores | MotoManager" },
      { property: "og:description", content: "Registra compras de repuestos y confirma la entrada de stock." },
    ],
  }),
  component: ComprasPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function ComprasPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [factura, setFactura] = useState("");
  const [fecha, setFecha] = useState(today());
  const [detalles, setDetalles] = useState<CompraDetalleWrite[]>([]);

  const query = useCompras({ ...(desde ? { fecha_desde: desde } : {}), ...(hasta ? { fecha_hasta: hasta } : {}) });
  const proveedores = useProveedores("");
  const repuestos = useRepuestos("");
  const create = useCreateCompra();
  const confirmar = useConfirmarCompra();

  const total = useMemo(
    () => detalles.reduce((acc, d) => acc + Number(d.cantidad || 0) * Number(d.costo_unitario || 0), 0),
    [detalles],
  );

  function addLinea() {
    setDetalles((d) => [...d, { repuesto_id: "", cantidad: 1, costo_unitario: 0 }]);
  }

  function setLinea(i: number, patch: Partial<CompraDetalleWrite>) {
    setDetalles((d) => d.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  const valid = proveedorId && fecha && detalles.length > 0 && detalles.every((d) => d.repuesto_id && d.cantidad > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        proveedor_id: proveedorId,
        factura_proveedor: factura || null,
        fecha,
        detalles: detalles.map((d) => ({
          repuesto_id: d.repuesto_id,
          cantidad: Number(d.cantidad),
          costo_unitario: Number(d.costo_unitario),
        })),
      });
      toast.success("Compra creada");
      setOpen(false);
      setProveedorId("");
      setFactura("");
      setFecha(today());
      setDetalles([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear la compra");
    }
  }

  async function confirm(id: string) {
    try {
      await confirmar.mutateAsync(id);
      toast.success("Compra confirmada y stock actualizado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar la compra");
    }
  }

  const items = query.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Compras"
        subtitle="Registra compras a proveedores y confirma la entrada de stock al inventario."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nueva compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Proveedor *</Label>
                    <Select value={proveedorId} onValueChange={setProveedorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {(proveedores.data?.results ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="factura">Factura proveedor</Label>
                    <Input id="factura" value={factura} onChange={(e) => setFactura(e.target.value)} />
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Detalle</span>
                    <Button type="button" size="sm" variant="outline" onClick={addLinea}>
                      <Plus className="mr-1 h-3 w-3" /> Agregar linea
                    </Button>
                  </div>
                  {detalles.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">Agrega al menos un repuesto.</p>
                  ) : (
                    <div className="space-y-3 p-3">
                      {detalles.map((d, i) => (
                        <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                          <Select value={d.repuesto_id} onValueChange={(v) => setLinea(i, { repuesto_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Repuesto" />
                            </SelectTrigger>
                            <SelectContent>
                              {(repuestos.data?.results ?? []).map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.codigo_interno} - {r.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={d.cantidad}
                            placeholder="Cantidad"
                            onChange={(e) => setLinea(i, { cantidad: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={d.costo_unitario}
                            placeholder="Costo unitario"
                            onChange={(e) => setLinea(i, { costo_unitario: Number(e.target.value) })}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetalles((prev) => prev.filter((_, idx) => idx !== i))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end text-sm">
                  <span className="mr-2 text-muted-foreground">Total estimado</span>
                  <span className="font-semibold">{formatMoney(total)}</span>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!valid || create.isPending}>
                    {create.isPending ? "Guardando..." : "Crear compra"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="desde" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="hasta" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No hay compras registradas" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="hidden md:table-cell">Factura</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const esBorrador = (c.estado ?? "").toLowerCase() === "borrador";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                      <TableCell>{c.proveedor?.nombre ?? "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.factura_proveedor ?? "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.fecha}</TableCell>
                      <TableCell>
                        <Badge variant={esBorrador ? "outline" : "secondary"}>{estadoLabel(c.estado)}</Badge>
                      </TableCell>
                      <TableCell>{formatMoney(c.total)}</TableCell>
                      <TableCell className="text-right">
                        {esBorrador ? (
                          <Button size="sm" disabled={confirmar.isPending} onClick={() => confirm(c.id)}>
                            Confirmar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Stock actualizado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
