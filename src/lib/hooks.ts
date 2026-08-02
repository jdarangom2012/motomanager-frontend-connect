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
  TecnicoWrite,
  Proveedor,
  ProveedorWrite,
  Repuesto,
  RepuestoWrite,
  RepuestoCompatibilidad,
  Compra,
  CompraWrite,
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
      apiFetch<Cotizacion>(`/cotizaciones/${id}/aprobar/`, { method: "POST" }),
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

/* ---------- Sprint 05 ---------- */

export function useTecnicosList(search: string, page = 1) {
  return useQuery({
    queryKey: ["tecnicos-list", search, page],
    queryFn: () => apiFetch<Paginated<Tecnico>>("/tecnicos/", { query: { search, page } }),
    ...listOpts,
  });
}

export function useCreateTecnico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TecnicoWrite) => apiFetch<Tecnico>("/tecnicos/", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnicos-list"] });
      qc.invalidateQueries({ queryKey: ["tecnicos"] });
    },
  });
}

export function useUpdateTecnico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TecnicoWrite> }) =>
      apiFetch<Tecnico>(`/tecnicos/${id}/`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tecnicos-list"] });
      qc.invalidateQueries({ queryKey: ["tecnicos"] });
    },
  });
}

export function useRepuestos(search: string, opts: { categoria?: string; stock_bajo?: boolean; page?: number } = {}) {
  return useQuery({
    queryKey: ["repuestos", search, opts],
    queryFn: () =>
      apiFetch<Paginated<Repuesto>>("/repuestos/", {
        query: {
          search,
          categoria: opts.categoria,
          stock_bajo: opts.stock_bajo ? "true" : undefined,
          page: opts.page ?? 1,
        },
      }),
    ...listOpts,
  });
}

export function useCreateRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RepuestoWrite) => apiFetch<Repuesto>("/repuestos/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestos"] }),
  });
}

export function useUpdateRepuesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RepuestoWrite> }) =>
      apiFetch<Repuesto>(`/repuestos/${id}/`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repuestos"] }),
  });
}

export function useCompatibilidades(repuestoId?: string) {
  return useQuery({
    queryKey: ["compatibilidades", repuestoId],
    queryFn: () => apiFetch<Paginated<RepuestoCompatibilidad>>(`/repuestos/${repuestoId}/compatibilidades/`),
    enabled: !!repuestoId,
    retry: false,
  });
}

export function useProveedores(search = "", page = 1) {
  return useQuery({
    queryKey: ["proveedores", search, page],
    queryFn: () => apiFetch<Paginated<Proveedor>>("/proveedores/", { query: { search, page } }),
    ...listOpts,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProveedorWrite) => apiFetch<Proveedor>("/proveedores/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }),
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ProveedorWrite> }) =>
      apiFetch<Proveedor>(`/proveedores/${id}/`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores"] }),
  });
}

export function useCompras(filters: { fecha_desde?: string; fecha_hasta?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ["compras", filters],
    queryFn: () =>
      apiFetch<Paginated<Compra>>("/compras/", {
        query: { fecha_desde: filters.fecha_desde, fecha_hasta: filters.fecha_hasta, page: filters.page ?? 1 },
      }),
    ...listOpts,
  });
}

export function useCreateCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompraWrite) => apiFetch<Compra>("/compras/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useConfirmarCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Compra>(`/compras/${id}/confirmar/`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compras"] });
      qc.invalidateQueries({ queryKey: ["repuestos"] });
    },
  });
}
