// Tipos derivados del contrato openapi.yaml (MotoManager API v1).

export type UUID = string;

export type Empresa = {
  id: UUID;
  nombre: string;
  nit?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo_url?: string | null;
  moneda: string;
  timezone: string;
};

export type UserMe = {
  id: UUID;
  email: string;
  full_name?: string;
  empresa: Empresa;
  roles: string[];
  permissions: string[];
};

export type AuthTokenResponse = { access: string; refresh: string; user: UserMe };

export type ClienteResumen = { id: UUID; documento: string; nombre: string; celular?: string | null };

export type Cliente = ClienteResumen & {
  tipo_documento?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  correo?: string | null;
  observaciones?: string | null;
  motocicletas_count?: number;
  ultima_visita?: string | null;
  is_active?: boolean;
};

export type ClienteWrite = {
  tipo_documento?: string | null;
  documento: string;
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  celular?: string | null;
  correo?: string | null;
  observaciones?: string | null;
};

export type MotocicletaResumen = { id: UUID; placa: string; marca: string; modelo: string };

export type Motocicleta = MotocicletaResumen & {
  cliente: ClienteResumen;
  anio?: number | null;
  cilindraje?: string | null;
  color?: string | null;
  vin?: string | null;
  motor?: string | null;
  kilometraje_actual?: number | null;
  is_active?: boolean;
};

export type MotocicletaWrite = {
  cliente_id: UUID;
  placa: string;
  marca: string;
  modelo: string;
  anio?: number | null;
  cilindraje?: string | null;
  color?: string | null;
  vin?: string | null;
  motor?: string | null;
  kilometraje_actual?: number | null;
  observaciones?: string | null;
};

export type ChecklistEstado = "ok" | "falla" | "no_aplica" | "no_revisado";
export type ChecklistItem = { item: string; estado: ChecklistEstado; observacion?: string | null };

export type Recepcion = {
  id: UUID;
  numero: string;
  cliente: ClienteResumen;
  motocicleta: MotocicletaResumen;
  fecha_recepcion: string;
  recibido_por?: string | null;
  kilometraje?: number | null;
  nivel_combustible?: string | null;
  motivo_ingreso: string;
  estado: string;
  checklist?: ChecklistItem[];
};

export type RecepcionWrite = {
  cliente_id: UUID;
  motocicleta_id: UUID;
  fecha_recepcion: string;
  recibido_por_id?: UUID;
  tecnico_sugerido_id?: UUID;
  kilometraje?: number | null;
  nivel_combustible?: string | null;
  motivo_ingreso: string;
  observaciones?: string | null;
  checklist?: ChecklistItem[];
};

export type Diagnostico = {
  id: UUID;
  descripcion_problema: string;
  recomendaciones?: string | null;
  tiempo_estimado_horas?: number | null;
  observaciones_tecnicas?: string | null;
  estado: string;
};

export type DiagnosticoWrite = {
  recepcion_id?: UUID;
  orden_id?: UUID;
  tecnico_id?: UUID;
  descripcion_problema: string;
  recomendaciones?: string | null;
  tiempo_estimado_horas?: number | null;
  observaciones_tecnicas?: string | null;
};

export type DocumentoDetalle = {
  id?: UUID;
  tipo: "mano_obra" | "repuesto";
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  iva_porcentaje?: number;
  total_linea?: number;
};

export type DocumentoDetalleWrite = {
  tipo: "mano_obra" | "repuesto";
  repuesto_id?: UUID;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  iva_porcentaje?: number;
};

export type Cotizacion = {
  id: UUID;
  numero: string;
  estado: string;
  cliente: ClienteResumen;
  motocicleta: MotocicletaResumen;
  subtotal: number;
  descuento_total: number;
  iva_total: number;
  total: number;
  vigencia_hasta?: string | null;
  detalles?: DocumentoDetalle[];
};

export type CotizacionWrite = {
  diagnostico_id?: UUID;
  cliente_id: UUID;
  motocicleta_id: UUID;
  vigencia_hasta?: string | null;
  observaciones?: string | null;
  detalles: DocumentoDetalleWrite[];
};

