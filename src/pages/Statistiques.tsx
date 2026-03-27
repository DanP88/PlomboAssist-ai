import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import {
  TrendingUp, Euro, Wrench, Users, Clock, FileCheck,
  ArrowUpRight, ArrowDownRight, Target, Star
} from 'lucide-react'
import { getInterventions } from '../lib/agenda'

const caParMois = [
  { mois: 'Avr', ca: 6200, objectif: 7000 },
  { mois: 'Mai', ca: 7800, objectif: 7000 },
  { mois: 'Jun', ca: 9200, objectif: 7500 },
  { mois: 'Jul', ca: 8100, objectif: 7500 },
  { mois: 'Aoû', ca: 6900, objectif: 7500 },
  { mois: 'Sep', ca: 10200, objectif: 8000 },
  { mois: 'Oct', ca: 11500, objectif: 8000 },
  { mois: 'Nov', ca: 9800, objectif: 8000 },
  { mois: 'Déc', ca: 8400, objectif: 8000 },
  { mois: 'Jan', ca: 7200, objectif: 8000 },
  { mois: 'Fév', ca: 9100, objectif: 8500 },
  { mois: 'Mar', ca: 8420, objectif: 8500 },
]

const parType = [
  { type: "Fuite d'eau", count: 28, ca: 2940, marge: 62, color: '#ef4444' },
  { type: 'Débouchage', count: 22, ca: 2420, marge: 71, color: '#f97316' },
  { type: 'Chauffe-eau', count: 14, ca: 4200, marge: 48, color: '#3b82f6' },
  { type: 'Entretien', count: 18, ca: 2160, marge: 68, color: '#22c55e' },
  { type: 'Robinetterie', count: 16, ca: 1920, marge: 74, color: '#06b6d4' },
  { type: 'Rénovation', count: 8, ca: 3200, marge: 42, color: '#8b5cf6' },
]

const topClients = [
  { nom: 'Syndic Résidence Les Pins', ca: 4800, interventions: 9, badge: 'Syndic' },
  { nom: 'M. Bernard Paul', ca: 1850, interventions: 4, badge: 'Particulier' },
  { nom: 'Agence Immo Dubois', ca: 1640, interventions: 6, badge: 'Agence' },
  { nom: 'Mme Garcia Rosa', ca: 1200, interventions: 3, badge: 'Particulier' },
  { nom: 'SCI du Château', ca: 980, interventions: 2, badge: 'Entreprise' },
]

const devisStats = [
  { mois: 'Oct', envoyes: 12, acceptes: 9 },
  { mois: 'Nov', envoyes: 14, acceptes: 10 },
  { mois: 'Déc', envoyes: 10, acceptes: 7 },
  { mois: 'Jan', envoyes: 11, acceptes: 8 },
  { mois: 'Fév', envoyes: 15, acceptes: 11 },
  { mois: 'Mar', envoyes: 13, acceptes: 9 },
]

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  Syndic:       { bg: '#eff6ff', color: '#2563eb' },
  Particulier:  { bg: '#f0fdf4', color: '#16a34a' },
  Agence:       { bg: '#faf5ff', color: '#7c3aed' },
  Entreprise:   { bg: '#fff7ed', color: '#ea580c' },
}

const PERIOD_OPTIONS = ['3 derniers mois', '6 derniers mois', '12 derniers mois']

