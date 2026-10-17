export interface PacienteResponse {
  id: string
  nombre: string
  documentoIdentidad: string | null
  fechaNacimiento: string | null
  sexo: 'F' | 'M' | null
  telefono: string | null
  email: string | null
  direccion: string | null
  alergias: string | null
  antecedentes: string | null
  tipoSangre: string | null
  medicamentosActuales: string | null
  activo: boolean
  creadoEn: string
}

export interface UsuarioResumen {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  atiendePacientes: boolean
}

/** Quien puede tener citas a su nombre: todo DOCTOR y el admin que tambien es medico. */
export function atiendePacientes(usuario: UsuarioResumen) {
  return usuario.rol === 'DOCTOR' || usuario.atiendePacientes
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
  recordatorioEnviado: boolean
  creadoEn: string
}

export interface DiagnosticoItem {
  codigo: string | null
  descripcion: string
}

export interface RecetaItem {
  medicamento: string
  dosis: string | null
  frecuencia: string | null
  duracion: string | null
  indicaciones: string | null
}

export interface SignosVitales {
  presionSistolica: number | null
  presionDiastolica: number | null
  frecuenciaCardiaca: number | null
  frecuenciaRespiratoria: number | null
  temperatura: number | null
  saturacionO2: number | null
  pesoKg: number | null
  tallaCm: number | null
  glucosaMgDl: number | null
}

export interface ConsultaResponse extends SignosVitales {
  id: string
  citaId: string
  citaFechaHora: string
  pacienteId: string
  pacienteNombre: string
  doctorId: string
  doctorNombre: string
  motivoConsulta: string | null
  notas: string | null
  examenFisico: string | null
  diagnosticos: DiagnosticoItem[]
  diagnostico: string | null
  recetaItems: RecetaItem[]
  /** recetas anteriores a la receta por lineas, en texto libre */
  receta: string | null
  indicaciones: string | null
  proximoControl: string | null
  codigoVerificacion: string
  creadoEn: string
  actualizadoEn: string | null
}

export interface PlantillaConsultaDatos {
  motivoConsulta: string | null
  notas: string | null
  examenFisico: string | null
  diagnosticos: DiagnosticoItem[]
  diagnostico: string | null
  recetaItems: RecetaItem[]
  indicaciones: string | null
}

export interface PlantillaConsulta {
  id: string
  nombre: string
  datos: PlantillaConsultaDatos
}

export interface PerfilProfesional {
  usuarioId: string
  nombre: string
  especialidad: string | null
  jvpm: string | null
  firmaImagen: string | null
}

export interface VerificacionReceta {
  codigo: string
  emitidaEn: string
  clinicaNombre: string
  doctorNombre: string
  doctorEspecialidad: string | null
  doctorJvpm: string | null
  pacienteIniciales: string
  medicamentos: RecetaItem[]
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
  limiteDoctores: number | null
}

export interface ServicioResponse {
  id: string
  nombre: string
  precio: number
  activo: boolean
}

export interface ClinicaResponse {
  id: string
  nombre: string
  nit: string
  nrc: string | null
  giro: string | null
  telefono: string | null
  direccion: string | null
  tipoPractica: string
  logoImagen: string | null
}

export interface FarmaciaResponse {
  id: string
  nombre: string
  url: string
  urlBusqueda: string | null
}
