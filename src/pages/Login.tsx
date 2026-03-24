import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login({ onLogin }: { onLogin?: () => void }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [forgotSent, setForgotSent] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (onLogin) onLogin()
      navigate('/')
    }, 1200)
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setForgotSent(true)
    }, 1000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2433 0%, #2d3a54 50%, #1a2744 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(59,130,246,0.08)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(6,182,212,0.06)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>

        {/* Logo & Brand — TODO: personnaliser */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.35)'
          }}>
            <Droplets size={32} color="white" />
          </div>
          <h1 style={{
            color: 'white', fontSize: 26, fontWeight: 800,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            marginBottom: 6
          }}>PlomboAssist</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Votre assistant intelligent de plomberie
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 20,
          padding: '32px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)'
        }}>

          {mode === 'login' && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e2433', marginBottom: 4, fontFamily: 'Plus Jakarta Sans' }}>
                Connexion
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                Accédez à votre espace
              </p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Adresse e-mail
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="contact@monprojet.fr"
                      style={{
                        width: '100%', padding: '10px 12px 10px 38px',
                        border: `1px solid ${error && !email ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: 10, fontSize: 14, outline: 'none',
                        transition: 'border-color 0.2s', boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '10px 40px 10px 38px',
                        border: `1px solid ${error && !password ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: 10, fontSize: 14, outline: 'none',
                        transition: 'border-color 0.2s', boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={16} color="#9ca3af" /> : <Eye size={16} color="#9ca3af" />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 16
                  }}>
                    <AlertCircle size={15} color="#ef4444" />
                    <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px',
                    background: loading ? '#fdba74' : 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s', letterSpacing: 0.3
                  }}
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
              </form>

              <div style={{
                marginTop: 20, padding: '10px 14px',
                background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa'
              }}>
                <p style={{ fontSize: 12, color: '#c2410c', margin: 0 }}>
                  <strong>Démo :</strong> entrez n'importe quel e-mail et mot de passe pour accéder à l'application.
                </p>
              </div>
            </>
          )}

          {mode === 'forgot' && !forgotSent && (
            <>
              <button
                onClick={() => { setMode('login'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
              >
                ← Retour
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e2433', marginBottom: 4, fontFamily: 'Plus Jakarta Sans' }}>
                Mot de passe oublié
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                Entrez votre e-mail pour recevoir un lien de réinitialisation.
              </p>
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Adresse e-mail
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="contact@monprojet.fr"
                      style={{
                        width: '100%', padding: '10px 12px 10px 38px',
                        border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box'
                      }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
                    <AlertCircle size={15} color="#ef4444" />
                    <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px',
                    background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}

          {mode === 'forgot' && forgotSent && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span style={{ fontSize: 28 }}>✉️</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e2433', marginBottom: 8, fontFamily: 'Plus Jakarta Sans' }}>
                E-mail envoyé !
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
              </p>
              <button
                onClick={() => { setMode('login'); setForgotSent(false); setError('') }}
                style={{
                  padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 20 }}>
          Conforme RGPD · Données hébergées en France · v1.0.0
        </p>
      </div>
    </div>
  )
}
