// Tipos derivados directamente de las entities/DTOs de turismo-backend.
// Mantenerlos sincronizados si cambian los DTOs del backend.

export type RolAdmin = "SUPER_ADMIN" | "ADMIN";

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  rol: RolAdmin;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  activo: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginAdminPayload {
  email: string;
  password: string;
}

export interface LoginClientePayload {
  email: string;
  password: string;
}

export interface RegistroClientePayload {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface ImagenGaleria {
  id: number;
  url: string;
  esPrincipal: boolean;
}

export interface Destino {
  id: number;
  nombre: string;
  descripcion: string;
  pais: string;
  ciudad: string;
  latitud?: number;
  longitud?: number;
  imagenPrincipal?: string;
  imagenes?: ImagenGaleria[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  categorias?: Categoria[];
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface Paquete {
  id: number;
  destinoId: number;
  destino?: Destino;
  nombre: string;
  descripcion: string;
  precio: number;
  // Presente solo cuando el admin bajó el precio: es el precio anterior,
  // para mostrarlo tachado junto al nuevo (rebaja tipo agencia comercial).
  precioAnterior?: number;
  cupos: number;
  fechaInicio: string;
  fechaFin: string;
  imagenPrincipal?: string;
  imagenes?: ImagenGaleria[];
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResenaHome {
  nombre: string;
  texto: string;
  valoracion?: number;
}

export interface ContenidoHome {
  id: number;
  nombreAgencia: string;
  titulo: string;
  subtitulo: string;
  presentacion: string;
  mision: string;
  vision: string;
  valores: string;
  resenas: ResenaHome[];
  updatedAt: string;
}


export interface Oferta {
  id: number;
  paqueteId: number;
  paquete?: Paquete;
  titulo: string;
  descripcion?: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  imagenPrincipal?: string;
  imagenes?: ImagenGaleria[];
  activa: boolean;
  createdAt: string;
}

export type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

export interface Reserva {
  id: number;
  paqueteId: number;
  paquete?: Paquete;
  clienteId?: number;
  cliente?: Cliente;
  nombreCliente: string;
  emailCliente?: string;
  telefono?: string;
  cantidadPersonas: number;
  montoTotal?: number;
  estado: EstadoReserva;
  fechaReserva: string;
}

export type EstadoCotizacion = "PENDIENTE" | "RESPONDIDA" | "CERRADA";

export interface Cotizacion {
  id: number;
  paqueteId?: number;
  paquete?: Paquete;
  destinoId?: number;
  destino?: Destino;
  clienteId?: number;
  nombre: string;
  email: string;
  telefono?: string;
  cantidadPersonas: number;
  mensaje?: string;
  estado: EstadoCotizacion;
  respuesta?: string;
  respondidoEn?: string;
  leida: boolean;
  createdAt: string;
}

export type EstadoConsultaEmail = "RESPONDIDA_IA" | "ESCALADA" | "ERROR";

export interface ConsultaEmailIA {
  id: number;
  remitente: string;
  asunto?: string;
  cuerpoOriginal: string;
  respuesta?: string;
  estado: EstadoConsultaEmail;
  detalle?: string;
  createdAt: string;
}

export interface AnalyticsDashboard {
  total_destinos: number;
  total_paquetes: number;
  total_ofertas: number;
  total_mensajes: number;
  total_reservas: number;
  total_visitas: number;
}

export interface TopItem {
  id: number;
  nombre: string;
  visitas: number;
}

export interface TendenciaMensual {
  mes: string;
  visitas: number;
}

export interface VentasMensuales {
  mes: string;
  reservas: number;
  ingresos: number;
}

export interface ResumenFinanciero {
  ingresosConfirmados: number;
  ingresosPendientes: number;
  ingresosCancelados: number;
  ticketPromedio: number;
  totalReservas: number;
  reservasConfirmadas: number;
  reservasPendientes: number;
  reservasCanceladas: number;
  personasConfirmadas: number;
  ingresosManuales: number;
  egresosManuales: number;
  perdidasManuales: number;
  balanceTotal: number;
}

export type TipoMovimientoFinanciero =
  | "INGRESO_MANUAL"
  | "EGRESO_MANUAL"
  | "ROBO"
  | "ESTAFA"
  | "PERDIDA"
  | "AJUSTE";

export interface MovimientoFinanciero {
  id: number;
  tipo: TipoMovimientoFinanciero;
  monto: number;
  descripcion: string;
  usuarioId?: number;
  usuario?: { id: number; nombre?: string; email?: string };
  createdAt: string;
}

export interface IngresoMensual {
  mes: string;
  confirmados: number;
  pendientes: number;
  cancelados: number;
}

export interface IngresoPorItem {
  id: number;
  nombre: string;
  ingresos: number;
  reservas: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
