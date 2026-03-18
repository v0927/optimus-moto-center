import { useState } from 'react';
import { supabase } from '../supabase';
import logo from '../assets/logo.jpeg';

export default function Login() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showPass,   setShowPass]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError('Correo o contraseña incorrectos');
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '0.5px solid #E2E8F0', borderRadius: '8px',
    background: 'white', color: '#1E293B', outline: 'none',
    transition: 'border-color .15s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>

      {/* Fondo decorativo */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at top, #3A0000 0%, #0A0A0A 60%)',
        zIndex: 0,
      }} />

      {/* Card de login */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>

        {/* Logo y nombre */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logo} alt="Optimus Moto Center"
            style={{ width: '80px', height: '80px', objectFit: 'contain',
              borderRadius: '50%', marginBottom: '12px',
              border: '3px solid #CC0000' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
            Optimus <span style={{ color: '#CC0000' }}>Moto Center</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Sistema de Inventario
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
              color: '#64748B', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              style={inputStyle}
              placeholder="admin@optimus.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500,
              color: '#64748B', marginBottom: '6px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '16px',
                  color: '#64748B', padding: 0,
                }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '0.5px solid #FECACA',
              borderRadius: '8px', padding: '10px 12px', marginBottom: '16px',
              fontSize: '13px', color: '#B91C1C', display: 'flex', gap: '8px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600,
              borderRadius: '8px', border: 'none',
              background: loading ? '#CBD5E0' : '#CC0000',
              color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
            }}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px',
          color: '#94A3B8', marginTop: '24px' }}>
          Honduras · Sistema de Inventario v1.0
        </p>
      </div>
    </div>
  );
}