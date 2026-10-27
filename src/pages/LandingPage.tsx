import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import type { PlanResponse } from '@/types'
import { useAsistente } from '@/lib/asistente'
import { MarcaArchivo } from '@/components/app-sidebar'
import { AsistenteChat } from '@/components/landing/asistente-chat'
import { HojaPantalla, Notificacion, PantallaAvisos, Telefono } from '@/components/landing/pantallas'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowUp, Check, MessageCircle, Minus, X } from 'lucide-react'
import './LandingPage.css'

/*
 * Pagina de inicio publica. Contrato de diseno (seed 03e27317) en index.html.
 * Mundo: el archivo de expedientes del panel llevado a escala de portada.
 */

const DIA = [
  {
    hora: '6:30',
    periodo: 'a. m.',
    titulo: 'Su teléfono le resume el día',
    texto: 'Antes de salir de casa sabe cuántas citas tiene y con quién empieza.',
    visual: 'avisos',
  },
  {
    hora: '8:51',
    periodo: 'a. m.',
    titulo: 'Llega el paciente y usted se entera',
    texto: 'La recepción lo marca en sala de espera, su teléfono vibra y la hoja del día muestra cuánto lleva esperando.',
    visual: 'hoja-del-dia',
  },
  {
    hora: '9:00',
    periodo: 'a. m.',
    titulo: 'Consulta con el expediente al lado',
    texto: 'Alergias en rojo, la presión anterior para comparar, diagnóstico con CIE-10 y notas que puede dictar con la voz.',
    visual: 'consulta',
  },
  {
    hora: '9:20',
    periodo: 'a. m.',
    titulo: 'Receta con su firma y un código QR',
    texto: 'Con su logo, su J.V.P.M. y su firma. La farmacia escanea el código y confirma que es auténtica.',
    visual: 'receta',
  },
  {
    hora: '9:25',
    periodo: 'a. m.',
    titulo: 'Las indicaciones, por WhatsApp',
    texto: 'Con un toque el paciente recibe sus medicamentos y la fecha de su próximo control.',
    visual: 'whatsapp',
  },
  {
    hora: '6:00',
    periodo: 'p. m.',
    titulo: 'La evolución de cada paciente, a la vista',
    texto: 'Peso y presión en el tiempo, el historial completo y las facturas en el mismo expediente.',
    visual: 'evolucion',
  },
] as const

const EL_SALVADOR = [
  ['J.V.P.M. en cada documento', 'Recetas, constancias e incapacidades salen con su número de la Junta de Vigilancia y su firma.'],
  ['IVA del 13 %', 'Calculado sobre el subtotal en cada factura, desde su propio catálogo de servicios y tarifas.'],
  ['Facturación electrónica DTE', 'Incluida en Consultorio Pro, Clínica y Clínica Plus. La conexión con el proveedor autorizado por Hacienda está en su etapa final.'],
  ['DUI y NIT', 'En la ficha de cada paciente y en sus facturas, con el formato de aquí.'],
  ['Consultorio o clínica', 'Si atiende solo, el sistema se simplifica: sin selector de médicos y con "Mi asistente" para su recepción.'],
] as const

const SEGURIDAD = [
  ['Cada consultorio, aislado', 'La información de su consultorio está separada en la base de datos: nadie de otra clínica puede verla.'],
  ['Cada quien ve lo suyo', 'La recepción agenda y cobra; las notas clínicas y los diagnósticos los ve el médico.'],
  ['Privacidad en la receta', 'La verificación pública de una receta solo muestra las iniciales del paciente.'],
  ['Nada se pierde a medias', 'Si se va la luz a mitad de una consulta, lo escrito queda guardado como borrador en su equipo.'],
] as const

function precio(p: PlanResponse) {
  return Number(p.precioMensual).toFixed(0)
}

