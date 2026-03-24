import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FileText, Plus, Send, CheckCircle, XCircle, Clock,
  Eye, ChevronRight, Euro, TrendingUp, Search, Filter,
  X, Trash2, Bot, Check
} from 'lucide-react'

type DevisStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'refused' | 'expired'

const allDevis = [
  {
    id: 1, number: 'DEV-2024-0047', client: 'M. Bernard Paul',
    address: 'Lyon 4', date: '15/03/2024', validite: '14/04/2024',
    amount: '1 240 €', status: 'sent' as DevisStatus,
    items: ['Remplacement chauffe-eau électrique 200L', 'Déplacement urgence'],
    daysAgo: 1
  },
  {
    id: 2, number: 'DEV-2024-0046', client: 'M. Laurent Jean',
    address: 'Villeurbanne', date: '12/03/2024', validite: '11/04/2024',
    amount: '850 €', status: 'sent' as DevisStatus,
    items: ['Remplacement mitigeur douche', 'Déplacement standard'],
    daysAgo: 4
  },
  {
    id: 3, number: 'DEV-2024-0045', client: 'Mme Garcia Maria',
    address: 'Lyon 2', date: '10/03/2024', validite: '09/04/2024',
    amount: '1 200 €', status: 'viewed' as DevisStatus,
    items: ['Rénovation salle de bain (main d\'œuvre)', 'Fournitures'],
    daysAgo: 6
  },
  {
    id: 4, number: 'DEV-2024-0044', client: 'Mme Dupont Marie',
    address: 'Lyon 3', date: '08/03/2024', validite: '07/04/2024',
    amount: '320 €', status: 'accepted' as DevisStatus,
    items: ['Remplacement robinet cuisine', 'Déplacement standard'],
    daysAgo: 8
  },
  {
    id: 5, number: 'DEV-2024-0043', client: 'Syndic Bellecour',
    address: 'Lyon 2', date: '05/03/2024', validite: '04/04/2024',
    amount: '3 800 €', status: 'accepted' as DevisStatus,
    items: ['Rénovation plomberie immeuble', '3 appartements'],
    daysAgo: 11
  },
  {
    id: 6, number: 'DEV-2024-0042', client: 'M. Moreau André',
    address: 'Bron', date: '01/03/2024', validite: '31/03/2024',
    amount: '560 €', status: 'refused' as DevisStatus,
    items: ['Remplacement chaudière gaz', 'Déplacement'],
    daysAgo: 15
  },
  {
    id: 7, number: 'DEV-2024-0048', client: 'Mme Simon Claire',
    address: 'Caluire', date: '16/03/2024', validite: '15/04/2024',
    amount: '185 €', status: 'draft' as DevisStatus,
    items: ['Remplacement joint + siphon', 'Déplacement standard'],
    daysAgo: 0
  },
]

const statusConfig: Record<DevisStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  draft:    { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: FileText },
  sent:     { label: 'Envoyé', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Send },
  viewed:   { label: 'Vu', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Eye },
  accepted: { label: 'Accepté', color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0', icon: CheckCircle },
  refused:  { label: 'Refusé', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: XCircle },
  expired:  { label: 'Expiré', color: '#9ca3af', bg: '#f9fafb', border: '#f3f4f6', icon: Clock },
}

type Tab = 'all' | 'draft' | 'sent' | 'accepted' | 'refused'

// Prestations library
const prestationLib = [
  { id: 'p1', cat: 'Dépannage', name: 'Remplacement joint robinet', price: 45, unit: 'forfait' },
  { id: 'p2', cat: 'Dépannage', name: 'Remplacement mitigeur cuisine', price: 120, unit: 'forfait' },
  { id: 'p3', cat: 'Dépannage', name: 'Remplacement mitigeur douche', price: 150, unit: 'forfait' },
  { id: 'p4', cat: 'Dépannage', name: 'Réparation fuite tuyauterie', price: 95, unit: 'forfait' },
  { id: 'p5', cat: 'Dépannage', name: 'Remplacement chasse d\'eau', price: 85, unit: 'forfait' },
  { id: 'p6', cat: 'Débouchage', name: 'Débouchage canalisation', price: 110, unit: 'forfait' },
  { id: 'p7', cat: 'Chauffe-eau', name: 'Remplacement chauffe-eau 150L', price: 950, unit: 'forfait' },
  { id: 'p8', cat: 'Chauffe-eau', name: 'Remplacement chauffe-eau 200L', price: 1100, unit: 'forfait' },
  { id: 'p9', cat: 'Entretien', name: 'Entretien chaudière gaz', price: 120, unit: 'forfait' },
  { id: 'p10', cat: 'Main d\'œuvre', name: 'Déplacement standard', price: 35, unit: 'forfait' },
  { id: 'p11', cat: 'Main d\'œuvre', name: 'Déplacement urgence', price: 65, unit: 'forfait' },
  { id: 'p12', cat: 'Main d\'œuvre', name: 'Main d\'œuvre horaire', price: 55, unit: 'heure' },
]