export const ORDEN_ESTADOS = [
  "recibida",
  "en_diagnostico",
  "esperando_aprobacion",
  "aprobada",
  "esperando_repuestos",
  "en_reparacion",
  "pruebas",
  "lista_para_entrega",
  "entregada",
  "cancelada",
] as const;

export type OrdenEstado = (typeof ORDEN_ESTADOS)[number];

export type Tecnico = {
  id: UUID;
  nombre_visible: string;
  rol_operativo: string;
  especialidad?: string | null;
  calificacion?: number | null;
  ordenes_activas?: number;
  is_assignable?: boolean;
  is_active?: boolean;
};

export type OrdenTrabajo = {
  id: UUID;
  numero: string;
  estado: OrdenEstado;
  cliente: ClienteResumen;
  motocicleta: MotocicletaResumen;
  tecnico?: Tecnico | null;
  fecha_estimada_entrega?: string | null;
  created_at?: string;
};

export type OrdenEstadoHistorial = {
  estado_anterior?: string | null;
  estado_nuevo: OrdenEstado;
  comentario?: string | null;
  changed_by?: string | null;
  changed_at: string;
};

export type OrdenActividad = { descripcion: string; tipo: string; cantidad?: number; estado?: string };

export type OrdenTrabajoDetalle = OrdenTrabajo & {
  timeline?: OrdenEstadoHistorial[];
  actividades?: OrdenActividad[];
  observaciones_cliente?: string | null;
};

export type Cita = {
  id: UUID;
  cliente: ClienteResumen;
  motocicleta: MotocicletaResumen;
  servicio?: { id: UUID; nombre: string } | null;
  tecnico?: Tecnico | null;
  origen: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones?: string | null;
};

export type DashboardReport = {
  ventas_mes?: number;
  motos_taller?: number;
  citas_hoy?: number;
  espacios_disponibles_hoy?: number;
  ticket_promedio?: number;
  ordenes_activas?: number;
  motos_en_diagnostico?: number;
  motos_en_reparacion?: number;
  listas_para_entrega?: number;
  clientes_nuevos?: number;
  stock_bajo?: number;
  proximas_citas?: Cita[];
};

/* ---------- Sprint 05: Tecnicos, Inventario, Proveedores, Compras ---------- */

export type TecnicoWrite = {
  usuario_id?: UUID;
  nombre_visible: string;
  rol_operativo: "tecnico" | "recepcionista" | "administrador";
  especialidad?: string | null;
  is_assignable?: boolean;
  is_active?: boolean;
};

export type ProveedorResumen = { id: UUID; nombre: string; nit: string } | null;

export type Proveedor = {
  id: UUID;
  nit: string;
  nombre: string;
  ciudad?: string | null;
  telefono?: string | null;
  correo?: string | null;
  contacto?: string | null;
  is_active?: boolean;
};

export type ProveedorWrite = {
  nit: string;
  nombre: string;
  direccion?: string | null;
  ciudad?: string | null;
  telefono?: string | null;
  correo?: string | null;
  contacto?: string | null;
};

export type Repuesto = {
  id: UUID;
  codigo_interno: string;
  referencia_fabricante?: string | null;
  codigo_barras?: string | null;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  proveedor?: ProveedorResumen;
  costo: number;
  precio: number;
  stock: number;
  stock_minimo: number;
  stock_bajo?: boolean;
};

export type RepuestoWrite = {
  proveedor_id?: UUID;
  codigo_interno: string;
  referencia_fabricante?: string | null;
  codigo_barras?: string | null;
  nombre: string;
  marca?: string | null;
  categoria?: string | null;
  costo: number;
  precio: number;
  iva_porcentaje?: number;
  stock?: number;
  stock_minimo?: number;
  ubicacion?: string | null;
};

export type RepuestoCompatibilidad = {
  id: UUID;
  marca_moto: string;
  modelo_moto: string;
  anio_desde?: number | null;
  anio_hasta?: number | null;
  cilindraje?: string | null;
  observaciones?: string | null;
};

