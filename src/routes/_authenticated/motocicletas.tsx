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
import { useClientes, useCreateMotocicleta, useMotocicletas, useUpdateMotocicleta } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { Motocicleta } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/motocicletas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Motocicletas | MotoManager" },
      { name: "description", content: "Registro de motocicletas por cliente, placa y kilometraje." },
    ],
  }),
  component: MotocicletasPage,
});

function MotocicletasPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Motocicleta | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Motocicleta | null>(null);
  const query = useMotocicletas(search, page);
  const clientes = useClientes("");
  const create = useCreateMotocicleta();
  const update = useUpdateMotocicleta();

  const [form, setForm] = useState({
    cliente_id: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    cilindraje: "",
    color: "",
    kilometraje_actual: "",
  });

  function resetForm() {
    setEditing(null);
    setForm({
      cliente_id: "",
      placa: "",
      marca: "",
      modelo: "",
      anio: "",
      cilindraje: "",
      color: "",
      kilometraje_actual: "",
    });
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(moto: Motocicleta) {
    setEditing(moto);
    setForm({
      cliente_id: moto.cliente?.id ?? "",
      placa: moto.placa ?? "",
      marca: moto.marca ?? "",
      modelo: moto.modelo ?? "",
      anio: moto.anio ? String(moto.anio) : "",
      cilindraje: moto.cilindraje ?? "",
      color: moto.color ?? "",
      kilometraje_actual: moto.kilometraje_actual ? String(moto.kilometraje_actual) : "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = {
        cliente_id: form.cliente_id,
        placa: form.placa.toUpperCase(),
        marca: form.marca,
        modelo: form.modelo,
        anio: form.anio ? Number(form.anio) : null,
        cilindraje: form.cilindraje || null,
        color: form.color || null,
        kilometraje_actual: form.kilometraje_actual ? Number(form.kilometraje_actual) : null,
      };
      if (editing) {
        await update.mutateAsync({ id: editing.id, body });
        toast.success("Motocicleta actualizada");
      } else {
        await create.mutateAsync(body);
        toast.success("Motocicleta registrada");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la motocicleta");
    }
  }

  async function toggleActive(moto: Motocicleta) {
    const next = !moto.is_active;
    try {
      await update.mutateAsync({ id: moto.id, body: { is_active: next } });
      toast.success(next ? "Motocicleta activada" : "Motocicleta inactivada");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado de la motocicleta");
    }
  }

  return (
    <div>
      <PageHeader
        title="Motocicletas"
        subtitle="Parque de motos asociado a los clientes"
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
                <Plus className="mr-1 h-4 w-4" /> Nueva motocicleta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar motocicleta" : "Nueva motocicleta"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Cliente *</Label>
                  <select
                    required
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.cliente_id}
                    onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.data?.results.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} — {c.documento}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Placa *">
                  <Input required value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
                </Field>
                <Field label="Marca *">
                  <Input required value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
                </Field>
                <Field label="Modelo *">
                  <Input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
                </Field>
                <Field label="Anio">
                  <Input type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} />
                </Field>
                <Field label="Cilindraje">
                  <Input value={form.cilindraje} onChange={(e) => setForm({ ...form, cilindraje: e.target.value })} />
                </Field>
                <Field label="Color">
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </Field>
                <Field label="Kilometraje" className="sm:col-span-2">
                  <Input
                    type="number"
                    value={form.kilometraje_actual}
                    onChange={(e) => setForm({ ...form, kilometraje_actual: e.target.value })}
                  />
                </Field>
                <DialogFooter className="sm:col-span-2">
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Guardando..." : "Guardar motocicleta"}
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
              placeholder="Buscar por placa o cliente"
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
            <EmptyState message="Aun no hay motocicletas registradas" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Anio</TableHead>
                    <TableHead className="text-right">Km</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data?.results.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono font-semibold">{m.placa}</TableCell>
                      <TableCell>
                        {m.marca} {m.modelo}
                      </TableCell>
                      <TableCell>{m.cliente?.nombre ?? "-"}</TableCell>
                      <TableCell>{m.anio ?? "-"}</TableCell>
                      <TableCell className="text-right">{m.kilometraje_actual ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={m.is_active === false ? "destructive" : "secondary"}>
                          {m.is_active === false ? "Inactiva" : "Activa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(m)}>
                            <Edit2 className="h-4 w-4" /> Editar
                          </Button>
                          <Button
                            type="button"
                            variant={m.is_active === false ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setConfirmTarget(m)}
                            disabled={update.isPending}
                          >
                            <Power className="h-4 w-4" />
                            {m.is_active === false ? "Activar" : "Inactivar"}
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
        title={confirmTarget?.is_active === false ? "Activar motocicleta" : "Inactivar motocicleta"}
        description={
          confirmTarget?.is_active === false
            ? `La motocicleta ${confirmTarget?.placa ?? ""} volvera a estar disponible para recepciones, citas y ordenes.`
            : `La motocicleta ${confirmTarget?.placa ?? ""} quedara fuera de nuevos procesos, pero se conserva todo su historial.`
        }
        confirmLabel={confirmTarget?.is_active === false ? "Activar motocicleta" : "Inactivar motocicleta"}
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
