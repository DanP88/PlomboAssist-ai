import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Phone, MapPin, Clock,
  ChevronRight, Star, Building, User, FileText,
  CheckCircle, X, History, MessageSquare
} from 'lucide-react'

const clients = [
  {
    id: 1, firstName: 'Marie', lastName: 'Dupont', type: 'particulier',
    phone: '06 12 34 56 78', email: 'marie.dupont@gmail.com',
    address: '12 rue Victor Hugo', city: 'Lyon 3',
    interventions: 4, lastIntervention: '15 mars 2024',
    totalCA: '1 240 €', isRecurrent: true, hasDevisEnAttente: false,
    lastType: 'Fuite', rating: 5
  },
  {
    id: 2, firstName: 'Jean', lastName: 'Renard', type: 'particulier',
    phone: '07 98 76 54 32', email: 'j.renard@orange.fr',
    address: '45 av. Gambetta', city: 'Lyon 6',
    interventions: 2, lastIntervention: '16 mars 2024',
    totalCA: '2 340 €', isRecurrent: false, hasDevisEnAttente: true,
    lastType: 'Chauffe-eau', rating: 5
  },
  {
    id: 3, firstName: 'Syndic', lastName: 'Bellecour', type: 'syndic',
    phone: '04 72 XX XX XX', email: 'contact@syndic-bellecour.fr',
    address: '18 place Bellecour', city: 'Lyon 2',
    interventions: 12, lastIntervention: '10 mars 2024',
    totalCA: '8 900 €', isRecurrent: true, hasDevisEnAttente: false,
    lastType: 'Débouchage', rating: 4
  },
  {
    id: 4, firstName: 'Maria', lastName: 'Garcia', type: 'particulier',
    phone: '06 77 88 99 00', email: '',
    address: '12 rue Molière', city: 'Lyon 2',
    interventions: 1, lastIntervention: '10 mars 2024',
    totalCA: '0 €', isRecurrent: false, hasDevisEnAttente: true,
    lastType: 'Entretien', rating: 0
  },
  {
    id: 5, firstName: 'Henri', lastName: 'Dupont', type: 'particulier',
    phone: '06 11 22 33 44', email: 'h.dupont@free.fr',
    address: '3 rue des Lilas', city: 'Bron',
    interventions: 3, lastIntervention: '12 mars 2024',
    totalCA: '760 €', isRecurrent: false, hasDevisEnAttente: false,
    lastType: 'Débouchage', rating: 5
  },
  {
    id: 6, firstName: 'Agence', lastName: 'Immobilière du Parc', type: 'agence',
    phone: '04 78 XX XX XX', email: 'contact@agence-parc.fr',
    address: '24 rue de la République', city: 'Lyon 1',
    interventions: 7, lastIntervention: '8 mars 2024',
    totalCA: '4 200 €', isRecurrent: true, hasDevisEnAttente: false,
    lastType: 'Installation', rating: 4
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  particulier: { label: 'Particulier', color: '#2563eb', bg: '#eff6ff', icon: User },
  syndic: { label: 'Syndic', color: '#7c3aed', bg: '#faf5ff', icon: Building },
  agence: { label: 'Agence', color: '#d97706', bg: '#fffbeb', icon: Building },
  entreprise: { label: 'Entreprise', color: '#374151', bg: '#f3f4f6', icon: Building },
}

const historyItems = [
  { date: '15 mars 2024', type: 'Intervention', detail: 'Fuite sous évier cuisine — Joint + siphon remplacés', amount: '185 €', status: 'done' },
  { date: '20 jan 2024', type: 'Facture', detail: 'FAC-2024-0008 — Remplacement mitigeur douche', amount: '320 €', status: 'paid' },
  { date: '18 jan 2024', type: 'Intervention', detail: 'Remplacement mitigeur douche', amount: '', status: 'done' },
  { date: '5 déc 2023', type: 'Devis', detail: 'DEV-2023-0089 — Rénovation salle de bain', amount: '2 400 €', status: 'refused' },
]

export default function Clients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [showNew, setShowNew] = useState(false)
  const [activeHistTab, setActiveHistTab] = useState('history')
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>(['Client très ponctuel pour les paiements. Préfère être contacté le matin.'])

  const filtered = clients.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || c.phone.includes(search) || c.city.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || c.type === filterType
    return matchSearch && matchType
  })

  const selected = clients.find(c => c.id === selectedId)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Users size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Clients</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{clients.length} clients · {clients.filter(c => c.isRecurrent).length} récurrents</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Nouveau client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>

        {/* Left — List */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          {/* Search + filter */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f5f6fa', borderRadius: 9, padding: '8px 13px', marginBottom: 10,
              border: '1px solid #f0f0f0'
            }}>
              <Search size={14} color="#9ca3af" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, téléphone, ville..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'particulier', 'syndic', 'agence'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                    background: filterType === t ? '#f97316' : '#f5f6fa',
                    color: filterType === t ? 'white' : '#6b7280',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {t === 'all' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Client list */}
          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filtered.map(c => {
              const tc = typeConfig[c.type]
              const TypeIcon = tc.icon
              const isSelected = c.id === selectedId
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    padding: '13px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: 'pointer',
                    background: isSelected ? '#fff7ed' : 'white',
                    borderLeft: `3px solid ${isSelected ? '#f97316' : 'transparent'}`,
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: isSelected ? '#f97316' : tc.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <TypeIcon size={17} color={isSelected ? 'white' : tc.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          {c.firstName} {c.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.phone}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{c.totalCA}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.interventions} interv.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <MapPin size={10} color="#9ca3af" />
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.city}</span>
                    {c.isRecurrent && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: 6 }}>
                        Client fidèle
                      </span>
                    )}
                    {c.hasDevisEnAttente && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: '#d97706', background: '#fffbeb', padding: '1px 6px', borderRadius: 6 }}>
                        Devis en cours
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — Client detail */}
        {selected ? (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            {/* Client header */}
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 13,
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 18, fontWeight: 800
                  }}>
                    {selected.firstName[0]}{selected.lastName[0]}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: 0 }}>
                      {selected.firstName} {selected.lastName}
                    </h2>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: typeConfig[selected.type].color,
                        background: typeConfig[selected.type].bg,
                        padding: '2px 8px', borderRadius: 7
                      }}>{typeConfig[selected.type].label}</span>
                      {selected.isRecurrent && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 7 }}>
                          Client fidèle
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { window.location.href = `tel:${selected.phone.replace(/\s/g, '')}` }}>
                    <Phone size={14} /> Appeler
                  </button>
                  <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => navigate('/planning')}>
                    <Plus size={14} /> Intervention
                  </button>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  { label: 'CA total', value: selected.totalCA, color: '#f97316' },
                  { label: 'Interventions', value: `${selected.interventions}`, color: '#3b82f6' },
                  { label: 'Dernière visite', value: selected.lastIntervention, color: '#10b981' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fafafa', borderRadius: 10, padding: '12px 14px', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {[
                  { icon: Phone, text: selected.phone },
                  { icon: MapPin, text: `${selected.address}, ${selected.city}` },
                  ...(selected.email ? [{ icon: MessageSquare, text: selected.email }] : []),
                ].map(({ icon: Ic, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Ic size={14} color="#9ca3af" />
                    <span style={{ fontSize: 13.5, color: '#374151' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #f5f5f5', padding: '0 24px' }}>
              {[['history', 'Historique'], ['devis', 'Devis'], ['factures', 'Factures'], ['notes', 'Notes']].map(([tab, label]) => (
                <button
                  key={tab}
                  className={`tab-button ${activeHistTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveHistTab(tab)}
                  style={{ padding: '10px 16px' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* History content */}
            <div style={{ padding: '20px 24px', maxHeight: 340, overflowY: 'auto' }}>
              {activeHistTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {historyItems.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: h.type === 'Intervention' ? '#fff7ed' : h.type === 'Facture' ? '#f0fdf4' : '#eff6ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {h.type === 'Intervention' && <Clock size={15} color="#f97316" />}
                          {h.type === 'Facture' && <CheckCircle size={15} color="#10b981" />}
                          {h.type === 'Devis' && <FileText size={15} color="#3b82f6" />}
                        </div>
                        {i < historyItems.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: '#f0f0f0', marginTop: 6, minHeight: 24 }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{h.detail}</span>
                          {h.amount && <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginLeft: 8 }}>{h.amount}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{h.date} · {h.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeHistTab === 'devis' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { num: 'DEV-2024-0044', desc: 'Remplacement robinet cuisine', amount: '320 €', status: 'Accepté', color: '#16a34a', bg: '#f0fdf4' },
                    { num: 'DEV-2023-0089', desc: 'Rénovation salle de bain', amount: '2 400 €', status: 'Refusé', color: '#dc2626', bg: '#fef2f2' },
                  ].map(d => (
                    <div key={d.num} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 9, border: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{d.num}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{d.desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{d.amount}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: d.color, background: d.bg, padding: '2px 8px', borderRadius: 6 }}>{d.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeHistTab === 'factures' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { num: 'FAC-2024-0015', desc: 'Remplacement robinet cuisine', amount: '320 €', status: 'Payée', color: '#16a34a', bg: '#f0fdf4' },
                    { num: 'FAC-2024-0008', desc: 'Remplacement mitigeur douche', amount: '185 €', status: 'Payée', color: '#16a34a', bg: '#f0fdf4' },
                  ].map(f => (
                    <div key={f.num} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fafafa', borderRadius: 9, border: '1px solid #f0f0f0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{f.num}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{f.desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{f.amount}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: f.color, background: f.bg, padding: '2px 8px', borderRadius: 6 }}>{f.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeHistTab === 'notes' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {notes.map((n, i) => (
                      <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9, padding: '10px 14px', fontSize: 13.5, color: '#374151', lineHeight: 1.5 }}>{n}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input-field" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Ajouter une note..." onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) { setNotes(prev => [...prev, noteText.trim()]); setNoteText('') } }} />
                    <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => { if (noteText.trim()) { setNotes(prev => [...prev, noteText.trim()]); setNoteText('') } }}>Ajouter</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#d1d5db' }}>
            <Users size={36} />
            <span style={{ fontSize: 14, color: '#9ca3af' }}>Sélectionnez un client</span>
          </div>
        )}
      </div>

      {/* New client modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouveau client</h2>
              <button className="btn-ghost" onClick={() => setShowNew(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Type</label>
                <select className="select-field">
                  <option>Particulier</option>
                  <option>Syndic</option>
                  <option>Agence immobilière</option>
                  <option>Entreprise</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prénom</label>
                  <input className="input-field" placeholder="Prénom" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nom</label>
                  <input className="input-field" placeholder="Nom" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Téléphone *</label>
                <input className="input-field" placeholder="06 XX XX XX XX" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Adresse</label>
                <input className="input-field" placeholder="12 rue Victor Hugo, Lyon 3" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
                <input className="input-field" type="email" placeholder="client@email.fr" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                <button className="btn-secondary" onClick={() => setShowNew(false)} style={{ justifyContent: 'center' }}>Annuler</button>
                <button className="btn-primary" onClick={() => setShowNew(false)} style={{ justifyContent: 'center' }}>Créer le client</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
