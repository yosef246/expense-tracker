import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';
import { formatExpenseDate, dateToYMD } from '../utils/dateHelpers';
import { Expense } from '../types';

/* ─── friendly budget message ─── */
function getBudgetMsg(pct: number, name: string) {
  const n = name.split(' ')[0];
  if (pct >= 100) return { emoji: '🐘', text: `${n}, יש לך מילה של אנטילופה... עברת את התקציב לגמרי!`, bg: '#fef2f2', color: '#dc2626' };
  if (pct >= 90)  return { emoji: '🚨', text: `${n}! אתה על הקצה — כמעט אפס בחשבון!`,                   bg: '#fff7ed', color: '#ea580c' };
  if (pct >= 75)  return { emoji: '😬', text: `${n}, אתה לקראת הסוף — מה נהיה כפרע?`,                    bg: '#fffbeb', color: '#d97706' };
  if (pct >= 50)  return { emoji: '👀', text: `${n}, אתה בסדר אבל מעכשיו תשים לב על מה אתה מוציא`,       bg: '#fefce8', color: '#ca8a04' };
  if (pct >= 30)  return { emoji: '👍', text: `${n}, אתה שולט היטב בהוצאות — כך ממשיכים!`,               bg: '#f0fdf4', color: '#16a34a' };
  return               { emoji: '🌟', text: `${n}, מעולה! אתה בשליטה מלאה על התקציב`,                    bg: '#f0fdf4', color: '#059669' };
}

/* ─── edit modal ─── */
function EditModal({ expense, onSave, onClose }: {
  expense: Expense;
  onSave: (id: string, changes: { amount: number; description: string; date: string }) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [desc,   setDesc]   = useState(expense.description);
  const [date,   setDate]   = useState(expense.date);
  const [warn,   setWarn]   = useState('');

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setWarn('יש להזין סכום גדול מאפס'); return; }
    onSave(expense.id, { amount: num, description: desc.trim(), date });
    onClose();
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.sheet} onClick={e => e.stopPropagation()}>
        <div style={m.handle} />
        <h2 style={m.title}>עריכת הוצאה ✏️</h2>

        <label style={m.lbl}>סכום ₪</label>
        <input style={m.inp} type="number" inputMode="decimal" value={amount}
          onChange={e => { setAmount(e.target.value); setWarn(''); }} />
        {warn && <p style={m.err}>{warn}</p>}

        <label style={m.lbl}>תיאור</label>
        <input style={m.inp} type="text" value={desc}
          onChange={e => setDesc(e.target.value)} maxLength={200} />

        <label style={m.lbl}>תאריך</label>
        <input style={m.inp} type="date" value={date}
          onChange={e => setDate(e.target.value)} />

        <div style={m.btns}>
          <button style={m.cancel} onClick={onClose}>ביטול</button>
          <button style={m.save}   onClick={handleSave}>💾 שמור</button>
        </div>
      </div>
    </div>
  );
}

/* ─── swipeable expense row ─── */
const SWIPE_THRESHOLD = 60;

