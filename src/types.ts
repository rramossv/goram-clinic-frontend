export interface PacienteResponse {
  id: string
  nombre: string
  documentoIdentidad: string | null
  fechaNacimiento: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  alergias: string | null
  antecedentes: string | null
  activo: boolean
  creadoEn: string
}

export interface UsuarioResumen {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
}

export interface CitaResponse {
  id: string
  pacienteId: string
  pacienteNombre: string
  doctorId: string
  doctorNombre: string
  fechaHora: string
  duracionMinutos: number
  estado: string
  motivo: string | null
  creadoEn: string
}

export interface ConsultaResponse {
  id: string
  citaId: string
  pacienteId: string
  pacienteNombre: string
  doctorId: string
  doctorNombre: string
  notas: string | null
  diagnostico: string | null
  receta: string | null
  creadoEn: string
}

export interface FacturaItemResponse {
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface FacturaResponse {
  id: string
  pacienteId: string
  pacienteNombre: string
  tipoDte: 'SIMPLE' | 'FE'
  subtotal: number
  iva: number
  total: number
  estado: string
  items: FacturaItemResponse[]
  creadoEn: string
}

export interface DocumentoDteResponse {
  id: string
  facturaId: string
  codigoGeneracion: string
  numeroControl: string
  selloRecepcion: string | null
  estado: string
  ambiente: string
  creadoEn: string
}

export interface NotaCreditoResponse {
  id: string
  facturaId: string
  motivo: string
  monto: number
  creadoEn: string
}

export interface SuscripcionResponse {
  id: string
  planCodigo: string
  planNombre: string
  estado: string
  fechaInicio: string
  proximaFechaCobro: string
}

export interface PagoResponse {
  id: string
  monto: number
  metodo: string
  estado: string
  referenciaPasarela: string | null
  creadoEn: string
}

export interface PlanResponse {
  id: string
  codigo: string
  nombre: string
  precioMensual: number
  incluyeFacturacionElectronica: boolean
  limiteUsuarios: number | null
  limitePacientes: number | null
}
