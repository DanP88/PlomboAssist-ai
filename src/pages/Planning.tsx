import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, MapPin, Clock,
  Phone, CheckCircle, Calendar, X
} from 'lucide-react'
import {
  addIntervention, getInterventions, updateStatus,
  Intervention
} from '../lib/agenda'

const HOUR_START = 7
const HOUR_END   = 19
const TOTAL_HOURS = HOUR_END - HOUR_START
const SLOT_HEIGHT = 56 // px par heure

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TYPE_COLORS: Record<string, { typeColor: string; typeBg: string; typeBorder: string }> = {
  'Fuite':        { typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca' },
  'Chauffe-eau':  { typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe' },
  'Débouchage':   { typeColor: '#d97706', typeBg: '#fffbeb', typeBorder: '#fde68a' },
  'Entretien':    { typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0' },
  'Rénovation':   { typeColor: '#7c3aed', typeBg: '#faf5ff', typeBorder: '#ddd6fe' },
  'Robinetterie': { typeColor: '#0891b2', typeBg: '#ecfeff', typeBorder: '#a5f3fc' },
}

const DURATIONS: Record<string, number> = {
  '30 min': 30, '1 heure': 60, '1h30': 90, '2 heures': 120, '3 heures': 180,
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Planifié',  color: '#6b7280' },
  in_progress: { label: 'En cours',  color: '#f97316' },
  done:        { label: 'Terminé',   color: '#10b981' },
  cancelled:   { label: 'Annulé',    color: '#dc2626' },
}

function topOffset(h: number, m: number) {
  return ((h - HOUR_START) + m / 60) * SLOT_HEIGHT
}
function blockHeight(min: number) {
  return Math.max((min / 60) * SLOT_HEIGHT, 22)
}

export default function Planning() {
  const [weekOffset, setWeekOffset]           = useState(0)
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([])
  const [selectedIv, setSelectedIv]           = useState<Intervention | null>(null)
  const [showModal, setShowModal]             = useState(false)

  // Pré-remplissage à la création
  const [formClient,   setFormClient]   = useState('')
  const [formAddress,  setFormAddress]  = useState('')
  const [formPhone,    setFormPhone]    = useState('')
  const [formDate,     setFormDate]     = useState('')
  const [formTime,     setFormTime]     = useState('09:00')
  const [formType,     setFormType]     = useState('Fuite')
  const [formDuration, setFormDuration] = useState('1h30')

  useEffect(() => { setAllInterventions(getInterventions()) }, [])

  const today     = new Date()
  const todayStr  = today.toISOString().split('T')[0]
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)

  function getDayDateStr(i: number) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  }

  function getDayDate(i: number) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  }

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

  const nowTop = topOffset(today.getHours(), today.getMinutes())
  const nowInRange = today.getHours() >= HOUR_START && today.getHours() < HOUR_END

  // Totaux semaine
  const weekTotal = WEEK_DAYS.reduce((sum, _, i) => {
    const ds = getDayDateStr(i)
    return sum + allInterventions.filter(iv => iv.date === ds).length
  }, 0)
  const weekDone = WEEK_DAYS.reduce((sum, _, i) => {
    const ds = getDayDateStr(i)
    return sum + allInterventions.filter(iv => iv.date === ds && iv.status === 'done').length
  }, 0)

  function openModal(dateStr?: string, hour?: number) {
    setFormDate(dateStr || todayStr)
    setFormTime(hour !== undefined ? `${String(hour).padStart(2,'0')}:00` : '09:00')
    setShowModal(true)
  }

  function handleCreate() {
    if (!formClient.trim() || !formDate || !formTime) return
    const [h, m] = formTime.split(':').map(Number)
    const colors = TYPE_COLORS[formType] || TYPE_COLORS['Fuite']
    addIntervention({
      date: formDate, startH: h, startM: m,
      durationMin: DURATIONS[formDuration] || 90,
      client: formClient.trim(), phone: formPhone.trim(),
      address: formAddress.trim(), type: formType,
      ...colors, status: 'scheduled',
    })
    setAllInterventions(getInterventions())
    setShowModal(false)
    setFormClient(''); setFormAddress(''); setFormPhone('')
    setFormDate(''); setFormTime('09:00'); setFormType('Fuite'); setFormDuration('1h30')
  }

  function handleCloturer(iv: Intervention) {
    updateStatus(iv.id, 'done', new Date().toISOString())
    setAllInterventions(getInterventions())
    setSelectedIv(null)
  }

  const weekLabel = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Calendar size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Planning</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              {weekDone}/{weekTotal} interventions · Semaine du {weekLabel}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => setWeekOffset(0)}>
            Aujourd'hui
          </button>
          <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight size={16} />
          </button>
          <button className="btn-primary" onClick={() => openModal()}>
            <Plus size={15} /> Nouvelle intervention
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>

        {/* Day header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '2px solid #f0f0f0' }}>
          <div /> {/* vide au dessus des heures */}
          {WEEK_DAYS.map((day, i) => {
            const dateStr  = getDayDateStr(i)
            const dateObj  = getDayDate(i)
            const isToday  = dateStr === todayStr
            const count    = allInterventions.filter(iv => iv.date === dateStr).length
            const done     = allInterventions.filter(iv => iv.date === dateStr && iv.status === 'done').length

            return (
              <div key={day} style={{
                padding: '12px 6px', textAlign: 'center',
                borderLeft: '1px solid #f0f0f0',
                background: isToday ? '#fff7ed' : 'white',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#f97316' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {day}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginTop: 2,
                  color: isToday ? '#f97316' : '#111827',
                  width: 32, height: 32, borderRadius: '50%',
                  background: isToday ? '#fff7ed' : 'transparent',
                  border: isToday ? '2px solid #f97316' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '2px auto',
                }}>
                  {dateObj.getDate()}
                </div>
                {count > 0 ? (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    <span style={{ fontWeight: 600, color: '#f97316' }}>{done}</span>/{count} RDV
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>Libre</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', maxHeight: '65vh' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', position: 'relative' }}>

            {/* Colonne heures */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {hours.map(h => (
                <div key={h} style={{
                  height: SLOT_HEIGHT, display: 'flex', alignItems: 'flex-start',
                  paddingTop: 4,
                }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, width: 44, textAlign: 'right', paddingRight: 8 }}>
                    {h}h
                  </span>
                </div>
              ))}
            </div>

            {/* 7 colonnes jours */}
            {WEEK_DAYS.map((_, dayIndex) => {
              const dateStr  = getDayDateStr(dayIndex)
              const isToday  = dateStr === todayStr
              const dayIvs   = allInterventions
                .filter(iv => iv.date === dateStr)
                .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))

              return (
                <div
                  key={dayIndex}
                  style={{
                    position: 'relative',
                    height: TOTAL_HOURS * SLOT_HEIGHT,
                    borderLeft: '1px solid #f3f4f6',
                    background: isToday ? 'rgba(249,115,22,0.015)' : 'white',
                  }}
                >
                  {/* Lignes d'heures */}
                  {hours.map(h => (
                    <div key={h} style={{
                      position: 'absolute',
                      top: (h - HOUR_START) * SLOT_HEIGHT,
                      left: 0, right: 0, height: 1,
                      background: '#f3f4f6',
                    }} />
                  ))}

                  {/* Zones cliquables pour ajouter */}
                  {hours.slice(0, -1).map(h => (
                    <div
                      key={h}
                      onClick={() => openModal(dateStr, h)}
                      style={{
                        position: 'absolute',
                        top: (h - HOUR_START) * SLOT_HEIGHT,
                        left: 0, right: 0,
                        height: SLOT_HEIGHT,
                        cursor: 'pointer', zIndex: 0,
                      }}
                      title={`Ajouter une intervention à ${h}h`}
                    />
                  ))}

                  {/* Ligne heure actuelle (uniquement aujourd'hui) */}
                  {isToday && nowInRange && (
                    <div style={{
                      position: 'absolute',
                      top: nowTop,
                      left: 0, right: 0,
                      height: 2, background: '#f97316',
                      zIndex: 4, pointerEvents: 'none',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#f97316',
                        position: 'absolute', left: -4, top: -3,
                      }} />
                    </div>
                  )}

                  {/* Blocs d'intervention */}
                  {dayIvs.map(iv => {
                    const top    = topOffset(iv.startH, iv.startM)
                    const height = blockHeight(iv.durationMin)
                    const endM   = iv.startH * 60 + iv.startM + iv.durationMin
                    const isSelected = selectedIv?.id === iv.id

                    return (
                      <div
                        key={iv.id}
                        onClick={e => { e.stopPropagation(); setSelectedIv(isSelected ? null : iv) }}
                        style={{
                          position: 'absolute',
                          top: top + 1, left: 3, right: 3,
                          height: height - 2,
                          background: iv.typeBg,
                          border: `1px solid ${isSelected ? iv.typeColor : iv.typeBorder}`,
                          borderLeft: `3px solid ${iv.typeColor}`,
                          borderRadius: 6,
                          padding: '3px 6px',
                          cursor: 'pointer', zIndex: 2,
                          overflow: 'hidden',
                          boxShadow: isSelected ? `0 2px 8px rgba(0,0,0,0.15)` : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'box-shadow 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#111827', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {iv.client}
                        </div>
                        {height > 34 && (
                          <div style={{ fontSize: 10.5, color: iv.typeColor, fontWeight: 600, lineHeight: 1.2 }}>
                            {iv.startH}:{String(iv.startM).padStart(2,'0')}–{Math.floor(endM/60)}:{String(endM%60).padStart(2,'0')}
                          </div>
                        )}
                        {height > 50 && (
                          <div style={{ fontSize: 10.5, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {iv.type}
                          </div>
                        )}
                        {iv.status === 'done' && (
                          <CheckCircle size={10} color="#10b981" style={{ position: 'absolute', top: 3, right: 4 }} />
                        )}
                        {iv.status === 'in_progress' && (
                          <div style={{ position: 'absolute', top: 3, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#f97316' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal détail intervention */}
      {selectedIv && (
        <div className="modal-overlay" onClick={() => setSelectedIv(null)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedIv.client}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{selectedIv.date} · {selectedIv.durationMin} min</div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedIv(null)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{
              background: selectedIv.typeBg, border: `1px solid ${selectedIv.typeBorder}`,
              borderRadius: 9, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: selectedIv.typeColor }}>{selectedIv.type}</span>
              <span style={{
                fontSize: 11.5, fontWeight: 700, borderRadius: 6, padding: '2px 8px',
                background: 'white', color: STATUS_CONFIG[selectedIv.status]?.color || '#6b7280',
              }}>
                {STATUS_CONFIG[selectedIv.status]?.label || selectedIv.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {[
                { icon: Clock,  text: `${selectedIv.startH}:${String(selectedIv.startM).padStart(2,'0')} – ${Math.floor((selectedIv.startH*60+selectedIv.startM+selectedIv.durationMin)/60)}:${String((selectedIv.startH*60+selectedIv.startM+selectedIv.durationMin)%60).padStart(2,'0')}` },
                { icon: MapPin, text: selectedIv.address || 'Adresse non renseignée' },
                { icon: Phone,  text: selectedIv.phone   || 'Téléphone non renseigné' },
              ].map(({ icon: Ic, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Ic size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>{text}</span>
                </div>
              ))}
              {selectedIv.notes && (
                <div style={{ background: '#f5f6fa', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#6b7280' }}>
                  {selectedIv.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedIv.status !== 'done' && (
                <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => handleCloturer(selectedIv)}>
                  <CheckCircle size={14} /> Clôturer l'intervention
                </button>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}
                  onClick={() => { window.location.href = `tel:${selectedIv.phone.replace(/\s/g,'')}` }}>
                  <Phone size={13} /> Appeler
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedIv.address)}`, '_blank')}>
                  <MapPin size={13} /> Itinéraire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création intervention */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouvelle intervention</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Client *</label>
                <input className="input-field" placeholder="Nom du client" value={formClient} onChange={e => setFormClient(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Adresse</label>
                <input className="input-field" placeholder="12 rue Victor Hugo, Lyon 3" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Téléphone</label>
                <input className="input-field" type="tel" placeholder="06 XX XX XX XX" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date *</label>
                  <input className="input-field" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Heure *</label>
                  <input className="input-field" type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Type</label>
                  <select className="select-field" value={formType} onChange={e => setFormType(e.target.value)}>
                    <option>Fuite</option>
                    <option>Chauffe-eau</option>
                    <option>Débouchage</option>
                    <option>Entretien</option>
                    <option>Rénovation</option>
                    <option>Robinetterie</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Durée</label>
                  <select className="select-field" value={formDuration} onChange={e => setFormDuration(e.target.value)}>
                    <option>30 min</option>
                    <option>1 heure</option>
                    <option>1h30</option>
                    <option>2 heures</option>
                    <option>3 heures</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ justifyContent: 'center' }}>Annuler</button>
                <button className="btn-primary" onClick={handleCreate} style={{ justifyContent: 'center' }}
                  disabled={!formClient.trim() || !formDate || !formTime}>
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
