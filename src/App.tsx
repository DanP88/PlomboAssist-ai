import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Version du schéma localStorage — incrémenter pour forcer une remise à zéro propre
const STORAGE_VERSION = '2'

function migrateStorage() {
  if (localStorage.getItem('plombo_version') === STORAGE_VERSION) return
  // Purge des clés susceptibles d'avoir des dates UTC décalées
  ;['plombo_agenda', 'plombo_demo_reset', 'plombo_planning'].forEach(k => localStorage.removeItem(k))
  localStorage.setItem('plombo_version', STORAGE_VERSION)
}
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
import RapportIntervention from './pages/RapportIntervention'
import Statistiques from './pages/Statistiques'
import AttestationTVA from './pages/AttestationTVA'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => { migrateStorage() }, [])

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
          <Route path="rapport" element={<RapportIntervention />} />
          <Route path="statistiques" element={<Statistiques />} />
          <Route path="attestation-tva" element={<AttestationTVA />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}
