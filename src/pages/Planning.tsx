import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus, MapPin, Clock,
  Phone, CheckCircle, Calendar, X, Edit2, MessageCircle, Copy, Trash2, ClipboardList
} from 'lucide-react'
import {
  addIntervention, getInterventions, updateStatus,
  updateIntervention, deleteIntervention, Intervention
} from '../lib/agenda'
import { geocodeAddress, getTravelTimeMin } from '../lib/geo'
import { formatDate } from '../lib/tarification'
import { getWorkPlanning, WorkDay, localDateStr } from '../lib/planning'

const HOUR_START  = 0
const HOUR_END    = 24
const TOTAL_HOURS = HOUR_END - HOUR_START
const SLOT_HEIGHT = 44   // px par heure

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const TYPE_COLORS: Record<string, { typeColor: string; typeBg: string; typeBorder: string }> = {
  'Fuite':          { typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca' },
  "Fuite d'eau":    { typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca' },
  'Chauffe-eau':    { typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe' },
  'Débouchage':     { typeColor: '#d97706', typeBg: '#fffbeb', typeBorder: '#fde68a' },
  'Entretien':      { typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0' },
  'Rénovation':     { typeColor: '#7c3aed', typeBg: '#faf5ff', typeBorder: '#ddd6fe' },
  'Robinetterie':   { typeColor: '#0891b2', typeBg: '#ecfeff', typeBorder: '#a5f3fc' },
}

const DURATIONS: Record<string, number> = {
  '15 min': 15, '30 min': 30, '45 min': 45, '1 heure': 60,
  '1h30': 90, '2 heures': 120, '3 heures': 180, '4 heures': 240,
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
function fmtHM(totalMin: number) {
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${h}h${String(m).padStart(2,'0')}`
}
function durationLabel(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2,'0')}`
}

interface SmsModal { phone: string; client: string; message: string }

export default function Planning() {
  const navigate = useNavigate()
  const [mapChoice, setMapChoice]               = useState<string | null>(null)
  const [weekOffset, setWeekOffset]             = useState(0)
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([])
  const [selectedIv, setSelectedIv]             = useState<Intervention | null>(null)
  const [showModal, setShowModal]               = useState(false)
  const [editMode, setEditMode]                 = useState(false)
  const [editDate, setEditDate]                 = useState('')
  const [editTime, setEditTime]                 = useState('09:00')
  const [editDuration, setEditDuration]         = useState('1h30')
  const [draggingId, setDraggingId]             = useState<string | null>(null)
  const [dragOverDay, setDragOverDay]           = useState<number | null>(null)
  const [smsModal, setSmsModal]                 = useState<SmsModal | null>(null)
  const [smsCopied, setSmsCopied]               = useState(false)
  const [confirmDelete, setConfirmDelete]       = useState(false)
  const [confirmOutsideWork, setConfirmOutsideWork]         = useState(false)
  const [confirmOutsideWorkEdit, setConfirmOutsideWorkEdit] = useState(false)
  const [pendingDrop, setPendingDrop]           = useState<{iv: Intervention; dateStr: string; newH: number; newM: number} | null>(null)
  const dragOffsetRef                           = useRef(0)
  const scrollRef                               = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop]               = useState(8 * SLOT_HEIGHT)

  // Champs du formulaire de création
  const [formClient,   setFormClient]   = useState('')
  const [formAddress,  setFormAddress]  = useState('')
  const [formPhone,    setFormPhone]    = useState('')
  const [formDate,     setFormDate]     = useState('')
  const [formTime,     setFormTime]     = useState('09:00')
  const [formType,     setFormType]     = useState('Fuite')
  const [formDuration, setFormDuration] = useState('1h30')

  const [workPlan] = useState<WorkDay[]>(getWorkPlanning)
  const [travelTimes, setTravelTimes] = useState<Record<string, number>>({})

  useEffect(() => { setAllInterventions(getInterventions()) }, [])

  // Centrer sur 8h au chargement et à chaque changement de semaine
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = 8 * SLOT_HEIGHT
    setScrollTop(8 * SLOT_HEIGHT)
  }, [weekOffset])

  // Calcul des temps de trajet entre interventions consécutives
  useEffect(() => {
    let cancelled = false
    async function computeTravelTimes() {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const ws = new Date(now)
      ws.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7)
      ws.setHours(0, 0, 0, 0)
      function getDs(i: number) {
        const d = new Date(ws)
        d.setDate(ws.getDate() + i)
        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
      }
      const pairs: Array<{ key: string; iv1: Intervention; iv2: Intervention }> = []
      for (let i = 0; i < 7; i++) {
        const ds = getDs(i)
        const dayIvs = allInterventions
          .filter(iv => iv.date === ds && iv.status !== 'cancelled' && iv.status !== 'done')
          .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))
        for (let j = 0; j < dayIvs.length - 1; j++) {
          pairs.push({ key: `${dayIvs[j].id}-${dayIvs[j+1].id}`, iv1: dayIvs[j], iv2: dayIvs[j+1] })
        }
      }
      for (const { key, iv1, iv2 } of pairs) {
        if (cancelled) return
        if (!iv1.address || !iv2.address) continue
        const [c1, c2] = await Promise.all([geocodeAddress(iv1.address), geocodeAddress(iv2.address)])
        if (cancelled) return
        if (c1 && c2) {
          const t = await getTravelTimeMin(c1, c2)
          if (!cancelled) setTravelTimes(prev => ({ ...prev, [key]: t }))
        }
      }
    }
    computeTravelTimes()
    return () => { cancelled = true }
  }, [allInterventions, weekOffset])

  const today     = new Date()
  const todayStr  = localDateStr(today)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  weekStart.setHours(0, 0, 0, 0)

  function getDayDateStr(i: number) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return localDateStr(d)
  }
  function getDayDate(i: number) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  }

  const hours       = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)
  const nowTop      = topOffset(today.getHours(), today.getMinutes())
  const nowInRange  = today.getHours() >= HOUR_START && today.getHours() < HOUR_END
  const weekTotal   = WEEK_DAYS.reduce((sum, _, i) => sum + allInterventions.filter(iv => iv.date === getDayDateStr(i)).length, 0)
  const weekDone    = WEEK_DAYS.reduce((sum, _, i) => sum + allInterventions.filter(iv => iv.date === getDayDateStr(i) && iv.status === 'done').length, 0)
  const weekLabel   = weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Compter les RDV hors zone visible (pour les badges de défilement)
  const containerH = scrollRef.current?.clientHeight ?? 600
  let hiddenAbove = 0, hiddenBelow = 0
  for (let i = 0; i < 7; i++) {
    const ds = getDayDateStr(i)
    allInterventions
      .filter(iv => iv.date === ds && iv.status !== 'cancelled')
      .forEach(iv => {
        const top = topOffset(iv.startH, iv.startM)
        const bot = top + blockHeight(iv.durationMin)
        if (bot <= scrollTop) hiddenAbove++
        else if (top >= scrollTop + containerH) hiddenBelow++
      })
  }

  // ── Vérification horaires de travail ─────────────────────────
  function isOutsideWorkHours(dateStr: string, h: number, m: number): boolean {
    const startMin = h * 60 + m
    const wd = workPlan.find(d => d.date === dateStr)
    const prevDate = new Date(dateStr + 'T12:00:00')
    prevDate.setDate(prevDate.getDate() - 1)
    const prevWd = workPlan.find(d => d.date === localDateStr(prevDate))
    const workingMin: Array<{from: number; to: number}> = []
    if (prevWd && prevWd.active && prevWd.endH > 23) {
      workingMin.push({ from: 0, to: (prevWd.endH - 24) * 60 + prevWd.endM })
    }
    if (wd && wd.active) {
      workingMin.push({ from: wd.startH * 60 + wd.startM, to: Math.min(24 * 60, wd.endH * 60 + wd.endM) })
    }
    if (workingMin.length === 0) return true
    return !workingMin.some(w => startMin >= w.from && startMin < w.to)
  }

  // ── Création ─────────────────────────────────────────────────
  function openModal(dateStr?: string, hour?: number) {
    setFormDate(dateStr || todayStr)
    setFormTime(hour !== undefined ? `${String(hour).padStart(2,'0')}:00` : '09:00')
    setShowModal(true)
  }

  function handleCreate(force = false) {
    if (!formClient.trim() || !formDate || !formTime) return
    const [h, m] = formTime.split(':').map(Number)
    if (!force && isOutsideWorkHours(formDate, h, m)) {
      setConfirmOutsideWork(true)
      return
    }
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
    setConfirmOutsideWork(false)
    setFormClient(''); setFormAddress(''); setFormPhone('')
    setFormDate(''); setFormTime('09:00'); setFormType('Fuite'); setFormDuration('1h30')
  }

  function handleDelete(iv: Intervention) {
    deleteIntervention(iv.id)
    setAllInterventions(getInterventions())
    setSelectedIv(null)
    setConfirmDelete(false)
  }

  function handleCloturer(iv: Intervention) {
    updateStatus(iv.id, 'done', new Date().toISOString())
    setAllInterventions(getInterventions())
    setSelectedIv(null)
  }

  // ── Drag & drop ───────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent<HTMLDivElement>, iv: Intervention) {
    e.dataTransfer.setData('ivId', iv.id)
    e.dataTransfer.effectAllowed = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dragOffsetRef.current = Math.max(0, (e.clientY - rect.top) / SLOT_HEIGHT * 60)
    setDraggingId(iv.id)
    setSelectedIv(null)
    setEditMode(false)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverDay(null)
  }

  function applyDrop(iv: Intervention, dateStr: string, newH: number, newM: number) {
    updateIntervention(iv.id, { date: dateStr, startH: newH, startM: newM })
    setAllInterventions(getInterventions())
    const oldLabel = `${formatDate(iv.date)} à ${fmtHM(iv.startH * 60 + iv.startM)}`
    const newLabel = `${formatDate(dateStr)} à ${fmtHM(newH * 60 + newM)}`
    const msg = `Bonjour ${iv.client},\nVotre rendez-vous (${iv.type}) prévu ${oldLabel} a été déplacé au ${newLabel}.\n\nÀ bientôt ! — Marc`
    if (iv.phone) setSmsModal({ phone: iv.phone, client: iv.client, message: msg })
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dateStr: string) {
    e.preventDefault()
    const ivId = e.dataTransfer.getData('ivId')
    const iv   = allInterventions.find(x => x.id === ivId)
    if (!iv) { setDraggingId(null); setDragOverDay(null); return }

    const rect    = e.currentTarget.getBoundingClientRect()
    const y       = e.clientY - rect.top
    const rawMin  = HOUR_START * 60 + (y / SLOT_HEIGHT) * 60 - dragOffsetRef.current
    const clamped = Math.max(HOUR_START * 60, Math.min((HOUR_END - 1) * 60, rawMin))
    const snapped = Math.round(clamped / 15) * 15
    const newH    = Math.floor(snapped / 60)
    const newM    = snapped % 60

    setDraggingId(null)
    setDragOverDay(null)

    if (newH === iv.startH && newM === iv.startM && dateStr === iv.date) return

    if (isOutsideWorkHours(dateStr, newH, newM)) {
      setPendingDrop({ iv, dateStr, newH, newM })
      return
    }

    applyDrop(iv, dateStr, newH, newM)
  }

  // ── Édition ───────────────────────────────────────────────────
  function openEdit(iv: Intervention) {
    setEditDate(iv.date)
    setEditTime(`${String(iv.startH).padStart(2,'0')}:${String(iv.startM).padStart(2,'0')}`)
    const durLabel = Object.entries(DURATIONS).find(([, v]) => v === iv.durationMin)?.[0] || '1h30'
    setEditDuration(durLabel)
    setEditMode(true)
  }

  function handleSaveEdit(force = false) {
    if (!selectedIv) return
    const [h, m]  = editTime.split(':').map(Number)
    if (!force && isOutsideWorkHours(editDate, h, m)) {
      setConfirmOutsideWorkEdit(true)
      return
    }
    const newDur  = DURATIONS[editDuration] || 90
    updateIntervention(selectedIv.id, { date: editDate, startH: h, startM: m, durationMin: newDur })
    setAllInterventions(getInterventions())
    const endMin = h * 60 + m + newDur
    const msg = `Bonjour ${selectedIv.client},\nVotre rendez-vous (${selectedIv.type}) a été modifié :\n${formatDate(editDate)} à ${fmtHM(h * 60 + m)} — durée ${durationLabel(newDur)} (fin prévue vers ${fmtHM(endMin)}).\n\nÀ bientôt ! — Marc`
    if (selectedIv.phone) setSmsModal({ phone: selectedIv.phone, client: selectedIv.client, message: msg })
    setSelectedIv(null)
    setEditMode(false)
    setConfirmOutsideWorkEdit(false)
  }

  // ── SMS ───────────────────────────────────────────────────────
  function waUrl(phone: string, msg: string) {
    return `https://wa.me/${phone.replace(/\s/g,'').replace(/^0/,'33')}?text=${encodeURIComponent(msg)}`
  }
  function smsUrl(phone: string, msg: string) {
    return `sms:${phone.replace(/\s/g,'')}?body=${encodeURIComponent(msg)}`
  }
  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setSmsCopied(true); setTimeout(() => setSmsCopied(false), 2000)
    })
  }

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

      {/* Hint drag */}
      {draggingId && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: 'white', borderRadius: 10, padding: '10px 18px',
          fontSize: 13, fontWeight: 600, zIndex: 999, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          Déposez sur le jour et l'heure souhaités
        </div>
      )}

      {/* Week grid */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>

        {/* Day header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '2px solid #f0f0f0' }}>
          <div />
          {WEEK_DAYS.map((day, i) => {
            const dateStr = getDayDateStr(i)
            const dateObj = getDayDate(i)
            const isToday = dateStr === todayStr
            const count   = allInterventions.filter(iv => iv.date === dateStr).length
            const done    = allInterventions.filter(iv => iv.date === dateStr && iv.status === 'done').length

            return (
              <div key={day} style={{
                padding: '12px 6px', textAlign: 'center',
                borderLeft: '1px solid #f0f0f0',
                background: dragOverDay === i ? '#eff6ff' : isToday ? '#fff7ed' : 'white',
                transition: 'background 0.15s',
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
        <div style={{ position: 'relative' }}>

          {/* Badge — RDV au-dessus de la zone visible */}
          {hiddenAbove > 0 && (
            <div
              onClick={() => scrollRef.current?.scrollBy({ top: -200, behavior: 'smooth' })}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
                display: 'flex', justifyContent: 'center', paddingTop: 4,
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.96) 60%, transparent)',
                cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              <span style={{
                background: '#f97316', color: 'white', borderRadius: 20,
                padding: '3px 12px', fontSize: 11.5, fontWeight: 700,
                boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                ↑ {hiddenAbove} RDV non visible{hiddenAbove > 1 ? 's' : ''} — défiler vers le haut
              </span>
            </div>
          )}

          {/* Badge — RDV en-dessous de la zone visible */}
          {hiddenBelow > 0 && (
            <div
              onClick={() => scrollRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
                display: 'flex', justifyContent: 'center', paddingBottom: 4,
                background: 'linear-gradient(to top, rgba(255,255,255,0.96) 60%, transparent)',
                cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              <span style={{
                background: '#f97316', color: 'white', borderRadius: 20,
                padding: '3px 12px', fontSize: 11.5, fontWeight: 700,
                boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                ↓ {hiddenBelow} RDV non visible{hiddenBelow > 1 ? 's' : ''} — défiler vers le bas
              </span>
            </div>
          )}

        <div
          ref={scrollRef}
          onScroll={e => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
          style={{ overflowY: 'auto', maxHeight: '65vh' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', position: 'relative' }}>

            {/* Colonne heures */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {hours.map(h => (
                <div key={h} style={{ height: SLOT_HEIGHT, display: 'flex', alignItems: 'flex-start', paddingTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, width: 44, textAlign: 'right', paddingRight: 8 }}>
                    {h}h
                  </span>
                </div>
              ))}
            </div>

            {/* 7 colonnes jours */}
            {WEEK_DAYS.map((_, dayIndex) => {
              const dateStr = getDayDateStr(dayIndex)
              const isToday = dateStr === todayStr
              const dayIvs  = allInterventions
                .filter(iv => iv.date === dateStr)
                .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))

              return (
                <div
                  key={dayIndex}
                  style={{
                    position: 'relative',
                    height: TOTAL_HOURS * SLOT_HEIGHT,
                    borderLeft: '1px solid #f3f4f6',
                    background: dragOverDay === dayIndex
                      ? 'rgba(59,130,246,0.04)'
                      : isToday ? 'rgba(249,115,22,0.015)' : 'white',
                    transition: 'background 0.1s',
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOverDay(dayIndex) }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={e => handleDrop(e, dateStr)}
                >
                  {/* Lignes d'heures */}
                  {hours.map(h => (
                    <div key={h} style={{
                      position: 'absolute', top: (h - HOUR_START) * SLOT_HEIGHT,
                      left: 0, right: 0, height: 1, background: '#f3f4f6',
                    }} />
                  ))}

                  {/* Zones non travaillées — grisées (gestion horaires nuit incluse) */}
                  {(() => {
                    const wd = workPlan.find(d => d.date === dateStr)
                    // Jour précédent : peut déborder sur ce jour si endH > 24
                    const prevDate = new Date(weekStart)
                    prevDate.setDate(weekStart.getDate() + dayIndex - 1)
                    const prevDateStr2 = localDateStr(prevDate)
                    const prevWd = workPlan.find(d => d.date === prevDateStr2)

                    // Construire les fenêtres de travail en minutes depuis minuit
                    const workingMin: Array<{from: number; to: number}> = []

                    // Débord du jour précédent (ex: jeudi 15h→27h → vendredi 0h→3h)
                    if (prevWd && prevWd.active && prevWd.endH > 23) {
                      workingMin.push({ from: 0, to: (prevWd.endH - 24) * 60 + prevWd.endM })
                    }

                    // Plage du jour courant (on coupe à minuit : la partie après minuit
                    // apparaîtra dans le lendemain via le mécanisme précédent)
                    if (wd && wd.active) {
                      workingMin.push({
                        from: wd.startH * 60 + wd.startM,
                        to:   Math.min(24 * 60, wd.endH * 60 + wd.endM),
                      })
                    }

                    workingMin.sort((a, b) => a.from - b.from)

                    // Zones grises = tout ce qui n'est PAS dans les fenêtres de travail
                    const gray: Array<{fromPx: number; heightPx: number}> = []
                    let cursor = 0
                    for (const w of workingMin) {
                      if (cursor < w.from) {
                        gray.push({
                          fromPx:   (cursor / 60) * SLOT_HEIGHT,
                          heightPx: ((w.from - cursor) / 60) * SLOT_HEIGHT,
                        })
                      }
                      cursor = Math.max(cursor, w.to)
                    }
                    if (cursor < 24 * 60) {
                      gray.push({
                        fromPx:   (cursor / 60) * SLOT_HEIGHT,
                        heightPx: ((24 * 60 - cursor) / 60) * SLOT_HEIGHT,
                      })
                    }

                    const GRAY_STYLE = {
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.03) 6px, rgba(0,0,0,0.03) 12px)',
                      backgroundColor: 'rgba(243,244,246,0.75)',
                    }

                    return gray.map((z, i) => (
                      <div key={i} style={{
                        position: 'absolute', top: z.fromPx, left: 0, right: 0,
                        height: z.heightPx,
                        ...GRAY_STYLE,
                        zIndex: 1, pointerEvents: 'none',
                      }} />
                    ))
                  })()}

                  {/* Zones cliquables pour créer */}
                  {!draggingId && hours.slice(0, -1).map(h => (
                    <div
                      key={h}
                      onClick={() => openModal(dateStr, h)}
                      style={{
                        position: 'absolute',
                        top: (h - HOUR_START) * SLOT_HEIGHT,
                        left: 0, right: 0, height: SLOT_HEIGHT,
                        cursor: 'pointer', zIndex: 0,
                      }}
                    />
                  ))}

                  {/* Heure actuelle */}
                  {isToday && nowInRange && (
                    <div style={{
                      position: 'absolute', top: nowTop, left: 0, right: 0,
                      height: 2, background: '#f97316', zIndex: 4, pointerEvents: 'none',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', position: 'absolute', left: -4, top: -3 }} />
                    </div>
                  )}

                  {/* Blocs d'intervention */}
                  {dayIvs.map(iv => {
                    const top        = topOffset(iv.startH, iv.startM)
                    const height     = blockHeight(iv.durationMin)
                    const endM       = iv.startH * 60 + iv.startM + iv.durationMin
                    const isSelected = selectedIv?.id === iv.id
                    const isDragging = draggingId === iv.id

                    return (
                      <div
                        key={iv.id}
                        draggable
                        onDragStart={e => handleDragStart(e, iv)}
                        onDragEnd={handleDragEnd}
                        onClick={e => {
                          e.stopPropagation()
                          if (!isDragging) {
                            setSelectedIv(isSelected ? null : iv)
                            setEditMode(false)
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: top + 1, left: 3, right: 3,
                          height: height - 2,
                          background: iv.typeBg,
                          border: `1px solid ${isSelected ? iv.typeColor : iv.typeBorder}`,
                          borderLeft: `3px solid ${iv.typeColor}`,
                          borderRadius: 6,
                          padding: '3px 6px',
                          cursor: isDragging ? 'grabbing' : 'grab',
                          zIndex: 2,
                          overflow: 'hidden',
                          opacity: isDragging ? 0.35 : 1,
                          boxShadow: isSelected ? `0 2px 8px rgba(0,0,0,0.15)` : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'box-shadow 0.15s, opacity 0.15s',
                          userSelect: 'none',
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

                  {/* Badges de trajet entre interventions consécutives */}
                  {(() => {
                    const sorted = dayIvs
                      .filter(iv => iv.status !== 'cancelled' && iv.status !== 'done')
                      .sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM))
                    return sorted.slice(0, -1).map((iv, idx) => {
                      const next = sorted[idx + 1]
                      const key = `${iv.id}-${next.id}`
                      const travelMin = travelTimes[key]
                      const endTop = topOffset(iv.startH, iv.startM) + blockHeight(iv.durationMin)
                      const gap = topOffset(next.startH, next.startM) - endTop
                      if (gap < 20) return null
                      const isTight = travelMin !== undefined && gap < travelMin * SLOT_HEIGHT / 60 + 10
                      return (
                        <div
                          key={key}
                          style={{
                            position: 'absolute',
                            top: endTop + 3,
                            left: 4, right: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 3, pointerEvents: 'none',
                          }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            background: travelMin === undefined ? '#f5f6fa' : isTight ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${travelMin === undefined ? '#e5e7eb' : isTight ? '#fecaca' : '#a7f3d0'}`,
                            borderRadius: 10, padding: '2px 7px',
                            fontSize: 10, fontWeight: 700,
                            color: travelMin === undefined ? '#9ca3af' : isTight ? '#dc2626' : '#16a34a',
                          }}>
                            🚗 {travelMin !== undefined ? `~${travelMin} min` : '...'}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )
            })}
          </div>
        </div>
        </div> {/* fin wrapper badges */}
      </div>

      {/* Modal détail / édition */}
      {selectedIv && (
        <div className="modal-overlay" onClick={() => { setSelectedIv(null); setEditMode(false); setConfirmDelete(false) }}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{selectedIv.client}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {formatDate(selectedIv.date)} · {durationLabel(selectedIv.durationMin)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!editMode && (
                  <button
                    className="btn-ghost"
                    style={{ padding: '6px 10px', fontSize: 12, gap: 5 }}
                    onClick={() => openEdit(selectedIv)}
                  >
                    <Edit2 size={13} /> Modifier
                  </button>
                )}
                <button className="btn-ghost" onClick={() => { setSelectedIv(null); setEditMode(false) }} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {editMode ? (
              /* ── Formulaire d'édition ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 9,
                  padding: '10px 14px', fontSize: 12.5, color: '#92400e',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Edit2 size={13} color="#f97316" />
                  Modifiez les informations puis enregistrez — un SMS de confirmation sera préparé.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Date</label>
                    <input className="input-field" type="date" value={editDate} onChange={e => { setEditDate(e.target.value); setConfirmOutsideWorkEdit(false) }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Heure de début</label>
                    <input className="input-field" type="time" value={editTime} onChange={e => { setEditTime(e.target.value); setConfirmOutsideWorkEdit(false) }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Durée estimée</label>
                  <select className="select-field" value={editDuration} onChange={e => setEditDuration(e.target.value)}>
                    {Object.keys(DURATIONS).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>

                {confirmOutsideWorkEdit && (
                  <div style={{
                    background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 9,
                    padding: '10px 14px', fontSize: 12.5, color: '#92400e',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Hors plage de travail</div>
                    <div style={{ marginBottom: 10 }}>Ce créneau est en dehors de vos heures de travail. Confirmez-vous quand même ?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button onClick={() => setConfirmOutsideWorkEdit(false)} style={{ padding: '7px 0', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                        Modifier l'heure
                      </button>
                      <button onClick={() => handleSaveEdit(true)} style={{ padding: '7px 0', borderRadius: 8, border: 'none', background: '#f97316', color: 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                        Confirmer quand même
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                  <button className="btn-secondary" style={{ justifyContent: 'center' }} onClick={() => { setEditMode(false); setConfirmOutsideWorkEdit(false) }}>Annuler</button>
                  <button className="btn-primary" style={{ justifyContent: 'center' }} onClick={() => handleSaveEdit()}>
                    <CheckCircle size={14} /> Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              /* ── Détail ── */
              <>
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
                    { icon: Clock,  text: `${selectedIv.startH}:${String(selectedIv.startM).padStart(2,'0')} – ${fmtHM(selectedIv.startH*60+selectedIv.startM+selectedIv.durationMin)} (${durationLabel(selectedIv.durationMin)})` },
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
                  <button
                    className="btn-secondary"
                    style={{ justifyContent: 'center', fontSize: 13, background: '#fff7ed', border: '1.5px solid #fed7aa', color: '#f97316' }}
                    onClick={() => { setSelectedIv(null); navigate(`/rapport?id=${selectedIv.id}`) }}
                  >
                    <ClipboardList size={13} /> Rapport d'intervention
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13 }}
                      onClick={() => { window.location.href = `tel:${selectedIv.phone.replace(/\s/g,'')}` }}>
                      <Phone size={13} /> Appeler
                    </button>
                    <div style={{ position: 'relative' }}>
                      <button className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13, width: '100%' }}
                        onClick={() => setMapChoice(mapChoice ? null : (selectedIv?.address || ''))}>
                        <MapPin size={13} /> Itinéraire ▾
                      </button>
                      {mapChoice && (
                        <div style={{
                          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                          background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10,
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50
                        }}>
                          <button onClick={() => { window.open(`https://waze.com/ul?q=${encodeURIComponent(mapChoice)}&navigate=yes`, '_blank'); setMapChoice(null) }}
                            style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <span style={{ fontSize: 16 }}>🚗</span> Waze
                          </button>
                          <div style={{ height: 1, background: '#f3f4f6' }} />
                          <button onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapChoice)}`, '_blank'); setMapChoice(null) }}
                            style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <span style={{ fontSize: 16 }}>🗺️</span> Google Maps
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suppression avec confirmation */}
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        background: 'none', border: '1.5px solid #fecaca', borderRadius: 10,
                        color: '#dc2626', fontSize: 13, fontWeight: 600, padding: '9px 16px',
                        cursor: 'pointer', marginTop: 4, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget.style.background = '#fef2f2') }}
                      onMouseLeave={e => { (e.currentTarget.style.background = 'none') }}
                    >
                      <Trash2 size={14} /> Supprimer le rendez-vous
                    </button>
                  ) : (
                    <div style={{
                      background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 10,
                      padding: '12px 14px', marginTop: 4,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 10, textAlign: 'center' }}>
                        Confirmer la suppression ?
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          style={{
                            padding: '8px 0', borderRadius: 8, border: '1.5px solid #e5e7eb',
                            background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleDelete(selectedIv)}
                          style={{
                            padding: '8px 0', borderRadius: 8, border: 'none',
                            background: '#dc2626', color: 'white',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          }}
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setConfirmOutsideWork(false) }}>
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
                  <input className="input-field" type="date" value={formDate} onChange={e => { setFormDate(e.target.value); setConfirmOutsideWork(false) }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Heure *</label>
                  <input className="input-field" type="time" value={formTime} onChange={e => { setFormTime(e.target.value); setConfirmOutsideWork(false) }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Type</label>
                  <select className="select-field" value={formType} onChange={e => setFormType(e.target.value)}>
                    {Object.keys(TYPE_COLORS).filter(k => !k.includes("'")).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Durée</label>
                  <select className="select-field" value={formDuration} onChange={e => setFormDuration(e.target.value)}>
                    {Object.keys(DURATIONS).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              {confirmOutsideWork && (
                <div style={{
                  background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 9,
                  padding: '12px 14px', fontSize: 13, color: '#92400e',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Hors plage de travail</div>
                  <div style={{ marginBottom: 10 }}>Ce créneau est en dehors de vos heures de travail configurées. Voulez-vous quand même créer ce rendez-vous ?</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button onClick={() => setConfirmOutsideWork(false)} style={{ padding: '8px 0', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Modifier l'heure
                    </button>
                    <button onClick={() => handleCreate(true)} style={{ padding: '8px 0', borderRadius: 8, border: 'none', background: '#f97316', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Confirmer quand même
                    </button>
                  </div>
                </div>
              )}

              {!confirmOutsideWork && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  <button className="btn-secondary" onClick={() => { setShowModal(false); setConfirmOutsideWork(false) }} style={{ justifyContent: 'center' }}>Annuler</button>
                  <button className="btn-primary" onClick={() => handleCreate()} style={{ justifyContent: 'center' }}
                    disabled={!formClient.trim() || !formDate || !formTime}>
                    Créer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation déplacement hors horaires */}
      {pendingDrop && (
        <div className="modal-overlay" onClick={() => setPendingDrop(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Hors plage de travail</div>
            </div>
            <div style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65, marginBottom: 20 }}>
              Vous déplacez <strong>{pendingDrop.iv.client}</strong> vers le{' '}
              <strong>{formatDate(pendingDrop.dateStr)} à {fmtHM(pendingDrop.newH * 60 + pendingDrop.newM)}</strong>,
              qui est en dehors de vos heures de travail configurées.
              <br /><br />
              Confirmez-vous ce déplacement ?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
                onClick={() => setPendingDrop(null)}
              >
                Annuler
              </button>
              <button
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: '#f97316', color: 'white', border: 'none', borderRadius: 10,
                  padding: '10px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                }}
                onClick={() => {
                  const { iv, dateStr, newH, newM } = pendingDrop
                  applyDrop(iv, dateStr, newH, newM)
                  setPendingDrop(null)
                }}
              >
                Confirmer quand même
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal SMS */}
      {smsModal && (
        <div className="modal-overlay" onClick={() => setSmsModal(null)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MessageCircle size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Prévenir le client</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{smsModal.client} · {smsModal.phone}</div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setSmsModal(null)} style={{ padding: 4 }}><X size={16} /></button>
            </div>

            <div style={{
              background: '#f5f6fa', borderRadius: 10, padding: '14px 16px',
              fontSize: 13.5, color: '#374151', lineHeight: 1.65, marginBottom: 18,
              whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb',
            }}>
              {smsModal.message}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={waUrl(smsModal.phone, smsModal.message)}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: '#25d366', color: 'white', borderRadius: 10,
                  padding: '12px 20px', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                }}
              >
                <MessageCircle size={17} /> Envoyer via WhatsApp
              </a>
              <a
                href={smsUrl(smsModal.phone, smsModal.message)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: '#3b82f6', color: 'white', borderRadius: 10,
                  padding: '12px 20px', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                }}
              >
                <Phone size={17} /> Envoyer par SMS
              </a>
              <button
                onClick={() => handleCopy(smsModal.message)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: smsCopied ? '#f0fdf4' : '#f5f6fa',
                  color: smsCopied ? '#16a34a' : '#374151',
                  border: `1.5px solid ${smsCopied ? '#a7f3d0' : '#e5e7eb'}`,
                  borderRadius: 10, padding: '12px 20px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Copy size={16} /> {smsCopied ? 'Copié !' : 'Copier le message'}
              </button>
              <button
                onClick={() => setSmsModal(null)}
                style={{
                  background: 'none', border: 'none', color: '#9ca3af',
                  fontSize: 13, cursor: 'pointer', padding: '6px 0',
                }}
              >
                Passer — ne pas prévenir le client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