export default function Statistiques() {
  const [period, setPeriod] = useState('12 derniers mois')
  const interventions = getInterventions()
  const done = interventions.filter(i => i.status === 'done').length
  const total = interventions.length

  const totalCA = caParMois.reduce((s, m) => s + m.ca, 0)
  const totalInterv = parType.reduce((s, t) => s + t.count, 0)
  const tauxConv = Math.round(devisStats.reduce((s, m) => s + m.acceptes, 0) / devisStats.reduce((s, m) => s + m.envoyes, 0) * 100)
  const margeMoy = Math.round(parType.reduce((s, t) => s + t.marge * t.count, 0) / parType.reduce((s, t) => s + t.count, 0))

  const displayedMonths = period === '3 derniers mois' ? caParMois.slice(-3)
    : period === '6 derniers mois' ? caParMois.slice(-6)
    : caParMois

  const kpis = [
    {
      label: 'CA annuel total',
      value: totalCA.toLocaleString('fr-FR') + ' €',
      trend: '+18%',
      up: true,
      sub: 'vs année précédente',
      icon: Euro,
      color: '#f97316',
      bg: 'linear-gradient(135deg,#fff7ed,#ffedd5)',
      border: '#fed7aa',
    },
    {
      label: 'Interventions réalisées',
      value: String(totalInterv),
      trend: '+9%',
      up: true,
      sub: 'sur 12 mois',
      icon: Wrench,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
      border: '#bfdbfe',
    },
    {
      label: 'Taux de conversion devis',
      value: tauxConv + ' %',
      trend: '+4 pts',
      up: true,
      sub: 'devis acceptés / envoyés',
      icon: Target,
      color: '#10b981',
      bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
      border: '#a7f3d0',
    },
    {
      label: 'Marge moyenne',
      value: margeMoy + ' %',
      trend: '-2 pts',
      up: false,
      sub: 'matériaux déduits',
      icon: TrendingUp,
      color: '#8b5cf6',
      bg: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
      border: '#ddd6fe',
    },
  ]

  return (
    <div style={{ padding: '28px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Statistiques & Rentabilité</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Vue financière de votre activité</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_OPTIONS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: period === p ? '1.5px solid #f97316' : '1.5px solid #e5e7eb',
              background: period === p ? '#fff7ed' : 'white',
              color: period === p ? '#f97316' : '#6b7280',
              cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 14,
            padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: k.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <k.icon size={16} color="white" />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                background: k.up ? '#dcfce7' : '#fee2e2',
                color: k.up ? '#16a34a' : '#dc2626',
                display: 'flex', alignItems: 'center', gap: 3
              }}>
                {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {k.trend}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 8 }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{k.label}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: CA Chart + Type Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 16 }}>
        {/* CA Bar Chart */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px 20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Chiffre d'affaires mensuel</h3>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '3px 0 0' }}>CA réalisé vs objectif</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={displayedMonths} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${v/1000}k` : String(v)} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(val: number, name: string) => [
                  val.toLocaleString('fr-FR') + ' €',
                  name === 'ca' ? 'CA réalisé' : 'Objectif'
                ]}
              />
              <Bar dataKey="ca" fill="#f97316" radius={[4,4,0,0]} name="ca" />
              <Bar dataKey="objectif" fill="#fed7aa" radius={[4,4,0,0]} name="objectif" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie par type */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px 20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Répartition par type</h3>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '3px 0 0' }}>CA par catégorie d'intervention</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PieChart width={180} height={160}>
              <Pie data={parType} cx={85} cy={75} innerRadius={45} outerRadius={75}
                dataKey="ca" nameKey="type" paddingAngle={2}>
                {parType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(val: number) => [val.toLocaleString('fr-FR') + ' €', 'CA']} />
            </PieChart>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
              {parType.map(t => (
                <div key={t.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#374151' }}>{t.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{t.count} interv.</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111827', minWidth: 60, textAlign: 'right' }}>
                      {t.ca.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top clients + Marge + Devis conversion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top clients */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Star size={15} color="#f97316" fill="#f97316" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Top clients</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topClients.map((c, i) => (
              <div key={c.nom} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, background: i === 0 ? '#fef3c7' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: i === 0 ? '#d97706' : '#6b7280', flexShrink: 0
                }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nom}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 6,
                      background: BADGE_COLORS[c.badge]?.bg ?? '#f3f4f6',
                      color: BADGE_COLORS[c.badge]?.color ?? '#6b7280',
                      fontWeight: 600
                    }}>{c.badge}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{c.interventions} interv.</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', flexShrink: 0 }}>
                  {c.ca.toLocaleString('fr-FR')} €
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marge par type */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Rentabilité par type</h3>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: '2px 0 0' }}>Marge nette estimée (matériaux déduits)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {parType.sort((a,b) => b.marge - a.marge).map(t => (
              <div key={t.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{t.type}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.marge >= 60 ? '#16a34a' : t.marge >= 50 ? '#d97706' : '#dc2626' }}>
                    {t.marge} %
                  </span>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${t.marge}%`,
                    background: t.marge >= 60 ? '#22c55e' : t.marge >= 50 ? '#f97316' : '#ef4444'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Taux conversion devis */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Conversion devis</h3>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: '2px 0 0' }}>Devis envoyés vs acceptés</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={devisStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="envoyes" stroke="#bfdbfe" strokeWidth={2} dot={false} name="Envoyés" />
              <Line type="monotone" dataKey="acceptes" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Acceptés" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {[{ label: 'Envoyés', color: '#bfdbfe' }, { label: 'Acceptés', color: '#3b82f6' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 16, height: 3, background: l.color, borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: '#6b7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Delais de paiement + Activité hebdo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Délais de paiement */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Délais de paiement</h3>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: '2px 0 0' }}>Répartition par ancienneté des impayés</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Payées en < 15 jours', count: 18, pct: 58, color: '#22c55e' },
              { label: 'Payées en 15–30 jours', count: 8, pct: 26, color: '#f97316' },
              { label: 'Payées en 30–60 jours', count: 4, pct: 13, color: '#ef4444' },
              { label: '> 60 jours (relance)', count: 1, pct: 3, color: '#7c3aed' },
            ].map(d => (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#374151' }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.color }}>{d.count} factures ({d.pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité hebdo */}
        <div style={{ background: 'white', borderRadius: 14, padding: '20px', border: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Charge hebdomadaire</h3>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: '2px 0 0' }}>Interventions par jour de la semaine (moy. sur 3 mois)</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { jour: 'Lun', count: 3.2 },
              { jour: 'Mar', count: 4.1 },
              { jour: 'Mer', count: 3.8 },
              { jour: 'Jeu', count: 4.5 },
              { jour: 'Ven', count: 3.9 },
              { jour: 'Sam', count: 1.8 },
              { jour: 'Dim', count: 0.4 },
            ]} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v.toFixed(1) + ' interv.', 'Moy.']} />
              <Bar dataKey="count" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{
            marginTop: 10, padding: '8px 12px', background: '#fff7ed', borderRadius: 8,
            border: '1px solid #fed7aa', fontSize: 11, color: '#92400e'
          }}>
            💡 <strong>Jeudi</strong> est votre journée la plus chargée. Pensez à bloquer du temps pour la gestion commerciale.
          </div>
        </div>
      </div>
    </div>
  )
}
