import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegistroPage } from '@/pages/RegistroPage'
import { OlvidePasswordPage } from '@/pages/OlvidePasswordPage'
import { RestablecerPasswordPage } from '@/pages/RestablecerPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PacientesPage } from '@/pages/PacientesPage'
import { PacienteDetailPage } from '@/pages/PacienteDetailPage'
import { AgendaPage } from '@/pages/AgendaPage'
import { ConsultasPage } from '@/pages/ConsultasPage'
import { FacturasPage } from '@/pages/FacturasPage'
import { ReportesPage } from '@/pages/ReportesPage'
import { PersonalPage } from '@/pages/PersonalPage'
import { SuscripcionPage } from '@/pages/SuscripcionPage'
import { PerfilPage } from '@/pages/PerfilPage'
import { ProtectedRoute } from '@/lib/protected-route'
import { AppLayout } from '@/components/app-layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/:id" element={<PacienteDetailPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/personal" element={<PersonalPage />} />
          <Route path="/suscripcion" element={<SuscripcionPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
