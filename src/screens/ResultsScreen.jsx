import { useState } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconWord, IconPdf, IconCopy, IconCheck, IconX, IconSpark, IconArrowL } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const BarChart = () => {
  const data = [{ l:'1.0–2.0',v:8},{l:'2.0–2.5',v:32},{l:'2.5–3.0',v:78},{l:'3.0–3.5',v:142},{l:'3.5–4.0',v:90}];
  const max = Math.max(...data.map(d => d.v));
  const W=640, H=200, P=36;
  const bw = (W-P*2)/data.length - 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', direction:'ltr' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#4a42de" stopOpacity="0.6"/>
        </linearGradient>
      </defs>
      {[0,.25,.5,.75,1].map(t => (
        <line key={t} x1={P} x2={W-P} y1={H-P-t*(H-P*2)} y2={H-P-t*(H-P*2)} stroke="#1e2a45" strokeDasharray="3 5"/>
      ))}
      {data.map((d,i) => {
        const h=(d.v/max)*(H-P*2), x=P+i*((W-P*2)/data.length)+5, y=H-P-h;
        return (
          <g key={d.l}>
            <rect x={x} y={y} width={bw} height={h} rx="3" fill="url(#barGrad)"/>
            <text x={x+bw/2} y={y-7} textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#64748b">{d.v}</text>
            <text x={x+bw/2} y={H-12} textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#64748b">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
};

const ScatterChart = () => {
  const pts = Array.from({length:64},(_,i)=>{ const x=1+(i%16)*1.4+(Math.sin(i*1.7)*0.6), y=1.9+x*0.085+(Math.cos(i*2.3)*0.32); return {x,y:Math.min(4,Math.max(1.5,y))}; });
  const W=640,H=200,P=36, sx=v=>P+((v-0)/24)*(W-P*2), sy=v=>H-P-((v-1.5)/2.5)*(H-P*2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',direction:'ltr'}}>
      {[0,.25,.5,.75,1].map(t=>(
        <line key={t} x1={P} x2={W-P} y1={H-P-t*(H-P*2)} y2={H-P-t*(H-P*2)} stroke="#1e2a45" strokeDasharray="3 5"/>
      ))}
      {pts.map((p,i)=>(<circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill="#6c63ff" opacity="0.55"/>))}
      <line x1={sx(0)} y1={sy(1.9)} x2={sx(24)} y2={sy(3.94)} stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.7"/>
    </svg>
  );
};

const Commentary = ({ children }) => {
  const { t } = useLanguage();
  return (
    <div className="explain-box" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <IconSpark size={13} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
        <strong style={{ color: 'var(--accent)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.aiCommentary}</strong>
      </div>
      <div style={{ color: 'var(--fg-primary)', lineHeight: 1.75, fontSize: 13 }}>{children}</div>
    </div>
  );
};

const ResultsTable = ({ headers, rows }) => (
  <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden', marginTop: 8 }}>
    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:400 }}>
      <thead>
        <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
          {headers.map(h => (
            <th key={h} style={{ padding:'10px 14px', textAlign:'start', fontSize:11, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase', color:'var(--fg-muted)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i) => (
          <tr key={i} style={{ background: i%2 ? 'var(--bg-card)' : '#111827' }}>
            {r.map((c,j) => (
              <td key={j} style={{
                padding:'9px 14px', fontSize:13,
                textAlign: j===0 ? 'start' : 'center',
                color: j===0 ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                fontFamily: j===0 ? 'inherit' : 'var(--font-numeric)',
                borderTop:'1px solid var(--border-subtle)',
              }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Divider = () => <div style={{ height:1, background:'var(--border-subtle)', margin:'32px 0' }}/>;

export default function ResultsScreen({ onBack, onSignOut }) {
  const { t } = useLanguage();
  const [approved, setApproved] = useState(false);

  const descTable = [
    { v: t.rdVar1, n: 350, mean: 21.4,  sd: 1.83, min: 18,  max: 27  },
    { v: t.rdVar2, n: 350, mean: 8.62,  sd: 3.94, min: 0,   max: 24  },
    { v: t.rdVar3, n: 350, mean: 3.81,  sd: 0.71, min: 1,   max: 5   },
    { v: t.rdVar4, n: 350, mean: 3.12,  sd: 0.46, min: 1.8, max: 4.0 },
  ];

  const regressionTable = [
    { v: t.rrVarConst, b: 1.842, beta: '—',   t_: 8.93, p: '< 0.001' },
    { v: t.rrVar1,     b: 0.054, beta: 0.412, t_: 7.21, p: '< 0.001' },
    { v: t.rrVar2,     b: 0.218, beta: 0.298, t_: 5.18, p: '< 0.001' },
    { v: t.rrVar3,     b: 0.071, beta: 0.094, t_: 1.74, p: '0.082'   },
  ];

  const hypotheses = [
    { id: 1, text: t.hyp1Text, accepted: false },
    { id: 2, text: t.hyp2Text, accepted: true  },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar onSignOut={onSignOut}/>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 140px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div>
            <h1 className="h1">{t.resultsTitle}</h1>
            <div style={{ color:'var(--fg-muted)', marginTop:4, fontSize:13 }}>{t.resultsSubtitle}</div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button className="btn btn--secondary"><IconWord size={14}/> {t.exportWord}</button>
            <button className="btn btn--secondary"><IconPdf size={14}/> {t.exportPdf}</button>
            <button className="btn btn--secondary"><IconCopy size={14}/> {t.copyBtn}</button>
          </div>
        </div>

        <StepIndicator current={4} completed={[1,2,3]}/>

        <section>
          <h2 className="h2">{t.descStats}</h2>
          <ResultsTable
            headers={[t.thVariable, 'N', t.thMean, t.thSD, t.thMin, t.thMax]}
            rows={descTable.map(r=>[r.v, r.n, r.mean.toFixed(2), r.sd.toFixed(2), r.min, r.max])}/>
          <div style={{ marginTop:20 }}><BarChart/></div>
          <Commentary>{t.descCommentary}</Commentary>
        </section>

        <Divider/>

        <section>
          <h2 className="h2">{t.regression}</h2>
          <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
            <span className="chip chip--advanced"><span className="latin">R² = 0.387</span></span>
            <span className="chip chip--advanced"><span className="latin">F(3, 346) = 72.4</span></span>
            <span className="chip chip--success"><span className="latin">p &lt; 0.001</span></span>
          </div>
          <ResultsTable
            headers={[t.thVariable, 'B', 'β', 't', 'p']}
            rows={regressionTable.map(r=>[r.v, typeof r.b==='number'?r.b.toFixed(3):r.b, r.beta, r.t_, r.p])}/>
          <div style={{ marginTop:20 }}><ScatterChart/></div>
          <Commentary>{t.regCommentary}</Commentary>
        </section>

        <Divider/>

        <section>
          <h2 className="h2">{t.hypothesesSummary}</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:12 }}>
            {hypotheses.map(h => (
              <div key={h.id} className="card" style={{
                padding:16, display:'flex', alignItems:'center', gap:14,
                borderColor: h.accepted ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
              }}>
                <div style={{
                  width:34, height:34, borderRadius:'50%', flexShrink:0,
                  background: h.accepted ? 'var(--success-tint)' : 'var(--error-tint)',
                  color: h.accepted ? 'var(--success)' : 'var(--error)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{h.accepted ? <IconCheck size={16}/> : <IconX size={16}/>}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--fg-muted)', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                    {t.hypothesisLabel} <span className="num">{h.id}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--fg-primary)', lineHeight:1.6 }}>{h.text}</div>
                </div>
                <span className={`chip ${h.accepted ? 'chip--success' : 'chip--error'}`}>
                  {h.accepted ? t.accepted : t.rejected}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky approval bar */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'rgba(10,15,30,0.97)', backdropFilter:'blur(12px)',
        borderTop:'1px solid var(--border)', padding:'14px 24px', zIndex:20,
      }}>
        <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flex:1 }}>
            <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}
                   style={{ width:16, height:16, accentColor:'var(--accent)' }}/>
            <span style={{ fontSize:13, color:'var(--fg-secondary)' }}>{t.approveCheckbox}</span>
          </label>
          <button className="btn btn--secondary" onClick={onBack}>{t.backBtn}</button>
          <button className="btn btn--primary btn--lg" disabled={!approved}
                  style={{ opacity: approved ? 1 : 0.45, cursor: approved ? 'pointer' : 'not-allowed' }}>
            {t.confirmExport} <IconArrowL size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
}
