import { Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProximamentePage } from '@/pages/ProximamentePage'
import { ProtectedRoute } from '@/lib/protected-route'
import { AppLayout } from '@/components/app-layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pacientes" element={<ProximamentePage titulo="Pacientes" />} />
          <Route path="/agenda" element={<ProximamentePage titulo="Agenda" />} />
          <Route path="/consultas" element={<ProximamentePage titulo="Consultas" />} />
          <Route path="/facturas" element={<ProximamentePage titulo="Facturacion" />} />
          <Route path="/personal" element={<ProximamentePage titulo="Personal" />} />
          <Route path="/suscripcion" element={<ProximamentePage titulo="Suscripcion" />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
