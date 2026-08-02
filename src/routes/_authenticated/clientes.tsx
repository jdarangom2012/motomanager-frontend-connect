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
import { useClientes, useCreateCliente } from "@/lib/hooks";
import { ApiError } from "@/lib/api";

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
  const [open, setOpen] = useState(false);
  const query = useClientes(search);
  const create = useCreateCliente();

  const [form, setForm] = useState({
    documento: "",
    nombre: "",
    tipo_documento: "CC",
    celular: "",
    correo: "",
    direccion: "",
    ciudad: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success("Cliente creado");
      setOpen(false);
      setForm({ documento: "", nombre: "", tipo_documento: "CC", celular: "", correo: "", direccion: "", ciudad: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear el cliente");
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes del taller"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo cliente</DialogTitle>
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
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Guardando..." : "Guardar cliente"}
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
              onChange={(e) => setSearch(e.target.value)}
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
                    <TableHead className="text-right">Motos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data?.results.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.documento}</TableCell>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.celular ?? "-"}</TableCell>
                      <TableCell>{c.correo ?? "-"}</TableCell>
                      <TableCell className="text-right">{c.motocicletas_count ?? 0}</TableCell>
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