export type CompraDetalle = {
  repuesto: Repuesto;
  cantidad: number;
  costo_unitario: number;
  total_linea: number;
};

export type Compra = {
  id: UUID;
  numero: string;
  proveedor?: ProveedorResumen;
  factura_proveedor?: string | null;
  fecha: string;
  estado: string;
  total: number;
  detalles?: CompraDetalle[];
};

export type CompraDetalleWrite = {
  repuesto_id: UUID;
  cantidad: number;
  costo_unitario: number;
  iva_porcentaje?: number;
};

export type CompraWrite = {
  proveedor_id: UUID;
  factura_proveedor?: string | null;
  fecha: string;
  detalles: CompraDetalleWrite[];
};

/* ---------- Sprint 05 (parte 2): Facturas, Pagos, Reportes, Contai, Portal, Config ---------- */

export type Adjunto = {
  id: UUID;
  entidad_tipo: string;
  entidad_id: UUID;
  tipo: string;
  nombre_original: string;
  file_url: string;
  visible_portal: boolean;
  created_at: string;
};

export type Factura = {
  id: UUID;
  numero: string;
  orden_id: UUID;
  orden_numero?: string;
  tipo?: string;
  estado: string;
  cliente?: ClienteResumen;
  motocicleta?: MotocicletaResumen;
  fecha: string;
  total: number;
  saldo: number;
  pdf_url?: string | null;
};

export type DocumentoDetalleWrite = {
  tipo: "mano_obra" | "repuesto";
  repuesto_id?: UUID;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  iva_porcentaje?: number;
};

export type FacturaWrite = {
  orden_id: UUID;
  observaciones?: string | null;
  detalles?: DocumentoDetalleWrite[] | null;
};

export type PagoMetodo = "efectivo" | "transferencia" | "nequi" | "daviplata" | "tarjeta" | "credito" | "otro";

export type Pago = {
  id: UUID;
  factura_id: UUID;
  fecha: string;
  metodo: string;
  valor: number;
  referencia?: string | null;
};

export type PagoWrite = {
  factura_id: UUID;
  metodo: PagoMetodo;
  valor: number;
  referencia?: string | null;
  observaciones?: string | null;
};

export type FileGenerated = { file_url: string; filename: string; mime_type: string };

export type ReportResult = {
  kpis?: Record<string, unknown>;
  rows?: Record<string, unknown>[];
};

export type ExportacionContaiRequest = {
  fecha_desde: string;
  fecha_hasta: string;
  formato: "xlsx" | "csv";
  tipo: "paquete_completo" | "ventas" | "compras" | "pagos" | "inventario";
};

export type PortalCitaRequest = {
  servicio_id: UUID;
  fecha_inicio: string;
  tecnico_id?: UUID;
  nombre_cliente: string;
  celular?: string | null;
  correo?: string | null;
  placa: string;
  motocicleta_descripcion?: string | null;
  observaciones?: string | null;
};

export type PortalCitaResponse = { id: UUID; estado: string; mensaje: string };

export type PortalEstado = {
  orden_numero: string;
  placa: string;
  motocicleta: string;
  estado_actual: string;
  fecha_estimada_entrega?: string | null;
  timeline?: { estado: string; descripcion: string; fecha: string }[];
  adjuntos_visibles?: Adjunto[];
};

export type ServicioTaller = {
  id: UUID;
  nombre: string;
  duracion_minutos?: number;
  precio_base?: number;
  is_active?: boolean;
};

export type ConfiguracionEmpresa = {
  impuesto_iva_default?: number;
  prefijo_recepcion?: string;
  prefijo_cotizacion?: string;
  prefijo_orden?: string;
  prefijo_factura?: string;
  soporte_texto?: string | null;
  smtp_configurado?: boolean;
};

export type ConfiguracionEmpresaWrite = {
  impuesto_iva_default?: number;
  prefijo_recepcion?: string;
  prefijo_cotizacion?: string;
  prefijo_orden?: string;
  prefijo_factura?: string;
  soporte_texto?: string | null;
};
