import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, type Paginated } from "./api";
import type {
  Cliente,
  ClienteWrite,
  Cotizacion,
  CotizacionWrite,
  DashboardReport,
  Diagnostico,
  DiagnosticoWrite,
  Motocicleta,
  MotocicletaWrite,
  OrdenEstado,
  OrdenTrabajo,
  OrdenTrabajoDetalle,
  Recepcion,
  RecepcionWrite,
  Tecnico,
} from "./types";

const listOpts = { staleTime: 15_000, retry: false } as const;

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardReport>("/reportes/dashboard/"),
    retry: false,
  });
}

export function useClientes(search: string, page = 1) {
  return useQuery({
    queryKey: ["clientes", search, page],
    queryFn: () => apiFetch<Paginated<Cliente>>("/clientes/", { query: { search, page } }),
    ...listOpts,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ClienteWrite) => apiFetch<Cliente>("/clientes/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useMotocicletas(search: string, page = 1) {
  return useQuery({
    queryKey: ["motocicletas", search, page],
    queryFn: () => apiFetch<Paginated<Motocicleta>>("/motocicletas/", { query: { search, page } }),
    ...listOpts,
  });
}

export function useCreateMotocicleta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MotocicletaWrite) => apiFetch<Motocicleta>("/motocicletas/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["motocicletas"] }),
  });
}

export function useRecepciones(page = 1) {
  return useQuery({
    queryKey: ["recepciones", page],
    queryFn: () => apiFetch<Paginated<Recepcion>>("/recepciones/", { query: { page } }),
    ...listOpts,
  });
}

export function useCreateRecepcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RecepcionWrite) => apiFetch<Recepcion>("/recepciones/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recepciones"] }),
  });
}

export function useConvertirRecepcionEnOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<OrdenTrabajo>(`/recepciones/${id}/convertir-orden/`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recepciones"] });
      qc.invalidateQueries({ queryKey: ["ordenes"] });
    },
  });
}

export function useDiagnosticos(page = 1) {
  return useQuery({
    queryKey: ["diagnosticos", page],
    queryFn: () => apiFetch<Paginated<Diagnostico>>("/diagnosticos/", { query: { page } }),
    ...listOpts,
  });
}

export function useCreateDiagnostico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DiagnosticoWrite) => apiFetch<Diagnostico>("/diagnosticos/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diagnosticos"] }),
  });
}

export function useCotizaciones(page = 1) {
  return useQuery({
    queryKey: ["cotizaciones", page],
    queryFn: () => apiFetch<Paginated<Cotizacion>>("/cotizaciones/", { query: { page } }),
    ...listOpts,
  });
}

export function useCreateCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CotizacionWrite) => apiFetch<Cotizacion>("/cotizaciones/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cotizaciones"] }),
  });
}

/**
 * El OpenAPI no expone un endpoint dedicado de aprobacion.
 * Se usa el unico existente: PATCH /cotizaciones/{id}/ (cotizaciones_partial_update).
 */
export function useAprobarCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Cotizacion>(`/cotizaciones/${id}/`, { method: "PATCH", body: { estado: "aprobada" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cotizaciones"] }),
  });
}

export function useConvertirCotizacionEnOrden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<OrdenTrabajo>(`/cotizaciones/${id}/convertir-orden/`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cotizaciones"] });
      qc.invalidateQueries({ queryKey: ["ordenes"] });
    },
  });
}

export function useOrdenes(search: string, estado?: string) {
  return useQuery({
    queryKey: ["ordenes", search, estado],
    queryFn: () =>
      apiFetch<Paginated<OrdenTrabajo>>("/ordenes/", { query: { search, estado, page_size: 100 } }),
    ...listOpts,
  });
}

export function useOrden(id: string) {
  return useQuery({
    queryKey: ["orden", id],
    queryFn: () => apiFetch<OrdenTrabajoDetalle>(`/ordenes/${id}/`),
    retry: false,
  });
}

export function useCambiarEstadoOrden(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { estado_nuevo: OrdenEstado; comentario?: string }) =>
      apiFetch<OrdenTrabajoDetalle>(`/ordenes/${id}/cambiar-estado/`, { method: "POST", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orden", id] });
      qc.invalidateQueries({ queryKey: ["ordenes"] });
    },
  });
}

export function useTecnicos() {
  return useQuery({
    queryKey: ["tecnicos"],
    queryFn: () => apiFetch<Paginated<Tecnico>>("/tecnicos/", { query: { page_size: 100 } }),
    ...listOpts,
  });
}
