import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import type { CitaResponse, FacturaResponse, PacienteResponse } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraficaBarras, GraficaEstados } from '@/components/reportes/graficas'
import { toast } from 'sonner'

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function ultimosNMeses(n: number) {
  const ahora = new Date()
  const meses: { anio: number; mes: number; etiqueta: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    meses.push({ anio: fecha.getFullYear(), mes: fecha.getMonth(), etiqueta: MESES_CORTOS[fecha.getMonth()] })
  }
  return meses
}

export function ReportesPage() {
  const [citas, setCitas] = useState<CitaResponse[]>([])
  const [facturas, setFacturas] = useState<FacturaResponse[]>([])
  const [pacientes, setPacientes] = useState<PacienteResponse[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<CitaResponse[]>('/api/v1/citas'),
      apiFetch<FacturaResponse[]>('/api/v1/facturas'),
      apiFetch<PacienteResponse[]>('/api/v1/pacientes'),
    ])
      .then(([citasData, facturasData, pacientesData]) => {
        setCitas(citasData)
        setFacturas(facturasData)
        setPacientes(pacientesData)
      })
      .catch(() => toast.error('No se pudieron cargar los reportes'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  const meses = ultimosNMeses(6)

  const ingresosPorMes = meses.map(({ anio, mes, etiqueta }) => ({
    etiqueta,
    valor: facturas
      .filter((f) => {
        const fecha = new Date(f.creadoEn)
        return f.estado === 'EMITIDA' && fecha.getFullYear() === anio && fecha.getMonth() === mes
      })
      .reduce((suma, f) => suma + f.total, 0),
  }))

  const pacientesPorMes = meses.map(({ anio, mes, etiqueta }) => ({
    etiqueta,
    valor: pacientes.filter((p) => {
      const fecha = new Date(p.creadoEn)
      return fecha.getFullYear() === anio && fecha.getMonth() === mes
    }).length,
  }))

  const citasCompletadasPorMes = meses.map(({ anio, mes, etiqueta }) => ({
    etiqueta,
    valor: citas.filter((c) => {
      const fecha = new Date(c.fechaHora)
      return c.estado === 'COMPLETADA' && fecha.getFullYear() === anio && fecha.getMonth() === mes
    }).length,
  }))

  const conteoEstados = citas.reduce<Record<string, number>>((acumulado, cita) => {
    acumulado[cita.estado] = (acumulado[cita.estado] ?? 0) + 1
    return acumulado
  }, {})

  const totalIngresos6Meses = ingresosPorMes.reduce((suma, dato) => suma + dato.valor, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">Ultimos 6 meses</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos por mes</CardTitle>
            <CardDescription>
              Total ${totalIngresos6Meses.toLocaleString('es-SV', { minimumFractionDigits: 2 })} en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraficaBarras datos={ingresosPorMes} formatoValor={(v) => (v > 0 ? `$${v.toFixed(0)}` : '')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pacientes nuevos por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficaBarras datos={pacientesPorMes} formatoValor={(v) => (v > 0 ? String(v) : '')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citas completadas por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficaBarras datos={citasCompletadasPorMes} formatoValor={(v) => (v > 0 ? String(v) : '')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citas por estado</CardTitle>
            <CardDescription>Todas las citas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficaEstados conteos={conteoEstados} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
