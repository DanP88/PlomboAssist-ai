import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, Plus, Trash2, CheckCircle, ClipboardList, Package } from 'lucide-react'
import { getStock, enregistrerUtilisation, type Materiau } from '../lib/stock'

interface Ligne {
  materiauId: number
  nomMateriau: string
  quantite: number
  unite: string
}

export default function SaisieMateriaux() {
  const navigate = useNavigate()
  const [stock, setStock] = useState<Materiau[]>([])
  const [intervention, setIntervention] = useState('')
  const [client, setClient] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [search, setSearch] = useState('')
  const [showSuggestions, setSuggestions] = useState(false)
  const [qteInput, setQteInput] = useState('')
  const [selectedMat, setSelectedMat] = useState<Materiau | null>(null)
  const [note, setNote] = useState('')
  const [success, setSuccess] = useState(false)

  // Voice
  const [recording, setRecording] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => { setStock(getStock()) }, [])

  const suggestions = stock.filter(m =>
    search.length > 0 &&
    (m.nom.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 6)

  function selectMat(mat: Materiau) {
    setSelectedMat(mat)
    setSearch(mat.nom)
    setSuggestions(false)
    setQteInput('')
  }

  function ajouterLigne() {
    if (!selectedMat || !qteInput || parseFloat(qteInput) <= 0) return
    const qte = parseFloat(qteInput)
    setLignes(prev => {
      const existing = prev.findIndex(l => l.materiauId === selectedMat.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing].quantite += qte
        return updated
      }
      return [...prev, { materiauId: selectedMat.id, nomMateriau: selectedMat.nom, quantite: qte, unite: selectedMat.unite }]
    })
    setSearch('')
    setSelectedMat(null)
    setQteInput('')
  }

  function supprimerLigne(idx: number) {
    setLignes(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    if (lignes.length === 0) return
    enregistrerUtilisation({
      date,
      intervention,
      client,
      lignes,
      note,
    })
    setSuccess(true)
    setTimeout(() => navigate('/stock'), 1800)
  }

  // Web Speech API
  function toggleVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('La reconnaissance vocale n\'est pas supportée sur ce navigateur. Utilisez Chrome ou Edge.')
      return
    }
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    let finalText = voiceText

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += (finalText ? ' ' : '') + transcript
        } else {
          interim = transcript
        }
      }
      setVoiceText(finalText + (interim ? ' ' + interim : ''))
    }
    recognition.onend = () => { setRecording(false); setVoiceText(finalText) }
    recognition.onerror = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Saisie enregistrée !</div>
          <div style={{ fontSize: 13.5, color: '#6b7280' }}>Le stock a été mis à jour automatiquement.</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Redirection vers le stock…</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)' }}>
          <ClipboardList size={20} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Saisir les matériaux utilisés</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Après chaque intervention — le stock se met à jour automatiquement</p>
        </div>
      </div>

      {/* Infos intervention */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '20px 22px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#374151' }}>Informations de l'intervention</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Référence intervention</label>
            <input value={intervention} onChange={e => setIntervention(e.target.value)} placeholder="Ex : INT-2026-089" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Client</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Nom du client" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      {/* Voice */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>Dictée vocale <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>— optionnel, aide-mémoire</span></h3>
          <button
            onClick={toggleVoice}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: recording ? '#fef2f2' : '#fff7ed',
              color: recording ? '#dc2626' : '#f97316',
              boxShadow: recording ? '0 0 0 3px rgba(220,38,38,0.15)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {recording ? <><MicOff size={15} /> Arrêter l'enregistrement</> : <><Mic size={15} /> Dicter les matériaux</>}
          </button>
        </div>
        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 14px', background: '#fef2f2', borderRadius: 9 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>Enregistrement en cours… Parlez clairement</span>
          </div>
        )}
        <textarea
          value={voiceText}
          onChange={e => setVoiceText(e.target.value)}
          placeholder="La transcription vocale apparaît ici… Vous pouvez aussi taper librement."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#374151' }}
        />
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>Exemple : "2 robinets mitigeurs, 5 joints plats, 1 mètre de tuyau cuivre 14mm"</p>
      </div>

      {/* Ajout structuré */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '20px 22px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#374151' }}>Matériaux utilisés</h3>

        {/* Add line */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Matériau</label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setSuggestions(true); setSelectedMat(null) }}
              onFocus={() => setSuggestions(true)}
              onBlur={() => setTimeout(() => setSuggestions(false), 150)}
              placeholder="Rechercher dans le stock…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: `1px solid ${selectedMat ? '#f97316' : '#e5e7eb'}`, fontSize: 13.5, outline: 'none', boxSizing: 'border-box', background: selectedMat ? '#fff7ed' : 'white' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', marginTop: 4 }}>
                {suggestions.map(m => (
                  <div key={m.id} onMouseDown={() => selectMat(m)} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f5' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fff7ed')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{m.nom}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{m.reference} · {m.categorie}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.quantite <= m.seuilAlerte ? '#ca8a04' : '#374151' }}>
                      {m.quantite} {m.unite}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {showSuggestions && search.length > 0 && suggestions.length === 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', zIndex: 50, marginTop: 4, fontSize: 13, color: '#9ca3af' }}>
                Aucun matériau trouvé pour "{search}"
              </div>
            )}
          </div>
          <div style={{ width: 120 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Quantité {selectedMat ? `(${selectedMat.unite})` : ''}</label>
            <input
              type="number" min="0.1" step="0.1"
              value={qteInput}
              onChange={e => setQteInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ajouterLigne()}
              placeholder="0"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={ajouterLigne}
            disabled={!selectedMat || !qteInput}
            style={{ padding: '9px 18px', background: '#f97316', color: 'white', border: 'none', borderRadius: 9, cursor: selectedMat && qteInput ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, opacity: (!selectedMat || !qteInput) ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            <Plus size={15} /> Ajouter
          </button>
        </div>

        {/* Lignes */}
        {lignes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: 10 }}>
            <Package size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div style={{ fontSize: 13.5 }}>Aucun matériau ajouté — recherchez et ajoutez les matériaux utilisés</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 0, marginBottom: 6 }}>
              {['Matériau', 'Stock avant', 'Qté utilisée', ''].map(h => (
                <div key={h} style={{ padding: '7px 12px', fontSize: 11.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>{h}</div>
              ))}
            </div>
            {lignes.map((l, i) => {
              const mat = stock.find(m => m.id === l.materiauId)
              const stockApres = mat ? Math.max(0, mat.quantite - l.quantite) : 0
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 0, borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                  <div style={{ padding: '11px 12px', fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{l.nomMateriau}</div>
                  <div style={{ padding: '11px 16px', fontSize: 13, color: '#6b7280', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {mat?.quantite ?? '—'} {l.unite}
                    {mat && stockApres <= (mat.seuilAlerte) && (
                      <span style={{ marginLeft: 6, fontSize: 11, background: '#fef9c3', color: '#92400e', padding: '1px 7px', borderRadius: 10 }}>⚠️ seuil</span>
                    )}
                  </div>
                  <div style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f97316' }}>−{l.quantite}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{l.unite}</span>
                  </div>
                  <div style={{ padding: '11px 12px' }}>
                    <button onClick={() => supprimerLigne(i)} style={{ padding: '5px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Note */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: '20px 22px', marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Note (optionnel)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Détails sur l'intervention, remarques…" rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13.5, resize: 'none', outline: 'none', boxSizing: 'border-box', color: '#374151' }} />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/stock')} style={{ padding: '11px 22px', border: '1px solid #e5e7eb', borderRadius: 10, background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={lignes.length === 0}
          style={{ padding: '11px 26px', background: lignes.length === 0 ? '#9ca3af' : '#f97316', color: 'white', border: 'none', borderRadius: 10, cursor: lignes.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} />
          Valider et mettre à jour le stock ({lignes.length} matériau{lignes.length > 1 ? 'x' : ''})
        </button>
      </div>
    </div>
  )
}
