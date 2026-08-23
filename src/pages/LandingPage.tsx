import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { apiFetch } from '@/lib/api'
import type { PlanResponse } from '@/types'
import './LandingPage.css'

const DESCRIPCIONES_PLAN: Record<string, string> = {
  BASICO: 'Para consultorios que arrancan: pacientes, agenda y consultas en un solo lugar.',
  PROFESIONAL: 'Todo lo del plan Basico, mas facturacion electronica DTE y reportes financieros.',
  CLINICA: 'Para clinicas con varios doctores: usuarios ilimitados y soporte prioritario.',
}

const CARACTERISTICAS_PLAN: Record<string, string[]> = {
  BASICO: ['Hasta 3 usuarios', 'Hasta 500 pacientes', 'Agenda y consultas', 'Factura interna'],
  PROFESIONAL: ['Hasta 8 usuarios', 'Hasta 2,000 pacientes', 'Facturacion electronica DTE', 'Reportes financieros'],
  CLINICA: ['Usuarios ilimitados', 'Pacientes ilimitados', 'Facturacion electronica DTE', 'Soporte prioritario'],
}

export function LandingPage() {
  const { sesion } = useAuth()
  const [planes, setPlanes] = useState<PlanResponse[]>([])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  useEffect(() => {
    apiFetch<PlanResponse[]>('/api/v1/planes', { auth: false })
      .then(setPlanes)
      .catch(() => setPlanes([]))
  }, [])

  if (sesion) {
    return <Navigate to="/panel" replace />
  }

  return (
    <div className="gr-landing">
      <header className="wrap nav">
        <div className="brand">
          <span className="mark">
            <i></i>
          </span>
          GoRam Clinic
        </div>
        <nav className="links">
          <a href="#sistema">Sistema</a>
          <a href="#experiencia">Experiencia</a>
          <a href="#planes">Planes</a>
          <Link to="/login">Iniciar sesion</Link>
        </nav>
        <Link to="/registro" className="navCta">
          Comenzar
        </Link>
      </header>

      <section className="hero wrap heroGrid">
        <div>
          <p className="eyebrow">Plataforma para clinicas en El Salvador</p>
          <h1>
            La clinica <em>organizada</em> que tus pacientes notan.
          </h1>
          <p className="lead">
            Pacientes, agenda, consultas y facturacion electronica en un solo sistema.
            Reemplaza el cuaderno y las hojas de Excel por un panel que tu equipo
            realmente disfruta usar.
          </p>
          <div className="actions">
            <Link to="/registro" className="btn primary">
              Comenzar prueba gratis
            </Link>
            <a href="#planes" className="btn secondary">
              Ver planes
            </a>
          </div>
          <p className="note">7 dias gratis · sin tarjeta requerida</p>
        </div>

        <div className="heroVisual">
          <div
            className="heroImg"
            style={{ backgroundImage: "url('/images/landing/hero-doctor-tel.jpg')" }}
          ></div>
          <div className="productCard">
            <div className="topbar">
              <i></i>
              <i></i>
              <i></i>
              <span>GoRam Clinic — Panel</span>
            </div>
            <div className="dashboard">
              <div className="side">
                <b></b>
                <b></b>
                <b></b>
                <b></b>
                <b></b>
              </div>
              <div className="content">
                <div className="contentHead">
                  Agenda de hoy
                  <span className="badge">En vivo</span>
                </div>
                <div className="metrics">
                  <div className="metric">
                    <small>PACIENTES</small>
                    <strong>842</strong>
                  </div>
                  <div className="metric">
                    <small>CITAS HOY</small>
                    <strong>17</strong>
                  </div>
                  <div className="metric">
                    <small>INGRESOS</small>
                    <strong>$3,120</strong>
                  </div>
                </div>
                <div className="graph"></div>
              </div>
            </div>
          </div>
          <div className="float f1">
            <small>Proxima cita</small>
            <b>10:30 AM — Maria L.</b>
          </div>
          <div className="float f2">
            <small>Ingresos del mes</small>
            <b>$4,890</b>
            <div className="green">▲ 18% vs. mes anterior</div>
          </div>
        </div>
      </section>

      <div className="trust wrap trustIn">
        <p>Confiado por clinicas y consultorios independientes</p>
        <div className="trustLogos">
          <span>+50 clinicas</span>
          <span>+12,000 citas gestionadas</span>
          <span>IVA calculado automaticamente</span>
          <span>99.9% disponibilidad</span>
        </div>
      </div>

      <section id="sistema" className="section wrap">
        <div className="intro">
          <div>
            <p className="kicker">El sistema</p>
            <h2>Todo lo que tu clinica necesita para operar, sin hojas sueltas.</h2>
          </div>
          <p className="desc">
            Seis modulos conectados entre si — lo que registra tu recepcionista
            lo ve el doctor, y lo que cierra el doctor llega directo a facturacion.
          </p>
        </div>
        <div className="modules">
          <div className="module">
            <span className="num">01</span>
            <div className="icon">Pa</div>
            <h3>Pacientes</h3>
            <p>Expediente digital con historial, contacto y antecedentes de cada paciente.</p>
          </div>
          <div className="module">
            <span className="num">02</span>
            <div className="icon">Ag</div>
            <h3>Agenda</h3>
            <p>Calendario por doctor con disponibilidad real y recordatorios automaticos.</p>
          </div>
          <div className="module">
            <span className="num">03</span>
            <div className="icon">Co</div>
            <h3>Consultas</h3>
            <p>Notas clinicas, diagnostico y receta, ligados a la cita correspondiente.</p>
          </div>
          <div className="module">
            <span className="num">04</span>
            <div className="icon">Fa</div>
            <h3>Facturacion electronica</h3>
            <p>Documentos tributarios (DTE) transmitidos al Ministerio de Hacienda.</p>
          </div>
          <div className="module">
            <span className="num">05</span>
            <div className="icon">Re</div>
            <h3>Reportes</h3>
            <p>Ingresos, citas atendidas y pacientes nuevos, siempre al dia.</p>
          </div>
          <div className="module">
            <span className="num">06</span>
            <div className="icon">Pe</div>
            <h3>Personal</h3>
            <p>Roles y permisos para doctores, recepcionistas y administradores.</p>
          </div>
        </div>
      </section>

      <section className="photoBand wrap">
        <div className="photoGrid">
          <div className="photoTile large">
            <img src="/images/landing/doctora-parque.jpg" alt="Doctora sonriendo" />
            <div className="caption">
              <small>Hecho para tu equipo</small>
              <b>Menos administracion, mas pacientes.</b>
            </div>
          </div>
          <div className="sidePhotos">
            <div className="photoTile small">
              <img src="/images/landing/estetoscopio.jpg" alt="Estetoscopio" />
            </div>
            <div className="photoTile small">
              <img src="/images/landing/pasillo-equipo.jpg" alt="Equipo medico caminando" />
            </div>
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="wrap intro">
          <div>
            <p className="kicker">Resultados</p>
            <h2>Clinicas que dejaron el cuaderno atras.</h2>
          </div>
          <p className="desc">Numeros reales de clinicas que operan hoy con GoRam Clinic.</p>
        </div>
        <div className="wrap stats">
          <div className="stat">
            <strong>+50</strong>
            <span>Clinicas activas</span>
          </div>
          <div className="stat">
            <strong>12k</strong>
            <span>Citas gestionadas</span>
          </div>
          <div className="stat">
            <strong>6 hrs</strong>
            <span>Ahorradas por semana</span>
          </div>
          <div className="stat">
            <strong>99.9%</strong>
            <span>Disponibilidad</span>
          </div>
        </div>
      </section>

      <section id="experiencia" className="section wrap workflow">
        <div>
          <p className="kicker">La experiencia</p>
          <h2>De la cita a la factura, sin salir del sistema.</h2>
          <p className="desc">
            Cada paso queda conectado: la recepcionista agenda, el doctor atiende
            y factura, y el reporte se actualiza solo.
          </p>
          <div className="steps">
            <div className="step">
              <span className="stepN">1</span>
              <div>
                <b>Se agenda la cita</b>
                <p>La recepcionista busca disponibilidad real del doctor y confirma en segundos.</p>
              </div>
            </div>
            <div className="step">
              <span className="stepN">2</span>
              <div>
                <b>El doctor atiende</b>
                <p>Registra diagnostico, receta y notas directo desde la cita del calendario.</p>
              </div>
            </div>
            <div className="step">
              <span className="stepN">3</span>
              <div>
                <b>Se factura al instante</b>
                <p>El documento tributario electronico se genera y transmite a Hacienda.</p>
              </div>
            </div>
            <div className="step">
              <span className="stepN">4</span>
              <div>
                <b>El reporte se actualiza</b>
                <p>Ingresos y pacientes nuevos quedan reflejados sin trabajo manual.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="screen">
          <div className="screenInner">
            <div className="screenHead">
              Agenda — hoy
              <span>4 citas</span>
            </div>
            <div className="rows">
              <div className="row">
                <div className="avatar"></div>
                <div className="line"></div>
                <div className="line line2"></div>
                <span className="state">Confirmada</span>
              </div>
              <div className="row">
                <div className="avatar"></div>
                <div className="line"></div>
                <div className="line line2"></div>
                <span className="state">En consulta</span>
              </div>
              <div className="row">
                <div className="avatar"></div>
                <div className="line"></div>
                <div className="line line2"></div>
                <span className="state">Confirmada</span>
              </div>
              <div className="row">
                <div className="avatar"></div>
                <div className="line"></div>
                <div className="line line2"></div>
                <span className="state">Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="section pricing">
        <div className="wrap intro">
          <div>
            <p className="kicker">Planes</p>
            <h2>Un plan para cada tamano de clinica.</h2>
          </div>
          <p className="desc">Cambia de plan cuando quieras. Sin permanencia forzada.</p>
        </div>
        <div className="wrap plans">
          {planes.map((plan) => (
            <div key={plan.id} className={plan.codigo === 'PROFESIONAL' ? 'plan featured' : 'plan'}>
              {plan.codigo === 'PROFESIONAL' && <span className="tag">Mas popular</span>}
              <p className="planName">{plan.nombre}</p>
              <p className="price">
                ${plan.precioMensual.toFixed(0)}
                <small> /mes</small>
              </p>
              <p className="desc" style={{ marginBottom: 20 }}>
                {DESCRIPCIONES_PLAN[plan.codigo] ?? ''}
              </p>
              <div className="features">
                {(CARACTERISTICAS_PLAN[plan.codigo] ?? []).map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
              <Link
                to={`/registro?plan=${plan.codigo}`}
                className="btn primary"
                style={{ marginTop: 24 }}
              >
                Elegir {plan.nombre}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="final wrap">
        <div className="finalBox">
          <div>
            <p className="kicker">Empieza hoy</p>
            <h2>Tu clinica, organizada desde la primera semana.</h2>
            <p>
              Crea tu cuenta y empieza a usar GoRam Clinic hoy mismo. 7 dias gratis,
              sin tarjeta requerida.
            </p>
          </div>
          <Link to="/registro" className="btn primary">
            Crear mi cuenta
          </Link>
        </div>
      </section>

      <footer>
        <div className="wrap foot">
          <span>GoRam Clinic — un producto de la marca GoRam</span>
          <span>© {new Date().getFullYear()} GoRam. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
