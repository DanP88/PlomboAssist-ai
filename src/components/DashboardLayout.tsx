import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import AppSidebar from './AppSidebar'
import {
  Bell, LogOut, User, Settings, ChevronDown, Menu, Search,
  LayoutDashboard, Calendar, PhoneCall, FileText, MoreHorizontal
} from 'lucide-react'

const notifList = [
  { title: '2 demandes urgentes', sub: 'M. Bernard · Mme Simon', time: 'Il y a 12 min', color: '#dc2626' },
  { title: 'Devis DEV-0046 vu', sub: 'M. Laurent a consulté le devis', time: 'Il y a 1h', color: '#d97706' },
  { title: 'Facture en retard', sub: 'FAC-0015 — M. Dupont Henri', time: 'Il y a 2h', color: '#f97316' },
  { title: 'Rapport hebdomadaire', sub: 'CA : 8 420 € · 42 appels traités', time: 'Lundi 8h00', color: '#3b82f6' },
]

const BOTTOM_TABS = [
  { path: '/',          icon: LayoutDashboard, label: 'Accueil',   end: true },
  { path: '/planning',  icon: Calendar,        label: 'Planning'              },
  { path: '/demandes',  icon: PhoneCall,       label: 'Demandes',  badge: '4' },
  { path: '/devis',     icon: FileText,        label: 'Devis'                 },
  { path: null,         icon: MoreHorizontal,  label: 'Plus'                  },
]

export default function DashboardLayout({ onLogout }: { onLogout?: () => void }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [searchVal, setSearchVal]     = useState('')

  function handleLogout() {
    setMenuOpen(false)
    if (onLogout) onLogout()
    navigate('/login')
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !searchVal.trim()) return
    const q = searchVal.toLowerCase()
    if (q.includes('client'))                          navigate('/clients')
    else if (q.includes('devis'))                      navigate('/devis')
    else if (q.includes('facture'))                    navigate('/factures')
    else if (q.includes('planning') || q.includes('intervention')) navigate('/planning')
    else if (q.includes('demande'))                    navigate('/demandes')
    else if (q.includes('stock'))                      navigate('/stock')
    else if (q.includes('stat'))                       navigate('/statistiques')
    setSearchVal('')
  }

  function isTabActive(tab: typeof BOTTOM_TABS[0]) {
    if (tab.path === null) return false
    if (tab.end) return location.pathname === tab.path
    return location.pathname.startsWith(tab.path)
  }

  // Page title for mobile header
  const PAGE_TITLES: Record<string, string> = {
    '/': 'Tableau de bord',
    '/planning': 'Planning',
    '/demandes': 'Demandes',
    '/devis': 'Devis',
    '/factures': 'Factures',
    '/clients': 'Clients',
    '/stock': 'Stock',
    '/saisie-materiaux': 'Saisie matériaux',
    '/assistant-ia': 'Assistant IA',
    '/parametres': 'Paramètres',
    '/rapport': 'Rapport chantier',
    '/statistiques': 'Statistiques',
    '/attestation-tva': 'Attestation TVA',
  }
  const pageTitle = PAGE_TITLES[location.pathname] || 'PlomboAssist'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar backdrop (mobile) */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        style={{ position: 'relative', flexShrink: 0, zIndex: 200 }}
        className={`sidebar-wrapper${sidebarOpen ? ' sidebar-open' : ''}`}
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 56,
          background: 'white',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Hamburger — visible on mobile */}
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={21} color="#374151" />
            </button>

            {/* Logo — shown on mobile when search is hidden */}
            <div className="mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>P</span>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', fontFamily: 'Plus Jakarta Sans' }}>
                {pageTitle}
              </span>
            </div>

            {/* Search — hidden on mobile */}
            <div
              className="search-bar"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f8f9fb', borderRadius: 9, padding: '7px 13px',
                flex: 1, maxWidth: 300, border: '1px solid #f0f0f0'
              }}
            >
              <Search size={14} color="#9ca3af" />
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Rechercher un client, devis..."
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13.5, color: '#374151', width: '100%', minWidth: 0
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <div style={{ cursor: 'pointer', padding: 6, minWidth: 36, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false) }}>
                <Bell size={19} color={notifOpen ? '#f97316' : '#6b7280'} />
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, background: '#f97316',
                  borderRadius: '50%', border: '1.5px solid white'
                }} />
              </div>
              {notifOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setNotifOpen(false)} />
                  <div className="notif-panel" style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: -8,
                    background: 'white', borderRadius: 14, width: 320,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #f0f0f0',
                    zIndex: 99, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Notifications</span>
                      <span style={{ fontSize: 11.5, color: '#f97316', fontWeight: 600, cursor: 'pointer' }} onClick={() => setNotifOpen(false)}>Tout marquer lu</span>
                    </div>
                    {notifList.map((n, i) => (
                      <div key={i} onClick={() => setNotifOpen(false)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{n.sub}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                      <span style={{ fontSize: 12.5, color: '#f97316', fontWeight: 600, cursor: 'pointer' }} onClick={() => { navigate('/parametres'); setNotifOpen(false) }}>Gérer les notifications →</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Avatar + dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 9,
                  transition: 'background 0.2s', minHeight: 36
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <div style={{
                  width: 33, height: 33, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>ML</div>
                <div style={{ textAlign: 'left' }} className="avatar-text">
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.25 }}>Marc Lefebvre</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.25 }}>Plan Pro</div>
                </div>
                <ChevronDown
                  size={13} color="#9ca3af"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                  className="avatar-chevron"
                />
              </button>

              {menuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', borderRadius: 13, width: 210,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f0f0f0',
                    zIndex: 99, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '13px 15px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Marc Lefebvre</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>marc@plomberie-lefebvre.fr</div>
                    </div>
                    {[
                      { icon: User, label: 'Mon profil', path: '/parametres' },
                      { icon: Settings, label: 'Paramètres', path: '/parametres' },
                    ].map(({ icon: Icon, label, path }) => (
                      <button key={label} onClick={() => { setMenuOpen(false); navigate(path) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', background: 'none', border: 'none', fontSize: 13.5, color: '#374151', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <Icon size={14} color="#6b7280" /> {label}
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid #f5f5f5' }}>
                      <button onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', background: 'none', border: 'none', fontSize: 13.5, color: '#ef4444', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <LogOut size={14} color="#ef4444" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f5f6fa' }}>
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Tab Bar (mobile only) ── */}
      <nav className="bottom-tab-bar" role="navigation" aria-label="Navigation principale">
        {BOTTOM_TABS.map((tab) => {
          const active = isTabActive(tab)
          const Icon = tab.icon
          return (
            <button
              key={tab.label}
              className={`bottom-tab-item${active ? ' btab-active' : ''}`}
              onClick={() => {
                if (tab.path === null) {
                  setSidebarOpen(true)
                } else {
                  navigate(tab.path)
                }
              }}
              aria-label={tab.label}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              {tab.badge && !active && (
                <span className="btab-badge">{tab.badge}</span>
              )}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
