import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYearlyReset } from '../hooks/useYearlyReset';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';
import { formatExpenseDate, dateToYMD } from '../utils/dateHelpers';
import { CATEGORIES, getCategoryEmoji } from '../utils/categories';
import { Expense, Settings } from '../types';

/* ─── budget message ─── */
function getBudgetMsg(pct: number, name: string) {
  const n = name.split(' ')[0];
  if (pct > 100)  return { emoji: '🐘', text: `${n}, יש לך מילה של אנטילופה... עברת את התקציב לגמרי!`,                                        bg: '#fef2f2', color: '#dc2626' };
  if (pct >= 100) return { emoji: '🎯', text: `${n}, את/ה הגעת למכסה שהצבת לעצמך/לעצמיך — מכאן והלאה זה את/ה מול המילה שלך`,                  bg: '#fef2f2', color: '#dc2626' };
  if (pct >= 90)  return { emoji: '🚨', text: `${n}! את/ה על הקצה — כמעט אפס בחשבון!`,                                                           bg: '#fff7ed', color: '#ea580c' };
  if (pct >= 75)  return { emoji: '😬', text: `${n}, את/ה לקראת הסוף — מה יהיה כפרע?`,                                                           bg: '#fffbeb', color: '#d97706' };
  if (pct >= 50)  return { emoji: '👀', text: `${n}, את/ה בסדר אבל מעכשיו תשים/י לב על מה את/ה מוציא/ה כסף`,                                    bg: '#fefce8', color: '#ca8a04' };
  if (pct >= 30)  return { emoji: '👍', text: `${n}, את/ה שולט/ת היטב בהוצאות — כך ממשיכים/ות!`,                                                bg: '#f0fdf4', color: '#16a34a' };
  return               { emoji: '🌟', text: `${n}, מעולה! את/ה בשליטה מלאה על התקציב`,                                                           bg: '#f0fdf4', color: '#059669' };
}

