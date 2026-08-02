import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
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
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useClientes, useCreateMotocicleta, useMotocicletas } from "@/lib/hooks";
import { ApiError } from "@/lib/api";

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
  const [open, setOpen] = useState(false);
  const query = useMotocicletas(search);
  const clientes = useClientes("");
  const create = useCreateMotocicleta();

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        cliente_id: form.cliente_id,
        placa: form.placa.toUpperCase(),
        marca: form.marca,
        modelo: form.modelo,
        anio: form.anio ? Number(form.anio) : null,
        cilindraje: form.cilindraje || null,
        color: form.color || null,
        kilometraje_actual: form.kilometraje_actual ? Number(form.kilometraje_actual) : null,
      });
      toast.success("Motocicleta registrada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar la motocicleta");
    }
  }

  return (
    <div>
      <PageHeader
        title="Motocicletas"
        subtitle="Parque de motos asociado a los clientes"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nueva motocicleta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva motocicleta</DialogTitle>
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
              onChange={(e) => setSearch(e.target.value)}
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
