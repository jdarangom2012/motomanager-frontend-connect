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
  EmailSendRequest,
  EmailSent,
  Empresa,
  EmpresaWrite,
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
  Factura,
  FacturaWrite,
  Pago,
  PagoWrite,
  FileGenerated,
  Notificacion,
  Auditoria,
  ReportResult,
  SearchResult,
  ExportacionContaiRequest,
  ServicioTaller,
  ServicioTallerWrite,
  PortalEstado,
  PortalCitaEstado,
  PortalCitaRequest,
  PortalCitaResponse,
  ConfiguracionEmpresa,
  ConfiguracionEmpresaWrite,
  Cita,
  CitaEstadoUpdate,
  CitaWrite,
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

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ClienteWrite> }) =>
      apiFetch<Cliente>(`/clientes/${id}/`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["auditoria"] });
    },
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

export function useUpdateMotocicleta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<MotocicletaWrite> }) =>
      apiFetch<Motocicleta>(`/motocicletas/${id}/`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["motocicletas"] });
      qc.invalidateQueries({ queryKey: ["auditoria"] });
    },
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

export function useAprobarCotizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Cotizacion>(`/cotizaciones/${id}/aprobar/`, { method: "POST" }),
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

export function useEnviarCotizacionEmail() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: EmailSendRequest }) =>
      apiFetch<EmailSent>(`/cotizaciones/${id}/enviar-email/`, { method: "POST", body: body ?? {} }),
  });
}

export function useCitas(
  filters: {
    fecha_desde?: string | undefined;
    fecha_hasta?: string | undefined;
    tecnico_id?: string | undefined;
    estado?: string | undefined;
    page?: number;
    page_size?: number;
  } = {},
) {
  return useQuery({
    queryKey: ["citas", filters],
    queryFn: () =>
      apiFetch<Paginated<Cita>>("/citas/", {
        query: {
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
          tecnico_id: filters.tecnico_id,
          estado: filters.estado,
          page: filters.page ?? 1,
          page_size: filters.page_size ?? 100,
        },
      }),
    ...listOpts,
  });
}

export function useCreateCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CitaWrite) => apiFetch<Cita>("/citas/", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateCitaEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CitaEstadoUpdate }) =>
      apiFetch<Cita>(`/citas/${id}/`, { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["citas"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notificaciones"] });
    },
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
      qc.invalidateQueries({ queryKey: ["auditoria"] });
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

/* ---------- Sprint 05 parte 2: Facturas, Pagos, Reportes, Contai, Portal, Config ---------- */

export function useFacturas(filters: { fecha_desde?: string | undefined; fecha_hasta?: string | undefined; estado?: string | undefined; page?: number } = {}) {
  return useQuery({
    queryKey: ["facturas", filters],
    queryFn: () =>
      apiFetch<Paginated<Factura>>("/facturas/", {
        query: {
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
          estado: filters.estado,
          page: filters.page ?? 1,
        },
      }),
    ...listOpts,
  });
}

export function useCreateFactura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FacturaWrite) => apiFetch<Factura>("/facturas/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facturas"] }),
  });
}

export function useGenerarPdfFactura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<FileGenerated>(`/facturas/${id}/generar-pdf/`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facturas"] }),
  });
}

export function usePagos(filters: { factura_id?: string | undefined; fecha_desde?: string | undefined; fecha_hasta?: string | undefined; page?: number } = {}) {
  return useQuery({
    queryKey: ["pagos", filters],
    queryFn: () =>
      apiFetch<Paginated<Pago>>("/pagos/", {
        query: {
          factura_id: filters.factura_id,
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
          page: filters.page ?? 1,
        },
      }),
    ...listOpts,
  });
}

export function useCreatePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PagoWrite) => apiFetch<Pago>("/pagos/", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pagos"] });
      qc.invalidateQueries({ queryKey: ["facturas"] });
    },
  });
}

export function useReporteOperativo(
  filters: { fecha_desde?: string | undefined; fecha_hasta?: string | undefined; tecnico_id?: string | undefined; estado?: string | undefined },
  enabled = true,
) {
  return useQuery({
    queryKey: ["reporte-operativo", filters],
    queryFn: () => apiFetch<ReportResult>("/reportes/operativo/", { query: { ...filters } }),
    enabled,
    retry: false,
  });
}

