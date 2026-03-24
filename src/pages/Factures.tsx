import { useState } from 'react'
import {
  Receipt, CheckCircle, Clock, AlertTriangle, XCircle,
  Euro, TrendingUp, Send, Eye, Search, Filter, Plus, X
} from 'lucide-react'

type FactureStatus = 'sent' | 'paid' | 'overdue' | 'partial' | 'draft'

const factures = [
  { id: 1, number: 'FAC-2024-0018', client: 'M. Bernard Paul', address: 'Lyon 4', date: '16/03/2024', dueDate: '30/03/2024', amount: '1 240 €', amountNum: 1240, paidAmount: 0, status: 'sent' as FactureStatus, origin: 'DEV-2024-0047' },
  { id: 2, number: 'FAC-2024-0017', client: 'Mme Dupont Marie', address: 'Lyon 3', date: '14/03/2024', dueDate: '28/03/2024', amount: '185 €', amountNum: 185, paidAmount: 0, status: 'sent' as FactureStatus, origin: '' },
  { id: 3, number: 'FAC-2024-0016', client: 'Syndic Bellecour', address: 'Lyon 2', date: '05/03/2024', dueDate: '19/03/2024', amount: '3 800 €', amountNum: 3800, paidAmount: 1900, status: 'partial' as FactureStatus, origin: 'DEV-2024-0043' },
  { id: 4, number: 'FAC-2024-0015', client: 'M. Henri Dupont', address: 'Bron', date: '28/02/2024', dueDate: '13/03/2024', amount: '320 €', amountNum: 320, paidAmount: 0, status: 'overdue' as FactureStatus, origin: '' },
  { id: 5, number: 'FAC-2024-0014', client: 'Agence du Parc', address: 'Lyon 1', date: '20/02/2024', dueDate: '05/03/2024', amount: '560 €', amountNum: 560, paidAmount: 560, status: 'paid' as FactureStatus, origin: '' },
  { id: 6, number: 'FAC-2024-0013', client: 'M. Jean Renard', address: 'Lyon 6', date: '15/02/2024', dueDate: '01/03/2024', amount: '780 €', amountNum: 780, paidAmount: 780, status: 'paid' as FactureStatus, origin: '' },
  { id: 7, number: 'FAC-2024-0012', client: 'Mme Simon Claire', address: 'Caluire', date: '10/02/2024', dueDate: '24/02/2024', amount: '95 €', amountNum: 95, paidAmount: 95, status: 'paid' as FactureStatus, origin: '' },
]

