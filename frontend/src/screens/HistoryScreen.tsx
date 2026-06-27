import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../hooks/useExpenses';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency } from '../utils/formatCurrency';
import { getProgressColor } from '../utils/getProgressColor';
import { getBudgetPeriod, toYMD } from '../utils/getBudgetPeriod';
import { formatExpenseDate, getDaysElapsed, getTotalDays, HEBREW_MONTH_NAMES } from '../utils/dateHelpers';
import { CATEGORIES, getCategoryEmoji } from '../utils/categories';
import { Expense } from '../types';

function PieChart({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return null;

  const segments = CATEGORIES
    .map(cat => ({ ...cat, amount: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0) }))
    .filter(c => c.amount > 0);

  const cx = 90, cy = 90, r = 70, inner = 44;

  const centerLabel = (
    <>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">סה״כ</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="800">
        {formatCurrency(total).replace(' ₪', '')}₪
      </text>
    </>
  );

  if (segments.length === 1) {
    const seg = segments[0];
    return (
      <div style={p.wrap}>
        <div style={p.title}>🥧 פילוח קטגוריות</div>
        <div style={p.inner}>
          <svg width={180} height={180} viewBox="0 0 180 180">
            <circle cx={cx} cy={cy} r={r} fill={seg.color} />
            <circle cx={cx} cy={cy} r={inner} fill="white" />
            {centerLabel}
          </svg>
          <div style={p.legend}>
            <div style={p.legendRow}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
              <span style={p.legendLabel}>{seg.emoji} {seg.label}</span>
              <span style={{ ...p.legendAmt, color: seg.color }}>{formatCurrency(seg.amount)}</span>
              <span style={p.legendPct}>100%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const frac = seg.amount / total;
    const a0 = angle;
    angle += frac * 2 * Math.PI;
    const a1 = angle;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi0 = cx + inner * Math.cos(a0), yi0 = cy + inner * Math.sin(a0);
    const xi1 = cx + inner * Math.cos(a1), yi1 = cy + inner * Math.sin(a1);
    const lg = frac > 0.5 ? 1 : 0;
    return { ...seg, frac, d: `M ${x0} ${y0} A ${r} ${r} 0 ${lg} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${lg} 0 ${xi0} ${yi0} Z` };
  });

  return (
    <div style={p.wrap}>
      <div style={p.title}>🥧 פילוח קטגוריות</div>
      <div style={p.inner}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
          <circle cx={cx} cy={cy} r={inner} fill="white" />
          {centerLabel}
        </svg>

        <div style={p.legend}>
          {arcs.map((a, i) => (
            <div key={i} style={p.legendRow}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
              <span style={p.legendLabel}>{a.emoji} {a.label}</span>
              <span style={{ ...p.legendAmt, color: a.color }}>{formatCurrency(a.amount)}</span>
              <span style={p.legendPct}>{(a.frac * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const p: Record<string, React.CSSProperties> = {
  wrap:      { background: 'white', borderRadius: 18, padding: '16px', marginBottom: 14, boxShadow: '0 3px 16px rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.08)' },
  title:     { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12, textAlign: 'right' },
  inner:     { display: 'flex', alignItems: 'center', gap: 12 },
  legend:    { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  legendRow: { display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl' as const },
  legendLabel:{ fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1 },
  legendAmt: { fontSize: 12, fontWeight: '700', direction: 'ltr' as const, whiteSpace: 'nowrap' },
  legendPct: { fontSize: 11, color: '#94a3b8', minWidth: 30, textAlign: 'left' },
};

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const { settings } = useSettings();

  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date());
  const period   = getBudgetPeriod(settings.monthStartDay, viewDate);
  const startStr = toYMD(period.start);
  const endStr   = toYMD(period.end);

  const list       = expenses.filter(e => e.date >= startStr && e.date < endStr);
  const totalSpent = list.reduce((s, e) => s + e.amount, 0);
  const pct        = settings.monthlyBudget > 0 ? (totalSpent / settings.monthlyBudget) * 100 : 0;
  const barColor   = getProgressColor(pct);

  const isCurrent = toYMD(now) >= startStr && toYMD(now) < endStr;
  const days      = isCurrent ? getDaysElapsed(period, now) : getTotalDays(period);
  const dailyAvg  = days > 0 ? totalSpent / days : 0;
  const biggest   = list.reduce<typeof list[0] | null>((mx, e) => (!mx || e.amount > mx.amount ? e : mx), null);

  const prevM = () => { const d = new Date(period.start); d.setDate(d.getDate() - 1); setViewDate(d); };
  const nextM = () => setViewDate(new Date(period.end));
  const onDel = (id: string) => { if (window.confirm('למחוק את ההוצאה?')) deleteExpense(id); };

  const barGrad = barColor === '#10b981' ? 'linear-gradient(90deg,#059669,#34d399)'
                : barColor === '#f59e0b' ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                :                          'linear-gradient(90deg,#dc2626,#f87171)';

  const displayMonth = HEBREW_MONTH_NAMES[period.start.getMonth()];
  const displayYear  = period.start.getFullYear();

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.blob} />
        <button style={s.backBtn} onClick={() => navigate(-1)}>← חזרה</button>
        <h1 style={s.title}>📊 היסטוריה חודשית</h1>

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
        <div style={s.summCard}>
          <div style={s.summRow}>
            <Stat label="סה״כ הוצאות" value={formatCurrency(totalSpent)} color="#ef4444" />
            <div style={s.divider} />
            <Stat label="תקציב" value={formatCurrency(settings.monthlyBudget)} color="#6366f1" />
            <div style={s.divider} />
            <Stat label="ניצול" value={`${pct.toFixed(0)}%`} color={barColor} />
          </div>
          <div style={s.track}>
            <div style={{ ...s.fill, width: `${Math.min(pct, 100)}%`, background: barGrad }} />
          </div>
        </div>

        {list.length > 0 && (
          <div style={s.insights}>
            <div style={s.insLine}>💸 הוצאה הגדולה: <b>{biggest?.description || '—'}</b> ({formatCurrency(biggest?.amount ?? 0)})</div>
            <div style={s.insLine}>📅 ממוצע יומי: <b>{formatCurrency(dailyAvg)}</b></div>
          </div>
        )}

        <PieChart expenses={list} />

        <div style={s.secTitle}>כל ההוצאות ({list.length})</div>
        {list.length === 0
          ? <div style={s.empty}><div style={{ fontSize: 40, marginBottom: 8 }}>🗓️</div>אין הוצאות בחודש זה</div>
          : list.map(e => (
              <div key={e.id} style={s.expCard}>
                <div style={s.catDot}><span style={{ fontSize: 16 }}>{getCategoryEmoji(e.category)}</span></div>
                <div style={s.expLeft}>
                  <span style={s.expDate}>{formatExpenseDate(e.date, e.createdAt)}</span>
                  <span style={s.expDesc}>{e.description || '—'}</span>
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

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: '800', color, direction: 'ltr' as const }}>{value}</div>
    </div>
  );
}

const HDR = 'linear-gradient(150deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)';

const s: Record<string, React.CSSProperties> = {
  page:   { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f0f2ff' },
  header: { background: HDR, padding: '52px 20px 20px', borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(99,102,241,0.28)' },
  blob:   { position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', pointerEvents: 'none' },
  backBtn:{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', marginBottom: 14, padding: 0, position: 'relative', zIndex: 1 },
  title:  { fontSize: 22, fontWeight: '800', color: 'white', margin: '0 0 18px', position: 'relative', zIndex: 1 },

  monthNav:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.22)', borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 },
  arrow:      { background: 'none', border: 'none', fontSize: 24, fontWeight: '800', color: 'white', cursor: 'pointer', padding: '0 4px' },
  monthCenter:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  monthName:  { fontSize: 17, fontWeight: '700', color: 'white' },
  monthYear:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  body:  { padding: '18px 16px 60px' },

  summCard: { background: 'white', borderRadius: 18, padding: '18px 16px 14px', marginBottom: 14, boxShadow: '0 3px 16px rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.08)' },
  summRow:  { display: 'flex', alignItems: 'center', marginBottom: 14 },
  divider:  { width: 1, height: 40, background: '#e2e8f0', flexShrink: 0 },
  track:    { height: 10, borderRadius: 6, background: '#e2e8f0', overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 6, transition: 'width 0.6s ease' },

  insights: { background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1.5px solid #c7d2fe', borderRadius: 14, padding: '14px 16px', marginBottom: 14, color: '#4338ca' },
  insLine:  { fontSize: 13, lineHeight: '1.7', direction: 'rtl' as const },

  secTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, letterSpacing: 0.2 },
  empty:    { textAlign: 'center', padding: '32px 20px', color: '#94a3b8', fontSize: 15 },

  expCard:  { background: 'white', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 10px rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.07)' },
  catDot:   { flexShrink: 0, width: 32, height: 32, borderRadius: 9, background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  expLeft:  { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, textAlign: 'right' },
  expDate:  { fontSize: 11, color: '#94a3b8' },
  expDesc:  { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  expRight: { display: 'flex', alignItems: 'center', gap: 8 },
  expAmt:   { fontSize: 14, fontWeight: '800', color: '#6366f1', direction: 'ltr' as const, whiteSpace: 'nowrap' },
  delBtn:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 3, opacity: 0.4 },
};
