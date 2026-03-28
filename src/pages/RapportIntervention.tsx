import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ClipboardList, Clock, Camera, PenLine, Package, CheckCircle,
  Play, Square, Trash2, Plus, ChevronDown, Navigation, Phone,
  MapPin, X, FileText, AlertCircle, User
} from 'lucide-react'
import { getInterventions, Intervention } from '../lib/agenda'
import { getStock, Materiau, enregistrerUtilisation } from '../lib/stock'

interface LigneMateriaux {
  id: string
  materiauId?: number   // id dans le stock, pour la déduction
  nom: string
  quantite: number
  unite: string
  prixUnitaire: number
}

interface Rapport {
  id: string
  interventionId?: string
  clientNom: string
  clientTel: string
  adresse: string
  date: string
  typeIntervention: string
  problemeConstate: string
  travauxRealises: string
  recommandations: string
  materiaux: LigneMateriaux[]
  photos: string[]
  signature?: string
  dureeMinutes: number
  status: 'brouillon' | 'termine' | 'facture'
  createdAt: string
}

function getRapports(): Rapport[] {
  try { return JSON.parse(localStorage.getItem('plombo_rapports') || '[]') } catch { return [] }
}
function saveRapport(r: Rapport) {
  const all = getRapports().filter(x => x.id !== r.id)
  localStorage.setItem('plombo_rapports', JSON.stringify([r, ...all]))
}

const TRAVAUX_SUGGESTIONS: Record<string, string[]> = {
  "Fuite d'eau":  ['Remplacement joint défectueux', 'Resserrage raccord', 'Remplacement tube flexible', 'Soudure brasage cuivre'],
  'Débouchage':   ['Débouchage méthode mécanique', 'Débouchage haute pression', 'Inspection caméra', 'Remplacement siphon'],
  'Chauffe-eau':  ['Remplacement résistance', 'Remplacement thermostat', 'Remplacement groupe de sécurité', 'Installation chauffe-eau neuf', 'Purge et détartrage'],
  'Entretien':    ['Entretien chaudière annuel', 'Vérification circuits', 'Nettoyage brûleur', 'Remplacement filtre', 'Rapport de maintenance établi'],
  'Robinetterie': ['Remplacement robinet', 'Remplacement cartouche', 'Remplacement joint céramique', 'Pose mitigeur thermostatique'],
  'Rénovation':   ['Pose tuyauterie cuivre', 'Pose tuyauterie PER', 'Dépose ancienne installation', 'Raccordement réseau'],
}

const INTERVENTION_TYPES = ["Fuite d'eau", 'Débouchage', 'Chauffe-eau', 'Entretien', 'Robinetterie', 'Rénovation', 'Autre']

