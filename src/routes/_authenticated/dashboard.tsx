import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Package,
  Stethoscope,
  UserPlus,
  Wrench,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/states";
import { useDashboard, useOrdenes } from "@/lib/hooks";
import { estadoLabel, formatMoney, formatTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard operativo | MotoManager" },
      { name: "description", content: "KPIs, citas y ordenes del taller en tiempo real." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const ordenes = useOrdenes("");

  const d = dashboard.data;
  const moneda = user?.empresa?.moneda ?? "COP";

  const kpis = [
    { label: "Ventas del mes", value: formatMoney(d?.ventas_mes, moneda), icon: DollarSign },
    { label: "Motos en taller", value: d?.motos_taller ?? 0, icon: Bike },
    { label: "Citas de hoy", value: d?.citas_hoy ?? 0, icon: CalendarClock },
    { label: "Ticket promedio", value: formatMoney(d?.ticket_promedio, moneda), icon: DollarSign },
    { label: "Ordenes activas", value: d?.ordenes_activas ?? 0, icon: Wrench },
    { label: "Clientes nuevos", value: d?.clientes_nuevos ?? 0, icon: UserPlus },
    { label: "En diagnostico", value: d?.motos_en_diagnostico ?? 0, icon: Stethoscope },
    { label: "En reparacion", value: d?.motos_en_reparacion ?? 0, icon: Wrench },
    { label: "Listas para entrega", value: d?.listas_para_entrega ?? 0, icon: CheckCircle2 },
  ];

  const ordenesPorEstado = Object.entries(
    (ordenes.data?.results ?? []).reduce<Record<string, number>>((acc, o) => {
      acc[o.estado] = (acc[o.estado] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([estado, total]) => ({ estado: estadoLabel(estado), total }));

  return (
    <div>
      <PageHeader
        title={`Hola, ${user?.full_name || user?.email || "equipo"}`}
        subtitle="Resumen operativo y comercial del taller"
        actions={
          <>
            <Button variant="outline" disabled={!d}>
              Exportar
            </Button>
            <Button asChild>
              <Link to="/recepcion">Nueva recepcion</Link>
            </Button>
          </>
        }
      />

      {dashboard.isError ? (
        <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard.isLoading
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : kpis.map((k) => (
                  <Card key={k.label}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                        <p className="mt-1 truncate text-xl font-semibold">{k.value}</p>
                      </div>
                      <k.icon className="h-5 w-5 shrink-0 text-primary" />
                    </CardContent>
                  </Card>
                ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Ordenes por estado</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {ordenes.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : ordenesPorEstado.length === 0 ? (
                  <EmptyState message="Aun no hay actividad registrada" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordenesPorEstado}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="estado" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" /> Alerta de stock minimo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{d?.stock_bajo ?? 0}</p>
                <p className="mt-1 text-sm text-muted-foreground">repuestos por debajo del stock minimo</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proximas citas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(d?.proximas_citas ?? []).length === 0 ? (
                  <EmptyState message="Aun no hay citas programadas" />
                ) : (
                  d?.proximas_citas?.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.cliente?.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.motocicleta?.placa} · {c.servicio?.nombre ?? "Servicio"} ·{" "}
                          {c.tecnico?.nombre_visible ?? "Sin tecnico"}
                        </p>
                      </div>
                      <Badge variant="secondary">{formatTime(c.fecha_inicio)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="h-4 w-4 text-primary" /> Ordenes recientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ordenes.isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (ordenes.data?.results ?? []).length === 0 ? (
                  <EmptyState
                    message="Aun no hay actividad registrada"
                    action={
                      <Button asChild size="sm">
                        <Link to="/recepcion">Nueva recepcion</Link>
                      </Button>
                    }
                  />
                ) : (
                  ordenes.data?.results.slice(0, 6).map((o) => (
                    <Link
                      key={o.id}
                      to="/ordenes/$id"
                      params={{ id: o.id }}
                      className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {o.numero} · {o.motocicleta?.placa}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{o.cliente?.nombre}</p>
                      </div>
                      <Badge variant="outline">{estadoLabel(o.estado)}</Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
