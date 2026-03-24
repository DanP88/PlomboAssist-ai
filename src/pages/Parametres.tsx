import { useState, useRef } from 'react'
import {
  Settings, Building, User, CreditCard, Bell,
  Wrench, CheckCircle, ChevronRight, Upload, Trash2,
  Plus, Edit, Star, X, Euro, CalendarDays
} from 'lucide-react'
import { getTarif, saveTarif, TarifConfig } from '../lib/tarification'
import { getWorkPlanning, saveWorkPlanning, WorkDay } from '../lib/planning'

const defaultPrestations = [
  { id: 1, cat: 'Dépannage', name: 'Remplacement joint robinet', price: 45, active: true },
  { id: 2, cat: 'Dépannage', name: 'Remplacement mitigeur cuisine', price: 120, active: true },
  { id: 3, cat: 'Dépannage', name: 'Remplacement mitigeur douche', price: 150, active: true },
  { id: 4, cat: 'Dépannage', name: 'Réparation fuite tuyauterie', price: 95, active: true },
  { id: 5, cat: 'Dépannage', name: 'Remplacement chasse d\'eau', price: 85, active: false },
  { id: 6, cat: 'Débouchage', name: 'Débouchage canalisation', price: 110, active: true },
  { id: 7, cat: 'Chauffe-eau', name: 'Remplacement chauffe-eau 150L', price: 950, active: true },
  { id: 8, cat: 'Chauffe-eau', name: 'Remplacement chauffe-eau 200L', price: 1100, active: true },
  { id: 9, cat: 'Entretien', name: 'Entretien chaudière gaz', price: 120, active: true },
  { id: 10, cat: 'Main d\'œuvre', name: 'Déplacement standard', price: 35, active: true },
  { id: 11, cat: 'Main d\'œuvre', name: 'Déplacement urgence', price: 65, active: true },
  { id: 12, cat: 'Main d\'œuvre', name: 'Main d\'œuvre horaire', price: 55, active: true },
]

const defaultNotifs = [
  { label: 'Nouvelle demande urgente', sub: 'Push immédiat dès qu\'un appel urgent est qualifié', push: true, sms: true },
  { label: 'Nouvelle demande (non urgente)', sub: 'Regroupées toutes les heures', push: true, sms: false },
  { label: 'Devis accepté', sub: 'Quand un client signe un devis', push: true, sms: false },
  { label: 'Facture en retard', sub: 'Quand une facture dépasse son échéance', push: true, sms: false },
  { label: 'Rapport hebdomadaire', sub: 'Chaque lundi à 8h — résumé de la semaine', push: true, sms: false },
]

type Section = 'entreprise' | 'prestations' | 'abonnement' | 'notifications' | 'tarification' | 'planning'

