import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, XCircle, TrendingUp, Plus, RefreshCw, ClipboardList, ShoppingCart, ExternalLink, X } from 'lucide-react'
import { getStock, getUtilisations, ajouterStock, getStatutStock, saveStock, type Materiau } from '../lib/stock'

const CATEGORIES = ['Toutes', 'Robinetterie', 'Joints', 'Étanchéité', 'Tuyauterie', 'Accessoires', 'Vannes', 'Évacuation']

const FOURNISSEURS = [
  { nom: 'Point P',       logo: '🏗️', couleur: '#e84c1c', url: (q: string) => `https://www.pointp.fr/recherche?q=${encodeURIComponent(q)}` },
  { nom: 'Cedeo',         logo: '💧', couleur: '#004a97', url: (q: string) => `https://www.cedeo.fr/search?q=${encodeURIComponent(q)}` },
  { nom: 'Leroy Merlin',  logo: '🟢', couleur: '#78be20', url: (q: string) => `https://www.leroymerlin.fr/recherche=${encodeURIComponent(q)}` },
  { nom: 'Rexel',         logo: '⚡', couleur: '#e2001a', url: (q: string) => `https://www.rexel.fr/fre/search?q=${encodeURIComponent(q)}` },
  { nom: 'Brico Dépôt',   logo: '🔧', couleur: '#f7a600', url: (q: string) => `https://www.bricodepot.fr/catalogsearch/result/?q=${encodeURIComponent(q)}` },
]

