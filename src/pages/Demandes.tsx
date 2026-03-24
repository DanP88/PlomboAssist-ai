import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall, PhoneOff, Clock, CheckCircle, AlertTriangle,
  Phone, MapPin, Calendar, ChevronRight, Bot, Mic, X,
  User, MessageSquare, Zap, FileText, Plus, Wrench
} from 'lucide-react'

const allDemandes = [
  {
    id: 1,
    source: 'call',
    status: 'new',
    urgency: 1,
    name: 'M. Bernard Paul',
    phone: '06 12 34 56 78',
    address: '23 rue des Fleurs, Lyon 4',
    problemType: 'Chauffe-eau',
    summary: "Chauffe-eau électrique en panne depuis ce matin. Plus d'eau chaude du tout. Famille avec enfants en bas âge.",
    availability: 'Aujourd\'hui ou demain matin',
    timeAgo: 'Il y a 12 min',
    duration: '2m 14s',
    aiSuggestions: ['Remplacement chauffe-eau électrique 200L', 'Déplacement urgence'],
  },
  {
    id: 2,
    source: 'call',
    status: 'new',
    urgency: 1,
    name: 'Mme Simon Claire',
    phone: '07 98 76 54 32',
    address: '8 impasse du Moulin, Caluire',
    problemType: 'Fuite',
    summary: "Fuite sous l'évier de la cuisine. De l'eau coule sur le sol depuis hier soir. Seau posé mais ça déborde.",
    availability: 'Disponible toute la journée',
    timeAgo: 'Il y a 1h',
    duration: '1m 48s',
    aiSuggestions: ['Remplacement joint + siphon', 'Déplacement standard'],
  },
  {
    id: 3,
    source: 'call',
    status: 'new',
    urgency: 2,
    name: 'M. Laurent Jean',
    phone: '06 55 44 33 22',
    address: '45 avenue Jean Jaurès, Villeurbanne',
    problemType: 'Robinetterie',
    summary: "Robinet qui goutte dans la salle de bain. Problème depuis 2 semaines. Pas urgent mais souhaite un devis.",
    availability: 'Mercredi après-midi ou jeudi matin',
    timeAgo: 'Il y a 3h',
    duration: '1m 22s',
    aiSuggestions: ['Remplacement mitigeur douche', 'Déplacement standard'],
  },
  {
    id: 4,
    source: 'call',
    status: 'new',
    urgency: 3,
    name: 'Mme Garcia Maria',
    phone: '06 77 88 99 00',
    address: '12 rue Molière, Lyon 2',
    problemType: 'Entretien',
    summary: "Souhaite faire réviser sa chaudière gaz avant l'hiver. Dernière révision il y a 2 ans.",
    availability: 'Semaine prochaine',
    timeAgo: 'Il y a 5h',
    duration: '0m 58s',
    aiSuggestions: ['Entretien chaudière gaz', 'Déplacement standard'],
  },
  {
    id: 5,
    source: 'call',
    status: 'converted',
    urgency: 2,
    name: 'M. Dupont Henri',
    phone: '06 11 22 33 44',
    address: '3 rue des Lilas, Bron',
    problemType: 'Débouchage',
    summary: "Évier de cuisine bouché, eau qui remonte. Appartement en location.",
    availability: 'Ce soir ou demain',
    timeAgo: 'Il y a 6h',
    duration: '1m 33s',
    aiSuggestions: ['Débouchage manuel/furet', 'Déplacement standard'],
  },
  {
    id: 6,
    source: 'call',
    status: 'closed',
    urgency: 3,
    name: 'Mme Martin Sophie',
    phone: '07 66 55 44 33',
    address: '18 cours Lafayette, Lyon 3',
    problemType: 'Robinetterie',
    summary: "Chasse d'eau qui fuit en continu. Appartement propriété.",
    availability: 'Fin de semaine',
    timeAgo: 'Hier',
    duration: '1m 05s',
    aiSuggestions: ['Remplacement mécanisme WC', 'Déplacement standard'],
  },
]

const urgencyConfig: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'URGENT', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  2: { label: 'Semi-urgent', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  3: { label: 'Planifiable', color: '#16a34a', bg: '#f0fdf4', border: '#a7f3d0' },
}

const statusLabel: Record<string, string> = {
  new: 'Non traité',
  converted: 'Converti',
  closed: 'Fermé',
}

type Tab = 'all' | 'new' | 'urgent' | 'converted' | 'closed'

