import { createFileRoute } from "@tanstack/react-router";
import { History, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { formatDateTime } from "@/lib/format";
import { useAuditoria } from "@/lib/hooks";

export const Route = createFileRoute("/_authenticated/auditoria")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Auditoria | MotoManager" },
      { name: "description", content: "Registro de actividad administrativa y operativa del taller." },
    ],
  }),
  component: AuditoriaPage,
});

const ENTIDADES = [
  "cliente",
  "motocicleta",
  "recepcion",
  "diagnostico",
  "cotizacion",
  "orden",
  "factura",
  "pago",
  "repuesto",
  "proveedor",
  "compra",
  "cita",
  "empresa",
];

const ACCION_LABELS: Record<string, string> = {
  created: "Creado",
  updated: "Actualizado",
  deleted: "Eliminado",
  state_changed: "Cambio de estado",
  login: "Inicio de sesion",
  import_excel: "Importacion",
  email_sent: "Correo enviado",
  pdf_generated: "PDF generado",
};

function AuditoriaPage() {
  const [entidad, setEntidad] = useState("todas");
  const [page, setPage] = useState(1);
  const [localSearch, setLocalSearch] = useState("");
  const query = useAuditoria({
    ...(entidad === "todas" ? {} : { entidad_tipo: entidad }),
    page,
    page_size: 50,
  });

  const registros = (query.data?.results ?? []).filter((item) => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return true;
    return [item.usuario, item.accion, item.entidad_tipo, item.entidad_id, item.created_at]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="Auditoria"
        subtitle="Registro de acciones relevantes del taller"
        actions={
          <Select
            value={entidad}
            onValueChange={(value) => {
              setEntidad(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las entidades</SelectItem>
              {ENTIDADES.map((item) => (
                <SelectItem key={item} value={item}>
                  {capitalize(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar usuario, accion o entidad"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {query.isLoading ? (
            <TableSkeleton />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : registros.length === 0 ? (
            <EmptyState message="Aun no hay actividad registrada" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Accion</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(item.created_at)}</TableCell>
                      <TableCell>{item.usuario ?? "Sistema"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ACCION_LABELS[item.accion] ?? item.accion}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <History className="h-4 w-4 text-muted-foreground" />
                          {capitalize(item.entidad_tipo)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.entidad_id ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                data={query.data}
                page={page}
                pageSize={50}
                onPageChange={setPage}
                isLoading={query.isFetching}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}
