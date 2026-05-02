import { useState } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconWord, IconPdf, IconCopy, IconCheck, IconX, IconSpark, IconArrowL } from '../components/Icons';

const DESC_TABLE = [
  { v: 'العمر',                 n: 350, mean: 21.4,  sd: 1.83, min: 18,  max: 27 },
  { v: 'ساعات الاستخدام/أسبوع', n: 350, mean: 8.62,  sd: 3.94, min: 0,   max: 24 },
  { v: 'دوافع التعلم',           n: 350, mean: 3.81,  sd: 0.71, min: 1,   max: 5  },
  { v: 'المعدل التراكمي (GPA)', n: 350, mean: 3.12,  sd: 0.46, min: 1.8, max: 4.0 },
];

const REGRESSION_TABLE = [
  { v: '(الثابت)',         b: 1.842, beta: '—',    t: 8.93, p: '< 0.001' },
  { v: 'ساعات الاستخدام',  b: 0.054, beta: 0.412,  t: 7.21, p: '< 0.001' },
  { v: 'دوافع التعلم',     b: 0.218, beta: 0.298,  t: 5.18, p: '< 0.001' },
  { v: 'المستوى الأكاديمي', b: 0.071, beta: 0.094, t: 1.74, p: '0.082'   },
];

const HYPOTHESES = [
  { id: 1, text: 'توجد فروق دالة إحصائياً في المعدل التراكمي بين الذكور والإناث', accepted: false },
  { id: 2, text: 'يوجد أثر دال لساعات استخدام المنصة ودوافع التعلم على المعدل التراكمي', accepted: true },
];

const BarChart = () => {
  const data = [
    { l: '1.0–2.0', v: 8 },
    { l: '2.0–2.5', v: 32 },
    { l: '2.5–3.0', v: 78 },
    { l: '3.0–3.5', v: 142 },
    { l: '3.5–4.0', v: 90 },
  ];
  const max = Math.max(...data.map(d => d.v));
  const W = 640, H = 220, P = 36;
  const bw = (W - P * 2) / data.length - 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', direction: 'ltr' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={P} x2={W - P}
              y1={H - P - t * (H - P * 2)} y2={H - P - t * (H - P * 2)}
              stroke="#2d3654" strokeDasharray="3 4"/>
      ))}
      {data.map((d, i) => {
        const h = (d.v / max) * (H - P * 2);
        const x = P + i * ((W - P * 2) / data.length) + 4;
        const y = H - P - h;
        return (
          <g key={d.l}>
            <rect x={x} y={y} width={bw} height={h} rx="4" fill="url(#barGrad)"/>
            <text x={x + bw / 2} y={y - 8} textAnchor="middle" fontFamily="Inter" fontSize="11" fill="#b8c0d4">{d.v}</text>
            <text x={x + bw / 2} y={H - 14} textAnchor="middle" fontFamily="Inter" fontSize="11" fill="#7a8299">{d.l}</text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#9d6bff"/>
          <stop offset="100%" stopColor="#5b32d1"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

const ScatterChart = () => {
  const pts = Array.from({ length: 64 }, (_, i) => {
    const x = 1 + (i % 16) * 1.4 + (Math.sin(i * 1.7) * 0.6);
    const y = 1.9 + x * 0.085 + (Math.cos(i * 2.3) * 0.32);
    return { x, y: Math.min(4, Math.max(1.5, y)) };
  });
  const W = 640, H = 220, P = 36;
  const sx = v => P + ((v - 0) / 24) * (W - P * 2);
  const sy = v => H - P - ((v - 1.5) / 2.5) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', direction: 'ltr' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={P} x2={W - P}
              y1={H - P - t * (H - P * 2)} y2={H - P - t * (H - P * 2)}
              stroke="#2d3654" strokeDasharray="3 4"/>
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4" fill="#7c4dff" opacity="0.75"/>
      ))}
      <line x1={sx(0)} y1={sy(1.9)} x2={sx(24)} y2={sy(3.94)}
            stroke="#9d6bff" strokeWidth="2" strokeDasharray="6 5"/>
      <text x={W - P} y={H - 14} textAnchor="end" fontFamily="Inter" fontSize="11" fill="#7a8299">
        ساعات الاستخدام / أسبوع
      </text>
      <text x={P} y={20} fontFamily="Inter" fontSize="11" fill="#7a8299">GPA</text>
    </svg>
  );
};

