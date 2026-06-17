import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';
import { formatExpenseDate } from '../utils/dateHelpers';
import { Expense } from '../types';

function getBudgetMessage(pct: number, name: string): { emoji: string; text: string; bg: string; color: string } {
  const n = name.split(' ')[0];
  if (pct >= 100) return { emoji: '🐘', text: `${n}, יש לך מילה של אטילופה... עברת את התקציב לגמרי!`, bg: '#fef2f2', color: '#dc2626' };
  if (pct >= 90)  return { emoji: '🚨', text: `${n}! אתה על הקצה — כמעט אפס בחשבון!`, bg: '#fff7ed', color: '#ea580c' };
  if (pct >= 75)  return { emoji: '😬', text: `${n}, אתה לקראת הסוף — מה נהיה כפרע?`, bg: '#fffbeb', color: '#d97706' };
  if (pct >= 50)  return { emoji: '👀', text: `${n}, אתה בסדר אבל מעכשיו תשים לב על מה אתה מוציא`, bg: '#fefce8', color: '#ca8a04' };
  if (pct >= 30)  return { emoji: '👍', text: `${n}, אתה שולט היטב בהוצאות — כך ממשיכים!`, bg: '#f0fdf4', color: '#16a34a' };
  return              { emoji: '🌟', text: `${n}, מעולה! אתה בשליטה מלאה על התקציב`, bg: '#f0fdf4', color: '#059669' };
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const { settings } = useSettings();
  const userName = localStorage.getItem('userName') || 'משתמש';

  const period = getBudgetPeriod(settings.monthStartDay, new Date());
  const startStr = toYMD(period.start);
  const endStr   = toYMD(period.end);

  const periodExpenses = expenses.filter(e => e.date >= startStr && e.date < endStr);
  const totalSpent     = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining      = settings.monthlyBudget - totalSpent;
  const pct            = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;
  const barColor       = getProgressColor(pct);
  const barWidth       = Math.min(pct, 100);
  const recent         = expenses.slice(0, 5);
  const msg            = getBudgetMessage(pct, userName);

  const handleDelete = (id: string) => {
    if (window.confirm('למחוק את ההוצאה?')) deleteExpense(id);
  };

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

        {/* Progress */}
        <div style={s.track}>
          <div style={{ ...s.fill, width: `${barWidth}%`,
            background: barColor === '#10b981' ? 'linear-gradient(90deg,#059669,#34d399)'
                      : barColor === '#f59e0b' ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                      :                          'linear-gradient(90deg,#dc2626,#f87171)' }} />
        </div>

        <div style={s.pillRow}>
          <div style={s.pill}>
            <span style={s.pillLabel}>הוצאת</span>
            <span style={{ ...s.pillVal, color: '#ef4444' }}>{formatCurrency(totalSpent)}</span>
          </div>
          <div style={{ ...s.pill, background: 'rgba(255,255,255,0.55)' }}>
            <span style={s.pillLabel}>נשאר</span>
            <span style={{ ...s.pillVal, color: remaining >= 0 ? '#059669' : '#ef4444' }}>
              {formatCurrency(remaining)}
            </span>
          </div>
          <div style={{ ...s.pill, minWidth: 56 }}>
            <span style={{ ...s.pillVal, color: barColor, fontSize: 18 }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>

        {/* Budget message */}
        <div style={{ ...s.msgCard, background: msg.bg, borderColor: msg.color + '33' }}>
          <span style={s.msgEmoji}>{msg.emoji}</span>
          <span style={{ ...s.msgText, color: msg.color }}>{msg.text}</span>
        </div>

        <div style={s.sectionRow}>
          <span style={s.sectionTitle}>📅 הוצאות אחרונות</span>
          <button style={s.linkBtn} onClick={() => navigate('/history')}>כל ההיסטוריה ›</button>
        </div>

        {recent.length === 0 ? <Empty /> : recent.map((e, i) => (
          <ExpRow key={e.id} expense={e} onDelete={handleDelete} i={i} />
        ))}

        <button style={s.histBtn} onClick={() => navigate('/history')}>📊 היסטוריה חודשית</button>
      </div>

      {/* ── FAB ── */}
      <button style={s.fab} onClick={() => navigate('/add')}>＋</button>
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

function ExpRow({ expense, onDelete, i }: { expense: Expense; onDelete:(id:string)=>void; i:number }) {
  return (
    <div className="card-enter" style={{ ...s.expCard, animationDelay:`${i*55}ms` }}>
      <div style={s.expLeft}>
        <span style={s.expDate}>{formatExpenseDate(expense.date, expense.createdAt)}</span>
        <span style={s.expDesc}>{expense.description || '—'}</span>
      </div>
      <div style={s.expRight}>
        <span style={s.expAmt}>{formatCurrency(expense.amount)}</span>
        <button style={s.delBtn} onClick={() => onDelete(expense.id)} title="מחק">🗑️</button>
      </div>
    </div>
  );
}

const HEADER_BG = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 45%,#a78bfa 100%)';

const s: Record<string,React.CSSProperties> = {
  page:    { maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'#f0f2ff', position:'relative', fontFamily:'inherit' },

  /* header */
  header:  { background:HEADER_BG, padding:'52px 20px 28px', position:'relative', overflow:'hidden', borderRadius:'0 0 28px 28px', boxShadow:'0 8px 32px rgba(99,102,241,0.28)' },
  blob1:   { position:'absolute', top:-80, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.1)', pointerEvents:'none' },
  blob2:   { position:'absolute', bottom:-50, right:-50, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' },
  topRow:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative', zIndex:1 },
  gearBtn: { width:38, height:38, borderRadius:12, background:'rgba(255,255,255,0.22)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, backdropFilter:'blur(8px)' },
  logoRow: { display:'flex', alignItems:'center', gap:8 },
  logo:    { width:30, height:30, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' },
  appTitle:{ fontSize:15, fontWeight:'700', color:'white' },

  greeting:   { fontSize:15, fontWeight:'700', color:'rgba(255,255,255,0.9)', marginBottom:2, position:'relative', zIndex:1 },
  periodTag:  { fontSize:13, color:'rgba(255,255,255,0.65)', marginBottom:6, position:'relative', zIndex:1 },
  heroAmount: { fontSize:46, fontWeight:'800', color:'white', textAlign:'center', marginBottom:18, direction:'ltr' as const, position:'relative', zIndex:1, letterSpacing:-1, textShadow:'0 2px 16px rgba(0,0,0,0.15)' },

  track: { height:12, borderRadius:8, background:'rgba(255,255,255,0.25)', overflow:'hidden', marginBottom:16, position:'relative', zIndex:1 },
  fill:  { height:'100%', borderRadius:8, transition:'width 0.7s cubic-bezier(.4,0,.2,1)' },

  pillRow: { display:'flex', gap:8, position:'relative', zIndex:1 },
  pill:    { flex:1, background:'rgba(255,255,255,0.38)', borderRadius:12, padding:'8px 10px', textAlign:'center', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.4)' },
  pillLabel:{ display:'block', fontSize:11, color:'rgba(255,255,255,0.75)', marginBottom:2 },
  pillVal: { fontSize:15, fontWeight:'800', direction:'ltr' as const },

  /* body */
  body:        { padding:'22px 16px 100px' },
  sectionRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  sectionTitle:{ fontSize:16, fontWeight:'700', color:'#1e293b' },
  linkBtn:     { fontSize:13, color:'#6366f1', fontWeight:'600', background:'none', border:'none', cursor:'pointer' },

  empty: { textAlign:'center', padding:'36px 20px', borderRadius:18, background:'white', marginBottom:12, boxShadow:'0 2px 12px rgba(99,102,241,0.07)' },

  expCard:  { background:'white', borderRadius:16, padding:'14px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 12px rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.08)' },
  expLeft:  { display:'flex', flexDirection:'column', gap:3, flex:1, textAlign:'right' },
  expDate:  { fontSize:11, color:'#94a3b8' },
  expDesc:  { fontSize:15, color:'#1e293b', fontWeight:'600' },
  expRight: { display:'flex', alignItems:'center', gap:10 },
  expAmt:   { fontSize:15, fontWeight:'800', color:'#6366f1', direction:'ltr' as const, whiteSpace:'nowrap' },
  delBtn:   { background:'none', border:'none', cursor:'pointer', fontSize:15, padding:4, opacity:0.45 },

  msgCard:  { display:'flex', alignItems:'flex-start', gap:10, borderRadius:14, padding:'12px 14px', marginBottom:18, border:'1.5px solid', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  msgEmoji: { fontSize:22, flexShrink:0, marginTop:1 },
  msgText:  { fontSize:14, fontWeight:'600', lineHeight:'1.5', flex:1, textAlign:'right' },

  histBtn: { width:'100%', padding:14, marginTop:18, border:'2px solid #6366f1', borderRadius:14, background:'white', color:'#6366f1', fontSize:15, fontWeight:'700', cursor:'pointer' },

  fab: { position:'fixed', bottom:28, right:'calc(max(0px,(100vw - 480px)/2) + 20px)', width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', fontSize:26, fontWeight:'400', boxShadow:'0 6px 24px rgba(99,102,241,0.5)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
};
