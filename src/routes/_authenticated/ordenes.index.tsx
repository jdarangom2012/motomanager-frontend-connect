import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import { useOrdenes } from "@/lib/hooks";
import { estadoLabel, formatDateTime } from "@/lib/format";
import { ORDEN_ESTADOS } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ordenes/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ordenes de trabajo | MotoManager" },
      { name: "description", content: "Tablero Kanban de ordenes de trabajo por estado." },
    ],
  }),
  component: OrdenesPage,
});

const KANBAN = ORDEN_ESTADOS.filter((e) => e !== "cancelada");

function OrdenesPage() {
  const [search, setSearch] = useState("");
  const query = useOrdenes(search);
  const ordenes = query.data?.results ?? [];

  return (
    <div>
      <PageHeader title="Ordenes de trabajo" subtitle="Seguimiento por estado y tecnico asignado" />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por placa, cliente u orden"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : ordenes.length === 0 ? (
        <EmptyState message="Aun no hay ordenes de trabajo" />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN.map((estado) => {
            const items = ordenes.filter((o) => o.estado === estado);
            return (
              <div key={estado} className="w-72 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {estadoLabel(estado)}
                  </span>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((o) => (
                    <Link key={o.id} to="/ordenes/$id" params={{ id: o.id }}>
                      <Card className="transition-shadow hover:shadow-md">
                        <CardContent className="space-y-1 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">{o.numero}</span>
                            <span className="font-semibold">{o.motocicleta?.placa}</span>
                          </div>
                          <p className="truncate text-sm">{o.cliente?.nombre}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {o.tecnico?.nombre_visible ?? "Sin tecnico"} · {formatDateTime(o.created_at)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                      Sin ordenes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