export default function Demandes() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('new')
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [demandesList, setDemandesList] = useState(allDemandes)
  const [toast, setToast] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showPlanif, setShowPlanif] = useState(false)
  const [planifForm, setPlanifForm] = useState({
    date: '', heure: '09:00', duree: '60', technicien: 'Marc Lefebvre',
    type: '', adresse: '', notes: ''
  })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const openPlanif = () => {
    if (!selected) return
    setPlanifForm({
      date: '', heure: '09:00', duree: '60',
      technicien: 'Marc Lefebvre',
      type: selected.problemType,
      adresse: selected.address,
      notes: selected.summary
    })
    setShowPlanif(true)
  }

  const closeSelected = () => {
    if (!selectedId) return
    setDemandesList(prev => prev.map(d => d.id === selectedId ? { ...d, status: 'closed' } : d))
    showToast('Demande fermée')
  }

  const filtered = demandesList.filter(d => {
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'new' ? d.status === 'new' :
      activeTab === 'urgent' ? d.urgency === 1 :
      activeTab === 'converted' ? d.status === 'converted' :
      activeTab === 'closed' ? d.status === 'closed' : true
    const matchType = !typeFilter || d.problemType === typeFilter
    return matchTab && matchType
  })

  const selected = demandesList.find(d => d.id === selectedId)

  const tabCounts: Record<Tab, number> = {
    all: demandesList.length,
    new: demandesList.filter(d => d.status === 'new').length,
    urgent: demandesList.filter(d => d.urgency === 1).length,
    converted: demandesList.filter(d => d.status === 'converted').length,
    closed: demandesList.filter(d => d.status === 'closed').length,
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Modal planification */}
      {showPlanif && selected && (
        <div className="modal-overlay" onClick={() => setShowPlanif(false)}>
          <div style={{
            background: 'white', borderRadius: 20, width: '90%', maxWidth: 560,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Planifier l'intervention</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{selected.name} · {selected.problemType}</div>
                </div>
              </div>
              <button onClick={() => setShowPlanif(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} color="white" />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Client info strip */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: User, text: selected.name },
                  { icon: Phone, text: selected.phone },
                  { icon: MapPin, text: selected.address },
                  { icon: Clock, text: `Disponibilité : ${selected.availability}` },
                ].map(({ icon: Ic, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ic size={13} color="#f97316" />
                    <span style={{ fontSize: 12.5, color: '#374151' }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* Date + Heure */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Date de l'intervention *
                  </label>
                  <input className="input-field" type="date"
                    value={planifForm.date}
                    onChange={e => setPlanifForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Heure de début *
                  </label>
                  <input className="input-field" type="time"
                    value={planifForm.heure}
                    onChange={e => setPlanifForm(f => ({ ...f, heure: e.target.value }))}
                  />
                </div>
              </div>

              {/* Durée + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Durée estimée
                  </label>
                  <select className="select-field" value={planifForm.duree} onChange={e => setPlanifForm(f => ({ ...f, duree: e.target.value }))}>
                    <option value="30">30 minutes</option>
                    <option value="60">1 heure</option>
                    <option value="90">1h30</option>
                    <option value="120">2 heures</option>
                    <option value="180">3 heures</option>
                    <option value="240">4 heures</option>
                    <option value="480">Journée complète</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    <Wrench size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Type d'intervention
                  </label>
                  <select className="select-field" value={planifForm.type} onChange={e => setPlanifForm(f => ({ ...f, type: e.target.value }))}>
                    <option>Chauffe-eau</option>
                    <option>Fuite</option>
                    <option>Débouchage</option>
                    <option>Robinetterie</option>
                    <option>Entretien</option>
                    <option>Rénovation</option>
                    <option>Autre</option>
                  </select>
                </div>
              </div>

              {/* Technicien */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  <User size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Technicien assigné
                </label>
                <select className="select-field" value={planifForm.technicien} onChange={e => setPlanifForm(f => ({ ...f, technicien: e.target.value }))}>
                  <option>Marc Lefebvre</option>
                  <option>Thomas Dupuis</option>
                  <option>Antoine Moreau</option>
                </select>
              </div>

              {/* Adresse */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />Adresse d'intervention
                </label>
                <input className="input-field" value={planifForm.adresse} onChange={e => setPlanifForm(f => ({ ...f, adresse: e.target.value }))} placeholder="Adresse complète" />
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Notes pour le technicien</label>
                <textarea className="input-field" rows={3} value={planifForm.notes} onChange={e => setPlanifForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none', fontSize: 13 }} />
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <button className="btn-secondary" onClick={() => setShowPlanif(false)} style={{ justifyContent: 'center' }}>Annuler</button>
                <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => {
                  if (!planifForm.date) { alert('Veuillez choisir une date'); return }
                  setShowPlanif(false)
                  setDemandesList(prev => prev.map(d => d.id === selectedId ? { ...d, status: 'converted' } : d))
                  showToast(`Intervention planifiée le ${new Date(planifForm.date).toLocaleDateString('fr-FR')} à ${planifForm.heure}`)
                  navigate('/planning')
                }}>
                  <Calendar size={15} /> Confirmer et planifier
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: 'white', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, fontWeight: 600, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={15} color="#10b981" /> {toast}
        </div>
      )}
      {/* Header */}
      <div className="page-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <PhoneCall size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Demandes entrantes</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Appels qualifiés par l'IA · Numéro dédié 09 72 XX XX XX</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f0fdf4', border: '1px solid #a7f3d0',
            borderRadius: 8, padding: '6px 12px'
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>IA active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '2px solid #f0f0f0',
        marginBottom: 20, overflowX: 'auto', gap: 0
      }}>
        {([
          ['all', 'Toutes'],
          ['new', 'Non traitées'],
          ['urgent', 'Urgentes'],
          ['converted', 'Converties'],
          ['closed', 'Fermées'],
        ] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
            {tabCounts[tab] > 0 && (
              <span style={{
                marginLeft: 6,
                background: activeTab === tab ? '#f97316' : '#f3f4f6',
                color: activeTab === tab ? 'white' : '#6b7280',
                fontSize: 10, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10
              }}>{tabCounts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {/* 2-col layout: list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(d => {
            const uc = urgencyConfig[d.urgency]
            const isSelected = d.id === selectedId
            return (
              <div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: `1.5px solid ${isSelected ? '#f97316' : d.urgency === 1 ? '#fecaca' : '#f0f0f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#f5f6fa',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {d.status === 'new' ? <PhoneOff size={15} color="#6b7280" /> : <CheckCircle size={15} color="#10b981" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{d.name}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{d.timeAgo} · {d.duration}</div>
                    </div>
                  </div>
                  <span
                    onClick={e => {
                      e.stopPropagation()
                      if (d.urgency === 1) setActiveTab('urgent')
                      else if (d.status === 'converted') setActiveTab('converted')
                      else if (d.status === 'closed') setActiveTab('closed')
                      else setActiveTab('new')
                    }}
                    title="Cliquer pour filtrer"
                    style={{
                      fontSize: 10.5, fontWeight: 700,
                      color: uc.color, background: uc.bg,
                      padding: '2px 7px', borderRadius: 8,
                      border: `1px solid ${uc.border}`,
                      flexShrink: 0, marginLeft: 4, cursor: 'pointer',
                    }}
                  >{uc.label}</span>
                </div>

                <div style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>
                  {d.summary.length > 90 ? d.summary.slice(0, 90) + '...' : d.summary}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    onClick={e => {
                      e.stopPropagation()
                      setTypeFilter(prev => prev === d.problemType ? '' : d.problemType)
                      setActiveTab('all')
                    }}
                    title={typeFilter === d.problemType ? 'Cliquer pour annuler le filtre' : 'Cliquer pour filtrer par type'}
                    style={{
                      fontSize: 11, fontWeight: 600,
                      background: typeFilter === d.problemType ? '#eff6ff' : '#f5f6fa',
                      color: typeFilter === d.problemType ? '#2563eb' : '#374151',
                      border: typeFilter === d.problemType ? '1px solid #bfdbfe' : '1px solid transparent',
                      padding: '2px 8px', borderRadius: 7, cursor: 'pointer',
                    }}
                  >{d.problemType}</span>
                  <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                    <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                    {d.address.split(',')[1]?.trim()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0', alignSelf: 'start' }}>

            {/* Urgency header */}
            {(() => {
              const uc = urgencyConfig[selected.urgency]
              return (
                <div style={{
                  background: uc.bg, border: `1.5px solid ${uc.border}`,
                  borderRadius: 10, padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20
                }}>
                  <Zap size={16} color={uc.color} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: uc.color }}>{uc.label}</span>
                  <span style={{ fontSize: 13, color: uc.color, opacity: 0.7 }}>· {selected.problemType}</span>
                </div>
              )
            })()}

            {/* Client info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Informations client
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: User, label: selected.name },
                  { icon: Phone, label: selected.phone },
                  { icon: MapPin, label: selected.address },
                  { icon: Clock, label: `Disponibilité : ${selected.availability}` },
                ].map(({ icon: Ic, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Ic size={15} color="#9ca3af" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#374151' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* IA résumé */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: 12, padding: '16px 18px', marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Bot size={16} color="#fb923c" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Résumé IA</span>
                <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 'auto' }}>
                  <Mic size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  {selected.duration}
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
                {selected.summary}
              </p>
            </div>

            {/* IA suggestions */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Prestations suggérées par l'IA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {selected.aiSuggestions.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px',
                    background: '#fff7ed', border: '1px solid #fed7aa',
                    borderRadius: 9
                  }}>
                    <CheckCircle size={14} color="#f97316" />
                    <span style={{ fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={openPlanif}>
                <Calendar size={16} /> Planifier l'intervention
              </button>
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} onClick={() => navigate('/devis', { state: { openCreate: true, client: selected?.name, problemType: selected?.problemType, urgency: selected?.urgency } })}>
                <FileText size={15} /> Créer un devis
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn-ghost" style={{ justifyContent: 'center', padding: '9px' }} onClick={() => { if (selected) window.location.href = `tel:${selected.phone.replace(/\s/g, '')}` }}>
                  <Phone size={14} /> Rappeler
                </button>
                <button className="btn-ghost" style={{ justifyContent: 'center', padding: '9px', color: '#9ca3af' }} onClick={closeSelected}>
                  <X size={14} /> Fermer
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            background: 'white', borderRadius: 14, padding: '60px 30px',
            border: '1px solid #f0f0f0', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12
          }}>
            <MessageSquare size={40} color="#d1d5db" />
            <span style={{ fontSize: 14, color: '#9ca3af' }}>Sélectionnez une demande</span>
          </div>
        )}
      </div>
    </div>
  )
}
