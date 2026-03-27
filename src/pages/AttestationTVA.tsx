import { useState, useRef } from 'react'
import { FileText, Printer, CheckCircle, ChevronDown, Info, Building } from 'lucide-react'

interface AttestationData {
  // Client
  clientCivilite: string
  clientNom: string
  clientPrenom: string
  clientAdresseRue: string
  clientCP: string
  clientVille: string

  // Logement
  logementAdresseRue: string
  logementCP: string
  logementVille: string
  logementType: 'maison' | 'appartement'
  dateAchevement: string
  usagePrincipal: boolean
  dateEmmenagement: string

  // Prestataire
  prestataireNom: string
  prestataireRue: string
  prestataireCP: string
  prestataireVille: string
  prestataireRCS: string

  // Travaux
  descriptionTravaux: string
  montantHT: string
  tauxTVA: '5.5' | '10'
  montantTVA: string
  montantTTC: string

  // Signature
  lieu: string
  dateSignature: string
  certifie: boolean
}

const TAUX_OPTIONS = [
  { value: '10', label: '10% — Travaux de rénovation (local résidentiel > 2 ans)' },
  { value: '5.5', label: "5,5% — Travaux d'amélioration énergétique" },
]

export default function AttestationTVA() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [data, setData] = useState<AttestationData>({
    clientCivilite: 'M.',
    clientNom: '',
    clientPrenom: '',
    clientAdresseRue: '',
    clientCP: '',
    clientVille: '',
    logementAdresseRue: '',
    logementCP: '',
    logementVille: '',
    logementType: 'appartement',
    dateAchevement: '',
    usagePrincipal: true,
    dateEmmenagement: '',
    prestataireNom: 'PlomboAssist SARL',
    prestataireRue: '',
    prestataireCP: '',
    prestataireVille: '',
    prestataireRCS: '',
    descriptionTravaux: '',
    montantHT: '',
    tauxTVA: '10',
    montantTVA: '',
    montantTTC: '',
    lieu: '',
    dateSignature: todayStr,
    certifie: false,
  })

  const set = (k: keyof AttestationData, v: any) => setData(prev => ({ ...prev, [k]: v }))

  const calcTVA = (ht: string, taux: string) => {
    const htN = parseFloat(ht.replace(',', '.'))
    if (isNaN(htN)) return
    const tvaRate = parseFloat(taux) / 100
    const tva = htN * tvaRate
    const ttc = htN + tva
    set('montantTVA', tva.toFixed(2))
    set('montantTTC', ttc.toFixed(2))
  }

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = () => window.print()

  const formatDate = (d: string) => {
    if (!d) return '___/___/______'
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const isComplete = data.clientNom && data.clientPrenom && data.logementAdresseRue &&
    data.dateAchevement && data.descriptionTravaux && data.montantTTC && data.certifie

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Attestation TVA réduite</h1>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Formulaire simplifié — Article 279-0 bis et 278-0 bis A du CGI</p>
          </div>
        </div>
        <button onClick={handlePrint} disabled={!isComplete} style={{
          padding: '9px 18px', borderRadius: 8, border: 'none',
          background: isComplete ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : '#e5e7eb',
          color: isComplete ? 'white' : '#9ca3af',
          fontWeight: 700, fontSize: 13, cursor: isComplete ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: isComplete ? '0 2px 8px rgba(59,130,246,0.3)' : 'none'
        }}>
          <Printer size={14} /> Imprimer / PDF
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
        padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start'
      }}>
        <Info size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
          <strong>Obligatoire</strong> pour appliquer la TVA à 10% sur les travaux de rénovation de locaux à usage d'habitation achevés depuis plus de 2 ans.
          Ce document doit être conservé <strong>10 ans</strong> et présenté en cas de contrôle fiscal.
          En cas de fausse déclaration, le client est solidairement responsable du rappel de TVA.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Section client */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>1. Identité du client (donneur d'ordre)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Civilité</label>
                <select value={data.clientCivilite} onChange={e => set('clientCivilite', e.target.value)} style={selectStyle}>
                  {['M.', 'Mme', 'M. et Mme', 'SCI', 'SAS', 'SARL'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nom *</label>
                <input value={data.clientNom} onChange={e => set('clientNom', e.target.value)}
                  placeholder="DUPONT" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Prénom *</label>
                <input value={data.clientPrenom} onChange={e => set('clientPrenom', e.target.value)}
                  placeholder="Jean" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={labelStyle}>Adresse du client (si différente du logement)</label>
              <input value={data.clientAdresseRue} onChange={e => set('clientAdresseRue', e.target.value)}
                placeholder="N° et libellé de la voie" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, marginTop: 8 }}>
              <div>
                <label style={labelStyle}>Code postal</label>
                <input value={data.clientCP} onChange={e => set('clientCP', e.target.value)} placeholder="75001" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Commune</label>
                <input value={data.clientVille} onChange={e => set('clientVille', e.target.value)} placeholder="Paris" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Section logement */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>2. Adresse du logement concerné par les travaux</h3>
            <div>
              <label style={labelStyle}>Adresse *</label>
              <input value={data.logementAdresseRue} onChange={e => set('logementAdresseRue', e.target.value)}
                placeholder="N° et libellé de la voie" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, marginTop: 10 }}>
              <div>
                <label style={labelStyle}>Code postal</label>
                <input value={data.logementCP} onChange={e => set('logementCP', e.target.value)} placeholder="75001" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Commune</label>
                <input value={data.logementVille} onChange={e => set('logementVille', e.target.value)} placeholder="Paris" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={data.logementType} onChange={e => set('logementType', e.target.value)} style={selectStyle}>
                  <option value="maison">Maison individuelle</option>
                  <option value="appartement">Appartement</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div>
                <label style={labelStyle}>Date d'achèvement de construction *</label>
                <input type="date" value={data.dateAchevement} onChange={e => set('dateAchevement', e.target.value)} style={inputStyle} />
                {data.dateAchevement && (() => {
                  const years = new Date().getFullYear() - new Date(data.dateAchevement).getFullYear()
                  return (
                    <div style={{ marginTop: 4, fontSize: 10, color: years >= 2 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                      {years >= 2 ? `✓ ${years} ans — éligible TVA réduite` : `⚠️ ${years} an(s) — non éligible (< 2 ans)`}
                    </div>
                  )
                })()}
              </div>
              <div>
                <label style={labelStyle}>Date d'emménagement du client</label>
                <input type="date" value={data.dateEmmenagement} onChange={e => set('dateEmmenagement', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={data.usagePrincipal} onChange={e => set('usagePrincipal', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#3b82f6' }} />
                <span style={{ fontSize: 12, color: '#374151' }}>
                  Ce logement est ma <strong>résidence principale</strong> ou secondaire (usage exclusivement privé)
                </span>
              </label>
            </div>
          </div>

          {/* Section travaux */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>3. Nature des travaux</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Taux de TVA applicable *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                {TAUX_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                    <input type="radio" value={opt.value} checked={data.tauxTVA === opt.value}
                      onChange={e => { set('tauxTVA', e.target.value); calcTVA(data.montantHT, e.target.value) }}
                      style={{ marginTop: 2, accentColor: '#3b82f6' }} />
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description des travaux *</label>
              <textarea value={data.descriptionTravaux} onChange={e => set('descriptionTravaux', e.target.value)}
                rows={3} placeholder="Ex : Remplacement de la chaudière, installation chauffe-eau thermodynamique, réfection de tuyauterie…"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
              <div>
                <label style={labelStyle}>Montant HT (€) *</label>
                <input value={data.montantHT}
                  onChange={e => { set('montantHT', e.target.value); calcTVA(e.target.value, data.tauxTVA) }}
                  placeholder="1 200,00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TVA {data.tauxTVA}% (€)</label>
                <input value={data.montantTVA} readOnly style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }} placeholder="Auto" />
              </div>
              <div>
                <label style={labelStyle}>Montant TTC (€) *</label>
                <input value={data.montantTTC} readOnly style={{ ...inputStyle, background: '#f9fafb', color: '#111827', fontWeight: 700 }} placeholder="Auto" />
              </div>
            </div>
          </div>

          {/* Certification */}
          <div style={{ background: 'white', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>4. Certification du client</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Fait à *</label>
                <input value={data.lieu} onChange={e => set('lieu', e.target.value)} placeholder="Paris" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Le *</label>
                <input type="date" value={data.dateSignature} onChange={e => set('dateSignature', e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{
              background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', marginBottom: 12,
              fontSize: 11, color: '#92400e', lineHeight: 1.6
            }}>
              Je soussigné(e), certifie que les informations ci-dessus sont exactes. Je suis informé(e) qu'en cas de fausse
              déclaration, je serai tenu solidairement responsable des rappels de TVA que le prestataire pourrait être amené à acquitter.
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={data.certifie} onChange={e => set('certifie', e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#3b82f6', marginTop: 2 }} />
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                J'ai lu et j'accepte les conditions ci-dessus. Je certifie l'exactitude des informations fournies. *
              </span>
            </label>
          </div>
        </div>

        {/* Aperçu du document */}
        <div>
          <div style={{
            background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb',
            position: 'sticky', top: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <FileText size={14} color="#6b7280" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Aperçu du document
              </span>
            </div>
            {/* Document preview */}
            <div ref={printRef} id="attestation-print" style={{
              fontFamily: 'serif', fontSize: 10, lineHeight: 1.7, color: '#111',
              border: '1px solid #d1d5db', padding: '16px', borderRadius: 6, background: '#fafafa'
            }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                  Attestation simplifiée pour les travaux
                </div>
                <div style={{ fontSize: 11, fontWeight: 'bold' }}>
                  portant sur des logements à usage d'habitation achevés depuis plus de 2 ans
                </div>
                <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                  CGI — art. 279-0 bis et 278-0 bis A — TVA à taux réduit {data.tauxTVA}%
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Donneur d'ordre :</strong><br />
                {data.clientCivilite} {data.clientNom || '________________'} {data.clientPrenom || '________________'}<br />
                {data.logementAdresseRue || '________________________________'}<br />
                {data.logementCP || '_____'} {data.logementVille || '________________'}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Adresse du logement :</strong><br />
                {data.logementAdresseRue || '________________________________'}<br />
                {data.logementCP || '_____'} {data.logementVille || '________________'}<br />
                <em>Type : {data.logementType === 'maison' ? 'Maison individuelle' : 'Appartement'}</em><br />
                <em>Achevé le : {formatDate(data.dateAchevement)} — Usage : {data.usagePrincipal ? 'résidence principale/secondaire' : 'autre'}</em>
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Prestataire :</strong><br />
                {data.prestataireNom || '________________________________'}<br />
                {data.prestataireRue || '________________________________'}<br />
                {data.prestataireCP || '_____'} {data.prestataireVille || '________________'}
                {data.prestataireRCS && <><br />RCS : {data.prestataireRCS}</>}
              </div>

              <div style={{ marginBottom: 8 }}>
                <strong>Nature et description des travaux :</strong><br />
                {data.descriptionTravaux || '______________________________________\n______________________________________'}
              </div>

              <div style={{ marginBottom: 12, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Montant HT :</span>
                  <strong>{data.montantHT ? data.montantHT + ' €' : '_________'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TVA {data.tauxTVA}% :</span>
                  <strong>{data.montantTVA ? data.montantTVA + ' €' : '_________'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #ccc', marginTop: 4, paddingTop: 4 }}>
                  <span>Montant TTC :</span>
                  <span>{data.montantTTC ? data.montantTTC + ' €' : '_________'}</span>
                </div>
              </div>

              <div style={{ fontSize: 9, marginBottom: 10, fontStyle: 'italic', color: '#555' }}>
                Je soussigné(e), certifie que les renseignements figurant dans la présente attestation sont exacts et engage
                ma responsabilité en cas de fausse déclaration (rappel de TVA + intérêts).
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <div>
                  Fait à : {data.lieu || '___________'}<br />
                  Le : {formatDate(data.dateSignature)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  Signature du client<br />
                  <div style={{ marginTop: 4, width: 80, height: 28, borderBottom: '1px solid #999' }} />
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Identité client', ok: !!(data.clientNom && data.clientPrenom) },
                { label: 'Adresse logement', ok: !!data.logementAdresseRue },
                { label: "Date d'achèvement", ok: !!data.dateAchevement },
                { label: 'Description travaux', ok: !!data.descriptionTravaux },
                { label: 'Montant TTC', ok: !!data.montantTTC },
                { label: 'Certification client', ok: data.certifie },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: item.ok ? '#dcfce7' : '#f3f4f6',
                    border: `1.5px solid ${item.ok ? '#22c55e' : '#e5e7eb'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {item.ok && <CheckCircle size={9} color="#16a34a" strokeWidth={3} />}
                  </div>
                  <span style={{ color: item.ok ? '#374151' : '#9ca3af' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {isComplete && (
              <div style={{
                marginTop: 14, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8,
                border: '1px solid #bbf7d0', fontSize: 11, color: '#16a34a', fontWeight: 600,
                textAlign: 'center'
              }}>
                ✓ Document complet — prêt à imprimer
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #attestation-print, #attestation-print * { visibility: visible !important; }
          #attestation-print {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important;
            padding: 40px !important;
            font-size: 12pt !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4
}
const inputStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12,
  width: '100%', boxSizing: 'border-box'
}
const selectStyle: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 7, border: '1.5px solid #e5e7eb', fontSize: 12,
  width: '100%', boxSizing: 'border-box', background: 'white'
}