/* ─── weekly summary ─── */
function WeeklySummary({ expenses }: { expenses: Expense[] }) {
  const now    = new Date();
  const nowStr = dateToYMD(now);

  const thisStart = new Date(now); thisStart.setDate(thisStart.getDate() - 6);
  const thisStartStr = dateToYMD(thisStart);

  const lastEnd   = new Date(thisStart); lastEnd.setDate(lastEnd.getDate() - 1);
  const lastStart = new Date(lastEnd);   lastStart.setDate(lastStart.getDate() - 6);
  const lastStartStr = dateToYMD(lastStart);
  const lastEndStr   = dateToYMD(lastEnd);

  const thisWeek = expenses.filter(e => e.date >= thisStartStr && e.date <= nowStr);
  const lastWeek = expenses.filter(e => e.date >= lastStartStr && e.date <= lastEndStr);

  const thisTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
  const lastTotal = lastWeek.reduce((s, e) => s + e.amount, 0);

  if (thisTotal === 0) return null;

  const topCat = CATEGORIES
    .map(cat => ({ ...cat, amount: thisWeek.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];

  const diff = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : null;

  return (
    <div style={sw.wrap}>
      <div style={sw.title}>📊 סיכום השבוע</div>
      <div style={sw.line}>
        <span>סה״כ: <b>{formatCurrency(thisTotal)}</b></span>
        {topCat && <span> · {topCat.emoji} <b>{topCat.label}</b> {formatCurrency(topCat.amount)}</span>}
        {diff !== null && (
          <span style={{ color: diff > 0 ? '#ef4444' : '#059669', fontWeight: '700' }}>
            {' '}· {diff > 0 ? '+' : ''}{diff.toFixed(0)}% משבוע שעבר
          </span>
        )}
      </div>
    </div>
  );
}

const sw: Record<string, React.CSSProperties> = {
  wrap:  { background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1.5px solid #c7d2fe', borderRadius: 14, padding: '12px 14px', marginBottom: 14, direction: 'rtl' as const },
  title: { fontSize: 13, fontWeight: '700', color: '#4338ca', marginBottom: 6 },
  line:  { fontSize: 13, color: '#4338ca', lineHeight: '1.6' },
};

/* ─── last month comparison ─── */
function LastMonthRow({ expenses, settings }: { expenses: Expense[]; settings: Settings }) {
  const now    = new Date();
  const period = getBudgetPeriod(settings.monthStartDay, now);

  const daysElapsed = Math.max(1, Math.floor((now.getTime() - period.start.getTime()) / 86400000) + 1);

  const startStr = toYMD(period.start);
  const nowStr   = toYMD(now);
  const current  = expenses.filter(e => e.date >= startStr && e.date <= nowStr).reduce((s, e) => s + e.amount, 0);

  const lastStart = new Date(period.start); lastStart.setMonth(lastStart.getMonth() - 1);
  const lastEnd   = new Date(lastStart);    lastEnd.setDate(lastEnd.getDate() + daysElapsed - 1);
  const last = expenses
    .filter(e => e.date >= toYMD(lastStart) && e.date <= toYMD(lastEnd))
    .reduce((s, e) => s + e.amount, 0);

  if (last === 0) return null;

  const diff = current - last;
  const pct  = Math.abs((diff / last) * 100);
  const isMore = diff > 0;

  return (
    <div style={lm.wrap}>
      <span style={lm.icon}>📈</span>
      <span style={lm.text}>
        החודש עד כה: <b>{formatCurrency(current)}</b>
        {' '}· חודש שעבר: <b>{formatCurrency(last)}</b>
        {' '}<b style={{ color: isMore ? '#ef4444' : '#059669' }}>
          ({isMore ? '+' : '-'}{pct.toFixed(0)}%)
        </b>
      </span>
    </div>
  );
}

const lm: Record<string, React.CSSProperties> = {
  wrap: { background: 'white', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.07)', direction: 'rtl' as const },
  icon: { fontSize: 16, flexShrink: 0 },
  text: { fontSize: 13, color: '#475569', lineHeight: '1.5' },
};

/* ─── edit modal ─── */
function EditModal({ expense, onSave, onClose }: {
  expense: Expense;
  onSave: (id: string, changes: { amount: number; description: string }) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [desc,   setDesc]   = useState(expense.description);
  const [warn,   setWarn]   = useState('');
  const [saved,  setSaved]  = useState(false);

  const hasChanged = amount !== String(expense.amount) || desc.trim() !== expense.description;

  const handleSave = () => {
    if (!hasChanged) return;
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) { setWarn('יש להזין סכום גדול מאפס'); return; }
    onSave(expense.id, { amount: num, description: desc.trim() });
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const saveBg = saved       ? 'linear-gradient(135deg,#059669,#34d399)'
               : hasChanged  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
               :               '#e2e8f0';

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.sheet} onClick={e => e.stopPropagation()}>
        <div style={m.handle} />
        <h2 style={m.title}>עריכת הוצאה ✏️</h2>

        <label style={m.lbl}>סכום ₪</label>
        <input style={m.inp} type="number" inputMode="decimal" value={amount}
          onChange={e => { setAmount(e.target.value); setWarn(''); }} />
        {warn && <p style={m.err}>{warn}</p>}

        <label style={m.lbl}>מאיפה קנית? 🛍️</label>
        <input style={m.inp} type="text" value={desc}
          onChange={e => setDesc(e.target.value)} maxLength={200} />

        <div style={m.btns}>
          <button style={m.cancel} onClick={onClose}>ביטול</button>
          <button
            style={{ ...m.save, background: saveBg, color: hasChanged || saved ? 'white' : '#94a3b8', cursor: hasChanged ? 'pointer' : 'default' }}
            onClick={handleSave}
          >
            {saved ? '✅ נשמר!' : '💾 שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── swipeable row ─── */
const SWIPE_THRESHOLD = 60;

function SwipeRow({ expense, onDelete, onEdit, index }: {
  expense: Expense; onDelete: (id: string) => void;
  onEdit: (e: Expense) => void; index: number;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const begin = (x: number) => { startX.current = x; setDragging(true); };
  const move  = (x: number) => { if (!dragging) return; setOffsetX(Math.max(-110, Math.min(110, x - startX.current))); };
  const end   = () => {
    setDragging(false);
    if      (offsetX >  SWIPE_THRESHOLD) setOffsetX(100);
    else if (offsetX < -SWIPE_THRESHOLD) setOffsetX(-100);
    else                                  setOffsetX(0);
  };
  const reset = () => setOffsetX(0);

  const catEmoji = getCategoryEmoji(expense.category);

  return (
    <div className="card-enter" style={{ ...r.wrap, animationDelay: `${index * 55}ms` }}>
      <button style={r.editBg} onClick={() => { reset(); onEdit(expense); }}>✏️ עריכה</button>
      <button style={r.delBg}  onClick={() => { reset(); if (window.confirm('למחוק את ההוצאה?')) onDelete(expense.id); }}>🗑️ מחיקה</button>

      <div
        style={{ ...r.card, transform: `translateX(${offsetX}px)`, transition: dragging ? 'none' : 'transform 0.28s cubic-bezier(.4,0,.2,1)', touchAction: 'pan-y' }}
        onMouseDown={e => begin(e.clientX)}
        onMouseMove={e => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={() => { if (dragging) end(); }}
        onTouchStart={e => begin(e.touches[0].clientX)}
        onTouchMove={e => move(e.touches[0].clientX)}
        onTouchEnd={end}
      >
        <div style={r.catDot}>
          <span style={{ fontSize: 18 }}>{catEmoji}</span>
        </div>
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
  const navigate = useNavigate();
  // useYearlyReset MUST be called before useExpenses — its lazy initializer clears
  // localStorage before useExpenses reads from it, ensuring a clean slate on new year.
  const { showEndOfYearWarning, wasRecentlyReset, currentYear } = useYearlyReset();
  const { expenses, deleteExpense, editExpense } = useExpenses();
  const { settings } = useSettings();
  const userName = localStorage.getItem('userName') || 'משתמש';

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
        <p style={s.todayDate}>{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <p style={s.remainLabel}>נשאר לך</p>
        <div style={{ ...s.heroAmount, color: barColor }}>{formatCurrency(remaining)}</div>

        <div style={s.track}>
          <div style={{ ...s.fill, width: `${barWidth}%`, background: barGrad }} />
        </div>

        <div style={s.pillRow}>
          <div style={s.pill}>
            <span style={s.pillLabel}>הוצאת</span>
            <span style={{ ...s.pillVal, color: '#ef4444' }}>{formatCurrency(totalSpent)}</span>
          </div>
          <div style={{ ...s.pill, background: 'rgba(255,255,255,0.55)' }}>
            <span style={s.pillLabel}>תקציב</span>
            <span style={{ ...s.pillVal, color: '#10b981' }}>{formatCurrency(settings.monthlyBudget)}</span>
          </div>
          <div style={{ ...s.pill, minWidth: 56 }}>
            <span style={s.pillLabel}>בוצע</span>
            <span style={{ ...s.pillVal, color: barColor, fontSize: 18 }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        {/* New-year reset confirmation */}
        {wasRecentlyReset && (
          <div style={s.resetBanner}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <div style={{ flex: 1 }}>
              <div style={s.resetTitle}>שנה טובה! ברוך הבא ל-{currentYear}</div>
              <div style={s.resetSub}>כל ההוצאות אופסו לקראת השנה החדשה. לא ניתן לשחזר את הנתונים הישנים.</div>
            </div>
          </div>
        )}

        {/* End-of-year warning (Dec 20–31) */}
        {showEndOfYearWarning && (
          <div style={s.eoyBanner}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={s.eoyTitle}>עוד מעט סוף שנה!</div>
              <div style={s.eoySub}>ב-1 בינואר {currentYear + 1} המערכת תאפס את כל ההוצאות לקראת השנה החדשה. לא ניתן לשמור את הנתונים.</div>
            </div>
          </div>
        )}

        {/* Budget message */}
        <div style={{ ...s.msgCard, background: msg.bg, borderColor: msg.color + '40' }}>
          <span style={s.msgEmoji}>{msg.emoji}</span>
          <span style={{ ...s.msgText, color: msg.color }}>{msg.text}</span>
        </div>

        {/* Weekly summary */}
        <WeeklySummary expenses={expenses} />

        {/* Last month comparison */}
        <LastMonthRow expenses={expenses} settings={settings} />

        <div style={s.sectionRow}>
          <span style={s.sectionTitle}>📅 הוצאות אחרונות</span>
          <button style={s.linkBtn} onClick={() => navigate('/history')}>כל ההיסטוריה ›</button>
        </div>

        <p style={s.swipeHint}>← החלק/י לעריכה &nbsp;|&nbsp; החלק/י למחיקה →</p>

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
          onSave={(id, changes) => editExpense(id, { ...changes, date: editing.date })}
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
      <div style={{ fontSize: 13, color: '#94a3b8' }}>לחץ/י + כדי להוסיף</div>
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
  gearBtn:    { width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, backdropFilter: 'blur(8px)', cursor: 'pointer' },
  logoRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  logo:       { width: 30, height: 30, borderRadius: 8 },
  appTitle:   { fontSize: 15, fontWeight: '700', color: 'white' },
  greeting:   { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 2, position: 'relative', zIndex: 1 },
  todayDate:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4, position: 'relative', zIndex: 1 },
  periodTag:  { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 2, position: 'relative', zIndex: 1 },
  remainLabel:{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 4, position: 'relative', zIndex: 1, letterSpacing: 0.5 },
  heroAmount: { fontSize: 46, fontWeight: '800', textAlign: 'center', marginBottom: 18, direction: 'ltr' as const, position: 'relative', zIndex: 1, letterSpacing: -1, textShadow: '0 2px 12px rgba(0,0,0,0.18)' },
  track:      { height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginBottom: 16, position: 'relative', zIndex: 1 },
  fill:       { height: '100%', borderRadius: 8, transition: 'width 0.7s cubic-bezier(.4,0,.2,1)' },
  pillRow:    { display: 'flex', gap: 8, position: 'relative', zIndex: 1 },
  pill:       { flex: 1, background: 'rgba(255,255,255,0.38)', borderRadius: 12, padding: '8px 10px', textAlign: 'center', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.4)' },
  pillLabel:  { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  pillVal:    { fontSize: 15, fontWeight: '800', direction: 'ltr' as const },
  body:       { padding: '20px 16px 100px' },
  msgCard:    { display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 14, padding: '12px 14px', marginBottom: 14, border: '1.5px solid', direction: 'rtl' as const },
  msgEmoji:   { fontSize: 22, flexShrink: 0, marginTop: 1 },
  msgText:    { fontSize: 14, fontWeight: '600', lineHeight: '1.5', flex: 1, textAlign: 'right' },
  sectionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: '#1e293b' },
  linkBtn:    { fontSize: 13, color: '#6366f1', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' },
  swipeHint:  { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12, direction: 'ltr' as const },
  empty:      { textAlign: 'center', padding: '36px 20px', borderRadius: 18, background: 'white', marginBottom: 12, boxShadow: '0 2px 12px rgba(99,102,241,0.07)' },
  histBtn:    { width: '100%', padding: 14, marginTop: 18, border: '2px solid #6366f1', borderRadius: 14, background: 'white', color: '#6366f1', fontSize: 15, fontWeight: '700', cursor: 'pointer' },
  resetBanner:{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '14px 16px', marginBottom: 14, direction: 'rtl' as const },
  resetTitle: { fontSize: 15, fontWeight: '800', color: '#15803d', marginBottom: 4 },
  resetSub:   { fontSize: 13, color: '#166534', lineHeight: '1.5' },
  eoyBanner:  { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 14, padding: '14px 16px', marginBottom: 14, direction: 'rtl' as const },
  eoyTitle:   { fontSize: 15, fontWeight: '800', color: '#c2410c', marginBottom: 4 },
  eoySub:     { fontSize: 13, color: '#9a3412', lineHeight: '1.5' },
  fab:        { position: 'fixed', bottom: 28, right: 'calc(max(0px,(100vw - 480px)/2) + 20px)', width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 26, boxShadow: '0 6px 24px rgba(99,102,241,0.5)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};

const r: Record<string, React.CSSProperties> = {
  wrap:   { position: 'relative', marginBottom: 10, borderRadius: 16, overflow: 'hidden', userSelect: 'none' },
  delBg:  { position: 'absolute', top: 0, bottom: 0, right: 0, width: 110, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: 13, gap: 4, border: 'none', cursor: 'pointer' },
  editBg: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 110, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: 13, gap: 4, border: 'none', cursor: 'pointer' },
  card:   { background: 'white', borderRadius: 16, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 12px rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.08)', position: 'relative', zIndex: 1, cursor: 'grab' },
  catDot: { flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  left:   { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, textAlign: 'right' },
  date:   { fontSize: 11, color: '#94a3b8' },
  desc:   { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  amt:    { fontSize: 15, fontWeight: '800', color: '#6366f1', direction: 'ltr' as const, whiteSpace: 'nowrap' },
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