const Commentary = ({ children }) => (
  <div className="explain-box" style={{ marginTop: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <IconSpark size={16} style={{ color: 'var(--accent)' }}/>
      <strong style={{ color: 'var(--accent)', fontSize: 13 }}>قراءة المساعد الذكي</strong>
    </div>
    <div style={{ color: 'var(--fg-primary)', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
  </div>
);

const ResultsTable = ({ headers, rows }) => (
  <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden', marginTop: 8 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
      <thead>
        <tr style={{ background: 'var(--accent)', color: '#fff' }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13.5, fontWeight: 700 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
            {r.map((c, j) => (
              <td key={j} style={{
                padding: '11px 16px', fontSize: 14,
                textAlign: j === 0 ? 'right' : 'center',
                color: 'var(--fg-primary)',
                fontFamily: j === 0 ? 'inherit' : 'var(--font-numeric)',
                borderTop: '1px solid var(--border-subtle)',
              }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SectionDivider = () => (
  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '40px 0' }}/>
);

export default function ResultsScreen({ onBack }) {
  const [approved, setApproved] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 160px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <h1 className="h1">نتائج التحليل</h1>
            <div style={{ color: 'var(--fg-secondary)', marginTop: 4 }}>
              أثر التعلم الإلكتروني على التحصيل الأكاديمي
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn--secondary"><IconWord size={16}/> تصدير <span className="latin">Word</span></button>
            <button className="btn btn--secondary"><IconPdf size={16}/> تصدير <span className="latin">PDF</span></button>
            <button className="btn btn--secondary"><IconCopy size={16}/> نسخ</button>
          </div>
        </div>

        <StepIndicator current={4} completed={[1, 2, 3]}/>

        {/* Section 1 — Descriptive */}
        <section>
          <h2 className="h2">الإحصاء الوصفي</h2>
          <ResultsTable
            headers={['المتغير', 'N', 'المتوسط', 'الانحراف', 'الأدنى', 'الأعلى']}
            rows={DESC_TABLE.map(r => [r.v, r.n, r.mean.toFixed(2), r.sd.toFixed(2), r.min, r.max])}
          />
          <div style={{ marginTop: 24 }}>
            <BarChart/>
          </div>
          <Commentary>
            متوسط المعدل التراكمي للعينة <span className="num">3.12</span> بانحراف <span className="num">0.46</span>،
            وهو ما يعكس تجانس نسبي. أكثر من <span className="num">66%</span> من الطلاب يقعون في الفئة{' '}
            <span className="num">3.0–4.0</span>، ما يدل على عينة ذات أداء أكاديمي مرتفع وقابلة للتحليل الاستدلالي.
          </Commentary>
        </section>

        <SectionDivider/>

        {/* Section 2 — Regression */}
        <section>
          <h2 className="h2">تحليل الانحدار المتعدد</h2>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="chip chip--advanced"><span className="latin">R² = 0.387</span></span>
            <span className="chip chip--advanced"><span className="latin">F(3, 346) = 72.4</span></span>
            <span className="chip chip--success"><span className="latin">p &lt; 0.001</span></span>
          </div>
          <ResultsTable
            headers={['المتغير', 'B', 'β', 't', 'p']}
            rows={REGRESSION_TABLE.map(r => [
              r.v,
              typeof r.b === 'number' ? r.b.toFixed(3) : r.b,
              r.beta,
              r.t,
              r.p
            ])}
          />
          <div style={{ marginTop: 24 }}>
            <ScatterChart/>
          </div>
          <Commentary>
            النموذج يفسّر <span className="num">38.7%</span> من تباين المعدل التراكمي، وهي قيمة مقبولة في البحوث التربوية.
            ساعات استخدام المنصة (<span className="latin">β = 0.412</span>) هي أقوى منبئ، يليها دوافع التعلم
            (<span className="latin">β = 0.298</span>). أثر المستوى الأكاديمي غير دال (<span className="latin">p = 0.082</span>).
          </Commentary>
        </section>

        <SectionDivider/>

        {/* Hypothesis summary */}
        <section>
          <h2 className="h2">ملخص الفروض</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {HYPOTHESES.map(h => (
              <div key={h.id} className="card" style={{
                padding: 18, display: 'flex', alignItems: 'center', gap: 16,
                borderColor: h.accepted ? 'rgba(102,187,106,0.35)' : 'rgba(239,83,80,0.35)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: h.accepted ? 'var(--success-tint)' : 'var(--error-tint)',
                  color: h.accepted ? 'var(--success)' : 'var(--error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {h.accepted ? <IconCheck size={20}/> : <IconX size={20}/>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 2 }}>
                    الفرض <span className="num">{h.id}</span>
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--fg-primary)' }}>{h.text}</div>
                </div>
                <span className={`chip ${h.accepted ? 'chip--success' : 'chip--error'}`}>
                  {h.accepted ? '✓ مقبول' : '✗ مرفوض'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky approval bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        padding: '16px 24px', zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', flex: 1,
          }}>
            <input
              type="checkbox"
              checked={approved}
              onChange={e => setApproved(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: '#7c4dff' }}
            />
            <span style={{ fontSize: 15, color: 'var(--fg-primary)' }}>
              راجعت النتائج وأوافق عليها
            </span>
          </label>
          <button className="btn btn--secondary" onClick={onBack}>رجوع</button>
          <button
            className="btn btn--primary btn--lg"
            disabled={!approved}
            style={{ opacity: approved ? 1 : 0.55, cursor: approved ? 'pointer' : 'not-allowed' }}>
            تأكيد وتصدير التقرير النهائي <IconArrowL size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}
