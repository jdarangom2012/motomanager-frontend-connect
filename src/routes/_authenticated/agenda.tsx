import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/states";
import {
  useCitas,
  useClientes,
  useCreateCita,
  useMotocicletas,
  useServiciosTaller,
  useTecnicos,
  useUpdateCitaEstado,
} from "@/lib/hooks";
import { ApiError } from "@/lib/api";
import { estadoLabel, formatDateTime, formatMoney, formatTime } from "@/lib/format";
import type { Cita } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/agenda")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Agenda de taller | MotoManager" },
      { name: "description", content: "Calendario de citas del taller por mes, dia, tecnico y estado." },
    ],
  }),
  component: AgendaPage,
});

const today = new Date().toISOString().slice(0, 10);
const dayNames = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toInputDate(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function toApiDateTime(value: string) {
  return new Date(value).toISOString();
}

function addMonths(value: string, amount: number) {
  const date = dateFromInput(value);
  date.setMonth(date.getMonth() + amount);
  return toInputDate(date);
}

function addDays(value: string, amount: number) {
  const date = dateFromInput(value);
  date.setDate(date.getDate() + amount);
  return toInputDate(date);
}

function startOfMonth(value: string) {
  const date = dateFromInput(value);
  return toInputDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(value: string) {
  const date = dateFromInput(value);
  return toInputDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function monthLabel(value: string) {
  return dateFromInput(value).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function dayLabel(value: string) {
  return dateFromInput(value).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function addMinutesToLocalDateTime(value: string, minutes: number) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() + minutes);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function buildMonthDays(cursor: string) {
  const first = dateFromInput(startOfMonth(cursor));
  const last = dateFromInput(endOfMonth(cursor));
  const mondayIndex = (first.getDay() + 6) % 7;
  const days: Array<string | null> = Array.from({ length: mondayIndex }, () => null);
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    days.push(toInputDate(new Date(d)));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function EventPill({ cita }: { cita: Cita }) {
  return (
    <div className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-xs leading-tight">
      <p className="font-medium text-foreground">
        {formatTime(cita.fecha_inicio)} · {cita.servicio?.nombre ?? "Servicio"}
      </p>
      <p className="truncate text-muted-foreground">{cita.cliente?.nombre}</p>
    </div>
  );
}

function CitaActions({
  cita,
  tecnicos,
  tecnicoId,
  onTecnicoChange,
  onCambiarEstado,
  isPending,
}: {
  cita: Cita;
  tecnicos: ReturnType<typeof useTecnicos>["data"];
  tecnicoId: string;
  onTecnicoChange: (id: string) => void;
  onCambiarEstado: (cita: Cita, estado: "confirmada" | "cancelada" | "completada") => void;
  isPending: boolean;
}) {
  const requiereTecnico = cita.estado === "solicitada" && !cita.tecnico;

  if (cita.estado === "cancelada" || cita.estado === "completada") return null;

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      {requiereTecnico && (
        <div className="grid min-w-[220px] gap-1">
          <Label className="text-xs text-muted-foreground">Tecnico para confirmar</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={tecnicoId}
            onChange={(e) => onTecnicoChange(e.target.value)}
          >
            <option value="">Selecciona</option>
            {tecnicos?.results
              .filter((t) => t.is_assignable !== false && t.is_active !== false)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre_visible}
                </option>
              ))}
          </select>
        </div>
      )}
      {cita.estado === "solicitada" && (
        <Button
          size="sm"
          onClick={() => onCambiarEstado(cita, "confirmada")}
          disabled={isPending || (requiereTecnico && !tecnicoId)}
        >
          Confirmar
        </Button>
      )}
      {cita.estado === "confirmada" && (
        <Button size="sm" onClick={() => onCambiarEstado(cita, "completada")} disabled={isPending}>
          Completar
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => onCambiarEstado(cita, "cancelada")} disabled={isPending}>
        Cancelar
      </Button>
    </div>
  );
}

function AgendaPage() {
  const [vista, setVista] = useState<"mes" | "dia">("mes");
  const [cursor, setCursor] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [estado, setEstado] = useState("");
  const [tecnicoFiltro, setTecnicoFiltro] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [motoId, setMotoId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [permitirConflicto, setPermitirConflicto] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [tecnicoConfirmacion, setTecnicoConfirmacion] = useState<Record<string, string>>({});

  const fechaDesde = vista === "mes" ? startOfMonth(cursor) : selectedDate;
  const fechaHasta = vista === "mes" ? endOfMonth(cursor) : selectedDate;
  const citas = useCitas({
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    tecnico_id: tecnicoFiltro || undefined,
    estado: estado || undefined,
    page: 1,
  });
  const clientes = useClientes("");
  const motos = useMotocicletas("");
  const tecnicos = useTecnicos();
  const servicios = useServiciosTaller();
  const create = useCreateCita();
  const updateEstado = useUpdateCitaEstado();

  const citasList = useMemo(
    () => [...(citas.data?.results ?? [])].sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)),
    [citas.data],
  );
  const citasByDate = useMemo(() => {
    const map = new Map<string, Cita[]>();
    for (const cita of citasList) {
      const key = dateKey(cita.fecha_inicio);
      map.set(key, [...(map.get(key) ?? []), cita]);
    }
    return map;
  }, [citasList]);
  const monthDays = useMemo(() => buildMonthDays(cursor), [cursor]);
  const dayCitas = citasByDate.get(selectedDate) ?? [];

  const motosCliente = useMemo(
    () => (motos.data?.results ?? []).filter((m) => !clienteId || m.cliente?.id === clienteId),
    [motos.data, clienteId],
  );
  const servicioSeleccionado = useMemo(
    () => servicios.data?.find((s) => s.id === servicioId),
    [servicios.data, servicioId],
  );

  function syncFechaFin(inicio: string, servicio = servicioSeleccionado) {
    const duracion = servicio?.duracion_minutos || 60;
    setFechaFin(addMinutesToLocalDateTime(inicio, duracion));
  }

  function moveCalendar(direction: number) {
    if (vista === "mes") {
      setCursor(addMonths(cursor, direction));
      return;
    }
    const next = addDays(selectedDate, direction);
    setSelectedDate(next);
    setCursor(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    try {
      const cita = await create.mutateAsync({
        cliente_id: clienteId,
        motocicleta_id: motoId,
        servicio_id: servicioId,
        tecnico_id: tecnicoId,
        fecha_inicio: toApiDateTime(fechaInicio),
        fecha_fin: toApiDateTime(fechaFin),
        permitir_conflicto: permitirConflicto,
        observaciones: observaciones || null,
      });
      toast.success(`Cita ${estadoLabel(cita.estado)} creada`);
      setFechaInicio("");
      setFechaFin("");
      setObservaciones("");
      setPermitirConflicto(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo crear la cita");
    }
  }

  async function cambiarEstadoCita(cita: Cita, nuevoEstado: "confirmada" | "cancelada" | "completada") {
    try {
      const tecnico_id = cita.tecnico?.id ?? tecnicoConfirmacion[cita.id] ?? null;
      await updateEstado.mutateAsync({
        id: cita.id,
        body: {
          estado: nuevoEstado,
          ...(nuevoEstado === "confirmada" && tecnico_id ? { tecnico_id } : {}),
        },
      });
      toast.success(`Cita ${estadoLabel(nuevoEstado)}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : "No se pudo actualizar la cita");
    }
  }

  const disabled =
    !clienteId ||
    !motoId ||
    !servicioId ||
    !tecnicoId ||
    !fechaInicio ||
    !fechaFin ||
    new Date(fechaFin) <= new Date(fechaInicio) ||
    create.isPending;

  return (
    <div>
      <PageHeader title="Agenda de taller" subtitle="Calendario de citas por tecnico, fecha y servicio" />

      <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => moveCalendar(-1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => moveCalendar(1)} aria-label="Siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant={vista === "mes" ? "default" : "outline"}
            onClick={() => setVista("mes")}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Mes
          </Button>
          <Button
            variant={vista === "dia" ? "default" : "outline"}
            onClick={() => setVista("dia")}
            className="gap-2"
          >
            Dia
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCursor(e.target.value);
              setVista("dia");
            }}
            className="w-[170px]"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Tecnico</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={tecnicoFiltro}
            onChange={(e) => setTecnicoFiltro(e.target.value)}
          >
            <option value="">Todos</option>
            {tecnicos.data?.results.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre_visible}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="solicitada">Solicitada</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="completada">Completada</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base capitalize">
              {vista === "mes" ? monthLabel(cursor) : dayLabel(selectedDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {citas.isLoading ? (
              <TableSkeleton rows={4} />
            ) : citas.isError ? (
              <ErrorState error={citas.error} onRetry={() => citas.refetch()} />
            ) : vista === "mes" ? (
              <div className="grid grid-cols-7 overflow-hidden rounded-md border">
                {dayNames.map((day) => (
                  <div key={day} className="border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium">
                    {day}
                  </div>
                ))}
                {monthDays.map((day, index) => {
                  const events = day ? citasByDate.get(day) ?? [] : [];
                  return (
                    <button
                      key={`${day ?? "blank"}-${index}`}
                      type="button"
                      disabled={!day}
                      onClick={() => {
                        if (!day) return;
                        setSelectedDate(day);
                        setVista("dia");
                      }}
                      className="min-h-[128px] border-b border-r bg-background p-2 text-left align-top transition hover:bg-muted/40 disabled:bg-muted/20"
                    >
                      {day && (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className={day === today ? "font-semibold text-primary" : "font-medium"}>
                              {Number(day.slice(-2))}
                            </span>
                            {events.length > 0 && <Badge variant="outline">{events.length}</Badge>}
                          </div>
                          <div className="space-y-1">
                            {events.slice(0, 3).map((cita) => (
                              <EventPill key={cita.id} cita={cita} />
                            ))}
                            {events.length > 3 && (
                              <p className="text-xs text-muted-foreground">+{events.length - 3} mas</p>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : dayCitas.length === 0 ? (
              <EmptyState message="No hay citas para este dia" />
            ) : (
              <div className="space-y-3">
                {dayCitas.map((cita) => (
                  <div key={cita.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {formatTime(cita.fecha_inicio)} - {formatTime(cita.fecha_fin)}
                        </p>
                        <p className="mt-1 text-base font-semibold">
                          {cita.servicio?.nombre ?? "Sin servicio"} · {cita.cliente?.nombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cita.motocicleta?.placa} · {cita.tecnico?.nombre_visible ?? "Tecnico pendiente"} ·{" "}
                          {cita.origen === "portal" ? "Portal cliente" : "Manual"}
                        </p>
                      </div>
                      <Badge variant="outline">{estadoLabel(cita.estado)}</Badge>
                    </div>
                    {cita.observaciones && <p className="mt-3 text-sm">{cita.observaciones}</p>}
                    <CitaActions
                      cita={cita}
                      tecnicos={tecnicos.data}
                      tecnicoId={tecnicoConfirmacion[cita.id] ?? ""}
                      onTecnicoChange={(id) => setTecnicoConfirmacion((current) => ({ ...current, [cita.id]: id }))}
                      onCambiarEstado={cambiarEstadoCita}
                      isPending={updateEstado.isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva cita</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Cliente *</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={clienteId}
                  onChange={(e) => {
                    setClienteId(e.target.value);
                    setMotoId("");
                  }}
                >
                  <option value="">Selecciona</option>
                  {clientes.data?.results.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Motocicleta *</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={motoId}
                  onChange={(e) => setMotoId(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {motosCliente.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.placa} - {m.marca} {m.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Servicio *</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={servicioId}
                  onChange={(e) => {
                    const nextServicioId = e.target.value;
                    const nextServicio = servicios.data?.find((s) => s.id === nextServicioId);
                    setServicioId(nextServicioId);
                    if (fechaInicio && nextServicio) syncFechaFin(fechaInicio, nextServicio);
                  }}
                >
                  <option value="">Selecciona</option>
                  {servicios.data
                    ?.filter((s) => s.is_active !== false)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} · {s.duracion_minutos ?? 0} min · {formatMoney(s.precio_base ?? 0)}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tecnico *</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                >
                  <option value="">Selecciona</option>
                  {tecnicos.data?.results
                    .filter((t) => t.is_assignable !== false && t.is_active !== false)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre_visible}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Inicio *</Label>
                  <Input
                    className="w-full pr-10"
                    type="datetime-local"
                    value={fechaInicio}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      syncFechaFin(e.target.value);
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Fin *</Label>
                  <Input
                    className="w-full pr-10"
                    type="datetime-local"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={permitirConflicto}
                  onChange={(e) => setPermitirConflicto(e.target.checked)}
                />
                Permitir conflicto de horario
              </label>
              <div className="grid gap-1.5">
                <Label className="text-xs">Observaciones</Label>
                <Textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
              <Button type="submit" disabled={disabled}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                {create.isPending ? "Guardando..." : "Crear cita"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
