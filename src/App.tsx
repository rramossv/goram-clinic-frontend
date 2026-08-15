import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PacientesPage } from '@/pages/PacientesPage'
import { PacienteDetailPage } from '@/pages/PacienteDetailPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { ConsultasPage } from '@/pages/ConsultasPage'
import { FacturasPage } from '@/pages/FacturasPage'
import { PersonalPage } from '@/pages/PersonalPage'
import { SuscripcionPage } from '@/pages/SuscripcionPage'
import { ProtectedRoute } from '@/lib/protected-route'
import { AppLayout } from '@/components/app-layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/:id" element={<PacienteDetailPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/personal" element={<PersonalPage />} />
          <Route path="/suscripcion" element={<SuscripcionPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