export default function RapportIntervention() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const interventionId = searchParams.get('id')
  const interventions = getInterventions()
  const stock = getStock()

  const prefill = interventionId ? interventions.find(i => i.id === interventionId) : null

  const [clientNom, setClientNom] = useState(prefill?.client ?? '')
  const [clientTel, setClientTel] = useState(prefill?.phone ?? '')
  const [adresse, setAdresse] = useState(prefill?.address ?? '')
  const [typeIntervention, setTypeIntervention] = useState(prefill?.type ?? "Fuite d'eau")
  const [date, setDate] = useState(() => {
    if (prefill?.date) return prefill.date
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [problemeConstate, setProblemeConstate] = useState('')
  const [travauxRealises, setTravauxRealises] = useState('')
  const [recommandations, setRecommandations] = useState('')
  const [materiaux, setMateriaux] = useState<LigneMateriaux[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [signature, setSignature] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)
  const [showStockPicker, setShowStockPicker] = useState(false)
  const [stockSearch, setStockSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Chronomètre
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = () => {
    setTimerRunning(true)
    timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000)
  }
  const stopTimer = () => {
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }
  const resetTimer = () => { stopTimer(); setTimerSeconds(0) }
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // Photos
  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(file)
    })
  }

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{x:number;y:number} | null>(null)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = true
    const canvas = canvasRef.current!
    lastPos.current = getPos(e, canvas)
  }
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos
  }
  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = false
    setSignature(canvasRef.current?.toDataURL())
  }
  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(undefined)
  }

  // Materiaux
  const addMateriau = (m: Materiau) => {
    setMateriaux(prev => [...prev, {
      id: Date.now().toString(),
      materiauId: m.id,
      nom: m.nom,
      quantite: 1,
      unite: m.unite,
      prixUnitaire: m.prixUnitaire,
    }])
    setShowStockPicker(false)
    setStockSearch('')
  }
  const removeMateriau = (id: string) => setMateriaux(prev => prev.filter(m => m.id !== id))
  const updateMateriauQty = (id: string, q: number) =>
    setMateriaux(prev => prev.map(m => m.id === id ? { ...m, quantite: Math.max(0.1, q) } : m))

  const totalMat = materiaux.reduce((s, m) => s + m.quantite * m.prixUnitaire, 0)
  const filteredStock = stock.filter(m =>
    m.nom.toLowerCase().includes(stockSearch.toLowerCase()) ||
    m.reference.toLowerCase().includes(stockSearch.toLowerCase())
  )

  const [stockUpdated, setStockUpdated] = useState(false)

  const handleSave = (status: 'brouillon' | 'termine') => {
    const r: Rapport = {
      id: interventionId ? `rap-${interventionId}` : `rap-${Date.now()}`,
      interventionId: interventionId ?? undefined,
      clientNom, clientTel, adresse, date, typeIntervention,
      problemeConstate, travauxRealises, recommandations,
      materiaux, photos, signature,
      dureeMinutes: Math.round(timerSeconds / 60),
      status,
      createdAt: new Date().toISOString(),
    }
    saveRapport(r)

    // Déduire du stock uniquement à la finalisation et si pas déjà fait
    if (status === 'termine' && !stockUpdated && materiaux.length > 0) {
      const lignes = materiaux
        .filter(m => m.materiauId !== undefined)
        .map(m => ({
          materiauId: m.materiauId!,
          nomMateriau: m.nom,
          quantite: m.quantite,
          unite: m.unite,
        }))
      if (lignes.length > 0) {
        enregistrerUtilisation({
          date,
          intervention: typeIntervention,
          client: clientNom,
          lignes,
          note: `Rapport chantier — ${travauxRealises.slice(0, 80)}`,
        })
        setStockUpdated(true)
      }
    }

    setSaved(true)
    if (status === 'termine') setTimeout(() => navigate('/planning'), 1200)
  }

  const handleGPS = () => {
    if (adresse) window.open(`https://maps.google.com/?q=${encodeURIComponent(adresse)}`, '_blank')
  }

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ClipboardList size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Rapport d'intervention</h1>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
              {prefill ? `Lié à ${prefill.type} — ${prefill.client}` : 'Nouveau rapport'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleSave('brouillon')} style={{
            padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
            background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            Sauvegarder
          </button>
          <button onClick={() => handleSave('termine')} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#f97316,#ea580c)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)'
          }}>
            <CheckCircle size={14} />
            Finaliser le rapport
          </button>
        </div>
      </div>

      {saved && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#16a34a', fontSize: 13, fontWeight: 600
        }}>
          <CheckCircle size={16} /> Rapport sauvegardé avec succès
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Colonne gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Infos client */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} color="#f97316" /> Informations client & chantier
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nom client *</label>
                <input value={clientNom} onChange={e => setClientNom(e.target.value)}
                  placeholder="M. Dupont Jean"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Téléphone</label>
                <input value={clientTel} onChange={e => setClientTel(e.target.value)}
                  placeholder="06 12 34 56 78"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Adresse du chantier</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={adresse} onChange={e => setAdresse(e.target.value)}
                    placeholder="12 rue des Lilas, 75011 Paris"
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
                  <button onClick={handleGPS} title="Ouvrir dans Google Maps" style={{
                    padding: '8px 12px', borderRadius: 7, border: '1.5px solid #bfdbfe',
                    background: '#eff6ff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0
                  }}>
                    <Navigation size={13} /> GPS
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Type d'intervention</label>
                <select value={typeIntervention} onChange={e => setTypeIntervention(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', background: 'white' }}>
                  {INTERVENTION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Problème + Travaux */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} color="#f97316" /> Constat & Travaux réalisés
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Problème constaté</label>
                <textarea value={problemeConstate} onChange={e => setProblemeConstate(e.target.value)}
                  rows={3} placeholder="Décrire le problème constaté à l'arrivée…"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Travaux réalisés</label>
                  <button onClick={() => setShowSuggestions(s => !s)} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 6, border: '1px solid #e5e7eb',
                    background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontWeight: 600
                  }}>
                    Suggestions ↓
                  </button>
                </div>
                {showSuggestions && (
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(TRAVAUX_SUGGESTIONS[typeIntervention] ?? TRAVAUX_SUGGESTIONS["Fuite d'eau"]).map(s => (
                      <button key={s} onClick={() => {
                        setTravauxRealises(prev => prev ? prev + '\n• ' + s : '• ' + s)
                        setShowSuggestions(false)
                      }} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fed7aa',
                        background: '#fff7ed', color: '#ea580c', cursor: 'pointer', fontWeight: 500
                      }}>{s}</button>
                    ))}
                  </div>
                )}
                <textarea value={travauxRealises} onChange={e => setTravauxRealises(e.target.value)}
                  rows={4} placeholder="Décrire les travaux réalisés…"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>Recommandations / Observations</label>
                <textarea value={recommandations} onChange={e => setRecommandations(e.target.value)}
                  rows={2} placeholder="Travaux à prévoir, observations importantes…"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>

          {/* Matériaux utilisés */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={14} color="#f97316" /> Matériaux utilisés
              </h3>
              <button onClick={() => setShowStockPicker(true)} style={{
                padding: '6px 12px', borderRadius: 7, border: '1.5px solid #f97316',
                background: '#fff7ed', color: '#f97316', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <Plus size={12} /> Depuis le stock
              </button>
              <button onClick={() => setMateriaux(prev => [...prev, { id: Date.now().toString(), nom: '', quantite: 1, unite: 'pcs', prixUnitaire: 0 }])} style={{
                padding: '6px 12px', borderRadius: 7, border: '1.5px solid #e5e7eb',
                background: '#f9fafb', color: '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <Plus size={12} /> Saisie libre
              </button>
            </div>

            {showStockPicker && (
              <div style={{ marginBottom: 12, background: '#f9fafb', borderRadius: 8, padding: 10, border: '1px solid #e5e7eb' }}>
                <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                  placeholder="Rechercher un matériau…"
                  autoFocus
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 12, boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredStock.slice(0, 12).map(m => (
                    <button key={m.id} onClick={() => addMateriau(m)} style={{
                      width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 6,
                      border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>{m.nom}</span>
                      <span style={{ color: '#9ca3af' }}>{m.prixUnitaire} €/{m.unite}</span>
                    </button>
                  ))}
                  {filteredStock.length === 0 && <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Aucun résultat</p>}
                </div>
                <button onClick={() => setShowStockPicker(false)} style={{
                  marginTop: 8, fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer'
                }}>Fermer</button>
              </div>
            )}

            {materiaux.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, fontStyle: 'italic' }}>Aucun matériau ajouté</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Matériau', 'Qté', 'Unité', 'PU', 'Total', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materiaux.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '7px 8px' }}>
                        {m.materiauId
                          ? <><div style={{ fontWeight: 500, color: '#111827', fontSize: 12 }}>{m.nom}</div>
                             <div style={{ fontSize: 10, color: '#16a34a', marginTop: 1 }}>✓ lié au stock</div></>
                          : <><input value={m.nom} onChange={e => setMateriaux(prev => prev.map(x => x.id === m.id ? { ...x, nom: e.target.value } : x))}
                              placeholder="Nom du matériau"
                              style={{ width: '100%', padding: '3px 6px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 11 }} />
                             <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>hors stock</div></>
                        }
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <input type="number" value={m.quantite} min={0.1} step={0.1}
                          onChange={e => updateMateriauQty(m.id, parseFloat(e.target.value))}
                          style={{ width: 56, padding: '3px 6px', borderRadius: 5, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      </td>
                      <td style={{ padding: '7px 8px', color: '#6b7280' }}>{m.unite}</td>
                      <td style={{ padding: '7px 8px', color: '#6b7280' }}>{m.prixUnitaire} €</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#111827' }}>
                        {(m.quantite * m.prixUnitaire).toFixed(2)} €
                      </td>
                      <td style={{ padding: '7px 8px' }}>
                        <button onClick={() => removeMateriau(m.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2
                        }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: '#374151', fontSize: 13 }}>Total matériaux</td>
                    <td colSpan={2} style={{ padding: '8px 8px', fontWeight: 800, color: '#f97316', fontSize: 14 }}>{totalMat.toFixed(2)} €</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Photos */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Camera size={14} color="#f97316" /> Photos avant / après
              </h3>
              <label style={{
                padding: '6px 12px', borderRadius: 7, border: '1.5px solid #f97316',
                background: '#fff7ed', color: '#f97316', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}>
                <Plus size={12} /> Ajouter photos
                <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} capture="environment" />
              </label>
            </div>
            {photos.length === 0 ? (
              <div style={{
                border: '2px dashed #e5e7eb', borderRadius: 8, padding: '24px', textAlign: 'center',
                color: '#9ca3af', fontSize: 12
              }}>
                📸 Prenez ou importez des photos avant/après le chantier
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Photo ${i+1}`} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, pi) => pi !== i))} style={{
                      position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Chronomètre */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#f97316" /> Chronomètre d'intervention
            </h3>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 40, fontWeight: 800, color: timerRunning ? '#f97316' : '#111827',
                fontVariantNumeric: 'tabular-nums', letterSpacing: 2, fontFamily: 'monospace',
                transition: 'color 0.2s'
              }}>
                {formatTimer(timerSeconds)}
              </div>
              <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
                {timerSeconds > 0 ? `${Math.ceil(timerSeconds / 60)} minutes` : 'Prêt à démarrer'}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
                {!timerRunning ? (
                  <button onClick={startTimer} style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
                  }}>
                    <Play size={13} fill="white" /> Démarrer
                  </button>
                ) : (
                  <button onClick={stopTimer} style={{
                    padding: '9px 20px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(239,68,68,0.3)'
                  }}>
                    <Square size={13} fill="white" /> Arrêter
                  </button>
                )}
                <button onClick={resetTimer} style={{
                  padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                  background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}>
                  Reset
                </button>
              </div>
            </div>
            {timerSeconds > 0 && (
              <div style={{
                marginTop: 12, padding: '8px 12px', background: '#fff7ed', borderRadius: 7,
                border: '1px solid #fed7aa', fontSize: 11, color: '#92400e', textAlign: 'center'
              }}>
                💰 À 55 €/h → <strong>{(Math.ceil(timerSeconds / 3600) * 55).toFixed(0)} €</strong> de main d'œuvre
              </div>
            )}
          </div>

          {/* Signature client */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <PenLine size={14} color="#f97316" /> Signature client
              </h3>
              {signature && (
                <button onClick={clearSignature} style={{
                  fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600
                }}>Effacer</button>
              )}
            </div>
            <div style={{
              border: '2px solid ' + (signature ? '#22c55e' : '#e5e7eb'),
              borderRadius: 8, overflow: 'hidden', background: '#fafafa', position: 'relative'
            }}>
              <canvas
                ref={canvasRef}
                width={300} height={120}
                style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
              />
              {!signature && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', pointerEvents: 'none'
                }}>
                  <span style={{ color: '#d1d5db', fontSize: 12 }}>Signez ici avec le doigt ou la souris</span>
                </div>
              )}
            </div>
            {signature && (
              <div style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 5,
                color: '#16a34a', fontSize: 11, fontWeight: 600
              }}>
                <CheckCircle size={12} /> Signature enregistrée
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Récapitulatif</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Client', value: clientNom || '—' },
                { label: 'Adresse', value: adresse || '—' },
                { label: 'Type', value: typeIntervention },
                { label: 'Durée chrono', value: timerSeconds > 0 ? `${Math.ceil(timerSeconds/60)} min` : '—' },
                { label: 'Matériaux', value: `${materiaux.length} article(s)` },
                { label: 'Coût matériaux', value: `${totalMat.toFixed(2)} €` },
                { label: 'Stock', value: stockUpdated ? '✓ Mis à jour' : materiaux.length > 0 ? 'Mis à jour à la finalisation' : '—' },
                { label: 'Photos', value: `${photos.length} photo(s)` },
                { label: 'Signature', value: signature ? '✓ Obtenue' : 'En attente' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#6b7280' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
              <button onClick={() => {
                handleSave('termine')
                setTimeout(() => navigate('/devis'), 800)
              }} style={{
                width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                background: '#111827', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <FileText size={14} /> Générer une facture
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