function VisualDia({ visual }: { visual: (typeof DIA)[number]['visual'] }) {
  if (visual === 'avisos') {
    return (
      <div className="gl-dia-telefono">
        <Telefono>
          <PantallaAvisos />
        </Telefono>
      </div>
    )
  }
  if (visual === 'whatsapp') {
    return (
      <div className="gl-dia-telefono">
        <Telefono>
          <div className="gl-whatsapp">
            <p className="gl-whatsapp-contacto">Consultorio Dra. Demo</p>
            <div className="gl-whatsapp-burbuja">
              <p>Hola Gabriela, estas son las indicaciones de su consulta con Dra. Andrea Demo:</p>
              <p className="mt-2 font-semibold">Medicamentos</p>
              <p>1. Levotiroxina 75 mcg tabletas — 1 tableta · cada 24 horas · uso continuo</p>
              <p>2. Vitamina D3 1,000 UI cápsulas — 1 cápsula · cada 24 horas · uso continuo</p>
              <p className="mt-2">
                <span className="font-semibold">Próximo control:</span> lunes, 11 de enero
              </p>
              <span className="gl-whatsapp-hora">9:25</span>
            </div>
          </div>
        </Telefono>
        <Notificacion className="gl-dia-notif" hora="9:25" titulo="Consultorio Dra. Demo" cuerpo="Hola Gabriela, estas son las indicaciones de su consulta…" />
      </div>
    )
  }
  const imagenes = {
    'hoja-del-dia': { src: '/landing/hoja-del-dia.png', alt: 'Hoja del día con un paciente en sala de espera' },
    consulta: { src: '/landing/consulta.png', alt: 'Consulta con signos vitales, valores anteriores y expediente al lado' },
    receta: { src: '/landing/receta.png', alt: 'Receta impresa con logo, J.V.P.M., firma y código QR' },
    evolucion: { src: '/landing/evolucion.png', alt: 'Gráficas de presión arterial y peso del paciente' },
  } as const
  const img = imagenes[visual]
  return (
    <div className={cn('gl-dia-hoja', visual === 'receta' && 'gl-dia-receta')}>
      <img src={img.src} alt={`${img.alt} (datos de demostración)`} loading="lazy" decoding="async" />
      {visual === 'receta' && (
        <div className="gl-dia-verificacion">
          <Telefono>
            <img src="/landing/verificacion.png" alt="La farmacia verifica la receta desde su teléfono" loading="lazy" />
          </Telefono>
        </div>
      )}
    </div>
  )
}