function SwipeRow({ expense, onDelete, onEdit, index }: {
  expense: Expense; onDelete: (id: string) => void;
  onEdit: (e: Expense) => void; index: number;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const begin = (x: number) => { startX.current = x; setDragging(true); };
  const move  = (x: number) => {
    if (!dragging) return;
    const dx = x - startX.current;
    setOffsetX(Math.max(-110, Math.min(110, dx)));
  };
  const end = () => {
    setDragging(false);
    if (offsetX > SWIPE_THRESHOLD)       { setOffsetX(100); }   // reveal delete (right)
    else if (offsetX < -SWIPE_THRESHOLD) { setOffsetX(-100); }  // reveal edit (left)
    else                                  { setOffsetX(0); }
  };
  const reset = () => setOffsetX(0);

  const handleDelete = () => { reset(); if (window.confirm('למחוק את ההוצאה?')) onDelete(expense.id); };
  const handleEdit   = () => { reset(); onEdit(expense); };

  return (
    <div className="card-enter" style={{ ...r.wrap, animationDelay: `${index * 55}ms` }}>
      {/* Behind-left: edit */}
      <button style={r.editBg} onClick={handleEdit}>✏️ עריכה</button>
      {/* Behind-right: delete */}
      <button style={r.delBg} onClick={handleDelete}>🗑️ מחיקה</button>

      {/* Draggable card */}
      <div
        style={{ ...r.card, transform: `translateX(${offsetX}px)`, transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(.4,0,.2,1)' }}
        onMouseDown={e => begin(e.clientX)}
        onMouseMove={e => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={() => { if (dragging) end(); }}
        onTouchStart={e => begin(e.touches[0].clientX)}
        onTouchMove={e => move(e.touches[0].clientX)}
        onTouchEnd={end}
      >
        <div style={r.left}>
          <span style={r.date}>{formatExpenseDate(expense.date, expense.createdAt)}</span>
          <span style={r.desc}>{expense.description || '—'}</span>
        </div>
        <span style={r.amt}>{formatCurrency(expense.amount)}</span>
      </div>
    </div>
  );
}

/* ─── main screen ─── */
export default function HomeScreen() {
  const navigate   = useNavigate();
  const { expenses, deleteExpense, editExpense } = useExpenses();
  const { settings } = useSettings();
  const userName   = localStorage.getItem('userName') || 'משתמש';

  const period   = getBudgetPeriod(settings.monthStartDay, new Date());
  const startStr = toYMD(period.start);
  const endStr   = toYMD(period.end);

  const periodExpenses = expenses.filter(e => e.date >= startStr && e.date < endStr);
  const totalSpent     = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining      = settings.monthlyBudget - totalSpent;
  const pct            = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;
  const barColor       = getProgressColor(pct);
  const barWidth       = Math.min(pct, 100);
  const recent         = expenses.slice(0, 5);
  const msg            = getBudgetMsg(pct, userName);

  const [editing, setEditing] = useState<Expense | null>(null);

  const barGrad = barColor === '#10b981' ? 'linear-gradient(90deg,#059669,#34d399)'
                : barColor === '#f59e0b' ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                :                          'linear-gradient(90deg,#dc2626,#f87171)';

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.blob1} /><div style={s.blob2} />

        <div style={s.topRow}>
          <button style={s.gearBtn} onClick={() => navigate('/settings')}>⚙️</button>
          <div style={s.logoRow}>
            <img src="/logo.svg" style={s.logo} alt="" />
            <span style={s.appTitle}>מעקב הוצאות</span>
          </div>
        </div>

        <p style={s.greeting}>שלום, {userName.split(' ')[0]} 👋</p>
        <p style={s.periodTag}>💰 תקציב {period.label}</p>
        <div style={s.heroAmount}>{formatCurrency(settings.monthlyBudget)}</div>

        <div style={s.track}>
          <div style={{ ...s.fill, width: `${barWidth}%`, background: barGrad }} />
        </div>

        <div style={s.pillRow}>
          <div style={s.pill}>
            <span style={s.pillLabel}>הוצאת</span>
            <span style={{ ...s.pillVal, color: '#ef4444' }}>{formatCurrency(totalSpent)}</span>
          </div>
          <div style={{ ...s.pill, background: 'rgba(255,255,255,0.55)' }}>
            <span style={s.pillLabel}>נשאר</span>
            <span style={{ ...s.pillVal, color: remaining >= 0 ? '#059669' : '#ef4444' }}>{formatCurrency(remaining)}</span>
          </div>
          <div style={{ ...s.pill, minWidth: 56 }}>
            <span style={{ ...s.pillVal, color: 'white', fontSize: 18 }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        {/* Budget message */}
        <div style={{ ...s.msgCard, background: msg.bg, borderColor: msg.color + '40' }}>
          <span style={s.msgEmoji}>{msg.emoji}</span>
          <span style={{ ...s.msgText, color: msg.color }}>{msg.text}</span>
        </div>

        <div style={s.sectionRow}>
          <span style={s.sectionTitle}>📅 הוצאות אחרונות</span>
          <button style={s.linkBtn} onClick={() => navigate('/history')}>כל ההיסטוריה ›</button>
        </div>

        <p style={s.swipeHint}>← החלק לעריכה &nbsp;|&nbsp; החלק למחיקה →</p>

        {recent.length === 0
          ? <Empty />
          : recent.map((e, i) => (
              <SwipeRow key={e.id} expense={e} index={i}
                onDelete={deleteExpense}
                onEdit={exp => setEditing(exp)} />
            ))
        }

        <button style={s.histBtn} onClick={() => navigate('/history')}>📊 היסטוריה חודשית</button>
      </div>

      {/* ── FAB ── */}
      <button style={s.fab} onClick={() => navigate('/add')}>＋</button>

      {/* ── Edit modal ── */}
      {editing && (
        <EditModal
          expense={editing}
          onSave={(id, changes) => editExpense(id, changes)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Empty() {
  return (
    <div style={s.empty}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>🌱</div>
      <div style={{ fontWeight: '700', color: '#6366f1', marginBottom: 4 }}>אין הוצאות עדיין</div>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>לחץ + כדי להוסיף</div>
    </div>
  );
}

/* ─── styles ─── */
const HEADER_BG = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 45%,#a78bfa 100%)';

const s: Record<string, React.CSSProperties> = {
  page:       { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f0f2ff', position: 'relative' },
  header:     { background: HEADER_BG, padding: '52px 20px 28px', position: 'relative', overflow: 'hidden', borderRadius: '0 0 28px 28px', boxShadow: '0 8px 32px rgba(99,102,241,0.28)' },
  blob1:      { position: 'absolute', top: -80, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' },
  blob2:      { position: 'absolute', bottom: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' },
  topRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 1 },
  gearBtn:    { width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, backdropFilter: 'blur(8px)' },
  logoRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  logo:       { width: 30, height: 30, borderRadius: 8 },
  appTitle:   { fontSize: 15, fontWeight: '700', color: 'white' },
  greeting:   { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 2, position: 'relative', zIndex: 1 },
  periodTag:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 6, position: 'relative', zIndex: 1 },
  heroAmount: { fontSize: 46, fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: 18, direction: 'ltr' as const, position: 'relative', zIndex: 1, letterSpacing: -1 },
  track:      { height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginBottom: 16, position: 'relative', zIndex: 1 },
  fill:       { height: '100%', borderRadius: 8, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' },
  pillRow:    { display: 'flex', gap: 8, position: 'relative', zIndex: 1 },
  pill:       { flex: 1, background: 'rgba(255,255,255,0.38)', borderRadius: 12, padding: '8px 10px', textAlign: 'center', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.4)' },
  pillLabel:  { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  pillVal:    { fontSize: 15, fontWeight: '800', direction: 'ltr' as const },
  body:       { padding: '20px 16px 100px' },
  msgCard:    { display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: '12px 14px', marginBottom: 18, border: '1.5px solid', direction: 'rtl' as const },
  msgEmoji:   { fontSize: 22, flexShrink: 0, marginTop: 1 },
  msgText:    { fontSize: 14, fontWeight: '600', lineHeight: '1.5', flex: 1, textAlign: 'right' },
  sectionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: '#1e293b' },
  linkBtn:    { fontSize: 13, color: '#6366f1', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' },
  swipeHint:  { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12, direction: 'ltr' as const },
  empty:      { textAlign: 'center', padding: '36px 20px', borderRadius: 18, background: 'white', marginBottom: 12, boxShadow: '0 2px 12px rgba(99,102,241,0.07)' },
  histBtn:    { width: '100%', padding: 14, marginTop: 18, border: '2px solid #6366f1', borderRadius: 14, background: 'white', color: '#6366f1', fontSize: 15, fontWeight: '700', cursor: 'pointer' },
  fab:        { position: 'fixed', bottom: 28, right: 'calc(max(0px,(100vw - 480px)/2) + 20px)', width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 26, boxShadow: '0 6px 24px rgba(99,102,241,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};

const r: Record<string, React.CSSProperties> = {
  wrap:   { position: 'relative', marginBottom: 10, borderRadius: 16, overflow: 'hidden', userSelect: 'none' },
  delBg:  { position: 'absolute', top: 0, bottom: 0, right: 0, width: 110, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: 13, gap: 4, border: 'none', cursor: 'pointer' },
  editBg: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 110, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: 13, gap: 4, border: 'none', cursor: 'pointer' },
  card:   { background: 'white', borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 12px rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.08)', position: 'relative', zIndex: 1, cursor: 'grab' },
  left:   { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, textAlign: 'right' },
  date:   { fontSize: 11, color: '#94a3b8' },
  desc:   { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  amt:    { fontSize: 15, fontWeight: '800', color: '#6366f1', direction: 'ltr' as const, whiteSpace: 'nowrap', marginRight: 8 },
};

const m: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,14,23,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  sheet:   { background: 'white', borderRadius: '24px 24px 0 0', padding: '16px 24px 36px', width: '100%', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' },
  handle:  { width: 40, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 20px' },
  title:   { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20, textAlign: 'right' },
  lbl:     { display: 'block', fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginTop: 14, textAlign: 'right' },
  inp:     { width: '100%', padding: '13px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 16, background: '#f8f9ff', color: '#1e293b', textAlign: 'right', direction: 'rtl' as const, outline: 'none', boxSizing: 'border-box' as const },
  err:     { color: '#ef4444', fontSize: 13, marginTop: 6, textAlign: 'right' },
  btns:    { display: 'flex', gap: 12, marginTop: 24 },
  cancel:  { flex: 1, padding: 14, borderRadius: 12, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 15, fontWeight: '700', cursor: 'pointer' },
  save:    { flex: 2, padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 15, fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' },
};
