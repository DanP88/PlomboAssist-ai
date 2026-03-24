import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, FileText, AlertTriangle, PhoneCall, Plus,
  Clock, CheckCircle, ChevronRight, RotateCcw,
  Phone, MapPin, Calendar, Euro, Bot, MessageCircle, Copy, X
} from 'lucide-react'
import {
  getTodayInterventions, updateStatus, calcETA, minutesToHHMM,
  Intervention
} from '../lib/agenda'

const kpis = [
  {
    label: 'CA du mois',
    value: '8 420 €',
    trend: '+12%',
    trendUp: true,
    sub: 'vs mars 2025',
    icon: Euro,
    color: '#f97316',
    bg: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
    border: '#fed7aa',
    iconBg: '#f97316',
  },
  {
    label: 'Devis en attente',
    value: '5',
    trend: null,
    sub: '2 800 € potentiels',
    icon: FileText,
    color: '#3b82f6',
    bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: '#bfdbfe',
    iconBg: '#3b82f6',
  },
  {
    label: 'Factures impayées',
    value: '1 240 €',
    trend: null,
    sub: '3 factures',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    border: '#fecaca',
    iconBg: '#ef4444',
    alert: true,
  },
  {
    label: 'Appels IA traités',
    value: '8',
    trend: null,
    sub: '6 RDV pris automatiquement',
    icon: PhoneCall,
    color: '#10b981',
    bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '#a7f3d0',
    iconBg: '#10b981',
  },
]

const recentIACalls = [
  { id: 1, name: 'M. Bernard Paul',  phone: '06 12 34 56 78', type: 'Chauffe-eau', urgency: 'urgent',      rdv: "Auj. 15h30", timeAgo: "Il y a 2h" },
  { id: 2, name: 'Mme Simon Claire', phone: '07 98 76 54 32', type: 'Fuite',       urgency: 'semi-urgent', rdv: "Auj. 13h00", timeAgo: "Il y a 3h" },
  { id: 3, name: 'M. Laurent Jean',  phone: '06 55 44 33 22', type: 'Robinetterie', urgency: 'planifiable', rdv: "Jeu. 9h00",   timeAgo: "Hier 16h30" },
]

const relancesDevis = [
  { id: 1, client: 'M. Laurent', montant: '850 €', jours: 5 },
  { id: 2, client: 'Mme Garcia', montant: '1 200 €', jours: 3 },
]

const urgencyConfig: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
  2: { label: 'Semi-urgent', color: '#d97706', bg: '#fffbeb' },
  3: { label: 'Planifiable', color: '#16a34a', bg: '#f0fdf4' },
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  done:        { label: 'Terminé',  icon: CheckCircle, color: '#10b981' },
  in_progress: { label: 'En cours', icon: Clock,        color: '#f97316' },
  scheduled:   { label: 'Planifié', icon: Calendar,     color: '#6b7280' },
  cancelled:   { label: 'Annulé',   icon: X,            color: '#dc2626' },
}

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

