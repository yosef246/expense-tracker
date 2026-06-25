import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
export default function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, saveSettings } = useSettings();

  const [budget,   setBudget]  = useState(String(settings.monthlyBudget));
  const [startDay, setStart]   = useState<1 | 10>(settings.monthStartDay);
  const [warning,  setWarning] = useState('');
  const [saved,    setSaved]   = useState(false);

  const handleSave = () => {
    const raw = budget.trim();
    if (!/^\d+$/.test(raw))      { setWarning('יש להזין מספר שלם בלבד'); return; }
    const n = parseInt(raw, 10);
    if (n <= 0)                   { setWarning('התקציב חייב להיות גדול מאפס'); return; }
    setWarning('');
    saveSettings({ monthlyBudget: n, monthStartDay: startDay });
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate('/'); }, 900);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.blob} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h1 style={s.title}>הגדרות ⚙️</h1>
        <p style={s.sub}>התאם את מעקב ההוצאות שלך</p>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.cardIcon}>💰</div>
          <div style={s.cardBody}>
            <div style={s.cardLabel}>תקציב חודשי (₪)</div>
            <input
              style={s.inp}
              type="number"
              inputMode="numeric"
              value={budget}
              placeholder="2000"
              onChange={e => { setBudget(e.target.value); setWarning(''); setSaved(false); }}
            />
            {warning && <p style={s.warn}>{warning}</p>}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardIcon}>📅</div>
          <div style={s.cardBody}>
            <div style={s.cardLabel}>יום תחילת החודש התקציבי</div>
            <div style={s.seg}>
              {([1, 10] as const).map(d => (
                <button
                  key={d}
                  style={{ ...s.segBtn, ...(startDay === d ? s.segOn : {}) }}
                  onClick={() => { setStart(d); setSaved(false); }}
                >
                  {d} לחודש
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          style={{ ...s.saveBtn, background: saved ? 'linear-gradient(135deg,#059669,#34d399)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          onClick={handleSave}
        >
          {saved ? '✅ נשמר בהצלחה!' : '💾 שמור הגדרות'}
        </button>
      </div>
    </div>
  );
}

const HDR = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)';

const s: Record<string, React.CSSProperties> = {
  page:   { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f0f2ff' },
  header: { background: HDR, padding: '52px 20px 32px', borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(99,102,241,0.28)' },
  blob:   { position: 'absolute', top: -70, left: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' },
  backBtn:{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', marginBottom: 14, padding: 0, position: 'relative', zIndex: 1 },
  title:  { fontSize: 28, fontWeight: '800', color: 'white', margin: '0 0 6px', position: 'relative', zIndex: 1 },
  sub:    { fontSize: 14, color: 'rgba(255,255,255,0.65)', position: 'relative', zIndex: 1 },

  body:  { padding: '24px 20px 60px' },

  card:      { background: 'white', borderRadius: 18, padding: '18px 16px', marginBottom: 14, display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 2px 16px rgba(99,102,241,0.09)', border: '1.5px solid rgba(99,102,241,0.07)' },
  cardIcon:  { fontSize: 26, marginTop: 2, flexShrink: 0 },
  cardBody:  { flex: 1 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 10, letterSpacing: 0.2 },

  inp:  { width: '100%', padding: '13px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 18, fontWeight: '700', background: '#f8f9ff', color: '#1e293b', textAlign: 'right', direction: 'rtl' as const, outline: 'none', boxSizing: 'border-box' as const },
  warn: { color: '#ef4444', fontSize: 13, marginTop: 8 },

  seg:    { display: 'flex', gap: 10 },
  segBtn: { flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid #e2e8f0', background: '#f8f9ff', color: '#94a3b8', fontSize: 15, fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  segOn:  { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: '2px solid transparent', fontWeight: '800' },

  saveBtn: { width: '100%', padding: 16, marginTop: 24, color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'background 0.4s', letterSpacing: 0.3 },
};
