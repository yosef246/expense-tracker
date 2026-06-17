import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';
import { formatExpenseDate, getDaysElapsed, getTotalDays, HEBREW_MONTH_NAMES } from '../utils/dateHelpers';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const { settings } = useSettings();

  const now = new Date();
  const [viewYear,  setYear]  = useState(now.getFullYear());
  const [viewMonth, setMonth] = useState(now.getMonth());

  const viewDate = new Date(viewYear, viewMonth, settings.monthStartDay === 15 ? 15 : 1);
  const period   = getBudgetPeriod(settings.monthStartDay, viewDate);
  const startStr = toYMD(period.start);
  const endStr   = toYMD(period.end);

  const list       = expenses.filter(e => e.date >= startStr && e.date < endStr);
  const totalSpent = list.reduce((s, e) => s + e.amount, 0);
  const pct        = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;
  const barColor   = getProgressColor(pct);

  const isCurrent  = toYMD(now) >= startStr && toYMD(now) < endStr;
  const days       = isCurrent ? getDaysElapsed(period, now) : getTotalDays(period);
  const dailyAvg   = days > 0 ? totalSpent / days : 0;
  const biggest    = list.reduce<typeof list[0]|null>((mx,e) => (!mx||e.amount>mx.amount?e:mx), null);

  const prevM = () => viewMonth===0  ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1);
  const nextM = () => viewMonth===11 ? (setMonth(0),  setYear(y=>y+1)) : setMonth(m=>m+1);
  const onDel = (id:string) => { if(window.confirm('למחוק את ההוצאה?')) deleteExpense(id); };

  const barGrad = barColor==='#10b981' ? 'linear-gradient(90deg,#059669,#34d399)'
                : barColor==='#f59e0b' ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                :                        'linear-gradient(90deg,#dc2626,#f87171)';

  const displayMonth = HEBREW_MONTH_NAMES[period.start.getMonth()];
  const displayYear  = period.start.getFullYear();

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.blob} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h1 style={s.title}>📊 היסטוריה חודשית</h1>

        {/* Month navigator */}
        <div style={s.monthNav}>
          <button style={s.arrow} onClick={nextM}>›</button>
          <div style={s.monthCenter}>
            <span style={s.monthName}>{displayMonth}</span>
            <span style={s.monthYear}>{displayYear}</span>
          </div>
          <button style={s.arrow} onClick={prevM}>‹</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Summary */}
        <div style={s.summCard}>
          <div style={s.summRow}>
            <Stat label="סה״כ הוצאות" value={formatCurrency(totalSpent)} color="#ef4444" />
            <div style={s.divider} />
            <Stat label="תקציב" value={formatCurrency(settings.monthlyBudget)} color="#6366f1" />
            <div style={s.divider} />
            <Stat label="ניצול" value={`${pct.toFixed(0)}%`} color={barColor} />
          </div>
          <div style={s.track}>
            <div style={{ ...s.fill, width:`${Math.min(pct,100)}%`, background:barGrad }} />
          </div>
        </div>

        {/* Insights */}
        {list.length > 0 && (
          <div style={s.insights}>
            <div style={s.insLine}>💸 הוצאה הגדולה: <b>{biggest?.description||'—'}</b> ({formatCurrency(biggest?.amount??0)})</div>
            <div style={s.insLine}>📅 ממוצע יומי: <b>{formatCurrency(dailyAvg)}</b></div>
          </div>
        )}

        {/* List */}
        <div style={s.secTitle}>כל ההוצאות ({list.length})</div>
        {list.length === 0
          ? <div style={s.empty}><div style={{fontSize:40,marginBottom:8}}>🗓️</div>אין הוצאות בחודש זה</div>
          : list.map(e => (
              <div key={e.id} style={s.expCard}>
                <div style={s.expLeft}>
                  <span style={s.expDate}>{formatExpenseDate(e.date, e.createdAt)}</span>
                  <span style={s.expDesc}>{e.description||'—'}</span>
                </div>
                <div style={s.expRight}>
                  <span style={s.expAmt}>{formatCurrency(e.amount)}</span>
                  <button style={s.delBtn} onClick={() => onDel(e.id)}>🗑️</button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ flex:1, textAlign:'center' }}>
      <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4, fontWeight:'600' }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:'800', color, direction:'ltr' as const }}>{value}</div>
    </div>
  );
}

const HDR = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)';

const s: Record<string,React.CSSProperties> = {
  page:   { maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'#f0f2ff' },
  header: { background:HDR, padding:'52px 20px 20px', borderRadius:'0 0 28px 28px', position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(99,102,241,0.28)' },
  blob:   { position:'absolute', bottom:-50, left:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.09)', pointerEvents:'none' },
  backBtn:{ background:'none', border:'none', color:'rgba(255,255,255,0.75)', fontSize:15, cursor:'pointer', marginBottom:14, padding:0, position:'relative', zIndex:1 },
  title:  { fontSize:22, fontWeight:'800', color:'white', margin:'0 0 18px', position:'relative', zIndex:1 },

  monthNav:   { display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.22)', borderRadius:14, padding:'10px 16px', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.35)', position:'relative', zIndex:1 },
  arrow:      { background:'none', border:'none', fontSize:24, fontWeight:'800', color:'white', cursor:'pointer', padding:'0 4px' },
  monthCenter:{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  monthName:  { fontSize:17, fontWeight:'700', color:'white' },
  monthYear:  { fontSize:12, color:'rgba(255,255,255,0.7)' },

  body:  { padding:'18px 16px 60px' },

  summCard: { background:'white', borderRadius:18, padding:'18px 16px 14px', marginBottom:14, boxShadow:'0 3px 16px rgba(99,102,241,0.1)', border:'1.5px solid rgba(99,102,241,0.08)' },
  summRow:  { display:'flex', alignItems:'center', marginBottom:14 },
  divider:  { width:1, height:40, background:'#e2e8f0', flexShrink:0 },
  track:    { height:10, borderRadius:6, background:'#e2e8f0', overflow:'hidden' },
  fill:     { height:'100%', borderRadius:6, transition:'width 0.6s ease' },

  insights: { background:'linear-gradient(135deg,#eef2ff,#f5f3ff)', border:'1.5px solid #c7d2fe', borderRadius:14, padding:'14px 16px', marginBottom:16, color:'#4338ca' },
  insLine:  { fontSize:13, lineHeight:'1.7', direction:'rtl' as const },

  secTitle: { fontSize:14, fontWeight:'700', color:'#64748b', marginBottom:10, letterSpacing:0.2 },
  empty:    { textAlign:'center', padding:'32px 20px', color:'#94a3b8', fontSize:15 },

  expCard:  { background:'white', borderRadius:14, padding:'13px 16px', marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 10px rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.07)' },
  expLeft:  { display:'flex', flexDirection:'column', gap:3, flex:1, textAlign:'right' },
  expDate:  { fontSize:11, color:'#94a3b8' },
  expDesc:  { fontSize:14, color:'#1e293b', fontWeight:'600' },
  expRight: { display:'flex', alignItems:'center', gap:8 },
  expAmt:   { fontSize:14, fontWeight:'800', color:'#6366f1', direction:'ltr' as const, whiteSpace:'nowrap' },
  delBtn:   { background:'none', border:'none', cursor:'pointer', fontSize:14, padding:3, opacity:0.4 },
};
