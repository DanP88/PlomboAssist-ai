import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PhoneCall, Calendar, FileText, Users,
  Receipt, Settings, Bot, X, Droplets, ChevronRight, Package, ClipboardList,
  TrendingUp, Stamp
} from 'lucide-react'

const navSections = [
  {
    label: null,
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
    ]
  },
  {
    label: 'Activité',
    items: [
      { path: '/demandes', icon: PhoneCall, label: 'Demandes', badge: '4' },
      { path: '/planning', icon: Calendar, label: 'Planning' },
      { path: '/rapport', icon: ClipboardList, label: 'Rapport chantier' },
    ]
  },
  {
    label: 'Stock',
    items: [
      { path: '/stock', icon: Package, label: 'Stock matériaux' },
      { path: '/saisie-materiaux', icon: ClipboardList, label: 'Saisir utilisation' },
    ]
  },
  {
    label: 'Commercial',
    items: [
      { path: '/devis', icon: FileText, label: 'Devis' },
      { path: '/factures', icon: Receipt, label: 'Factures' },
      { path: '/clients', icon: Users, label: 'Clients' },
      { path: '/statistiques', icon: TrendingUp, label: 'Statistiques' },
      { path: '/attestation-tva', icon: Stamp, label: 'Attestation TVA' },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { path: '/assistant-ia', icon: Bot, label: 'Assistant IA' },
      { path: '/parametres', icon: Settings, label: 'Paramètres' },
    ]
  },
]

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function AppSidebar({ onClose }: AppSidebarProps) {
  return (
    <div style={{
      width: 220,
      minWidth: 220,
      background: '#111827',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            flexShrink: 0
          }}>
            <Droplets size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14.5, fontFamily: 'Plus Jakarta Sans', lineHeight: 1.2 }}>
              PlomboAssist
            </div>
            <div style={{ color: '#6b7280', fontSize: 10.5, lineHeight: 1.2 }}>Assistant IA plomberie</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, display: 'flex', alignItems: 'center',
            borderRadius: 6, color: '#6b7280'
          }} className="sidebar-close-btn">
            <X size={17} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
        {navSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 6 }}>
            {section.label && (
              <div style={{
                padding: '10px 10px 4px',
                color: '#4b5563',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.09em'
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(({ path, icon: Icon, label, badge, end }: { path: string; icon: any; label: string; badge?: string; end?: boolean }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={15} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{
                    background: '#f97316',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    lineHeight: 1.6
                  }}>{badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ background: 'rgba(249,115,22,0.1)', borderRadius: 9, padding: '10px 12px', border: '1px solid rgba(249,115,22,0.2)' }}>
          <div style={{ color: '#9ca3af', fontSize: 10.5, marginBottom: 2 }}>Plan actuel</div>
          <div style={{ color: '#fb923c', fontWeight: 700, fontSize: 13 }}>PRO — 89 €/mois</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, cursor: 'pointer' }}>
            <span style={{ color: '#6b7280', fontSize: 10.5 }}>Gérer mon abonnement</span>
            <ChevronRight size={10} color="#6b7280" />
          </div>
        </div>
      </div>
    </div>
  )
}