type LineItem = { id: string; name: string; qty: number; price: number; unit: string }

export default function Devis() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { openCreate?: boolean; client?: string } | null
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [showCreate, setShowCreate] = useState(locationState?.openCreate === true)
  const [clientPrefill, setClientPrefill] = useState(locationState?.client ?? '')
  const [search, setSearch] = useState('')
  const [prestSearch, setPrestSearch] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])
  const [relanceId, setRelanceId] = useState<number | null>(null)
  const [viewDevis, setViewDevis] = useState<typeof allDevis[0] | null>(null)
  const [pdfToast, setPdfToast] = useState(false)
  const [showPdf, setShowPdf] = useState(false)

  const filtered = allDevis.filter(d => {
    const matchTab = activeTab === 'all' || d.status === activeTab
    const matchSearch = !search || d.client.toLowerCase().includes(search.toLowerCase()) || d.number.includes(search)
    return matchTab && matchSearch
  })

  const tabCounts = {
    all: allDevis.length,
    draft: allDevis.filter(d => d.status === 'draft').length,
    sent: allDevis.filter(d => d.status === 'sent' || d.status === 'viewed').length,
    accepted: allDevis.filter(d => d.status === 'accepted').length,
    refused: allDevis.filter(d => d.status === 'refused').length,
  }

  const totalAccepte = allDevis.filter(d => d.status === 'accepted').reduce((s, d) => s + parseFloat(d.amount.replace(/[^\d]/g, '')), 0)
  const totalEnAttente = allDevis.filter(d => d.status === 'sent' || d.status === 'viewed').reduce((s, d) => s + parseFloat(d.amount.replace(/[^\d]/g, '')), 0)

  const filteredPrests = prestationLib.filter(p =>
    !prestSearch || p.name.toLowerCase().includes(prestSearch.toLowerCase()) || p.cat.toLowerCase().includes(prestSearch.toLowerCase())
  )

  const addLine = (p: typeof prestationLib[0]) => {
    if (lines.find(l => l.id === p.id)) return
    setLines(prev => [...prev, { id: p.id, name: p.name, qty: 1, price: p.price, unit: p.unit }])
  }

  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id))

  const totalHT = lines.reduce((s, l) => s + l.qty * l.price, 0)
  const tva = Math.round(totalHT * 0.1)
  const totalTTC = totalHT + tva

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Aperçu PDF simulé */}
      {showPdf && (
        <div className="modal-overlay" onClick={() => setShowPdf(false)} style={{ alignItems: 'flex-start', paddingTop: 24, paddingBottom: 24, overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', width: '100%', maxWidth: 680,
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            fontFamily: 'Georgia, serif'
          }}>
            {/* Barre actions */}
            <div style={{ background: '#1e293b', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: 'sans-serif' }}>Aperçu PDF — Devis</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'sans-serif' }}>
                  Imprimer
                </button>
                <button onClick={() => setShowPdf(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={18} color="#9ca3af" />
                </button>
              </div>
            </div>

            {/* Document */}
            <div style={{ padding: '48px 52px', background: 'white' }}>

              {/* En-tête cabinet */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                <div>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 800, marginBottom: 10, fontFamily: 'sans-serif' }}>PL</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'sans-serif' }}>Plomberie Lefebvre</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, fontFamily: 'sans-serif' }}>
                    24 rue des Artisans, 69004 Lyon<br />
                    06 78 90 12 34 · marc@plomberie-lefebvre.fr<br />
                    SIRET : 82 345 678 900 012
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -1, fontFamily: 'sans-serif' }}>DEVIS</div>
                  <div style={{ fontSize: 13, color: '#6b7280', fontFamily: 'sans-serif', marginTop: 4 }}>
                    N° DEV-2024-{String(allDevis.length + 1).padStart(4, '0')}<br />
                    Date : {new Date().toLocaleDateString('fr-FR')}<br />
                    Validité : {new Date(Date.now() + 30 * 86400000).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Client */}
              <div style={{ background: '#f8f9fb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 20px', marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'sans-serif' }}>Client</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'sans-serif' }}>{clientPrefill || 'Client'}</div>
              </div>

              {/* Tableau prestations */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontFamily: 'sans-serif' }}>
                <thead>
                  <tr style={{ background: '#111827' }}>
                    {['Désignation', 'Qté', 'P.U. HT', 'Total HT'].map((h, i) => (
                      <th key={h} style={{ padding: '10px 14px', color: 'white', fontSize: 11, fontWeight: 700, textAlign: i === 0 ? 'left' : 'right', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.length > 0 ? lines.map((l, i) => (
                    <tr key={l.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f0f0f0' }}>{l.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{l.qty}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#374151', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{l.price} €</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#111827', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>{l.qty * l.price} €</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px 14px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>Aucune prestation ajoutée</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totaux */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
                <div style={{ width: 240 }}>
                  {[
                    { label: 'Total HT', value: `${totalHT} €`, bold: false },
                    { label: 'TVA (10%)', value: `${tva} €`, bold: false },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontFamily: 'sans-serif' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{r.label}</span>
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: r.bold ? 700 : 400 }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#111827', borderRadius: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'sans-serif' }}>TOTAL TTC</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fb923c', fontFamily: 'sans-serif' }}>{totalTTC} €</span>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 36 }}>
                <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: '16px', minHeight: 80 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'sans-serif', marginBottom: 8 }}>Signature du client (bon pour accord)</div>
                  <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'sans-serif', marginTop: 20 }}>Date : ____/____/________</div>
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'sans-serif', marginBottom: 6 }}>Plomberie Lefebvre</div>
                  <div style={{ fontSize: 12, color: '#374151', fontFamily: 'sans-serif', lineHeight: 1.6 }}>Marc Lefebvre<br />Artisan plombier</div>
                </div>
              </div>

              {/* Mentions légales */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <p style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.6, fontFamily: 'sans-serif', margin: 0 }}>
                  TVA applicable au taux de 10% pour travaux de rénovation dans des logements de plus de 2 ans. Devis valable 30 jours à compter de sa date d'émission. En cas d'acceptation, un acompte de 30% sera demandé au démarrage des travaux.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Voir devis */}
      {viewDevis && (
        <div className="modal-overlay" onClick={() => setViewDevis(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{viewDevis.number}</h2>
              <button className="btn-ghost" onClick={() => setViewDevis(null)} style={{ padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3 }}>Client</div><div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{viewDevis.client}</div><div style={{ fontSize: 12, color: '#9ca3af' }}>{viewDevis.address}</div></div>
                <div><div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3 }}>Date</div><div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{viewDevis.date}</div><div style={{ fontSize: 12, color: '#9ca3af' }}>Validité : {viewDevis.validite}</div></div>
              </div>
              <div style={{ background: '#f5f6fa', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase' }}>Prestations</div>
                {viewDevis.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: '#374151', padding: '4px 0', borderBottom: i < viewDevis.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>{item}</div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{viewDevis.amount}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={() => setViewDevis(null)}>Fermer</button>
                  <button className="btn-primary" onClick={() => { setPdfToast(true); setTimeout(() => setPdfToast(false), 2500); setViewDevis(null) }}><Eye size={14} /> PDF</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Devis</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{allDevis.length} devis · {tabCounts.accepted} acceptés ce mois</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nouveau devis
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'CA signé ce mois', value: `${totalAccepte.toLocaleString('fr-FR')} €`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0' },
          { label: 'En attente de réponse', value: `${totalEnAttente.toLocaleString('fr-FR')} €`, icon: Clock, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Taux de conversion', value: `${Math.round(allDevis.filter(d => d.status === 'accepted').length / allDevis.filter(d => d.status !== 'draft').length * 100)}%`, icon: TrendingUp, color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
        ].map(k => {
          const Ic = k.icon
          return (
            <div key={k.label} style={{
              background: k.bg, border: `1.5px solid ${k.border}`,
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: k.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.9
              }}>
                <Ic size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{k.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search + Tabs */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: '#f5f6fa', borderRadius: 9, padding: '8px 13px',
            border: '1px solid #f0f0f0'
          }}>
            <Search size={14} color="#9ca3af" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client ou n° de devis..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: '#374151', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid #f5f5f5', overflowX: 'auto' }}>
          {([
            ['all', 'Tous'],
            ['draft', 'Brouillons'],
            ['sent', 'Envoyés / Vus'],
            ['accepted', 'Acceptés'],
            ['refused', 'Refusés'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
              <span style={{
                marginLeft: 5,
                background: activeTab === tab ? '#f97316' : '#f3f4f6',
                color: activeTab === tab ? 'white' : '#6b7280',
                fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10
              }}>{tabCounts[tab]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['N° Devis', 'Client', 'Date', 'Montant', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid #f0f0f0'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const sc = statusConfig[d.status]
                const StatusIcon = sc.icon
                const canRelance = d.status === 'sent' && d.daysAgo >= 3
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                    onClick={() => setViewDevis(d)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{d.number}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{d.client}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{d.address}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13, color: '#374151' }}>{d.date}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Validité : {d.validite}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{d.amount}</span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600,
                        color: sc.color, background: sc.bg,
                        padding: '4px 10px', borderRadius: 8,
                        border: `1px solid ${sc.border}`
                      }}>
                        <StatusIcon size={12} />
                        {sc.label}
                        {canRelance && <span style={{ marginLeft: 3, color: '#d97706' }}>· J+{d.daysAgo}</span>}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setViewDevis(d)}>
                          <Eye size={13} /> Voir
                        </button>
                        {canRelance && (
                          <button
                            className="btn-outline"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => setRelanceId(relanceId === d.id ? null : d.id)}
                          >
                            Relancer
                          </button>
                        )}
                        {d.status === 'accepted' && (
                          <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/factures')}>
                            → Facture
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              Aucun devis trouvé
            </div>
          )}
        </div>
      </div>

      {/* Modal création devis */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'white', borderRadius: 18, width: '90%', maxWidth: 680,
            maxHeight: '90vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouveau devis</h2>
              <button className="btn-ghost" onClick={() => setShowCreate(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* IA suggestion banner */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <Bot size={16} color="#fb923c" />
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>
                  Suggestion IA basée sur l'appel de M. Bernard :
                  <span style={{ color: '#fb923c', fontWeight: 600 }}> Chauffe-eau 200L + déplacement urgence</span>
                </span>
              </div>

              {/* Client */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Client</label>
                <input className="input-field" placeholder="Rechercher ou créer un client..." value={clientPrefill} onChange={e => setClientPrefill(e.target.value)} />
              </div>

              {/* Prestations search */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prestations</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#f5f6fa', borderRadius: 9, padding: '8px 13px',
                  border: '1.5px solid #e5e7eb', marginBottom: 10
                }}>
                  <Search size={14} color="#9ca3af" />
                  <input
                    value={prestSearch}
                    onChange={e => setPrestSearch(e.target.value)}
                    placeholder="Rechercher une prestation... (ex: mitigeur, chauffe-eau)"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: '#374151', width: '100%' }}
                  />
                </div>

                {/* Prestation list */}
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 10 }}>
                  {filteredPrests.map(p => {
                    const added = lines.some(l => l.id === p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() => addLine(p)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '9px 14px', cursor: 'pointer',
                          background: added ? '#f0fdf4' : 'white',
                          borderBottom: '1px solid #f5f5f5',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => { if (!added) (e.currentTarget.style.background = '#fafafa') }}
                        onMouseLeave={e => { if (!added) (e.currentTarget.style.background = 'white') }}
                      >
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{p.name}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>{p.cat}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{p.price} €</span>
                          {added
                            ? <Check size={15} color="#16a34a" />
                            : <Plus size={15} color="#9ca3af" />
                          }
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected lines */}
              {lines.length > 0 && (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ background: '#fafafa', padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                    Lignes du devis
                  </div>
                  {lines.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ flex: 1, fontSize: 13.5, color: '#374151' }}>{l.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => setLines(prev => prev.map(x => x.id === l.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}
                          style={{ width: 24, height: 24, border: '1px solid #e5e7eb', borderRadius: 5, background: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{l.qty}</span>
                        <button onClick={() => setLines(prev => prev.map(x => x.id === l.id ? { ...x, qty: x.qty + 1 } : x))}
                          style={{ width: 24, height: 24, border: '1px solid #e5e7eb', borderRadius: 5, background: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', minWidth: 60, textAlign: 'right' }}>{l.qty * l.price} €</span>
                      <button onClick={() => removeLine(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}>
                        <Trash2 size={13} color="#9ca3af" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              {lines.length > 0 && (
                <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, color: '#6b7280' }}>Total HT</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{totalHT} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13.5, color: '#6b7280' }}>TVA 10%</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151' }}>{tva} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Total TTC</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#f97316' }}>{totalTTC} €</span>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Note (optionnel)</label>
                <textarea className="input-field" rows={2} placeholder="Conditions particulières, remarques..." style={{ resize: 'none' }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Annuler</button>
              <button className="btn-secondary" onClick={() => setShowPdf(true)}>
                <Eye size={14} /> Aperçu PDF
              </button>
              <button className="btn-primary" onClick={() => setShowCreate(false)}>
                <Send size={14} /> Envoyer par SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