export default function Parametres() {
  const [section, setSection] = useState<Section>('entreprise')
  const [tarif, setTarif] = useState<TarifConfig>(getTarif)
  const [tarifSaved, setTarifSaved] = useState(false)
  const [workPlan, setWorkPlan] = useState<WorkDay[]>(getWorkPlanning)
  const [planSaved, setPlanSaved] = useState(false)

  function handleTarifChange(field: keyof TarifConfig, value: number) {
    setTarif(prev => ({ ...prev, [field]: value }))
  }

  function saveTarifConfig() {
    saveTarif(tarif)
    setTarifSaved(true)
    setTimeout(() => setTarifSaved(false), 2500)
  }
  const [saved, setSaved] = useState(false)
  const [prestationsList, setPrestationsList] = useState(defaultPrestations)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [notifs, setNotifs] = useState(defaultNotifs)
  const [planToast, setPlanToast] = useState('')
  const logoRef = useRef<HTMLInputElement>(null)
  const [newPrestation, setNewPrestation] = useState({ cat: 'Dépannage', name: '', price: '' })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleNotif = (i: number, type: 'push' | 'sms') => {
    setNotifs(prev => prev.map((n, idx) => idx === i ? { ...n, [type]: !n[type] } : n))
  }

  const startEdit = (p: typeof defaultPrestations[0]) => {
    setEditId(p.id)
    setEditPrice(p.price)
  }

  const saveEdit = () => {
    setPrestationsList(prev => prev.map(p => p.id === editId ? { ...p, price: editPrice } : p))
    setEditId(null)
  }

  const toggleActive = (id: number) => {
    setPrestationsList(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  const addPrestation = () => {
    if (!newPrestation.name || !newPrestation.price) return
    setPrestationsList(prev => [...prev, { id: Date.now(), cat: newPrestation.cat, name: newPrestation.name, price: Number(newPrestation.price), active: true }])
    setNewPrestation({ cat: 'Dépannage', name: '', price: '' })
    setShowAdd(false)
  }

  const showPlanToast = (name: string) => {
    setPlanToast(name)
    setTimeout(() => setPlanToast(''), 3000)
  }

  function handleWorkDayChange(idx: number, field: keyof WorkDay, value: boolean | number) {
    setWorkPlan(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  function saveWorkPlan() {
    saveWorkPlanning(workPlan)
    setPlanSaved(true)
    setTimeout(() => setPlanSaved(false), 2500)
  }

  const sections = [
    { id: 'entreprise' as Section, label: 'Mon entreprise', icon: Building },
    { id: 'prestations' as Section, label: 'Prestations', icon: Wrench },
    { id: 'tarification' as Section, label: 'Tarification', icon: Euro },
    { id: 'planning' as Section, label: 'Planning de travail', icon: CalendarDays },
    { id: 'notifications' as Section, label: 'Notifications', icon: Bell },
    { id: 'abonnement' as Section, label: 'Abonnement', icon: CreditCard },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Plan toast */}
      {planToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111827', color: 'white', borderRadius: 10, padding: '12px 18px', fontSize: 13.5, fontWeight: 600, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={15} color="#10b981" /> Demande de passage au {planToast} envoyée
        </div>
      )}

      {/* Modal ajouter prestation */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouvelle prestation</h2>
              <button className="btn-ghost" onClick={() => setShowAdd(false)} style={{ padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Catégorie</label>
                <select className="select-field" value={newPrestation.cat} onChange={e => setNewPrestation(p => ({ ...p, cat: e.target.value }))}>
                  {['Dépannage', 'Débouchage', 'Chauffe-eau', 'Entretien', 'Main d\'œuvre'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nom de la prestation</label><input className="input-field" placeholder="Ex: Remplacement siphon" value={newPrestation.name} onChange={e => setNewPrestation(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Prix (€ HT)</label><input className="input-field" type="number" placeholder="0" value={newPrestation.price} onChange={e => setNewPrestation(p => ({ ...p, price: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                <button className="btn-secondary" onClick={() => setShowAdd(false)} style={{ justifyContent: 'center' }}>Annuler</button>
                <button className="btn-primary" onClick={addPrestation} style={{ justifyContent: 'center' }}>Ajouter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for logo */}
      <input ref={logoRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={() => {}} />

      {/* Header */}
      <div className="page-header">
        <div className="page-icon" style={{ background: 'linear-gradient(135deg, #6b7280, #374151)' }}>
          <Settings size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Paramètres</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Gérez votre compte et vos préférences</p>
        </div>
      </div>

      <div className="grid-2-1" style={{ gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Nav */}
        <div style={{ background: 'white', borderRadius: 14, padding: '12px', border: '1px solid #f0f0f0', alignSelf: 'start' }}>
          {sections.map(s => {
            const Ic = s.icon
            const isActive = section === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9, marginBottom: 4,
                  background: isActive ? '#fff7ed' : 'transparent',
                  border: `1px solid ${isActive ? '#fed7aa' : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left',
                  color: isActive ? '#f97316' : '#374151',
                  fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.15s'
                }}
              >
                <Ic size={15} color={isActive ? '#f97316' : '#6b7280'} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div>
          {/* Saved banner */}
          {saved && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10,
              padding: '10px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle size={15} color="#10b981" />
              <span style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 600 }}>Modifications enregistrées</span>
            </div>
          )}

          {/* Entreprise */}
          {section === 'entreprise' && (
            <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 22 }}>Mon entreprise</h2>

              {/* Logo */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Logo de l'entreprise</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 14,
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 22, fontWeight: 800
                  }}>PL</div>
                  <div>
                    <button className="btn-secondary" style={{ fontSize: 13, marginBottom: 6 }} onClick={() => logoRef.current?.click()}>
                      <Upload size={14} /> Changer le logo
                    </button>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>PNG ou JPG · Max 2 Mo</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Nom de l\'entreprise', value: 'Plomberie Lefebvre' },
                  { label: 'Prénom (affiché dans les SMS)', value: 'Marc' },
                  { label: 'SIRET', value: '82 345 678 900 012' },
                  { label: 'N° TVA', value: 'FR 12 823456789' },
                  { label: 'Téléphone', value: '06 78 90 12 34' },
                  { label: 'Email', value: 'marc@plomberie-lefebvre.fr' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                    <input className="input-field" defaultValue={f.value} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Adresse</label>
                <input className="input-field" defaultValue="24 rue des Artisans, 69004 Lyon" />
              </div>

              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>TVA par défaut</label>
                  <select className="select-field">
                    <option selected>10% (travaux de rénovation)</option>
                    <option>20% (fournitures / neuf)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Validité devis (jours)</label>
                  <input className="input-field" type="number" defaultValue="30" />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Mentions légales sur les devis</label>
                <textarea
                  className="input-field"
                  rows={3}
                  defaultValue="TVA applicable au taux de 10% pour travaux de rénovation dans des logements de plus de 2 ans. Devis valable 30 jours à compter de sa date d'émission."
                  style={{ resize: 'none', fontSize: 13 }}
                />
              </div>

              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleSave}>
                  <CheckCircle size={15} /> Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* Prestations */}
          {section === 'prestations' && (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Bibliothèque de prestations</h2>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>{prestationsList.filter(p => p.active).length} prestations actives</p>
                </div>
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>
                  <Plus size={14} /> Ajouter une prestation
                </button>
              </div>

              {(['Dépannage', 'Débouchage', 'Chauffe-eau', 'Entretien', 'Main d\'œuvre'] as string[]).map(cat => {
                const catPrests = prestationsList.filter(p => p.cat === cat)
                if (catPrests.length === 0) return null
                return (
                  <div key={cat}>
                    <div style={{ padding: '10px 24px', background: '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat}</span>
                    </div>
                    {catPrests.map(p => (
                      <div key={p.id} style={{
                        display: 'flex', alignItems: 'center', padding: '12px 24px',
                        borderBottom: '1px solid #f5f5f5',
                        opacity: p.active ? 1 : 0.5
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13.5, color: '#111827', fontWeight: 500 }}>{p.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          {editId === p.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))}
                                style={{ width: 70, padding: '4px 8px', border: '1.5px solid #f97316', borderRadius: 7, fontSize: 13.5, fontWeight: 700, textAlign: 'right' }} />
                              <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={saveEdit}>OK</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', minWidth: 60, textAlign: 'right' }}>{p.price} €</span>
                          )}
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => startEdit(p)}>
                            <Edit size={13} />
                          </button>
                          <div style={{ width: 1, height: 18, background: '#f0f0f0' }} />
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: p.active ? '#16a34a' : '#9ca3af',
                            background: p.active ? '#f0fdf4' : '#f3f4f6',
                            padding: '2px 8px', borderRadius: 6, cursor: 'pointer'
                          }} onClick={() => toggleActive(p.id)}>
                            {p.active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Tarification */}
          {section === 'tarification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tarifSaved && (
                <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 600 }}>Tarification enregistrée</span>
                </div>
              )}

              {/* Tarifs de base */}
              <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Tarifs de base</h2>
                <p style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 20 }}>Ces tarifs sont utilisés par l'assistant IA pour estimer le coût lors de la prise de rendez-vous.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { field: 'tauxHoraireBase' as keyof TarifConfig, label: 'Taux horaire main d\'œuvre', unit: '€/h', hint: 'Prix de la main d\'œuvre par heure' },
                    { field: 'fraisDeplacementBase' as keyof TarifConfig, label: 'Forfait déplacement', unit: '€', hint: 'Coût fixe du déplacement aller-retour' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-field"
                          type="number" min={0}
                          value={tarif[f.field] as number}
                          onChange={e => handleTarifChange(f.field, Number(e.target.value))}
                          style={{ paddingRight: 40 }}
                        />
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{f.unit}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{f.hint}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Majorations */}
              <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Majorations tarifaires (%)</h2>
                <p style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 20 }}>Ces pourcentages s'appliquent automatiquement au tarif de base selon les conditions d'intervention.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { field: 'majorUrgence' as keyof TarifConfig,  label: 'Urgence', desc: 'Intervention urgente demandée par le client', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                    { field: 'majorWeekend' as keyof TarifConfig,  label: 'Samedi / Dimanche', desc: 'Toute intervention planifiée le week-end', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    { field: 'majorNuit' as keyof TarifConfig,     label: 'Nuit (20h–7h)', desc: 'Intervention entre 20h00 et 07h00', color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
                    { field: 'majorFerie' as keyof TarifConfig,    label: 'Jour férié', desc: 'Tout jour férié officiel', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                  ].map((f, i, arr) => (
                    <div key={f.field} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none',
                      gap: 16
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 700, color: f.color,
                            background: f.bg, border: `1px solid ${f.border}`,
                            padding: '2px 8px', borderRadius: 6
                          }}>{f.label}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#6b7280' }}>{f.desc}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number" min={0} max={300}
                            value={tarif[f.field] as number}
                            onChange={e => handleTarifChange(f.field, Number(e.target.value))}
                            style={{
                              width: 80, padding: '6px 30px 6px 10px', border: '1.5px solid #e5e7eb',
                              borderRadius: 8, fontSize: 15, fontWeight: 700, color: f.color,
                              textAlign: 'right', outline: 'none',
                            }}
                            onFocus={e => (e.currentTarget.style.borderColor = f.color)}
                            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                          />
                          <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af', fontWeight: 700, pointerEvents: 'none' }}>%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', minWidth: 90 }}>
                          ex. 100€ → <strong style={{ color: '#111827' }}>{Math.round(100 * (1 + (tarif[f.field] as number) / 100))} €</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planning IA */}
              <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Planning IA — Paramètres de créneau</h2>
                <p style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 20 }}>Ces valeurs sont utilisées par l'assistant pour calculer le meilleur créneau disponible entre deux interventions.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { field: 'trajetDefaut' as keyof TarifConfig, label: 'Temps de trajet moyen', unit: 'min', hint: 'Durée estimée entre deux clients' },
                    { field: 'margeMin' as keyof TarifConfig,     label: 'Marge de sécurité', unit: 'min', hint: 'Tampon supplémentaire avant/après chaque RDV' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-field"
                          type="number" min={0} max={120}
                          value={tarif[f.field] as number}
                          onChange={e => handleTarifChange(f.field, Number(e.target.value))}
                          style={{ paddingRight: 44 }}
                        />
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{f.unit}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{f.hint}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 16, background: '#f5f6fa', borderRadius: 10, padding: '12px 14px',
                  fontSize: 12.5, color: '#6b7280', lineHeight: 1.6
                }}>
                  Tampon total entre 2 RDV : <strong style={{ color: '#111827' }}>{tarif.trajetDefaut + tarif.margeMin} min</strong>
                  {' '}({tarif.trajetDefaut} min trajet + {tarif.margeMin} min marge)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={saveTarifConfig}>
                  <CheckCircle size={15} /> Enregistrer la tarification
                </button>
              </div>
            </div>
          )}

          {/* Planning de travail */}
          {section === 'planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {planSaved && (
                <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span style={{ fontSize: 13.5, color: '#16a34a', fontWeight: 600 }}>Planning enregistré — l'IA en tiendra compte pour les prochains RDV</span>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Mes horaires de travail — 14 prochains jours</h2>
                  <p style={{ fontSize: 12.5, color: '#9ca3af' }}>
                    L'assistant téléphonique IA utilise ces horaires pour proposer des créneaux de rendez-vous uniquement pendant vos heures de travail.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {workPlan.map((day, idx) => {
                    const d = new Date(day.date + 'T12:00:00')
                    const dow = d.getDay()
                    const isWeekend = dow === 0 || dow === 6
                    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'long' })
                    const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    const dayCapital = dayName.charAt(0).toUpperCase() + dayName.slice(1)

                    return (
                      <div key={day.date} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 0',
                        borderBottom: idx < workPlan.length - 1 ? '1px solid #f5f5f5' : 'none',
                        opacity: day.active ? 1 : 0.45,
                      }}>
                        {/* Jour */}
                        <div style={{ width: 130, flexShrink: 0 }}>
                          <div style={{
                            fontSize: 13.5, fontWeight: 700,
                            color: isWeekend ? '#7c3aed' : '#111827',
                          }}>{dayCapital}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{dateLabel}</div>
                        </div>

                        {/* Toggle actif */}
                        <div
                          onClick={() => handleWorkDayChange(idx, 'active', !day.active)}
                          style={{
                            width: 38, height: 22, borderRadius: 11,
                            background: day.active ? '#f97316' : '#e5e7eb',
                            cursor: 'pointer', transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center',
                            padding: '3px',
                            justifyContent: day.active ? 'flex-end' : 'flex-start',
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>

                        {/* Heures */}
                        {day.active ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: '#6b7280' }}>De</span>
                              <select
                                value={day.startH}
                                onChange={e => handleWorkDayChange(idx, 'startH', Number(e.target.value))}
                                style={{ padding: '4px 6px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#111827', outline: 'none', cursor: 'pointer' }}
                              >
                                {Array.from({ length: 24 }, (_, h) => (
                                  <option key={h} value={h}>{String(h).padStart(2,'0')}h00</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, color: '#6b7280' }}>à</span>
                              <select
                                value={day.endH}
                                onChange={e => handleWorkDayChange(idx, 'endH', Number(e.target.value))}
                                style={{ padding: '4px 6px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#111827', outline: 'none', cursor: 'pointer' }}
                              >
                                {Array.from({ length: 24 }, (_, h) => (
                                  <option key={h} value={h}>{String(h).padStart(2,'0')}h00</option>
                                ))}
                              </select>
                            </div>
                            <span style={{
                              fontSize: 11.5, color: '#f97316', fontWeight: 600,
                              background: '#fff7ed', padding: '2px 8px', borderRadius: 6
                            }}>
                              {day.endH - day.startH}h de travail
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: '#9ca3af', fontStyle: 'italic' }}>Jour de repos — aucun RDV proposé par l'IA</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={saveWorkPlan}>
                  <CheckCircle size={15} /> Enregistrer le planning
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <div style={{ background: 'white', borderRadius: 14, padding: '24px 26px', border: '1px solid #f0f0f0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 22 }}>Préférences de notification</h2>
              {notifs.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{n.label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{n.sub}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginLeft: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 4 }}>Push</div>
                      <div onClick={() => toggleNotif(i, 'push')} style={{
                        width: 28, height: 16, borderRadius: 8,
                        background: n.push ? '#f97316' : '#e5e7eb',
                        cursor: 'pointer', transition: 'background 0.2s',
                        display: 'flex', alignItems: 'center',
                        padding: '2px',
                        justifyContent: n.push ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 4 }}>SMS</div>
                      <div onClick={() => toggleNotif(i, 'sms')} style={{
                        width: 28, height: 16, borderRadius: 8,
                        background: n.sms ? '#f97316' : '#e5e7eb',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        padding: '2px',
                        justifyContent: n.sms ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleSave}>Enregistrer</button>
              </div>
            </div>
          )}

          {/* Abonnement */}
          {section === 'abonnement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: 14, padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Votre plan actuel</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>Plan PRO</div>
                    <div style={{ fontSize: 15, color: '#fb923c', fontWeight: 600 }}>89 € / mois</div>
                  </div>
                  <div style={{ background: 'rgba(249,115,22,0.15)', borderRadius: 12, padding: '10px 16px', border: '1px solid rgba(249,115,22,0.3)' }}>
                    <div style={{ fontSize: 11, color: '#fb923c' }}>Prochain paiement</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>1er avril 2024</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {[
                    '500 appels IA/mois', '200 SMS/mois', 'Devis illimités',
                    'Signature électronique', 'Avis Google auto', 'Support chat'
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 12px' }}>
                      <CheckCircle size={12} color="#fb923c" />
                      <span style={{ fontSize: 12.5, color: '#d1d5db' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: '22px 24px', border: '1px solid #f0f0f0' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Consommation ce mois</h3>
                {[
                  { label: 'Appels IA', used: 42, total: 500, color: '#3b82f6' },
                  { label: 'SMS envoyés', used: 87, total: 200, color: '#f97316' },
                ].map(u => (
                  <div key={u.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13.5, color: '#374151', fontWeight: 500 }}>{u.label}</span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{u.used} / {u.total}</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${u.used / u.total * 100}%`, background: u.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #f5f5f5' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Passer à un plan supérieur</h3>
                </div>
                {[
                  { name: 'Plan ÉQUIPE', price: '149 €/mois', features: 'Jusqu\'à 4 utilisateurs · Multi-techniciens · 500 SMS · Stock simplifié', highlight: false },
                  { name: 'Plan ENTERPRISE', price: 'Sur devis', features: 'Utilisateurs illimités · API · Formation dédiée · SLA garanti', highlight: false },
                ].map(plan => (
                  <div key={plan.name} style={{ padding: '16px 24px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 12.5, color: '#6b7280' }}>{plan.features}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{plan.price}</span>
                      <button className="btn-outline" style={{ fontSize: 13, whiteSpace: 'nowrap' }} onClick={() => showPlanToast(plan.name)}>Passer à ce plan</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
