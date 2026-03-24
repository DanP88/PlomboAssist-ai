import { useState, useEffect, useRef } from 'react'
import {
  Bot, Phone, PhoneCall, Mic, CheckCircle, Clock,
  ChevronRight, MessageSquare, ToggleLeft, ToggleRight,
  Play, Volume2, AlertTriangle, PhoneOff, User, MapPin,
  Calendar, Euro, Zap, X, Send
} from 'lucide-react'
import {
  findBestSlot, calcPrix, getTarif, formatDate,
  REPAIR_DURATIONS
} from '../lib/tarification'
import { addIntervention, minutesToHHMM, getInterventions, Intervention } from '../lib/agenda'
import { geocodeAddress, getTravelTimeMin } from '../lib/geo'

/* ─── Types ─────────────────────────────────────────────────────────── */
type Step =
  | 'idle' | 'ringing' | 'ia_takeover' | 'greeting' | 'urgency'
  | 'diag1' | 'diag2' | 'diag3' | 'diag4'
  | 'collect_name' | 'collect_address' | 'collect_phone'
  | 'calculating' | 'slot_proposal' | 'confirmed'

interface Msg { from: 'ia' | 'client'; text: string }

interface ClientInfo {
  isExisting?: boolean
  isUrgent?: boolean
  problem?: string
  since?: string
  actions?: string
  detail?: string
  name?: string
  address?: string
  phone?: string
}

interface SlotInfo {
  date: string
  startH: number
  startM: number
  durationMin: number
  prixBase: number
  prixTotal: number
  majorations: string[]
}

/* ─── Static demo data ──────────────────────────────────────────────── */
const demoCallLog = [
  { id: 1, caller: 'M. Bernard Paul', phone: '06 12 34 56 78', time: "Aujourd'hui 10h23", duration: '2m 14s', urgency: 1, status: 'qualified', summary: 'Chauffe-eau HS depuis ce matin. Famille avec enfants.' },
  { id: 2, caller: 'Mme Simon Claire', phone: '07 98 76 54 32', time: "Aujourd'hui 09h45", duration: '1m 48s', urgency: 2, status: 'qualified', summary: 'Fuite sous évier cuisine. Seau posé mais déborde.' },
  { id: 3, caller: 'Numéro inconnu', phone: '—', time: "Aujourd'hui 08h12", duration: '0m 22s', urgency: 0, status: 'failed', summary: 'Appel raccroché avant qualification complète.' },
  { id: 4, caller: 'M. Laurent Jean', phone: '06 55 44 33 22', time: 'Hier 16h30', duration: '1m 22s', urgency: 3, status: 'qualified', summary: 'Robinet qui goutte salle de bain. Souhaite un devis.' },
]
const urgencyConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'N/A', color: '#9ca3af', bg: '#f3f4f6' },
  1: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
  2: { label: 'Semi-urgent', color: '#d97706', bg: '#fffbeb' },
  3: { label: 'Planifiable', color: '#16a34a', bg: '#f0fdf4' },
}
const stats = [
  { label: 'Appels traités (mois)', value: '42', color: '#3b82f6' },
  { label: 'Taux de qualification', value: '91%', color: '#10b981' },
  { label: 'Durée moyenne', value: '1m 38s', color: '#f97316' },
  { label: 'Taux de conversion RDV', value: '78%', color: '#7c3aed' },
]
const defaultSms = [
  { label: 'SMS de réassurance (appel manqué)', active: true, desc: 'Envoyé immédiatement si Marc ne décroche pas' },
  { label: 'Confirmation RDV (J-1)', active: true, desc: 'Envoyé la veille à 18h' },
  { label: 'Relance devis (J+3)', active: true, desc: 'Si le client n\'a pas répondu après 3 jours' },
  { label: 'Avis Google (post-intervention)', active: true, desc: 'Envoyé 2h après la clôture' },
  { label: 'Relance facture (J+30)', active: false, desc: 'Rappel poli si facture non réglée' },
]

/* ─── diag4 questions selon le type de problème ─────────────────────── */
function getDiag4(problem: string): { question: string; options: string[] } {
  switch (problem) {
    case "Fuite d'eau":
      return {
        question: "D'où semble venir la fuite ?",
        options: ['Robinet / mitigeur', 'Tuyauterie sous évier', 'Tuyauterie apparente', 'Joints / raccords WC', 'Je ne sais pas'],
      }
    case 'Chauffe-eau':
      return {
        question: 'Votre chauffe-eau est électrique ou gaz ?',
        options: ['Électrique', 'Gaz', 'Je ne sais pas'],
      }
    case 'Débouchage':
      return {
        question: 'Quel appareil est bouché ?',
        options: ['Évier cuisine', 'Lavabo / douche', 'WC', 'Baignoire', 'Canalisation extérieure'],
      }
    default:
      return {
        question: 'Avez-vous déjà eu ce type de problème auparavant ?',
        options: ['Oui, déjà réparé', 'Non, première fois'],
      }
  }
}

