import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useClientes, useCreateCliente, useUpdateCliente } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { Cliente } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/clientes")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Clientes | MotoManager" },
      { name: "description", content: "Gestion de clientes del taller: alta, busqueda y contacto." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Cliente | null>(null);
  const query = useClientes(search, page);
  const create = useCreateCliente();
  const update = useUpdateCliente();

  const [form, setForm] = useState({
    documento: "",
    nombre: "",
    tipo_documento: "CC",
    celular: "",
    correo: "",
    direccion: "",
    ciudad: "",
  });

  function resetForm() {
    setEditing(null);
    setForm({ documento: "", nombre: "", tipo_documento: "CC", celular: "", correo: "", direccion: "", ciudad: "" });
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(cliente: Cliente) {
    setEditing(cliente);
    setForm({
      documento: cliente.documento ?? "",
      nombre: cliente.nombre ?? "",
      tipo_documento: cliente.tipo_documento ?? "CC",
      celular: cliente.celular ?? "",
      correo: cliente.correo ?? "",
      direccion: cliente.direccion ?? "",
      ciudad: cliente.ciudad ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, body: form });
        toast.success("Cliente actualizado");
      } else {
        await create.mutateAsync(form);
        toast.success("Cliente creado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el cliente");
    }
  }

  async function toggleActive(cliente: Cliente) {
    const next = !cliente.is_active;
    try {
      await update.mutateAsync({ id: cliente.id, body: { is_active: next } });
      toast.success(next ? "Cliente activado" : "Cliente inactivado");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del cliente");
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes del taller"
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
                <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tipo documento">
                  <Input value={form.tipo_documento} onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })} />
                </Field>
                <Field label="Documento *">
                  <Input required value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
                </Field>
                <Field label="Nombre *" className="sm:col-span-2">
                  <Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </Field>
                <Field label="Celular">
                  <Input value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} />
                </Field>
                <Field label="Correo">
                  <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
                </Field>
                <Field label="Direccion">
                  <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
                </Field>
                <Field label="Ciudad">
                  <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
                </Field>
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit" disabled={create.isPending || update.isPending}>
                    {create.isPending || update.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Guardar cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o documento"
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
          ) : (query.data?.results ?? []).length === 0 ? (
            <EmptyState message="Aun no hay clientes registrados" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Motos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data?.results.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.documento}</TableCell>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.celular ?? "-"}</TableCell>
                      <TableCell>{c.correo ?? "-"}</TableCell>
                      <TableCell>{c.is_active === false ? "Inactivo" : "Activo"}</TableCell>
                      <TableCell className="text-right">{c.motocicletas_count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(c)}>
                            <Edit2 className="h-4 w-4" /> Editar
                          </Button>
                          <Button
                            type="button"
                            variant={c.is_active === false ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setConfirmTarget(c)}
                            disabled={update.isPending}
                          >
                            <Power className="h-4 w-4" />
                            {c.is_active === false ? "Activar" : "Inactivar"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls data={query.data} page={page} onPageChange={setPage} isLoading={query.isFetching} />
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(value) => !value && setConfirmTarget(null)}
        title={confirmTarget?.is_active === false ? "Activar cliente" : "Inactivar cliente"}
        description={
          confirmTarget?.is_active === false
            ? `El cliente ${confirmTarget?.nombre ?? ""} volvera a estar disponible para nuevos procesos.`
            : `El cliente ${confirmTarget?.nombre ?? ""} quedara oculto para nuevos procesos, pero se conserva todo su historial.`
        }
        confirmLabel={confirmTarget?.is_active === false ? "Activar cliente" : "Inactivar cliente"}
        destructive={confirmTarget?.is_active !== false}
        isPending={update.isPending}
        onConfirm={() => confirmTarget && toggleActive(confirmTarget)}
      />
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