export default function Stock() {
  const navigate = useNavigate()
  const [stock, setStock] = useState<Materiau[]>([])
  const [utilisations, setUtilisations] = useState<ReturnType<typeof getUtilisations>>([])
  const [filtre, setFiltre] = useState<'tous' | 'alerte' | 'rupture'>('tous')
  const [categorie, setCategorie] = useState('Toutes')
  const [search, setSearch] = useState('')
  const [restock, setRestock] = useState<{ id: number; val: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMat, setNewMat] = useState({ nom: '', reference: '', categorie: 'Robinetterie', quantite: '', unite: 'pcs', seuilAlerte: '', prixUnitaire: '' })

  // Selection pour commande
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [showCommandeModal, setShowCommandeModal] = useState(false)

  function refresh() {
    setStock(getStock())
    setUtilisations(getUtilisations())
  }

  useEffect(() => { refresh() }, [])

  const filtered = stock.filter(m => {
    const s = getStatutStock(m)
    if (filtre === 'alerte' && s !== 'alerte') return false
    if (filtre === 'rupture' && s !== 'rupture') return false
    if (categorie !== 'Toutes' && m.categorie !== categorie) return false
    if (search && !m.nom.toLowerCase().includes(search.toLowerCase()) && !m.reference.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const nbAlerte  = stock.filter(m => getStatutStock(m) === 'alerte').length
  const nbRupture = stock.filter(m => getStatutStock(m) === 'rupture').length
  const valeurTotale = stock.reduce((acc, m) => acc + m.quantite * m.prixUnitaire, 0)

  const selectedMats = stock.filter(m => selection.has(m.id))
  const allFilteredSelected = filtered.length > 0 && filtered.every(m => selection.has(m.id))

  function toggleSelect(id: number) {
    setSelection(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelection(prev => {
        const next = new Set(prev)
        filtered.forEach(m => next.delete(m.id))
        return next
      })
    } else {
      setSelection(prev => {
        const next = new Set(prev)
        filtered.forEach(m => next.add(m.id))
        return next
      })
    }
  }

  function handleRestock(id: number) {
    const val = parseInt(restock?.val || '0')
    if (!val || val <= 0) return
    ajouterStock(id, val)
    setRestock(null)
    refresh()
  }

  function handleAddMat() {
    const s = getStock()
    const mat: Materiau = {
      id: Date.now(),
      nom: newMat.nom,
      reference: newMat.reference,
      categorie: newMat.categorie,
      quantite: parseInt(newMat.quantite) || 0,
      unite: newMat.unite,
      seuilAlerte: parseInt(newMat.seuilAlerte) || 2,
      prixUnitaire: parseFloat(newMat.prixUnitaire) || 0,
    }
    s.push(mat)
    saveStock(s)
    setShowAddModal(false)
    setNewMat({ nom: '', reference: '', categorie: 'Robinetterie', quantite: '', unite: 'pcs', seuilAlerte: '', prixUnitaire: '' })
    refresh()
  }

  const statutStyle = (s: 'ok' | 'alerte' | 'rupture') => ({
    ok:      { background: '#dcfce7', color: '#16a34a', label: 'En stock' },
    alerte:  { background: '#fef9c3', color: '#ca8a04', label: 'Stock faible' },
    rupture: { background: '#fee2e2', color: '#dc2626', label: 'Rupture' },
  }[s])

  return (
    <div style={{ paddingBottom: selection.size > 0 ? 90 : 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.25)' }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Stock matériaux</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{stock.length} références · mis à jour automatiquement après chaque intervention</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/saisie-materiaux')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: '#f97316', color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <ClipboardList size={15} /> Saisir une utilisation
          </button>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Plus size={15} /> Nouveau matériau
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { icon: Package,       label: 'Références',    value: stock.length,                   color: '#3b82f6', bg: '#eff6ff' },
          { icon: TrendingUp,    label: 'Valeur stock',  value: `${valeurTotale.toFixed(0)} €`,  color: '#16a34a', bg: '#f0fdf4' },
          { icon: AlertTriangle, label: 'Stock faible',  value: nbAlerte,                        color: '#ca8a04', bg: '#fefce8' },
          { icon: XCircle,       label: 'Ruptures',      value: nbRupture,                       color: '#dc2626', bg: '#fef2f2' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 4 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f5f5f5', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['tous', 'Tous'], ['alerte', `⚠️ Stock faible (${nbAlerte})`], ['rupture', `🔴 Rupture (${nbRupture})`]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFiltre(key)} style={{ padding: '6px 13px', borderRadius: 8, border: '1px solid', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', background: filtre === key ? '#f97316' : 'white', color: filtre === key ? 'white' : '#374151', borderColor: filtre === key ? '#f97316' : '#e5e7eb' }}>
                {label}
              </button>
            ))}
          </div>
          <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12.5, color: '#374151', background: 'white', cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un matériau..." style={{ flex: 1, minWidth: 160, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, color: '#374151', background: '#f9fafb', outline: 'none' }} />
          {selection.size > 0 && (
            <button onClick={() => setSelection(new Set())} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: 12.5, fontWeight: 500 }}>
              Tout décocher ({selection.size})
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {/* Checkbox tout sélectionner */}
                <th style={{ padding: '10px 14px', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f97316' }}
                  />
                </th>
                {['Matériau', 'Référence', 'Catégorie', 'Quantité', 'Seuil alerte', 'Prix unitaire', 'Statut', 'Réappro.', 'Commander'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(mat => {
                const statut = getStatutStock(mat)
                const st = statutStyle(statut)
                const isRestock = restock?.id === mat.id
                const isSelected = selection.has(mat.id)
                return (
                  <tr key={mat.id}
                    style={{ borderTop: '1px solid #f5f5f5', background: isSelected ? '#fff7ed' : 'white', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa' }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? '#fff7ed' : 'white' }}>

                    {/* Checkbox */}
                    <td style={{ padding: '11px 14px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(mat.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#f97316' }}
                      />
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{mat.nom}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#6b7280', fontFamily: 'monospace' }}>{mat.reference}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, background: '#f3f4f6', color: '#374151', padding: '3px 9px', borderRadius: 6, fontWeight: 500 }}>{mat.categorie}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: statut === 'rupture' ? '#dc2626' : statut === 'alerte' ? '#ca8a04' : '#111827' }}>
                        {mat.quantite}
                      </span>
                      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{mat.unite}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#6b7280' }}>{mat.seuilAlerte} {mat.unite}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151' }}>{mat.prixUnitaire.toFixed(2)} €</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.background, color: st.color }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {isRestock ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="number" min="1"
                            value={restock.val}
                            onChange={e => setRestock({ id: mat.id, val: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && handleRestock(mat.id)}
                            placeholder="Qté"
                            style={{ width: 60, padding: '4px 8px', borderRadius: 7, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                            autoFocus
                          />
                          <button onClick={() => handleRestock(mat.id)} style={{ padding: '4px 10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>OK</button>
                          <button onClick={() => setRestock(null)} style={{ padding: '4px 8px', background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setRestock({ id: mat.id, val: '' })} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          <RefreshCw size={12} /> Réappro.
                        </button>
                      )}
                    </td>
                    {/* Bouton commander rapide sur la ligne */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        onClick={() => { setSelection(new Set([mat.id])); setShowCommandeModal(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <ShoppingCart size={12} /> Commander
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Aucun matériau trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique récent */}
      {utilisations.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', marginTop: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>Historique des utilisations récentes</h3>
          </div>
          {utilisations.slice(0, 5).map(u => (
            <div key={u.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={16} color="#f97316" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{u.intervention || 'Intervention sans référence'}</span>
                  {u.client && <span style={{ fontSize: 12, color: '#6b7280' }}>— {u.client}</span>}
                  <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{new Date(u.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {u.lignes.map((l, i) => (
                    <span key={i} style={{ fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontWeight: 500 }}>
                      {l.quantite} × {l.nomMateriau}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Barre flottante sélection ── */}
      {selection.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 220, right: 0,
          background: '#111827', padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 300, boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 14 }}>
              {selection.size}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>
                {selection.size} matériau{selection.size > 1 ? 'x' : ''} sélectionné{selection.size > 1 ? 's' : ''}
              </div>
              <div style={{ color: '#9ca3af', fontSize: 12 }}>
                {selectedMats.map(m => m.nom).join(' · ')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSelection(new Set())} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Annuler
            </button>
            <button onClick={() => setShowCommandeModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#f97316', color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13.5 }}>
              <ShoppingCart size={16} /> Commander sur les fournisseurs
            </button>
          </div>
        </div>
      )}

      {/* ── Modal commande fournisseurs ── */}
      {showCommandeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Commander les matériaux</div>
                <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>{selectedMats.length} matériau{selectedMats.length > 1 ? 'x' : ''} · cliquez sur un fournisseur pour ouvrir la recherche</div>
              </div>
              <button onClick={() => setShowCommandeModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', display: 'flex' }}>
                <X size={16} color="#6b7280" />
              </button>
            </div>

            {/* Fournisseurs buttons */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Ouvrir la recherche sur…</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FOURNISSEURS.map(f => (
                  <button
                    key={f.nom}
                    onClick={() => {
                      selectedMats.forEach(mat => window.open(f.url(mat.nom), '_blank'))
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 16px', borderRadius: 10,
                      background: 'white', border: `2px solid ${f.couleur}20`,
                      cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      color: f.couleur, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${f.couleur}12`; e.currentTarget.style.borderColor = f.couleur }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = `${f.couleur}20` }}
                  >
                    <span style={{ fontSize: 16 }}>{f.logo}</span>
                    {f.nom}
                    <ExternalLink size={12} />
                  </button>
                ))}
              </div>
              <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#9ca3af' }}>
                Chaque clic ouvre un onglet de recherche par matériau sur le site du fournisseur.
              </p>
            </div>

            {/* Liste des matériaux sélectionnés */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {selectedMats.map(mat => {
                const st = getStatutStock(mat)
                return (
                  <div key={mat.id} style={{ padding: '12px 24px', borderBottom: '1px solid #f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{mat.nom}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{mat.reference} · {mat.categorie}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: st === 'rupture' ? '#dc2626' : st === 'alerte' ? '#ca8a04' : '#374151' }}>
                        {mat.quantite} {mat.unite} en stock
                      </div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>seuil : {mat.seuilAlerte} {mat.unite}</div>
                    </div>
                    {/* Liens par matériau */}
                    <div style={{ display: 'flex', gap: 5 }}>
                      {FOURNISSEURS.map(f => (
                        <a
                          key={f.nom}
                          href={f.url(mat.nom)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Chercher sur ${f.nom}`}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${f.couleur}12`, border: `1px solid ${f.couleur}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, textDecoration: 'none',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${f.couleur}25` }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${f.couleur}12` }}
                        >
                          {f.logo}
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowCommandeModal(false)} style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout matériau */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#111827' }}>Nouveau matériau</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Nom', key: 'nom', col: '1/-1' },
                { label: 'Référence', key: 'reference' },
                { label: 'Prix unitaire (€)', key: 'prixUnitaire', type: 'number' },
                { label: 'Quantité initiale', key: 'quantite', type: 'number' },
                { label: 'Seuil alerte', key: 'seuilAlerte', type: 'number' },
                { label: 'Unité', key: 'unite' },
              ].map(({ label, key, type, col }) => (
                <div key={key} style={{ gridColumn: col }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type || 'text'}
                    value={(newMat as any)[key]}
                    onChange={e => setNewMat(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid #d1d5db', fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Catégorie</label>
                <select value={newMat.categorie} onChange={e => setNewMat(p => ({ ...p, categorie: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid #d1d5db', fontSize: 13.5, background: 'white' }}>
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '9px 18px', border: '1px solid #e5e7eb', borderRadius: 9, background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>Annuler</button>
              <button onClick={handleAddMat} disabled={!newMat.nom} style={{ padding: '9px 18px', background: '#f97316', color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13.5, opacity: !newMat.nom ? 0.5 : 1 }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