const statusConfig: Record<FactureStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  draft:   { label: 'Brouillon', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: Receipt },
  sent:    { label: 'Envoyée', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: Send },
  partial: { label: 'Acompte reçu', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Clock },
  paid:    { label: 'Payée', color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0', icon: CheckCircle },
  overdue: { label: 'En retard', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
}

type Tab = 'all' | 'unpaid' | 'paid' | 'overdue'

export default function Factures() {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [facturesList, setFacturesList] = useState(factures)
  const [showNew, setShowNew] = useState(false)
  const [toast, setToast] = useState('')
  const [viewFacture, setViewFacture] = useState<typeof factures[0] | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const filtered = facturesList.filter(f => {
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'unpaid' ? (f.status === 'sent' || f.status === 'partial') :
      activeTab === 'paid' ? f.status === 'paid' :
      activeTab === 'overdue' ? f.status === 'overdue' : true
    const matchSearch = !search || f.client.toLowerCase().includes(search.toLowerCase()) || f.number.includes(search)
    return matchTab && matchSearch
  })

  const totalPaid = facturesList.filter(f => f.status === 'paid').reduce((s, f) => s + f.amountNum, 0)
  const totalUnpaid = facturesList.filter(f => f.status === 'sent' || f.status === 'partial').reduce((s, f) => s + f.amountNum - f.paidAmount, 0)
  const totalOverdue = facturesList.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amountNum, 0)

  const tabCounts = {
    all: facturesList.length,
    unpaid: facturesList.filter(f => f.status === 'sent' || f.status === 'partial').length,
    paid: facturesList.filter(f => f.status === 'paid').length,
    overdue: facturesList.filter(f => f.status === 'overdue').length,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: 'white', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, fontWeight: 600, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}

      {/* Modal voir facture */}
      {viewFacture && (
        <div className="modal-overlay" onClick={() => setViewFacture(null)}>
          <div style={{ background: 'white', borderRadius: 18, width: '90%', maxWidth: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Facture</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{viewFacture.number}</div>
                {viewFacture.origin && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Issu de {viewFacture.origin}</div>}
              </div>
              <button className="btn-ghost" onClick={() => setViewFacture(null)} style={{ padding: 4, color: 'white' }}><X size={18} color="white" /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f5f6fa', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Client</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{viewFacture.client}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{viewFacture.address}</div>
                </div>
                <div style={{ background: '#f5f6fa', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Dates</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>Émise le {viewFacture.date}</div>
                  <div style={{ fontSize: 13, color: viewFacture.status === 'overdue' ? '#dc2626' : '#374151', fontWeight: viewFacture.status === 'overdue' ? 700 : 400 }}>Échéance {viewFacture.dueDate}</div>
                </div>
              </div>
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#fafafa', padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Détail</div>
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5, color: '#374151' }}>Intervention plomberie</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{viewFacture.amount}</span>
                </div>
                {viewFacture.status === 'partial' && (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#d97706' }}>Acompte reçu</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{viewFacture.paidAmount} €</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { showToast('PDF généré'); setViewFacture(null) }}><Eye size={14} /> PDF</button>
                {viewFacture.status !== 'paid' && (
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                    setFacturesList(prev => prev.map(x => x.id === viewFacture.id ? { ...x, status: 'paid' as FactureStatus, paidAmount: x.amountNum } : x))
                    showToast('Facture marquée comme payée')
                    setViewFacture(null)
                  }}>
                    <CheckCircle size={14} /> Marquer payée
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle facture */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouvelle facture</h2>
              <button className="btn-ghost" onClick={() => setShowNew(false)} style={{ padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Client</label><input className="input-field" placeholder="Rechercher un client..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date</label><input className="input-field" type="date" /></div>
                <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Échéance</label><input className="input-field" type="date" /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Devis associé (optionnel)</label><input className="input-field" placeholder="DEV-2024-..." /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label><textarea className="input-field" rows={3} placeholder="Détail des prestations..." style={{ resize: 'none' }} /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Montant TTC (€)</label><input className="input-field" type="number" placeholder="0" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                <button className="btn-secondary" onClick={() => setShowNew(false)} style={{ justifyContent: 'center' }}>Annuler</button>
                <button className="btn-primary" onClick={() => { setShowNew(false); showToast('Facture créée') }} style={{ justifyContent: 'center' }}>Créer la facture</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Receipt size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Factures</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{factures.length} factures · Mars 2024</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nouvelle facture
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'CA encaissé (mars)', value: `${totalPaid.toLocaleString('fr-FR')} €`, icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0' },
          { label: 'En attente de paiement', value: `${totalUnpaid.toLocaleString('fr-FR')} €`, icon: Clock, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'En retard', value: `${totalOverdue.toLocaleString('fr-FR')} €`, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map(k => {
          const Ic = k.icon
          return (
            <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
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

      {/* Table card */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f6fa', borderRadius: 9, padding: '8px 13px', border: '1px solid #f0f0f0' }}>
            <Search size={14} color="#9ca3af" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une facture..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: '#374151', width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid #f5f5f5', overflowX: 'auto' }}>
          {([
            ['all', 'Toutes'],
            ['unpaid', 'Non payées'],
            ['overdue', 'En retard'],
            ['paid', 'Payées'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} className={`tab-button ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {label}
              <span style={{ marginLeft: 5, background: activeTab === tab ? '#f97316' : '#f3f4f6', color: activeTab === tab ? 'white' : '#6b7280', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['N° Facture', 'Client', 'Date', 'Échéance', 'Montant', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const sc = statusConfig[f.status]
                const StatusIcon = sc.icon
                const progress = f.status === 'partial' ? (f.paidAmount / f.amountNum * 100) : f.status === 'paid' ? 100 : 0
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                    onClick={() => setViewFacture(f)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{f.number}</span>
                      {f.origin && <div style={{ fontSize: 11, color: '#9ca3af' }}>← {f.origin}</div>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{f.client}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{f.address}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151' }}>{f.date}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 13, color: f.status === 'overdue' ? '#dc2626' : '#374151', fontWeight: f.status === 'overdue' ? 700 : 400 }}>
                        {f.dueDate}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{f.amount}</div>
                      {f.status === 'partial' && (
                        <div style={{ marginTop: 4 }}>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                          <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>{f.paidAmount} € reçus</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 600, color: sc.color, background: sc.bg,
                        padding: '4px 10px', borderRadius: 8, border: `1px solid ${sc.border}`
                      }}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => showToast('PDF généré')}>
                          <Eye size={13} /> PDF
                        </button>
                        {(f.status === 'sent' || f.status === 'overdue') && (
                          <button className="btn-outline" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => showToast(`Relance envoyée à ${f.client}`)}>
                            Relancer
                          </button>
                        )}
                        {f.status !== 'paid' && (
                          <button className="btn-primary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => { setFacturesList(prev => prev.map(x => x.id === f.id ? { ...x, status: 'paid' as FactureStatus, paidAmount: x.amountNum } : x)); showToast('Facture marquée comme payée') }}>
                            Marquer payée
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
