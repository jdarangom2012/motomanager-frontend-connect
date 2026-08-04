import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useCreateTecnico, useTecnicosList, useUpdateTecnico } from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import type { Tecnico, TecnicoWrite } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/tecnicos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Equipo del taller | MotoManager" },
      { name: "description", content: "Administra tecnicos, recepcionistas y asignaciones del taller." },
      { property: "og:title", content: "Equipo del taller | MotoManager" },
      { property: "og:description", content: "Administra tecnicos, recepcionistas y asignaciones del taller." },
    ],
  }),
  component: TecnicosPage,
});

const EMPTY: TecnicoWrite = {
  nombre_visible: "",
  rol_operativo: "tecnico",
  especialidad: "",
  is_assignable: true,
  is_active: true,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function TecnicosPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tecnico | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Tecnico | null>(null);
  const [form, setForm] = useState<TecnicoWrite>(EMPTY);
  const query = useTecnicosList(search, page);
  const create = useCreateTecnico();
  const update = useUpdateTecnico();

  function resetForm() {
    setEditing(null);
    setForm(EMPTY);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(tecnico: Tecnico) {
    setEditing(tecnico);
    setForm({
      nombre_visible: tecnico.nombre_visible,
      rol_operativo: tecnico.rol_operativo as TecnicoWrite["rol_operativo"],
      especialidad: tecnico.especialidad ?? "",
      is_assignable: tecnico.is_assignable ?? true,
      is_active: tecnico.is_active ?? true,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const body = { ...form, especialidad: form.especialidad || null };
      if (editing) {
        await update.mutateAsync({ id: editing.id, body });
        toast.success("Integrante actualizado");
      } else {
        await create.mutateAsync(body);
        toast.success("Integrante guardado");
      }
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el integrante");
    }
  }

  async function toggleActive(tecnico: Tecnico) {
    const next = !tecnico.is_active;
    try {
      await update.mutateAsync({ id: tecnico.id, body: { is_active: next } });
      toast.success(next ? "Integrante activado" : "Integrante inactivado");
      setConfirmTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    }
  }

  const items = query.data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Equipo del taller"
        subtitle="Administra tecnicos, recepcionistas y asignaciones."
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
                <Plus className="mr-2 h-4 w-4" /> Nuevo integrante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar integrante" : "Nuevo integrante"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre visible *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre_visible}
                    onChange={(e) => setForm({ ...form, nombre_visible: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Rol operativo *</Label>
                  <Select
                    value={form.rol_operativo}
                    onValueChange={(v) => setForm({ ...form, rol_operativo: v as TecnicoWrite["rol_operativo"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Tecnico</SelectItem>
                      <SelectItem value="recepcionista">Recepcionista</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="esp">Especialidad</Label>
                  <Input
                    id="esp"
                    value={form.especialidad ?? ""}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label htmlFor="asignable">Disponible para asignacion</Label>
                  <Switch
                    id="asignable"
                    checked={form.is_assignable ?? true}
                    onCheckedChange={(v) => setForm({ ...form, is_assignable: v })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!form.nombre_visible || create.isPending || update.isPending}>
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
          placeholder="Buscar integrante"
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
        <EmptyState message="Aun no hay integrantes registrados" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className={t.is_active === false ? "opacity-60" : undefined}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials(t.nombre_visible)}
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{t.nombre_visible}</CardTitle>
                  <p className="text-xs capitalize text-muted-foreground">{t.rol_operativo}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {t.especialidad && <Badge variant="secondary">{t.especialidad}</Badge>}
                  <Badge variant={t.is_assignable ? "outline" : "destructive"}>
                    {t.is_assignable ? "Asignable" : "No asignable"}
                  </Badge>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ordenes activas</span>
                  <span className="font-medium text-foreground">{t.ordenes_activas ?? 0}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Calificacion</span>
                  <span className="font-medium text-foreground">
                    {t.calificacion != null && Number.isFinite(Number(t.calificacion))
                      ? Number(t.calificacion).toFixed(1)
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <Badge variant={t.is_active === false ? "destructive" : "secondary"}>
                    {t.is_active === false ? "Inactivo" : "Activo"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(t)}>
                      <Edit2 className="h-4 w-4" /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant={t.is_active === false ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setConfirmTarget(t)}
                      disabled={update.isPending}
                    >
                      <Power className="h-4 w-4" />
                      {t.is_active === false ? "Activar" : "Inactivar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="sm:col-span-2 xl:col-span-3">
            <PaginationControls data={query.data} page={page} onPageChange={setPage} isLoading={query.isFetching} />
          </div>
        </div>
      )}
      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(value) => !value && setConfirmTarget(null)}
        title={confirmTarget?.is_active === false ? "Activar integrante" : "Inactivar integrante"}
        description={
          confirmTarget?.is_active === false
            ? `El integrante ${confirmTarget?.nombre_visible ?? ""} volvera a estar disponible en el equipo del taller.`
            : `El integrante ${confirmTarget?.nombre_visible ?? ""} quedara fuera de nuevas asignaciones, pero se conserva su historial.`
        }
        confirmLabel={confirmTarget?.is_active === false ? "Activar integrante" : "Inactivar integrante"}
        destructive={confirmTarget?.is_active !== false}
        isPending={update.isPending}
        onConfirm={() => confirmTarget && toggleActive(confirmTarget)}
      />
    </div>
  );
}
