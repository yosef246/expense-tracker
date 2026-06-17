import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { dateToYMD } from '../utils/dateHelpers';

export default function AddExpenseScreen() {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();

  const [amount,  setAmount]  = useState('');
  const [description, setDesc] = useState('');
  const [warning, setWarning] = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setWarning('יש להזין סכום גדול מאפס'); return; }
    setSaving(true);
    addExpense(num, description.trim(), dateToYMD(new Date()));
    setTimeout(() => navigate('/'), 300);
  };

  const today = new Date();
  const displayDate = today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.blob} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h1 style={s.title}>הוצאה חדשה ✨</h1>
        <p style={s.sub}>הוסף הוצאה למעקב החודשי שלך</p>
      </div>

      <div style={s.body}>
        {/* Amount card */}
        <div style={s.amountCard}>
          <p style={s.amountHint}>כמה הוצאת?</p>
          <div style={s.amountRow}>
            <span style={s.shek}>₪</span>
            <input
              style={s.amountInput}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => { setAmount(e.target.value); setWarning(''); }}
              autoFocus
            />
          </div>
          {warning && <p style={s.warn}>{warning}</p>}
        </div>

        {/* Description */}
        <div style={s.field}>
          <label style={s.lbl}>על מה? 🛍️</label>
          <input
            style={s.inp}
            type="text"
            placeholder="פחית קולה ביילו"
            value={description}
            onChange={e => setDesc(e.target.value)}
            maxLength={200}
          />
        </div>

        {/* Auto date display */}
        <div style={s.dateBadge}>
          <span style={s.dateIcon}>📅</span>
          <span style={s.dateText}>נרשם לתאריך היום — {displayDate}</span>
        </div>

        <button style={{ ...s.saveBtn, opacity: saving ? 0.75 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? '...שומר' : '💾 שמור הוצאה'}
        </button>
      </div>
    </div>
  );
}

const HDR = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)';

const s: Record<string, React.CSSProperties> = {
  page:   { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f0f2ff' },
  header: { background: HDR, padding: '52px 20px 32px', borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(99,102,241,0.28)' },
  blob:   { position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' },
  backBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', marginBottom: 14, padding: 0, position: 'relative', zIndex: 1 },
  title:  { fontSize: 28, fontWeight: '800', color: 'white', margin: '0 0 6px', position: 'relative', zIndex: 1 },
  sub:    { fontSize: 14, color: 'rgba(255,255,255,0.65)', position: 'relative', zIndex: 1 },

  body:  { padding: '24px 20px 60px' },

  amountCard:  { background: 'white', borderRadius: 20, padding: '24px 20px 20px', marginBottom: 20, boxShadow: '0 4px 24px rgba(99,102,241,0.12)', border: '2px solid rgba(99,102,241,0.1)', textAlign: 'center' },
  amountHint:  { fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: '600' },
  amountRow:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  shek:        { fontSize: 36, fontWeight: '800', color: '#6366f1' },
  amountInput: { fontSize: 58, fontWeight: '800', color: '#1e293b', border: 'none', background: 'transparent', textAlign: 'center', width: 200, outline: 'none', direction: 'ltr' as const },
  warn:        { color: '#ef4444', fontSize: 13, marginTop: 10, fontWeight: '500' },

  field: { marginBottom: 16 },
  lbl:   { display: 'block', fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, letterSpacing: 0.2 },
  inp:   { width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid #e2e8f0', fontSize: 16, background: 'white', color: '#1e293b', textAlign: 'right', direction: 'rtl' as const, outline: 'none', boxSizing: 'border-box' as const },

  dateBadge: { display: 'flex', alignItems: 'center', gap: 8, background: '#eef2ff', borderRadius: 12, padding: '11px 14px', marginBottom: 8, border: '1px solid #c7d2fe', direction: 'rtl' as const },
  dateIcon:  { fontSize: 16, flexShrink: 0 },
  dateText:  { fontSize: 13, color: '#4338ca', fontWeight: '600' },

  saveBtn: { width: '100%', padding: 16, marginTop: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', letterSpacing: 0.3 },
};