/* ─── Composant principal ────────────────────────────────────────────── */
export default function AssistantIA() {
  const [iaActive, setIaActive]     = useState(true)
  const [greetingText, setGreetingText] = useState(
    "Bonjour, vous êtes bien chez Plomberie Lefebvre. Marc n'est pas disponible pour le moment. Je suis son assistante IA. Comment puis-je vous aider ?"
  )
  const [greetingSaved, setGreetingSaved] = useState(false)
  const [playingTest, setPlayingTest] = useState(false)
  const [smsAutomations, setSmsAutomations] = useState(defaultSms)
  const [callLog, setCallLog] = useState(demoCallLog)
  const [showCall, setShowCall] = useState(false)

  // — Conversation state
  const [step, setStep]         = useState<Step>('idle')
  const [messages, setMessages] = useState<Msg[]>([])
  const [clientInfo, setClientInfo] = useState<ClientInfo>({})
  const [textInput, setTextInput]   = useState('')
  const [slotInfo, setSlotInfo]     = useState<SlotInfo | null>(null)
  const [altSlotCount, setAltSlotCount] = useState(0)
  const [callTimer, setCallTimer]   = useState(0)

  interface TravelContext {
    loading: boolean
    prevIv?: Intervention
    prevTravelMin?: number
    nextIv?: Intervention
    nextTravelMin?: number
  }
  const [travelCtx, setTravelCtx] = useState<TravelContext | null>(null)
  const [ringCount, setRingCount]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Call timer
  useEffect(() => {
    if (showCall && step !== 'idle' && step !== 'confirmed') {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [showCall, step])

  function fmtTimer(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  /* helpers */
  function iaMsg(text: string, delay = 0) {
    setTimeout(() => setMessages(p => [...p, { from: 'ia', text }]), delay)
  }
  function clientMsg(text: string) {
    setMessages(p => [...p, { from: 'client', text }])
  }

  /* ─── Step transitions ─────────────────────────────────────────────── */
  function startCall() {
    setTravelCtx(null)
    setStep('ringing')
    setMessages([])
    setClientInfo({})
    setSlotInfo(null)
    setAltSlotCount(0)
    setTextInput('')
    setCallTimer(0)
    setRingCount(0)
    setShowCall(true)
    // 3 sonneries espacées de 1.4s
    setTimeout(() => setRingCount(1), 800)
    setTimeout(() => setRingCount(2), 2200)
    setTimeout(() => setRingCount(3), 3600)
    // Marc ne répond pas → transition IA
    setTimeout(() => setStep('ia_takeover'), 4800)
    // L'IA prend l'appel
    setTimeout(() => {
      setStep('greeting')
      iaMsg("Bonjour, vous êtes bien chez Plomberie Lefebvre. Marc n'est pas disponible pour le moment. Je suis son assistante IA. Êtes-vous déjà client chez nous ?")
    }, 6200)
  }

  function handleExisting(val: boolean) {
    clientMsg(val ? 'Oui, je suis déjà client' : 'Non, première fois')
    setClientInfo(c => ({ ...c, isExisting: val }))
    setStep('urgency')
    iaMsg("Très bien. Est-ce une urgence — fuite active, plus d'eau chaude, risque de dégât des eaux ?", 400)
  }

  function handleUrgency(val: boolean) {
    clientMsg(val ? 'Oui, c\'est urgent' : 'Non, c\'est planifiable')
    setClientInfo(c => ({ ...c, isUrgent: val }))
    setStep('diag1')
    iaMsg(val
      ? "Je comprends, nous allons vous trouver un créneau au plus tôt. Quel est le type de problème ?"
      : "D'accord. Pour mieux vous aider, quel est le type de problème ?"
    , 400)
  }

  function handleDiag1(problem: string) {
    clientMsg(problem)
    setClientInfo(c => ({ ...c, problem }))
    setStep('diag2')
    iaMsg('Depuis combien de temps avez-vous ce problème ?', 400)
  }

  function handleDiag2(since: string) {
    clientMsg(since)
    setClientInfo(c => ({ ...c, since }))
    setStep('diag3')
    iaMsg('Avez-vous pu couper l\'arrivée d\'eau principale ?', 400)
  }

  function handleDiag3(actions: string) {
    clientMsg(actions)
    setClientInfo(c => ({ ...c, actions }))
    setStep('diag4')
    const d4 = getDiag4(clientInfo.problem || '')
    iaMsg(d4.question, 400)
  }

  function handleDiag4(detail: string) {
    clientMsg(detail)
    setClientInfo(c => ({ ...c, detail }))
    setStep('collect_name')
    iaMsg("Merci pour ces précisions. Pour confirmer votre rendez-vous, j'ai besoin de quelques informations. Quel est votre nom et prénom ?", 400)
  }

  function handleCollectName() {
    if (!textInput.trim()) return
    clientMsg(textInput)
    setClientInfo(c => ({ ...c, name: textInput }))
    setTextInput('')
    setStep('collect_address')
    iaMsg('Et votre adresse complète (rue, code postal, ville) ?', 400)
  }

  function handleCollectAddress() {
    if (!textInput.trim()) return
    clientMsg(textInput)
    setClientInfo(c => ({ ...c, address: textInput }))
    setTextInput('')
    setStep('collect_phone')
    iaMsg('Votre numéro de téléphone pour que Marc puisse vous confirmer l\'intervention ?', 400)
  }

  function handleCollectPhone() {
    if (!textInput.trim()) return
    clientMsg(textInput)
    const phone = textInput
    setClientInfo(c => ({ ...c, phone }))
    setTextInput('')
    setStep('calculating')
    iaMsg('Parfait ! Je consulte le planning de Marc pour trouver le meilleur créneau disponible...', 400)
    setTimeout(() => proposeSlot(phone), 2000)
  }

  function proposeSlot(phoneOverride?: string, isAlt = false) {
    const info = { ...clientInfo, phone: phoneOverride ?? clientInfo.phone }
    const problem = info.problem || 'Autre'
    const repairDuration = REPAIR_DURATIONS[problem] || 75
    const tarif = getTarif()

    const prevSlot = isAlt && slotInfo
      ? { date: slotInfo.date, startH: slotInfo.startH, startM: slotInfo.startM }
      : undefined

    const slot = findBestSlot(repairDuration, tarif, prevSlot)
    if (!slot) {
      setStep('slot_proposal')
      iaMsg("Je suis désolée, aucun créneau n'est disponible dans les 2 prochaines semaines. Marc vous rappellera personnellement dès que possible.")
      return
    }

    const prix = calcPrix(repairDuration, slot.date, slot.startH, info.isUrgent ?? false, tarif)
    const si: SlotInfo = {
      ...slot,
      durationMin: repairDuration,
      prixBase: prix.base,
      prixTotal: prix.total,
      majorations: prix.majorations,
    }
    setSlotInfo(si)
    setStep('slot_proposal')
    computeTravelContext(si, info.address || '')

    const dateLabel = formatDate(slot.date)
    const timeLabel = minutesToHHMM(slot.startH * 60 + slot.startM)
    const endLabel  = minutesToHHMM(slot.startH * 60 + slot.startM + repairDuration)
    const prixLabel = prix.majorations.length > 0
      ? `${prix.total} € HT (${prix.majorations.join(', ')})`
      : `${prix.total} € HT`

    iaMsg(`J'ai trouvé un créneau pour vous ! Marc peut intervenir le **${dateLabel}** de **${timeLabel}** à **${endLabel}** (durée estimée : ${repairDuration} min). Tarif indicatif : ${prixLabel}. Cela vous convient ?`, 0)
  }

  function handleConfirm() {
    if (!slotInfo) return
    clientMsg('Oui, je confirme ce rendez-vous')

    // Save to agenda
    const info = clientInfo
    const problem = info.problem || 'Autre'
    const typeColorMap: Record<string, { typeColor: string; typeBg: string; typeBorder: string }> = {
      "Fuite d'eau":  { typeColor: '#dc2626', typeBg: '#fef2f2', typeBorder: '#fecaca' },
      'Chauffe-eau':  { typeColor: '#2563eb', typeBg: '#eff6ff', typeBorder: '#bfdbfe' },
      'Débouchage':   { typeColor: '#d97706', typeBg: '#fffbeb', typeBorder: '#fde68a' },
      'Entretien':    { typeColor: '#16a34a', typeBg: '#f0fdf4', typeBorder: '#a7f3d0' },
      'Robinetterie': { typeColor: '#0891b2', typeBg: '#ecfeff', typeBorder: '#a5f3fc' },
      'Autre':        { typeColor: '#6b7280', typeBg: '#f9fafb', typeBorder: '#e5e7eb' },
    }
    const colors = typeColorMap[problem] || typeColorMap['Autre']
    addIntervention({
      date: slotInfo.date,
      startH: slotInfo.startH,
      startM: slotInfo.startM,
      durationMin: slotInfo.durationMin,
      client: info.name || 'Nouveau client',
      phone: info.phone || '',
      address: info.address || '',
      type: problem,
      ...colors,
      status: 'scheduled',
      notes: `[IA] ${info.problem} · ${info.since} · ${info.actions}`,
    })

    const dateLabel = formatDate(slotInfo.date)
    const timeLabel = minutesToHHMM(slotInfo.startH * 60 + slotInfo.startM)
    setStep('confirmed')
    iaMsg(`Parfait ! Votre rendez-vous est confirmé pour le **${dateLabel}** à **${timeLabel}**. Marc sera chez vous à cette heure-là. Vous recevrez un SMS de confirmation. À bientôt, ${info.name?.split(' ')[0] || ''} !`, 300)

    // Add to call log
    const urgency = info.isUrgent ? 1 : info.since === 'Depuis aujourd\'hui' ? 2 : 3
    setCallLog(prev => [{
      id: Date.now(),
      caller: info.name || 'Nouveau client',
      phone: info.phone || '—',
      time: `Aujourd'hui ${new Date().getHours()}h${String(new Date().getMinutes()).padStart(2,'0')}`,
      duration: fmtTimer(callTimer),
      urgency,
      status: 'qualified',
      summary: `${info.problem} · ${info.since} · RDV confirmé ${dateLabel} à ${timeLabel}`,
    }, ...prev])

    if (timerRef.current) clearInterval(timerRef.current)
  }

  function handleAltSlot() {
    clientMsg('Non, proposez-moi un autre créneau')
    setAltSlotCount(c => c + 1)
    setStep('calculating')
    iaMsg('Je cherche un autre créneau disponible...', 300)
    setTimeout(() => proposeSlot(undefined, true), 1800)
  }

  async function computeTravelContext(slot: SlotInfo, newAddress: string) {
    setTravelCtx({ loading: true })
    const all = getInterventions()
    const slotStartMin = slot.startH * 60 + slot.startM
    const slotEndMin = slotStartMin + slot.durationMin
    const dayIvs = all
      .filter(iv => iv.date === slot.date && iv.status !== 'cancelled' && iv.status !== 'done')
      .sort((a, b) => (a.startH * 60 + a.startM) - (b.startH * 60 + b.startM))
    const prevIv = [...dayIvs].reverse().find(iv => iv.startH * 60 + iv.startM + iv.durationMin <= slotStartMin)
    const nextIv = dayIvs.find(iv => iv.startH * 60 + iv.startM >= slotEndMin)

    try {
      const [newCoords, prevCoords, nextCoords] = await Promise.all([
        geocodeAddress(newAddress),
        prevIv?.address ? geocodeAddress(prevIv.address) : Promise.resolve(null),
        nextIv?.address ? geocodeAddress(nextIv.address) : Promise.resolve(null),
      ])
      const prevTravelMin = (prevCoords && newCoords) ? await getTravelTimeMin(prevCoords, newCoords) : undefined
      const nextTravelMin = (newCoords && nextCoords) ? await getTravelTimeMin(newCoords, nextCoords) : undefined
      setTravelCtx({ loading: false, prevIv, prevTravelMin, nextIv, nextTravelMin })
    } catch {
      setTravelCtx({ loading: false, prevIv, nextIv })
    }
  }

  function endCall() {
    setShowCall(false)
    setStep('idle')
  }

  /* ─── Render helpers ─────────────────────────────────────────────────── */
  const diag4Options = getDiag4(clientInfo.problem || '').options

  function ChoiceBtn({ label, onClick, color }: { label: string; onClick: () => void; color?: string }) {
    return (
      <button onClick={onClick} style={{
        padding: '10px 16px', borderRadius: 20, border: '1.5px solid #e5e7eb',
        background: 'white', color: color || '#374151', fontSize: 13.5, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap'
      }}
        onMouseEnter={e => { (e.currentTarget.style.background = '#f5f6fa'); (e.currentTarget.style.borderColor = '#d1d5db') }}
        onMouseLeave={e => { (e.currentTarget.style.background = 'white'); (e.currentTarget.style.borderColor = '#e5e7eb') }}
      >
        {label}
      </button>
    )
  }

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Call simulation modal */}
      {showCall && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 920, height: '88vh',
            background: 'white', borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
          }}>
            {/* Call header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '14px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: step === 'ringing' ? '#f97316' : step === 'ia_takeover' ? '#7c3aed' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 4px ${step === 'ringing' ? 'rgba(249,115,22,0.3)' : step === 'ia_takeover' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)'}`
                }}>
                  {step === 'ringing' ? <PhoneCall size={17} color="white" /> : step === 'ia_takeover' ? <Bot size={17} color="white" /> : <Mic size={17} color="white" />}
                </div>
                <div>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>
                    {step === 'ringing' ? 'Appel entrant — Marc ne répond pas' : step === 'ia_takeover' ? "L'IA prend l'appel" : step === 'confirmed' ? 'Appel terminé' : 'IA en ligne'}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 12 }}>
                    {step === 'ringing' ? 'Sonnerie en cours...' : step === 'ia_takeover' ? 'Transfert automatique' : `Assistant IA · ${fmtTimer(callTimer)}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {step === 'confirmed' && (
                  <button onClick={endCall} style={{
                    background: '#10b981', color: 'white', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <CheckCircle size={14} /> Terminer & fermer
                  </button>
                )}
                <button onClick={endCall} style={{
                  background: '#ef4444', color: 'white', border: 'none',
                  borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PhoneOff size={16} />
                </button>
              </div>
            </div>

            {/* Call body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Chat */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                borderRight: '1px solid #f0f0f0'
              }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
                  {(step === 'ringing' || step === 'ia_takeover') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>

                      {step === 'ringing' ? (<>
                        {/* Téléphone animé */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '2px solid rgba(249,115,22,0.25)', animation: 'ripple 1.4s ease-out infinite' }} />
                          <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '2px solid rgba(249,115,22,0.12)', animation: 'ripple 1.4s ease-out 0.4s infinite' }} />
                          <div style={{
                            width: 80, height: 80, borderRadius: '50%', zIndex: 1,
                            background: 'linear-gradient(135deg, #1e293b, #334155)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                          }}>
                            <Phone size={34} color="white" style={{ animation: 'shake 0.4s ease-in-out infinite' }} />
                          </div>
                        </div>

                        {/* Infos */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Appel entrant</div>
                          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Numéro inconnu</div>

                          {/* Indicateurs de sonnerie */}
                          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10 }}>
                            {[1, 2, 3].map(n => (
                              <div key={n} style={{
                                width: 14, height: 14, borderRadius: '50%',
                                background: ringCount >= n ? '#f97316' : '#e5e7eb',
                                boxShadow: ringCount >= n ? '0 0 8px rgba(249,115,22,0.5)' : 'none',
                                transition: 'all 0.3s',
                              }} />
                            ))}
                          </div>
                          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                            {ringCount === 0 ? 'Sonnerie...' : `Sonnerie ${ringCount} sur 3...`}
                          </div>
                        </div>

                        {/* Statut Marc */}
                        <div style={{
                          background: '#fef2f2', border: '1px solid #fecaca',
                          borderRadius: 10, padding: '10px 20px',
                          display: 'flex', alignItems: 'center', gap: 8
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', animation: 'pulse 1s infinite' }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                            Marc ne répond pas...
                          </span>
                        </div>
                      </>) : (<>
                        {/* Transition IA takeover */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 0 14px rgba(124,58,237,0.15)',
                          }}>
                            <Bot size={32} color="white" />
                          </div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                            Marc n'a pas répondu
                          </div>
                          <div style={{ fontSize: 14, color: '#7c3aed', fontWeight: 700, marginBottom: 6 }}>
                            → L'assistante IA prend l'appel
                          </div>
                          <div style={{ fontSize: 12.5, color: '#9ca3af' }}>
                            Le client ne sera pas perdu · RDV pris automatiquement
                          </div>
                        </div>
                      </>)}

                      <style>{`
                        @keyframes ripple { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
                        @keyframes shake { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
                        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
                      `}</style>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: m.from === 'ia' ? 'flex-start' : 'flex-end',
                      marginBottom: 12,
                    }}>
                      {m.from === 'ia' && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginRight: 8, alignSelf: 'flex-end'
                        }}>
                          <Bot size={14} color="white" />
                        </div>
                      )}
                      <div style={{
                        maxWidth: '72%',
                        background: m.from === 'ia' ? '#f5f3ff' : '#f0fdf4',
                        border: `1px solid ${m.from === 'ia' ? '#ede9fe' : '#dcfce7'}`,
                        borderRadius: m.from === 'ia' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                        padding: '10px 14px',
                        fontSize: 13.5, color: '#111827', lineHeight: 1.55,
                      }}>
                        {/* Render **bold** text */}
                        {m.text.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                        )}
                      </div>
                      {m.from === 'client' && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#e5e7eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginLeft: 8, alignSelf: 'flex-end'
                        }}>
                          <User size={14} color="#6b7280" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input zone */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', minHeight: 70 }}>
                  {/* Quick choices */}
                  {step === 'greeting' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ChoiceBtn label="Oui, je suis déjà client" onClick={() => handleExisting(true)} />
                      <ChoiceBtn label="Non, c'est ma première fois" onClick={() => handleExisting(false)} />
                    </div>
                  )}
                  {step === 'urgency' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ChoiceBtn label="Oui, c'est urgent" onClick={() => handleUrgency(true)} color="#dc2626" />
                      <ChoiceBtn label="Non, planifiable" onClick={() => handleUrgency(false)} color="#16a34a" />
                    </div>
                  )}
                  {step === 'diag1' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.keys(REPAIR_DURATIONS).map(p => (
                        <ChoiceBtn key={p} label={p} onClick={() => handleDiag1(p)} />
                      ))}
                    </div>
                  )}
                  {step === 'diag2' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {["Depuis aujourd'hui", 'Depuis quelques jours', 'Plus d\'une semaine'].map(s => (
                        <ChoiceBtn key={s} label={s} onClick={() => handleDiag2(s)} />
                      ))}
                    </div>
                  )}
                  {step === 'diag3' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['Oui, l\'eau est coupée', 'Non, elle coule encore', 'Sans objet'].map(s => (
                        <ChoiceBtn key={s} label={s} onClick={() => handleDiag3(s)} />
                      ))}
                    </div>
                  )}
                  {step === 'diag4' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {diag4Options.map(o => (
                        <ChoiceBtn key={o} label={o} onClick={() => handleDiag4(o)} />
                      ))}
                    </div>
                  )}
                  {step === 'slot_proposal' && slotInfo && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={handleConfirm} style={{
                        padding: '10px 20px', borderRadius: 20,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none', fontSize: 13.5, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <CheckCircle size={15} /> Confirmer ce rendez-vous
                      </button>
                      {altSlotCount < 2 && (
                        <ChoiceBtn label="Proposer un autre créneau" onClick={handleAltSlot} />
                      )}
                    </div>
                  )}
                  {/* Text inputs */}
                  {['collect_name', 'collect_address', 'collect_phone'].includes(step) && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="input-field"
                        type={step === 'collect_phone' ? 'tel' : 'text'}
                        placeholder={
                          step === 'collect_name' ? 'Prénom et nom du client' :
                          step === 'collect_address' ? 'Adresse complète' :
                          'Numéro de téléphone'
                        }
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            step === 'collect_name'    ? handleCollectName() :
                            step === 'collect_address' ? handleCollectAddress() :
                            handleCollectPhone()
                          }
                        }}
                        style={{ flex: 1 }}
                        autoFocus
                      />
                      <button
                        className="btn-primary"
                        style={{ padding: '8px 14px' }}
                        onClick={
                          step === 'collect_name'    ? handleCollectName :
                          step === 'collect_address' ? handleCollectAddress :
                          handleCollectPhone
                        }
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: client info + slot */}
              <div style={{
                width: 280, flexShrink: 0, overflowY: 'auto',
                padding: '18px 18px', background: '#fafafa',
                display: 'flex', flexDirection: 'column', gap: 14
              }}>
                {/* Client info card */}
                <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Fiche client</div>
                  {[
                    { icon: User, label: 'Nom', val: clientInfo.name },
                    { icon: MapPin, label: 'Adresse', val: clientInfo.address },
                    { icon: Phone, label: 'Téléphone', val: clientInfo.phone },
                  ].map(({ icon: Ic, label, val }) => (
                    <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <Ic size={13} color={val ? '#7c3aed' : '#d1d5db'} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{label}</div>
                        <div style={{ fontSize: 13, color: val ? '#111827' : '#d1d5db', fontWeight: val ? 600 : 400 }}>
                          {val || '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Diagnostic card */}
                {(clientInfo.problem || clientInfo.isUrgent !== undefined) && (
                  <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Diagnostic</div>
                    {clientInfo.isUrgent !== undefined && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, marginBottom: 10,
                        background: clientInfo.isUrgent ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${clientInfo.isUrgent ? '#fecaca' : '#a7f3d0'}`,
                      }}>
                        {clientInfo.isUrgent ? <Zap size={12} color="#dc2626" /> : <CheckCircle size={12} color="#16a34a" />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: clientInfo.isUrgent ? '#dc2626' : '#16a34a' }}>
                          {clientInfo.isUrgent ? 'URGENT' : 'Planifiable'}
                        </span>
                      </div>
                    )}
                    {clientInfo.problem && <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{clientInfo.problem}</div>}
                    {clientInfo.since && <div style={{ fontSize: 12, color: '#6b7280' }}>{clientInfo.since}</div>}
                    {clientInfo.detail && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clientInfo.detail}</div>}
                  </div>
                )}

                {/* Slot card */}
                {slotInfo && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                    borderRadius: 12, padding: '14px 16px', border: '1px solid #ddd6fe'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Créneau proposé</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Calendar size={14} color="#7c3aed" />
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>
                        {formatDate(slotInfo.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Clock size={14} color="#7c3aed" />
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        {minutesToHHMM(slotInfo.startH * 60 + slotInfo.startM)} → {minutesToHHMM(slotInfo.startH * 60 + slotInfo.startM + slotInfo.durationMin)}
                      </span>
                    </div>
                    <div style={{ height: 1, background: '#ddd6fe', margin: '10px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: slotInfo.majorations.length > 0 ? 6 : 0 }}>
                      <Euro size={14} color="#7c3aed" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                        {slotInfo.prixTotal} € HT
                      </span>
                      {slotInfo.prixTotal !== slotInfo.prixBase && (
                        <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>{slotInfo.prixBase} €</span>
                      )}
                    </div>
                    {slotInfo.majorations.map(m => (
                      <div key={m} style={{ fontSize: 11.5, color: '#d97706', fontWeight: 600, paddingLeft: 22 }}>{m}</div>
                    ))}
                  </div>
                )}

                {/* Travel context card */}
                {(travelCtx || slotInfo) && (
                  <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                      Contexte du créneau
                    </div>

                    {/* Duration */}
                    {slotInfo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 10px', background: '#f5f3ff', borderRadius: 8 }}>
                        <Clock size={12} color="#7c3aed" />
                        <span style={{ fontSize: 12, color: '#374151' }}>
                          Durée estimée : <strong style={{ color: '#7c3aed' }}>{slotInfo.durationMin} min</strong>
                          <span style={{ color: '#9ca3af', fontSize: 11 }}> ({clientInfo.problem})</span>
                        </span>
                      </div>
                    )}

                    {travelCtx?.loading && (
                      <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>
                        🔄 Calcul des trajets en cours...
                      </div>
                    )}

                    {!travelCtx?.loading && travelCtx && (<>
                      {/* Previous intervention */}
                      {travelCtx.prevIv ? (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>RDV précédent</div>
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 2 }}>
                            {travelCtx.prevIv.client} · {travelCtx.prevIv.startH}h{String(travelCtx.prevIv.startM).padStart(2,'0')}–{Math.floor((travelCtx.prevIv.startH * 60 + travelCtx.prevIv.startM + travelCtx.prevIv.durationMin)/60)}h{String((travelCtx.prevIv.startH * 60 + travelCtx.prevIv.startM + travelCtx.prevIv.durationMin)%60).padStart(2,'0')}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{travelCtx.prevIv.address}</div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: travelCtx.prevTravelMin !== undefined && travelCtx.prevTravelMin > 25 ? '#fff7ed' : '#f0fdf4',
                            border: `1px solid ${travelCtx.prevTravelMin !== undefined && travelCtx.prevTravelMin > 25 ? '#fed7aa' : '#a7f3d0'}`,
                            borderRadius: 7, padding: '4px 8px'
                          }}>
                            <span style={{ fontSize: 13 }}>🚗</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: travelCtx.prevTravelMin !== undefined && travelCtx.prevTravelMin > 25 ? '#92400e' : '#15803d' }}>
                              {travelCtx.prevTravelMin !== undefined ? `~${travelCtx.prevTravelMin} min de trajet` : '~20 min (estimé)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginBottom: 8 }}>
                          Aucun RDV avant ce créneau
                        </div>
                      )}

                      {/* Separator */}
                      <div style={{ height: 1, background: '#f0f0f0', margin: '8px 0' }} />

                      {/* Next intervention */}
                      {travelCtx.nextIv ? (
                        <div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>RDV suivant</div>
                          <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 2 }}>
                            {travelCtx.nextIv.client} · {travelCtx.nextIv.startH}h{String(travelCtx.nextIv.startM).padStart(2,'0')}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{travelCtx.nextIv.address}</div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: travelCtx.nextTravelMin !== undefined && travelCtx.nextTravelMin > 25 ? '#fff7ed' : '#f0fdf4',
                            border: `1px solid ${travelCtx.nextTravelMin !== undefined && travelCtx.nextTravelMin > 25 ? '#fed7aa' : '#a7f3d0'}`,
                            borderRadius: 7, padding: '4px 8px'
                          }}>
                            <span style={{ fontSize: 13 }}>🚗</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: travelCtx.nextTravelMin !== undefined && travelCtx.nextTravelMin > 25 ? '#92400e' : '#15803d' }}>
                              {travelCtx.nextTravelMin !== undefined ? `~${travelCtx.nextTravelMin} min de trajet` : '~20 min (estimé)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                          Aucun RDV après ce créneau
                        </div>
                      )}
                    </>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Normal page view ───────────────────────────────────────────── */}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="page-icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Bot size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Assistant IA Téléphonique</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Qualification automatique · Prise de RDV intelligente</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Simulate call button */}
          <button onClick={startCall} style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)'
          }}>
            <PhoneCall size={16} /> Simuler un appel entrant
          </button>
          {/* Toggle IA */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: iaActive ? '#f0fdf4' : '#f3f4f6',
            border: `1px solid ${iaActive ? '#a7f3d0' : '#e5e7eb'}`,
            borderRadius: 10, padding: '8px 14px'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: iaActive ? '#10b981' : '#9ca3af' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: iaActive ? '#16a34a' : '#6b7280' }}>
              {iaActive ? 'IA Active' : 'IA Désactivée'}
            </span>
            <button onClick={() => setIaActive(!iaActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {iaActive ? <ToggleRight size={26} color="#10b981" /> : <ToggleLeft size={26} color="#9ca3af" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Conversation flow preview */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
        border: '1px solid #ddd6fe', borderRadius: 14, padding: '18px 22px', marginBottom: 20
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={16} /> Déroulé de la conversation IA
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            'Client existant ?',
            'Urgence ?',
            '3-4 questions diagnostic',
            'Nom & Prénom',
            'Adresse',
            'Téléphone',
            'Calcul créneau',
            'Proposition RDV + prix',
            'Confirmation → agenda',
          ].map((step, i, arr) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'white', border: '1px solid #c4b5fd',
                borderRadius: 20, padding: '5px 12px',
                fontSize: 12.5, fontWeight: 600, color: '#7c3aed'
              }}>{step}</div>
              {i < arr.length - 1 && <ChevronRight size={13} color="#a78bfa" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2-1" style={{ gap: 20 }}>
        {/* Left — Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Numéro dédié */}
          <div style={{ background: 'white', borderRadius: 14, padding: '22px 24px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={16} color="#f97316" /> Votre numéro dédié PlomboAssist
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Numéro IA dédié</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: 1 }}>09 72 68 XX XX</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Redirection depuis votre mobile</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={24} color="#fb923c" />
              </div>
            </div>
            <div style={{ background: '#f5f6fa', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Codes de renvoi d'appel</div>
              {[{ op: 'SFR', code: '**62*0972XXXXXX#' }, { op: 'Orange', code: '**61*0972XXXXXX#' }, { op: 'Free', code: '**67*0972XXXXXX#' }, { op: 'Bouygues', code: '**61*0972XXXXXX#' }].map(o => (
                <div key={o.op} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{o.op}</span>
                  <code style={{ fontSize: 12, color: '#7c3aed', background: '#faf5ff', padding: '2px 8px', borderRadius: 6 }}>{o.code}</code>
                </div>
              ))}
            </div>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setPlayingTest(true); setTimeout(() => setPlayingTest(false), 3000) }}>
              {playingTest ? <><Volume2 size={14} color="#f97316" /> Test en cours...</> : <><Play size={14} /> Tester l'assistant</>}
            </button>
          </div>

          {/* Message d'accueil */}
          <div style={{ background: 'white', borderRadius: 14, padding: '22px 24px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="#f97316" /> Message d'accueil
            </div>
            <textarea value={greetingText} onChange={e => setGreetingText(e.target.value)} rows={4}
              className="input-field" style={{ resize: 'none', fontSize: 13.5, lineHeight: 1.6, marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{greetingText.length}/280</span>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setGreetingSaved(true); setTimeout(() => setGreetingSaved(false), 2500) }}>
                {greetingSaved ? <><CheckCircle size={14} /> Enregistré</> : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* SMS auto */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 24px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Automatisations SMS</div>
            {smsAutomations.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{a.desc}</div>
                </div>
                <div style={{ marginLeft: 16, flexShrink: 0 }} onClick={() => setSmsAutomations(p => p.map((x, j) => j === i ? { ...x, active: !x.active } : x))}>
                  {a.active ? <ToggleRight size={22} color="#10b981" style={{ cursor: 'pointer' }} /> : <ToggleLeft size={22} color="#9ca3af" style={{ cursor: 'pointer' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Call log */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Journal des appels IA</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{callLog.length} appels traités</div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 620 }}>
            {callLog.map(c => {
              const uc = urgencyConfig[c.urgency]
              return (
                <div key={c.id} style={{ padding: '14px 22px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: c.status === 'qualified' ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {c.status === 'qualified' ? <CheckCircle size={14} color="#10b981" /> : <AlertTriangle size={14} color="#dc2626" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{c.caller}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.phone}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.time}</div>
                      <div style={{ fontSize: 11.5, color: '#6b7280' }}>{c.duration}</div>
                    </div>
                  </div>
                  {c.status === 'qualified' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Bot size={14} color="#7c3aed" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, margin: 0, flex: 1 }}>{c.summary}</p>
                      {c.urgency > 0 && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: uc.color, background: uc.bg, padding: '2px 7px', borderRadius: 7, flexShrink: 0 }}>{uc.label}</span>
                      )}
                    </div>
                  )}
                  {c.status === 'failed' && <div style={{ fontSize: 12.5, color: '#9ca3af', fontStyle: 'italic' }}>{c.summary}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
