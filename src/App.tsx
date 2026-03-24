import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Demandes from './pages/Demandes'
import Planning from './pages/Planning'
import Devis from './pages/Devis'
import Factures from './pages/Factures'
import Clients from './pages/Clients'
import AssistantIA from './pages/AssistantIA'
import Parametres from './pages/Parametres'
import Stock from './pages/Stock'
import SaisieMateriaux from './pages/SaisieMateriaux'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/" />
              : <Login onLogin={() => setIsAuthenticated(true)} />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated
              ? <DashboardLayout onLogout={() => setIsAuthenticated(false)} />
              : <Navigate to="/login" />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="demandes" element={<Demandes />} />
          <Route path="planning" element={<Planning />} />
          <Route path="devis" element={<Devis />} />
          <Route path="factures" element={<Factures />} />
          <Route path="clients" element={<Clients />} />
          <Route path="stock" element={<Stock />} />
          <Route path="saisie-materiaux" element={<SaisieMateriaux />} />
          <Route path="assistant-ia" element={<AssistantIA />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}
