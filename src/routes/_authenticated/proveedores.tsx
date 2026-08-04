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
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useCreateProveedor, useProveedores, useUpdateProveedor } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { Proveedor, ProveedorWrite } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/proveedores")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Proveedores | MotoManager" },
      { name: "description", content: "Directorio de proveedores de repuestos e insumos del taller." },
      { property: "og:title", content: "Proveedores | MotoManager" },
      { property: "og:description", content: "Directorio de proveedores de repuestos e insumos del taller." },
    ],
  }),
  component: ProveedoresPage,
});

const EMPTY: ProveedorWrite = {
  nit: "",
  nombre: "",
  direccion: "",
  ciudad: "",
  telefono: "",
  correo: "",
  contacto: "",
};

function ProveedoresPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<ProveedorWrite>(EMPTY);
  const query = useProveedores(search, page);
  const create = useCreateProveedor();
  const update = useUpdateProveedor();

  function resetForm() {
    setEditing(null);
    setForm(EMPTY);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(proveedor: Proveedor) {
    setEditing(proveedor);
    setForm({
      nit: proveedor.nit,
      nombre: proveedor.nombre,
      direccion: "",
      ciudad: proveedor.ciudad ?? "",
      telefono: proveedor.telefono ?? "",
      correo: proveedor.correo ?? "",
      contacto: proveedor.contacto ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: form });
        toast.success("Proveedor actualizado");
      } else {
        await create.mutateAsync(form);
        toast.success("Proveedor guardado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el proveedor");
    }
  }

  async function toggleActive(proveedor: Proveedor) {
    const next = !proveedor.is_active;
    try {
      await update.mutateAsync({ id: proveedor.id, body: { is_active: next } });
      toast.success(next ? "Proveedor activado" : "Proveedor inactivado");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del proveedor");
    }
  }

  const items = query.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Administra los proveedores de repuestos e insumos del taller."
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
                <Plus className="mr-2 h-4 w-4" /> Nuevo proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nit">NIT *</Label>
                  <Input id="nit" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} required />
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
                  <Label htmlFor="contacto">Contacto</Label>
                  <Input
                    id="contacto"
                    value={form.contacto ?? ""}
                    onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono ?? ""}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={form.correo ?? ""}
                    onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={form.ciudad ?? ""}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="direccion">Direccion</Label>
                  <Input
                    id="direccion"
                    value={form.direccion ?? ""}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  />
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!form.nit || !form.nombre || create.isPending || update.isPending}>
                    {create.isPending || update.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar proveedor"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message="No hay proveedores registrados" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="hidden md:table-cell">NIT</TableHead>
                  <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.nombre}</div>
                      <div className="text-xs text-muted-foreground">{p.correo ?? "-"}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{p.nit}</TableCell>
                    <TableCell className="hidden lg:table-cell">{p.contacto ?? "-"}</TableCell>
                    <TableCell>{p.telefono ?? "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{p.ciudad ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active === false ? "destructive" : "secondary"}>
                        {p.is_active === false ? "Inactivo" : "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Edit2 className="h-4 w-4" /> Editar
                        </Button>
                        <Button
                          type="button"
                          variant={p.is_active === false ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setConfirmTarget(p)}
                          disabled={update.isPending}
                        >
                          <Power className="h-4 w-4" />
                          {p.is_active === false ? "Activar" : "Inactivar"}
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
      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(value) => !value && setConfirmTarget(null)}
        title={confirmTarget?.is_active === false ? "Activar proveedor" : "Inactivar proveedor"}
        description={
          confirmTarget?.is_active === false
            ? `El proveedor ${confirmTarget?.nombre ?? ""} volvera a estar disponible en compras e inventario.`
            : `El proveedor ${confirmTarget?.nombre ?? ""} dejara de usarse en nuevos movimientos, conservando compras e historial.`
        }
        confirmLabel={confirmTarget?.is_active === false ? "Activar proveedor" : "Inactivar proveedor"}
        destructive={confirmTarget?.is_active !== false}
        isPending={update.isPending}
        onConfirm={() => confirmTarget && toggleActive(confirmTarget)}
      />
    </div>
  );
}
