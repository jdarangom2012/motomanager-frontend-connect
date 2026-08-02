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