export function useEnviarFacturaEmail() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: EmailSendRequest }) =>
      apiFetch<EmailSent>(`/facturas/${id}/enviar-email/`, { method: "POST", body: body ?? {} }),
  });
}

export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ["global-search", q],
    queryFn: () => apiFetch<SearchResult>("/search/", { query: { q } }),
    enabled: q.trim().length >= 2,
    retry: false,
  });
}

export function useNotificaciones() {
  return useQuery({
    queryKey: ["notificaciones"],
    queryFn: () => apiFetch<Paginated<Notificacion>>("/notificaciones/", { query: { page_size: 10 } }),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useAuditoria(filters: { entidad_tipo?: string; page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: ["auditoria", filters],
    queryFn: () =>
      apiFetch<Paginated<Auditoria>>("/auditoria/", {
        query: {
          entidad_tipo: filters.entidad_tipo,
          page: filters.page ?? 1,
          page_size: filters.page_size ?? 50,
        },
      }),
    ...listOpts,
  });
}

export function useMarcarNotificacionLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<Notificacion>(`/notificaciones/${id}/marcar-leida/`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }),
  });
}

export function useExportarContai() {
  return useMutation({
    mutationFn: (body: ExportacionContaiRequest) =>
      apiFetch<FileGenerated>("/exportaciones/contai/", { method: "POST", body }),
  });
}

export function useServiciosTaller() {
  return useQuery({
    queryKey: ["servicios-taller"],
    queryFn: () => apiFetch<ServicioTaller[]>("/servicios-taller/"),
    retry: false,
  });
}

export function useCreateServicioTaller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ServicioTallerWrite) => apiFetch<ServicioTaller>("/servicios-taller/", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicios-taller"] }),
  });
}

export function useUpdateServicioTaller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ServicioTallerWrite> }) =>
      apiFetch<ServicioTaller>(`/servicios-taller/${id}/`, { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicios-taller"] }),
  });
}

export function usePortalEstado(params: { placa?: string; numero_orden?: string } | null) {
  return useQuery({
    queryKey: ["portal-estado", params],
    queryFn: () =>
      apiFetch<PortalEstado>("/portal/estado/", {
        auth: false,
        query: { placa: params?.placa, numero_orden: params?.numero_orden },
      }),
    enabled: !!params && !!(params.placa || params.numero_orden),
    retry: false,
  });
}

export function useSolicitarCitaPortal() {
  return useMutation({
    mutationFn: (body: PortalCitaRequest) =>
      apiFetch<PortalCitaResponse>("/portal/citas/", { method: "POST", body, auth: false }),
  });
}

export function usePortalCitaEstado(params: { placa?: string; celular?: string } | null) {
  return useQuery({
    queryKey: ["portal-cita-estado", params],
    queryFn: () =>
      apiFetch<PortalCitaEstado>("/portal/citas/estado/", {
        auth: false,
        query: { placa: params?.placa, celular: params?.celular },
      }),
    enabled: !!params && !!(params.placa || params.celular),
    retry: false,
  });
}

export function usePortalServicios() {
  return useQuery({
    queryKey: ["portal-servicios"],
    queryFn: () => apiFetch<ServicioTaller[]>("/portal/servicios/", { auth: false }),
    retry: false,
  });
}

export function useConfiguracionEmpresa() {
  return useQuery({
    queryKey: ["configuracion-empresa"],
    queryFn: () => apiFetch<ConfiguracionEmpresa>("/configuracion/empresa/"),
    retry: false,
  });
}

export function useUpdateConfiguracionEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConfiguracionEmpresaWrite) =>
      apiFetch<ConfiguracionEmpresa>("/configuracion/empresa/", { method: "PATCH", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configuracion-empresa"] }),
  });
}

export function useUpdateEmpresaActiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmpresaWrite) => apiFetch<Empresa>("/empresas/active/", { method: "PATCH", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracion-empresa"] });
    },
  });
}