export function LandingPage() {
  const { sesion } = useAuth()
  const asistente = useAsistente()
  const [planes, setPlanes] = useState<PlanResponse[]>([])
  const [flotanteVisible, setFlotanteVisible] = useState(false)
  const [flotanteAbierto, setFlotanteAbierto] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const portada = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'GoRam Clinic · Sistema para consultorios y clínicas de El Salvador'
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then(setPlanes)
      .catch(() => setPlanes([]))
  }, [])

  // el asistente flotante aparece cuando el de la portada sale de vista
  useEffect(() => {
    const el = portada.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setFlotanteVisible(!e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  const desde = planes.length ? `$${precio(planes[0])}` : null

  function abrirConPregunta(texto: string) {
    setFlotanteAbierto(true)
    if (texto.trim()) asistente.preguntar(texto)
  }

  function enviarCierre(e: FormEvent) {
    e.preventDefault()
    abrirConPregunta(pregunta)
    setPregunta('')
  }

  return (
    <div className="gl">
      <a href="#contenido" className="gl-saltar">
        Saltar al contenido
      </a>

      {/* ---------- portada: la gaveta ---------- */}
      <div className="gl-gaveta">
        <header className="gl-nav gl-ancho">
          <Link to="/" className="gl-marca" aria-label="GoRam Clinic, inicio">
            <MarcaArchivo />
            <span>GoRam Clinic</span>
          </Link>
          <nav aria-label="Secciones" className="gl-nav-enlaces">
            <a href="#dia">Cómo funciona</a>
            <a href="#planes">Planes</a>
            <a href="#seguridad">Seguridad</a>
          </nav>
          <div className="gl-nav-acciones">
            <Link to="/login" className="gl-enlace-claro">
              Ingresar
            </Link>
            <Link to="/registro" className="gl-boton-claro">
              Crear cuenta
            </Link>
          </div>
        </header>

        <main id="contenido" className="gl-portada gl-ancho">
          <div className="gl-portada-cabeza">
            <h1>Su consultorio en orden, de la agenda a la receta.</h1>
            <div className="gl-portada-aside">
              <p className="gl-bajada">
                GoRam Clinic es el sistema para médicos y clínicas de El Salvador. Pregúntele al asistente lo que quiera: le responde a cualquier hora y le muestra el sistema funcionando.
              </p>
              <dl className="gl-hechos">
                <div>
                  <dt>Precio</dt>
                  <dd>{desde ? <>Desde {desde} al mes</> : 'Planes mensuales'}</dd>
                </div>
                <div>
                  <dt>Recetas</dt>
                  <dd>Con QR verificable</dd>
                </div>
                <div>
                  <dt>Funciona en</dt>
                  <dd>Computadora, tablet y teléfono</dd>
                </div>
              </dl>
            </div>
          </div>

          <div ref={portada} className="gl-escritorio">
            <div className="gl-escritorio-hoja">
              <HojaPantalla pantalla={asistente.pantalla} planes={planes} prioridad />
            </div>
            <div className="gl-escritorio-chat">
              <AsistenteChat asistente={asistente} />
            </div>
          </div>
        </main>
        <p className="gl-ancho gl-nota-demo">Pantallas reales del sistema con datos de demostración.</p>
      </div>

      {/* ---------- un dia de consultorio ---------- */}
      <section id="dia" className="gl-seccion gl-ancho" aria-labelledby="dia-titulo">
        <div className="gl-seccion-cabecera">
          <h2 id="dia-titulo">Un día con GoRam Clinic</h2>
          <p>Así se ve una jornada de consultorio, de la primera alarma a la última consulta. Pantallas reales del sistema con datos de demostración.</p>
        </div>
        <ol className="gl-dia">
          {DIA.map((d, i) => (
            <li key={d.hora + d.periodo} className={cn('gl-dia-fila', i % 2 === 1 && 'gl-dia-fila-par')}>
              <div className="gl-dia-hora">
                <time>
                  {d.hora}
                  <span>{d.periodo}</span>
                </time>
              </div>
              <div className="gl-dia-texto">
                <h3>{d.titulo}</h3>
                <p>{d.texto}</p>
              </div>
              <div className="gl-dia-visual">
                <VisualDia visual={d.visual} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- hecho para El Salvador ---------- */}
      <section className="gl-carton" aria-labelledby="sv-titulo">
        <div className="gl-seccion gl-ancho gl-libro">
          <div className="gl-seccion-cabecera">
            <h2 id="sv-titulo">Hecho para la consulta en El Salvador</h2>
            <p>Los detalles de aquí, resueltos desde el primer día.</p>
          </div>
          <dl className="gl-renglones">
            {EL_SALVADOR.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- planes: el tarifario ---------- */}
      <section id="planes" className="gl-seccion gl-ancho" aria-labelledby="planes-titulo">
        <div className="gl-seccion-cabecera">
          <h2 id="planes-titulo">Planes</h2>
          <p>Un precio mensual por consultorio o clínica. Pacientes sin límite en todos los planes.</p>
        </div>
        {planes.length === 0 ? (
          <p className="gl-cargando">Cargando planes…</p>
        ) : (
          <div className="gl-tarifario" role="list">
            {planes.map((p) => (
              <article key={p.id} role="listitem" className={cn('gl-plan', p.codigo === 'CONSULTORIO_PRO' && 'gl-plan-destacado')}>
                <header>
                  <h3>{p.nombre}</h3>
                  {p.codigo === 'CONSULTORIO_PRO' && <span className="gl-plan-marca">Recomendado para consultorio</span>}
                </header>
                <p className="gl-plan-precio">
                  <span className="gl-plan-moneda">$</span>
                  {precio(p)}
                  <span className="gl-plan-periodo">al mes</span>
                </p>
                <ul>
                  <li>
                    <Check aria-hidden="true" />
                    {p.limiteDoctores === null ? 'Médicos sin límite' : p.limiteDoctores === 1 ? '1 médico' : `Hasta ${p.limiteDoctores} médicos`}
                  </li>
                  <li>
                    <Check aria-hidden="true" />
                    {p.limiteUsuarios === null ? 'Usuarios sin límite' : `${p.limiteUsuarios} usuarios en total`}
                  </li>
                  <li className={cn(!p.incluyeFacturacionElectronica && 'gl-plan-no')}>
                    {p.incluyeFacturacionElectronica ? <Check aria-hidden="true" /> : <Minus aria-hidden="true" />}
                    {p.incluyeFacturacionElectronica ? 'Facturación electrónica DTE' : 'Factura interna, sin DTE'}
                  </li>
                  <li>
                    <Check aria-hidden="true" />
                    Agenda, expedientes, recetas y avisos
                  </li>
                </ul>
                <Link to="/registro" className={p.codigo === 'CONSULTORIO_PRO' ? 'gl-boton' : 'gl-boton-linea'}>
                  Crear cuenta
                </Link>
              </article>
            ))}
          </div>
        )}
        <button type="button" className="gl-preguntar-plan" onClick={() => abrirConPregunta('¿Cuál plan me conviene?')}>
          <MessageCircle className="size-4" />
          ¿No sabe cuál le conviene? Pregúntele al asistente
          <ArrowRight className="size-4" />
        </button>
      </section>

      {/* ---------- seguridad ---------- */}
      <section id="seguridad" className="gl-carton" aria-labelledby="seg-titulo">
        <div className="gl-seccion gl-ancho gl-libro">
          <div className="gl-seccion-cabecera">
            <h2 id="seg-titulo">Su información y la de sus pacientes, protegida</h2>
            <p>Datos de salud tratados como lo que son.</p>
          </div>
          <dl className="gl-renglones">
            {SEGURIDAD.map(([t, d]) => (
              <div key={t}>
                <dt>{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- cierre ---------- */}
      <section className="gl-cierre" aria-labelledby="cierre-titulo">
        <div className="gl-ancho gl-cierre-interior">
          <h2 id="cierre-titulo">¿Le quedó alguna duda?</h2>
          <p>El asistente le responde ahora mismo, a cualquier hora del día.</p>
          <form onSubmit={enviarCierre} className="gl-cierre-campo">
            <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} maxLength={500} placeholder="Escriba su pregunta…" aria-label="Su pregunta para el asistente" />
            <button type="submit" aria-label="Preguntar al asistente">
              <ArrowUp className="size-4" />
            </button>
          </form>
          <div className="gl-cierre-acciones">
            <Link to="/registro" className="gl-boton-claro">
              Crear cuenta
            </Link>
            <Link to="/login" className="gl-enlace-claro">
              Ya tengo cuenta · Ingresar
            </Link>
          </div>
        </div>
      </section>

      <footer className="gl-pie gl-ancho">
        <span className="gl-marca gl-marca-pie">
          <MarcaArchivo />
          <span>GoRam Clinic</span>
        </span>
        <span>Un producto de GoRam · El Salvador · {new Date().getFullYear()}</span>
        <nav aria-label="Enlaces del pie" className="gl-pie-enlaces">
          <Link to="/verificar">Verificar una receta</Link>
          <Link to="/login">Ingresar</Link>
        </nav>
      </footer>

      {/* ---------- el mismo asistente, siempre a mano ---------- */}
      {(flotanteVisible || flotanteAbierto) && (
        <div className={cn('gl-flotante', flotanteAbierto && 'gl-flotante-abierto')}>
          {flotanteAbierto ? (
            <div className="gl-flotante-panel" role="dialog" aria-label="Asistente de GoRam Clinic">
              <button type="button" className="gl-flotante-cerrar" onClick={() => setFlotanteAbierto(false)} aria-label="Cerrar asistente">
                <X className="size-4" />
              </button>
              <AsistenteChat asistente={asistente} variante="flotante" autoFoco />
            </div>
          ) : (
            <button type="button" className="gl-flotante-boton" onClick={() => setFlotanteAbierto(true)}>
              <img src="/iconos/icono-192.png" alt="" width={28} height={28} />
              Pregúntele al asistente
            </button>
          )}
        </div>
      )}
    </div>
  )
}
