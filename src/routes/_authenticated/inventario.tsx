import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Power, Search } from "lucide-react";
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
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { PaginationControls } from "@/components/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useCompatibilidades, useCreateRepuesto, useProveedores, useRepuestos, useUpdateRepuesto } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { Repuesto, RepuestoWrite } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/inventario")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Inventario de repuestos | MotoManager" },
      { name: "description", content: "Controla stock, costos y precios de repuestos del taller." },
      { property: "og:title", content: "Inventario de repuestos | MotoManager" },
      { property: "og:description", content: "Controla stock, costos y precios de repuestos del taller." },
    ],
  }),
  component: InventarioPage,
});

const EMPTY: RepuestoWrite = {
  codigo_interno: "",
  nombre: "",
  marca: "",
  categoria: "",
  costo: 0,
  precio: 0,
  stock: 0,
  stock_minimo: 0,
};

function InventarioPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [soloBajo, setSoloBajo] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Repuesto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Repuesto | null>(null);
  const [form, setForm] = useState<RepuestoWrite>(EMPTY);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const query = useRepuestos(search, { stock_bajo: soloBajo, page });
  const proveedores = useProveedores("");
  const create = useCreateRepuesto();
  const update = useUpdateRepuesto();
  const compat = useCompatibilidades(detalleId ?? undefined);

  function resetForm() {
    setEditing(null);
    setForm(EMPTY);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(repuesto: Repuesto) {
    setEditing(repuesto);
    setForm({
      ...(repuesto.proveedor ? { proveedor_id: repuesto.proveedor.id } : {}),
      codigo_interno: repuesto.codigo_interno,
      referencia_fabricante: repuesto.referencia_fabricante ?? "",
      codigo_barras: repuesto.codigo_barras ?? "",
      nombre: repuesto.nombre,
      marca: repuesto.marca ?? "",
      categoria: repuesto.categoria ?? "",
      costo: repuesto.costo,
      precio: repuesto.precio,
      stock: repuesto.stock,
      stock_minimo: repuesto.stock_minimo,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      costo: Number(form.costo),
      precio: Number(form.precio),
      stock: Number(form.stock ?? 0),
      stock_minimo: Number(form.stock_minimo ?? 0),
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body });
        toast.success("Repuesto actualizado");
      } else {
        await create.mutateAsync(body);
        toast.success("Repuesto creado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el repuesto");
    }
  }

  async function toggleActive(repuesto: Repuesto) {
    const next = !repuesto.is_active;
    try {
      await update.mutateAsync({ id: repuesto.id, body: { is_active: next } });
      toast.success(next ? "Repuesto activado" : "Repuesto inactivado");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del repuesto");
    }
  }

  const items = query.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Controla stock, costos y precios de los repuestos del taller."
        actions={
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo repuesto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar repuesto" : "Nuevo repuesto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Codigo interno *</Label>
                  <Input
                    id="codigo"
                    value={form.codigo_interno}
                    onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" value={form.marca ?? ""} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={form.categoria ?? ""}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ref">Referencia fabricante</Label>
                  <Input
                    id="ref"
                    value={form.referencia_fabricante ?? ""}
                    onChange={(e) => setForm({ ...form, referencia_fabricante: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Proveedor</Label>
                  <Select
                    value={form.proveedor_id ?? ""}
                    onValueChange={(v) => setForm({ ...form, proveedor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin proveedor" />
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
                  <Label htmlFor="costo">Costo *</Label>
                  <Input
                    id="costo"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.costo}
                    onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="precio">Precio *</Label>
                  <Input
                    id="precio"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock inicial</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={form.stock ?? 0}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockmin">Stock minimo</Label>
                  <Input
                    id="stockmin"
                    type="number"
                    min={0}
                    value={form.stock_minimo ?? 0}
                    onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
                  />
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={!form.codigo_interno || !form.nombre || create.isPending || update.isPending}
                  >
                    {create.isPending || update.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por codigo o nombre"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button
          variant={soloBajo ? "default" : "outline"}
          onClick={() => {
            setSoloBajo(!soloBajo);
            setPage(1);
          }}
        >
          Stock bajo
        </Button>
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No hay repuestos registrados" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Repuesto</TableHead>
                  <TableHead className="hidden md:table-cell">Proveedor</TableHead>
                  <TableHead className="hidden lg:table-cell">Costo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.codigo_interno}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {[r.marca, r.categoria].filter(Boolean).join(" - ") || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.proveedor?.nombre ?? "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatMoney(r.costo)}</TableCell>
                    <TableCell>{formatMoney(r.precio)}</TableCell>
                    <TableCell>
                      <Badge variant={r.stock_bajo ? "destructive" : "secondary"}>
                        {r.stock} / min {r.stock_minimo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.is_active === false ? "destructive" : "secondary"}>
                        {r.is_active === false ? "Inactivo" : "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDetalleId(r.id)}>
                          Compatibilidad
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(r)}>
                          <Edit2 className="h-4 w-4" /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant={r.is_active === false ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setConfirmTarget(r)}
                          disabled={update.isPending}
                        >
                          <Power className="h-4 w-4" />
                          {r.is_active === false ? "Activar" : "Inactivar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls data={query.data} page={page} onPageChange={setPage} isLoading={query.isFetching} />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detalleId} onOpenChange={(v) => !v && setDetalleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compatibilidad con motocicletas</DialogTitle>
          </DialogHeader>
          {compat.isLoading ? (
            <TableSkeleton rows={3} />
          ) : compat.isError ? (
            <ErrorState error={compat.error} onRetry={() => compat.refetch()} />
          ) : (compat.data?.results ?? []).length === 0 ? (
            <EmptyState message="Sin compatibilidades registradas" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(compat.data?.results ?? []).map((c) => (
                <li key={c.id} className="rounded-md border p-3">
                  <p className="font-medium">
                    {c.marca_moto} {c.modelo_moto}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[c.anio_desde, c.anio_hasta].filter(Boolean).join(" - ") || "Todos los anios"}
                    {c.cilindraje ? ` · ${c.cilindraje}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(value) => !value && setConfirmTarget(null)}
        title={confirmTarget?.is_active === false ? "Activar repuesto" : "Inactivar repuesto"}
        description={
          confirmTarget?.is_active === false
            ? `El repuesto ${confirmTarget?.nombre ?? ""} volvera a estar disponible en inventario y cotizaciones.`
            : `El repuesto ${confirmTarget?.nombre ?? ""} quedara fuera de nuevos movimientos, conservando stock e historial.`
        }
        confirmLabel={confirmTarget?.is_active === false ? "Activar repuesto" : "Inactivar repuesto"}
        destructive={confirmTarget?.is_active !== false}
        isPending={update.isPending}
        onConfirm={() => confirmTarget && toggleActive(confirmTarget)}
      />
    </div>
  );
}
