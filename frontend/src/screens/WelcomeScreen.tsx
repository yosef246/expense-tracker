import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [name, setName]       = useState('');
  const [touched, setTouched] = useState(false);

  const handleStart = () => {
    setTouched(true);
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('userName', trimmed);
    navigate('/');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div style={s.page}>
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      <div style={s.card}>
        <div style={s.logoWrap}>
          <img src="/logo.svg" alt="לוגו" style={s.logo} />
          <div style={s.logoGlow} />
        </div>

        <h1 style={s.title}>מעקב הוצאות</h1>
        <p style={s.tagline}>שלוט/י בכסף שלך — לפני שהוא שולט בך 💸</p>

        <div style={s.features}>
          {[
            { icon: '📊', text: 'מעקב תקציב חודשי' },
            { icon: '💾', text: 'נשמר מקומית על המכשיר שלך' },
            { icon: '📅', text: 'היסטוריה וניתוח חודשי' },
          ].map(f => (
            <div key={f.text} style={s.feat}>
              <span style={s.featIcon}>{f.icon}</span>
              <span style={s.featText}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={s.divider} />

        <p style={s.inputLabel}>מה שמך? 👋</p>
        <input
          style={{ ...s.input, borderColor: touched && !name.trim() ? '#ef4444' : '#e2e8f0' }}
          type="text"
          placeholder="הכנס/י את שמך..."
          value={name}
          onChange={e => { setName(e.target.value); setTouched(false); }}
          onKeyDown={handleKey}
          autoFocus
          maxLength={30}
        />
        {touched && !name.trim() && (
          <p style={s.err}>יש להזין שם כדי להמשיך</p>
        )}

        <button style={s.btn} onClick={handleStart}>
          בואו נתחיל! 🚀
        </button>

        <p style={s.privacy}>הנתונים נשמרים רק במכשיר שלך — ללא שרת, ללא ענן</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480, margin: '0 auto', minHeight: '100vh',
    background: '#f0f2ff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '20px 16px', position: 'relative', overflow: 'hidden',
  },
  blob1: { position: 'fixed', top: -120, right: -120, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.18),transparent 70%)', pointerEvents: 'none' },
  blob2: { position: 'fixed', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)', pointerEvents: 'none' },
  blob3: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.05),transparent 70%)', pointerEvents: 'none' },

  card: {
    background: 'white', borderRadius: 28, padding: '36px 28px 28px',
    boxShadow: '0 8px 48px rgba(99,102,241,0.14)', border: '1.5px solid rgba(99,102,241,0.1)',
    width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, textAlign: 'center',
  },

  logoWrap: { position: 'relative', display: 'inline-block', marginBottom: 20 },
  logo:     { width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', position: 'relative', zIndex: 1 },
  logoGlow: { position: 'absolute', inset: -8, borderRadius: 28, background: 'radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)', pointerEvents: 'none' },

  title:   { fontSize: 30, fontWeight: '800', color: '#1e293b', margin: '0 0 8px', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 },

  features: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, textAlign: 'right' },
  feat:     { display: 'flex', alignItems: 'center', gap: 12, background: '#f8f9ff', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(99,102,241,0.08)' },
  featIcon: { fontSize: 20, flexShrink: 0 },
  featText: { fontSize: 14, color: '#475569', fontWeight: '500' },

  divider: { height: 1, background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)', margin: '0 0 24px' },

  inputLabel: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, textAlign: 'right' },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: '2px solid #e2e8f0', fontSize: 17, fontWeight: '600',
    background: '#f8f9ff', color: '#1e293b', textAlign: 'right', direction: 'rtl',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
    marginBottom: 6,
  } as React.CSSProperties,
  err: { fontSize: 13, color: '#ef4444', marginBottom: 8, textAlign: 'right' },

  btn: {
    width: '100%', padding: '15px', marginTop: 16,
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: 'white', border: 'none', borderRadius: 14,
    fontSize: 17, fontWeight: '800', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99,102,241,0.4)', letterSpacing: 0.3,
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  privacy: { fontSize: 12, color: '#94a3b8', marginTop: 16, lineHeight: 1.5 },
};
