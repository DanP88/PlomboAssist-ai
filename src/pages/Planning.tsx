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
const HOUR_END = 19
const TOTAL_HOURS = HOUR_END - HOUR_START
const SLOT_HEIGHT = 54

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TYPE_COLORS: Record<string, { typeColor: string; typeBg: string; typeBorder: string }> = {
  'Fuite':        { typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca' },
  'Chauffe-eau':  { typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe' },
  'Débouchage':   { typeColor: '#d97706', typeBg: '#fffbeb', typeBorder: '#fde68a' },
  'Entretien':    { typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0' },
  'Rénovation':   { typeColor: '#7c3aed', typeBg: '#faf5ff', typeBorder: '#ddd6fe' },
  'Robinetterie': { typeColor: '#0891b2', typeBg: '#ecfeff', typeBorder: '#a5f3fc' },
}

const DURATIONS: Record<string, number> = {
  '30 min': 30, '1 heure': 60, '1h30': 90, '2 heures': 120, '3 heures': 180
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:   { label: 'Planifié', color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: 'En cours', color: '#f97316', bg: '#fff7ed' },
  done:        { label: 'Terminé',  color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { label: 'Annulé',   color: '#dc2626', bg: '#fef2f2' },
}

export default function Planning() {
  const [selectedDay, setSelectedDay]       = useState(0)
  const [selectedIv, setSelectedIv]         = useState<Intervention | null>(null)
  const [showModal, setShowModal]           = useState(false)
  const [weekOffset, setWeekOffset]         = useState(0)
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([])

  // Form state
  const [formClient,   setFormClient]   = useState('')
  const [formAddress,  setFormAddress]  = useState('')
  const [formPhone,    setFormPhone]    = useState('')
  const [formDate,     setFormDate]     = useState('')
  const [formTime,     setFormTime]     = useState('09:00')
  const [formType,     setFormType]     = useState('Fuite')
  const [formDuration, setFormDuration] = useState('1h30')

  useEffect(() => {
    setAllInterventions(getInterventions())
  }, [])

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const weekStart = new Date(today)
  // Monday of current week + offset
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)

  function getDayDateStr(dayIndex: number) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + dayIndex)
    return d.toISOString().split('T')[0]
  }

  const selectedDateStr = getDayDateStr(selectedDay)

  const interventions = allInterventions
    .filter(iv => iv.date === selectedDateStr)
    .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))

  const totalToday = interventions.length
  const doneToday  = interventions.filter(i => i.status === 'done').length

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

  function topOffset(h: number, m: number) {
    return ((h - HOUR_START) + m / 60) * SLOT_HEIGHT
  }
  function blockHeight(min: number) {
    return Math.max((min / 60) * SLOT_HEIGHT, 28)
  }

  const nowTop = selectedDateStr === todayStr
    ? topOffset(today.getHours(), today.getMinutes())
    : -1

  function dayCount(dayIndex: number) {
    const ds = getDayDateStr(dayIndex)
    return allInterventions.filter(iv => iv.date === ds).length
  }

  function openModal() {
    setFormDate(selectedDateStr)
    setShowModal(true)
  }

  function handleCreate() {
    if (!formClient.trim() || !formDate || !formTime) return
    const [h, m] = formTime.split(':').map(Number)
    const colors = TYPE_COLORS[formType] || TYPE_COLORS['Fuite']
    addIntervention({
      date: formDate,
      startH: h,
      startM: m,
      durationMin: DURATIONS[formDuration] || 90,
      client: formClient.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      type: formType,
      ...colors,
      status: 'scheduled',
    })
    setAllInterventions(getInterventions())
    // Switch view to the day of the new intervention
    for (let i = 0; i < 7; i++) {
      if (getDayDateStr(i) === formDate) { setSelectedDay(i); break }
    }
    setShowModal(false)
    setFormClient(''); setFormAddress(''); setFormPhone('')
    setFormDate(''); setFormTime('09:00'); setFormType('Fuite'); setFormDuration('1h30')
  }

  function handleCloturer(iv: Intervention) {
    updateStatus(iv.id, 'done', new Date().toISOString())
    const updated = { ...iv, status: 'done' as const }
    setAllInterventions(getInterventions())
    setSelectedIv(updated)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Calendar size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Planning</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              {doneToday}/{totalToday} interventions · Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <Plus size={15} /> Nouvelle intervention
        </button>
      </div>

      {/* Week strip */}
      <div style={{
        background: 'white', borderRadius: 14, padding: '14px 16px',
        marginBottom: 16, border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', flex: 1, textAlign: 'center' }}>
            {weekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {weekDays.map((day, i) => {
            const dateStr = getDayDateStr(i)
            const count = dayCount(i)
            const isSelected = i === selectedDay
            const isToday = dateStr === todayStr
            const d = new Date(weekStart)
            d.setDate(weekStart.getDate() + i)

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(i)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 4px', borderRadius: 10,
                  background: isSelected ? 'linear-gradient(135deg, #f97316, #ea580c)' : isToday ? '#fff7ed' : 'transparent',
                  border: `1.5px solid ${isSelected ? '#f97316' : isToday ? '#fed7aa' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  color: isSelected ? 'white' : '#374151',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{day}</span>
                <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <div key={j} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: isSelected ? 'rgba(255,255,255,0.7)' : '#f97316'
                    }} />
                  ))}
                  {count === 0 && <div style={{ width: 5, height: 5 }} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Day view */}
      <div style={{
        background: 'white', borderRadius: 14, border: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {weekDays[selectedDay]} {(() => {
              const d = new Date(weekStart)
              d.setDate(weekStart.getDate() + selectedDay)
              return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
            })()}
          </div>
          {interventions.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <span className="badge badge-gray">{interventions.length} intervention{interventions.length > 1 ? 's' : ''}</span>
              {doneToday > 0 && <span className="badge badge-green">{doneToday} terminée{doneToday > 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', minHeight: 520 }}>
          {/* Timeline */}
          <div style={{
            flex: 1, position: 'relative',
            paddingLeft: 52, paddingRight: 16,
            paddingTop: 12, paddingBottom: 12,
            minHeight: TOTAL_HOURS * SLOT_HEIGHT + 24,
          }}>
            {/* Hour lines */}
            {hours.map(h => (
              <div key={h} style={{
                position: 'absolute',
                top: 12 + (h - HOUR_START) * SLOT_HEIGHT,
                left: 0, right: 0,
                display: 'flex', alignItems: 'flex-start',
              }}>
                <span style={{
                  fontSize: 11, color: '#9ca3af', fontWeight: 500,
                  width: 44, textAlign: 'right', paddingRight: 8, flexShrink: 0,
                  marginTop: -7, lineHeight: 1
                }}>{h}h00</span>
                <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
              </div>
            ))}

            {/* Current time indicator */}
            {nowTop >= 0 && nowTop <= TOTAL_HOURS * SLOT_HEIGHT && (
              <div style={{
                position: 'absolute', top: 12 + nowTop, left: 44, right: 16,
                height: 2, background: '#f97316', borderRadius: 1, zIndex: 3
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#f97316',
                  position: 'absolute', left: -5, top: -4
                }} />
              </div>
            )}

            {/* Intervention blocks */}
            {interventions.map(iv => {
              const top = 12 + topOffset(iv.startH, iv.startM)
              const height = blockHeight(iv.durationMin)
              const isSelected = selectedIv?.id === iv.id
              const endTotalM = iv.startH * 60 + iv.startM + iv.durationMin
              const endH = Math.floor(endTotalM / 60) % 24
              const endM = endTotalM % 60

              return (
                <div
                  key={iv.id}
                  onClick={() => setSelectedIv(isSelected ? null : iv)}
                  style={{
                    position: 'absolute',
                    top, left: 52, right: 16, height,
                    background: iv.typeBg,
                    border: `1.5px solid ${isSelected ? iv.typeColor : iv.typeBorder}`,
                    borderLeft: `4px solid ${iv.typeColor}`,
                    borderRadius: 9, padding: '7px 10px',
                    cursor: 'pointer', zIndex: 2,
                    boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.15s', overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{iv.client}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: iv.typeColor }}>
                      {iv.startH}:{String(iv.startM).padStart(2, '0')} – {endH}:{String(endM).padStart(2, '0')}
                    </span>
                  </div>
                  {height > 40 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, color: iv.typeColor,
                        background: 'white', padding: '1px 6px', borderRadius: 6
                      }}>{iv.type}</span>
                      <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {iv.address}
                      </span>
                    </div>
                  )}
                  {iv.status === 'in_progress' && (
                    <div style={{
                      position: 'absolute', top: 6, right: 8,
                      width: 8, height: 8, borderRadius: '50%', background: '#f97316',
                      boxShadow: '0 0 0 2px rgba(249,115,22,0.3)'
                    }} />
                  )}
                  {iv.status === 'done' && (
                    <CheckCircle size={13} color="#10b981" style={{ position: 'absolute', top: 7, right: 8 }} />
                  )}
                </div>
              )
            })}

            {interventions.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, color: '#d1d5db'
              }}>
                <Calendar size={36} />
                <span style={{ fontSize: 14, color: '#9ca3af' }}>Aucune intervention ce jour</span>
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={openModal}>
                  <Plus size={14} /> Planifier
                </button>
              </div>
            )}
          </div>

          {/* Side panel — detail */}
          {selectedIv && (
            <div style={{
              width: 280, borderLeft: '1px solid #f0f0f0',
              padding: '20px 18px', flexShrink: 0, overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Détail</span>
                <button className="btn-ghost" onClick={() => setSelectedIv(null)} style={{ padding: '4px' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{
                background: selectedIv.typeBg, border: `1px solid ${selectedIv.typeBorder}`,
                borderRadius: 9, padding: '10px 14px', marginBottom: 16
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: selectedIv.typeColor }}>{selectedIv.type}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                  {selectedIv.startH}h{String(selectedIv.startM).padStart(2, '0')} · {selectedIv.durationMin} min
                </div>
              </div>

              {([
                { icon: Clock, text: `${selectedIv.startH}:${String(selectedIv.startM).padStart(2,'0')} – ${Math.floor((selectedIv.startH*60+selectedIv.startM+selectedIv.durationMin)/60)%24}:${String((selectedIv.startM+selectedIv.durationMin)%60).padStart(2,'0')}` },
                { icon: MapPin, text: selectedIv.address },
                { icon: Phone, text: selectedIv.phone },
              ] as { icon: any; text: string }[]).map(({ icon: Ic, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <Ic size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>{text}</span>
                </div>
              ))}

              {selectedIv.notes && (
                <div style={{
                  background: '#f5f6fa', borderRadius: 8, padding: '10px 12px', marginTop: 12, marginBottom: 16
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>NOTES</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>{selectedIv.notes}</div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {selectedIv.status !== 'done' && (
                  <button className="btn-primary" style={{ justifyContent: 'center', fontSize: 13 }}
                    onClick={() => handleCloturer(selectedIv)}>
                    <CheckCircle size={14} /> Clôturer
                  </button>
                )}
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}
                  onClick={() => { window.location.href = `tel:${selectedIv.phone.replace(/\s/g, '')}` }}>
                  <Phone size={14} /> Appeler le client
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedIv.address)}`, '_blank')}>
                  <MapPin size={14} /> Itinéraire
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Nouvelle intervention</h2>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Client *</label>
                <input className="input-field" type="text" placeholder="Nom du client"
                  value={formClient} onChange={e => setFormClient(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Adresse</label>
                <input className="input-field" type="text" placeholder="12 rue Victor Hugo, Lyon 3"
                  value={formAddress} onChange={e => setFormAddress(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Téléphone</label>
                <input className="input-field" type="tel" placeholder="06 XX XX XX XX"
                  value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date *</label>
                  <input className="input-field" type="date"
                    value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Heure *</label>
                  <input className="input-field" type="time"
                    value={formTime} onChange={e => setFormTime(e.target.value)} />
                </div>
              </div>

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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Durée estimée</label>
                <select className="select-field" value={formDuration} onChange={e => setFormDuration(e.target.value)}>
                  <option>30 min</option>
                  <option>1 heure</option>
                  <option>1h30</option>
                  <option>2 heures</option>
                  <option>3 heures</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ justifyContent: 'center' }}>
                  Annuler
                </button>
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