interface MsgModal {
  phone: string
  client: string
  message: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateCapital = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [msgModal, setMsgModal] = useState<MsgModal | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setInterventions(getTodayInterventions())
  }, [])

  function handleFinished(iv: Intervention) {
    const finishedAt = new Date().toISOString()
    updateStatus(iv.id, 'done', finishedAt)
    const updated = getTodayInterventions()
    setInterventions(updated)

    // Find next scheduled intervention
    const next = updated.find(x => x.status === 'scheduled')
    if (!next) return

    // ETA calculation
    const etaMin = calcETA(Date.now()) // finishedAt now + 20 min travel
    const scheduledMin = next.startH * 60 + next.startM
    const diffMin = etaMin - scheduledMin

    let message: string
    if (diffMin <= 0) {
      // On time or early
      message = `Bonjour ${next.client},\nVotre plombier sera chez vous à ${minutesToHHMM(etaMin)} comme prévu. À tout à l'heure !`
    } else {
      message = `Bonjour ${next.client},\nVotre plombier aura un peu de retard et arrivera vers ${minutesToHHMM(etaMin)} (environ ${diffMin} min de retard). Toutes nos excuses.`
    }

    setMsgModal({ phone: next.phone, client: next.client, message })
  }

  function whatsappUrl(phone: string, message: string) {
    const cleaned = phone.replace(/\s/g, '').replace(/^0/, '33')
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
  }

  function smsUrl(phone: string, message: string) {
    const cleaned = phone.replace(/\s/g, '')
    return `sms:${cleaned}?body=${encodeURIComponent(message)}`
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inProgress = interventions.find(iv => iv.status === 'in_progress')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Header greeting */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 3 }}>
            Bonjour Marc 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{dateCapital}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/planning')}>
            <Calendar size={15} />
            Planning
          </button>
          <button className="btn-primary" onClick={() => navigate('/devis')}>
            <Plus size={15} />
            Nouveau devis
          </button>
        </div>
      </div>

      {/* "J'ai fini !" banner — visible quand une intervention est en cours */}
      {inProgress && (
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '1.5px solid #fed7aa',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: '#f97316',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Clock size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                En cours · {inProgress.client}
              </div>
              <div style={{ fontSize: 12.5, color: '#6b7280' }}>
                {inProgress.type} · {inProgress.address}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleFinished(inProgress)}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <CheckCircle size={16} /> J'ai fini !
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} style={{
              background: kpi.bg,
              border: `1.5px solid ${kpi.border}`,
              borderRadius: 14,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: kpi.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0.9
                }}>
                  <Icon size={18} color="white" />
                </div>
                {kpi.trend && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 700,
                    color: kpi.trendUp ? '#16a34a' : '#dc2626',
                    background: kpi.trendUp ? '#f0fdf4' : '#fef2f2',
                    padding: '2px 7px', borderRadius: 20
                  }}>
                    {kpi.trendUp ? '↑' : '↓'} {kpi.trend}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: 5 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{kpi.label}</div>
              <div style={{ fontSize: 11.5, color: kpi.color, fontWeight: 600, marginTop: 3 }}>{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Main 2-col grid */}
      <div className="grid-2-1">

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Planning du jour */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Calendar size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Planning du jour</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {interventions.length} intervention{interventions.length !== 1 ? 's' : ''} planifiée{interventions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/planning')} style={{ fontSize: 12 }}>
                Voir tout <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {interventions.map((iv) => {
                const sc = statusConfig[iv.status] || statusConfig.scheduled
                const StatusIcon = sc.icon
                const endTotalM = iv.startH * 60 + iv.startM + iv.durationMin
                const timeStr = fmtTime(iv.startH, iv.startM)
                const endStr  = fmtTime(Math.floor(endTotalM / 60) % 24, endTotalM % 60)

                return (
                  <div key={iv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px',
                    background: '#fafafa',
                    borderRadius: 10,
                    border: `1px solid ${iv.status === 'in_progress' ? '#fed7aa' : '#f0f0f0'}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f6fa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
                  >
                    {/* Time */}
                    <div style={{ textAlign: 'center', width: 42, flexShrink: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{timeStr}</div>
                      <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{endStr}</div>
                    </div>

                    {/* Color bar */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, background: iv.typeColor, flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                        {iv.client}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: iv.typeColor, background: iv.typeBg,
                          padding: '1px 7px', borderRadius: 8
                        }}>{iv.type}</span>
                        <span style={{ fontSize: 11.5, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <MapPin size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                          {iv.address}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <StatusIcon size={14} color={sc.color} />
                      <span style={{ fontSize: 11.5, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                    </div>
                  </div>
                )
              })}

              {interventions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 14 }}>
                  Aucune intervention planifiée aujourd'hui
                </div>
              )}
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              onClick={() => navigate('/planning')}
            >
              <Plus size={14} /> Ajouter une intervention
            </button>
          </div>

          {/* IA insight strip */}
          <div style={{
            background: 'linear-gradient(135deg, #111827, #1e293b)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <Bot size={20} color="#fb923c" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'white', marginBottom: 3 }}>
                Résumé IA · Cette semaine
              </div>
              <div style={{ fontSize: 12.5, color: '#9ca3af', lineHeight: 1.5 }}>
                L'IA a répondu à <span style={{ color: '#fb923c', fontWeight: 600 }}>8 appels</span> ·
                3 devis générés · Délai moyen envoi devis : <span style={{ color: '#34d399', fontWeight: 600 }}>4h</span> (vs 48h avant)
              </div>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Derniers appels IA */}
          <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Derniers appels IA</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>RDV pris automatiquement</div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => navigate('/assistant-ia')} style={{ fontSize: 12 }}>
                Voir tout <ChevronRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentIACalls.map(c => {
                const urgColors: Record<string, { color: string; bg: string }> = {
                  'urgent':      { color: '#dc2626', bg: '#fef2f2' },
                  'semi-urgent': { color: '#d97706', bg: '#fffbeb' },
                  'planifiable': { color: '#16a34a', bg: '#f0fdf4' },
                }
                const uc = urgColors[c.urgency]
                return (
                  <div key={c.id} style={{
                    padding: '11px 13px', borderRadius: 10,
                    border: '1px solid #f0f0f0', background: '#fafafa',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{c.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: uc.color, background: uc.bg, padding: '2px 7px', borderRadius: 8 }}>{c.urgency}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{c.type} · {c.phone}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>📅 {c.rdv}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{c.timeAgo}</div>
                  </div>
                )
              })}
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 14, fontSize: 13 }}
              onClick={() => navigate('/assistant-ia')}
            >
              <Phone size={13} /> Journal des appels IA
            </button>
          </div>

          {/* Devis à relancer */}
          <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: '#fff7ed', border: '1px solid #fed7aa',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <RotateCcw size={14} color="#f97316" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Devis à relancer</div>
            </div>
            {relancesDevis.map(d => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #f5f5f5'
              }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{d.client}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>Il y a {d.jours} jours</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{d.montant}</span>
                  <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/devis')}>
                    Relancer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Actions rapides</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Nouveau devis', icon: FileText, path: '/devis', color: '#f97316' },
                { label: 'Planifier', icon: Calendar, path: '/planning', color: '#3b82f6' },
                { label: 'Nouveau client', icon: Plus, path: '/clients', color: '#10b981' },
                { label: 'Voir factures', icon: TrendingUp, path: '/factures', color: '#7c3aed' },
              ].map(a => {
                const Ic = a.icon
                return (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.path)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 7, padding: '14px 8px',
                      background: '#fafafa', border: '1.5px solid #f0f0f0',
                      borderRadius: 10, cursor: 'pointer',
                      transition: 'all 0.15s', fontSize: 12, fontWeight: 600, color: '#374151'
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget.style.background = '#f5f6fa')
                      ;(e.currentTarget.style.borderColor = a.color)
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget.style.background = '#fafafa')
                      ;(e.currentTarget.style.borderColor = '#f0f0f0')
                    }}
                  >
                    <Ic size={18} color={a.color} />
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modal message ETA */}
      {msgModal && (
        <div className="modal-overlay" onClick={() => setMsgModal(null)}>
          <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MessageCircle size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Message au prochain client</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{msgModal.client} · {msgModal.phone}</div>
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setMsgModal(null)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Message preview */}
            <div style={{
              background: '#f5f6fa', borderRadius: 10, padding: '14px 16px',
              fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 18,
              whiteSpace: 'pre-wrap', border: '1px solid #e5e7eb'
            }}>
              {msgModal.message}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={whatsappUrl(msgModal.phone, msgModal.message)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: '#25d366', color: 'white', borderRadius: 10,
                  padding: '12px 20px', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(37,211,102,0.3)'
                }}
              >
                <MessageCircle size={17} />
                Envoyer via WhatsApp
              </a>

              <a
                href={smsUrl(msgModal.phone, msgModal.message)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: '#3b82f6', color: 'white', borderRadius: 10,
                  padding: '12px 20px', textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                }}
              >
                <Phone size={17} />
                Envoyer par SMS
              </a>

              <button
                onClick={() => handleCopy(msgModal.message)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  background: copied ? '#f0fdf4' : '#f5f6fa',
                  color: copied ? '#16a34a' : '#374151',
                  border: `1.5px solid ${copied ? '#a7f3d0' : '#e5e7eb'}`,
                  borderRadius: 10, padding: '12px 20px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Copy size={16} />
                {copied ? 'Copié !' : 'Copier le message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
