// Tipos derivados directamente de las entities/DTOs de turismo-backend.
// Mantenerlos sincronizados si cambian los DTOs del backend.

export type RolAdmin = "SUPER_ADMIN" | "ADMIN";

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  rol: RolAdmin;
  rut?: string | null;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string | null;
  activo: boolean;
  createdAt?: string;
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
  // Precio referencial ("Desde $X") que carga el admin. Independiente
  // del precio de los paquetes asociados a este destino.
  precioDesde?: number;
  // Rango en que el destino está disponible como servicio. Obligatorio
  // al crear un destino nuevo; opcional acá porque destinos creados
  // antes de este cambio pueden no tenerlo cargado.
  fechaInicio?: string;
  fechaFin?: string;
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
  logoUrl: string | null;
  sloganColor: string;
  sloganFontFamily: string;
  sloganFontUrl: string | null;
  colorFondo: string | null;
  colorNavbar: string | null;
  colorFooter: string | null;
  titulo: string;
  subtitulo: string;
  presentacion: string;
  mision: string;
  vision: string;
  valores: string;
  resenas: ResenaHome[];
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  heroImagenUrl: string | null;
  heroImagenPosX: number;
  heroImagenPosY: number;
  heroImagenZoom: number;
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

export interface Noticia {
  id: number;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  activa: boolean;
  autorId?: number;
  autor?: AdminUser;
  createdAt: string;
  updatedAt: string;
}

export type TipoSlide = "destino" | "paquete" | "oferta" | "noticia";

// Slide del carrusel de portada (sección "Inicio" del cliente), ya
// resuelto contra el destino/paquete/oferta/noticia que referencia —
// ver SlidesService.resolver en el backend.
export interface HomeSlide {
  id: number;
  tipo: TipoSlide;
  referenciaId: number;
  orden: number;
  activo: boolean;
  titulo: string;
  descripcion: string;
  imagen: string | null;
  precio: number | null;
  precioAnterior: number | null;
  descuento: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  paqueteId: number | null;
  servicioVigente: boolean;
}

// Ítem elegible en el selector "Agregar al slide" del panel admin.
export interface OpcionSlide {
  id: number;
  titulo: string;
  imagen: string | null;
  activo: boolean;
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
  noticiaId?: number;
  noticia?: Noticia;
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
  gananciasTotales: number;
  gastosTotales: number;
  porcentajeImpuesto: number;
  impuestos: number;
  gananciaNeta: number;
}

export interface ConfiguracionFinanciera {
  id: number;
  porcentajeImpuesto: number;
  updatedAt: string;
}

export interface Proveedor {
  id: number;
  nombreNegocio: string;
  rubro?: string;
  nombreContacto: string;
  correo: string;
  telefono: string;
  direccion?: string;
  descripcion: string;
  leido: boolean;
  createdAt: string;
}

export type TipoMovimientoFinanciero =
  | "INGRESO_MANUAL"
  | "EGRESO_MANUAL"
  | "ROBO"
  | "ESTAFA"
  | "PERDIDA"
  | "AJUSTE";

export type CategoriaGasto =
  | "OPERACIONAL"
  | "SUELDOS"
  | "MARKETING"
  | "PROVEEDORES"
  | "MANTENIMIENTO"
  | "IMPUESTOS"
  | "OTRO";

export type MetodoPago =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "TARJETA"
  | "WEBPAY"
  | "OTRO";

export interface MovimientoFinanciero {
  id: number;
  tipo: TipoMovimientoFinanciero;
  monto: number;
  descripcion: string;
  categoria?: CategoriaGasto | null;
  usuarioId?: number;
  usuario?: { id: number; nombre?: string; email?: string };
  // "Quién pagó" — solo se completa para tipo INGRESO_MANUAL.
  clienteId?: number | null;
  cliente?: { id: number; nombre: string; email: string; rut?: string } | null;
  pagadorNombre?: string | null;
  metodoPago?: MetodoPago | null;
  createdAt: string;
}

export interface GastoPorCategoria {
  categoria: CategoriaGasto | "SIN_CATEGORIA";
  total: number;
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
