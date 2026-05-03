import { useState } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconCheck, IconEdit, IconTrash, IconBolt } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const TYPE_KEYS = ['typeNominal', 'typeOrdinal', 'typeQuantitative'];
const ROLE_KEYS = ['roleIndependent', 'roleDependent', 'roleMediator'];

const VarTypeChip = ({ typeKey }) => {
  const { t } = useLanguage();
  const cls = { typeNominal: 'chip--basic', typeOrdinal: 'chip--medium', typeQuantitative: 'chip--advanced' };
  return <span className={`chip ${cls[typeKey] || 'chip--neutral'}`}>{t[typeKey]}</span>;
};

const RoleChip = ({ roleKey }) => {
  const { t } = useLanguage();
  return (
    <span className="chip" style={{
      color: roleKey === 'roleDependent' ? 'var(--accent)' : 'var(--fg-muted)',
      background: roleKey === 'roleDependent' ? 'var(--accent-tint)' : 'var(--bg-hover)',
      borderColor: roleKey === 'roleDependent' ? 'rgba(108,99,255,0.3)' : 'var(--border)',
    }}>{t[roleKey]}</span>
  );
};

const iconBtnStyle = {
  background: 'transparent', border: '1px solid var(--border-subtle)',
  color: 'var(--fg-muted)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex',
};

const MethodCard = ({ m, idx }) => {
  const { t } = useLanguage();
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--accent-tint)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontFamily: 'var(--font-numeric)', fontSize: 13, flexShrink: 0,
          }}>{idx}</div>
          <div>
            <h3 className="h3" style={{ margin: 0, fontWeight: 600 }}>{m.name}</h3>
            <div style={{ marginTop: 5 }}><span className="chip chip--advanced">{m.hyp}</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={iconBtnStyle}><IconEdit size={14}/></button>
          <button style={iconBtnStyle}><IconTrash size={14}/></button>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { q: t.methodWhyQ,   a: m.why },
          { q: t.methodRelQ,   a: m.rel },
          { q: t.methodStatsQ, a: m.stats },
        ].map(b => (
          <div key={b.q} className="explain-box">
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{b.q}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.7 }}>{b.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const thStyle = { textAlign: 'start', padding: '11px 16px', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' };
const tdStyle = { textAlign: 'start', padding: '10px 16px', fontSize: 13, color: 'var(--fg-primary)', borderTop: '1px solid var(--border-subtle)' };

export default function PlanScreen({ onNext, onBack }) {
  const { t } = useLanguage();

  const [variables, setVariables] = useState(() => [
    { name: t.varGender,            typeKey: 'typeNominal',      roleKey: 'roleIndependent' },
    { name: t.varAcademicLevel,     typeKey: 'typeOrdinal',      roleKey: 'roleIndependent' },
    { name: t.varUsageHours,        typeKey: 'typeQuantitative', roleKey: 'roleIndependent' },
    { name: t.varLearningMotivation,typeKey: 'typeQuantitative', roleKey: 'roleIndependent' },
    { name: t.varGPA,               typeKey: 'typeQuantitative', roleKey: 'roleDependent'   },
  ]);

  const methods = [
    { name: t.m1Name, hyp: t.m1Hyp, why: t.m1Why, rel: t.m1Rel, stats: t.m1Stats },
    { name: t.m2Name, hyp: t.m2Hyp, why: t.m2Why, rel: t.m2Rel, stats: t.m2Stats },
    { name: t.m3Name, hyp: t.m3Hyp, why: t.m3Why, rel: t.m3Rel, stats: t.m3Stats },
  ];

  const [editingIdx, setEditingIdx] = useState(null);

  const updateVar = (idx, field, val) =>
    setVariables(vs => vs.map((v, i) => i === idx ? { ...v, [field]: val } : v));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 140px' }}>
        <h1 className="h1">{t.planTitle}</h1>
        <div style={{ color: 'var(--fg-muted)', marginTop: 4, fontSize: 13 }}>{t.planSubtitle}</div>

        <StepIndicator current={2} completed={[1]}/>

        <div className="banner banner--success" style={{ marginTop: 8 }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', background: 'rgba(16,185,129,0.18)',
            color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><IconCheck size={14}/></span>
          <div style={{ fontSize: 13 }}>
            <strong>{t.dataValid}</strong> — <span className="num">350</span> {t.rowsLabel}،{' '}
            <span className="num">12</span> {t.varNameCol}، {t.noMissingValues}.
          </div>
        </div>

        {/* Variables table */}
        <section style={{ marginTop: 28 }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>{t.variablesSection}</h2>
          <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, color: 'var(--fg-muted)' }}>{t.varNameCol}</th>
                  <th style={{ ...thStyle, color: 'var(--fg-muted)' }}>{t.varTypeCol}</th>
                  <th style={{ ...thStyle, color: 'var(--fg-muted)' }}>{t.varRoleCol}</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 64, color: 'var(--fg-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-card)' : '#111827' }}>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <input className="input" value={v.name} onChange={e => updateVar(i, 'name', e.target.value)} style={{ padding: '5px 8px', fontSize: 13 }}/>
                        : v.name}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <select className="input" value={v.typeKey} onChange={e => updateVar(i, 'typeKey', e.target.value)} style={{ padding: '5px 8px', fontSize: 13 }}>
                            {TYPE_KEYS.map(k => <option key={k} value={k}>{t[k]}</option>)}
                          </select>
                        : <VarTypeChip typeKey={v.typeKey}/>}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <select className="input" value={v.roleKey} onChange={e => updateVar(i, 'roleKey', e.target.value)} style={{ padding: '5px 8px', fontSize: 13 }}>
                            {ROLE_KEYS.map(k => <option key={k} value={k}>{t[k]}</option>)}
                          </select>
                        : <RoleChip roleKey={v.roleKey}/>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button style={iconBtnStyle} onClick={() => setEditingIdx(editingIdx === i ? null : i)}>
                        {editingIdx === i ? <IconCheck size={14}/> : <IconEdit size={14}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Methods */}
        <section style={{ marginTop: 28 }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>{t.methodsSection}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {methods.map((m, i) => <MethodCard key={i} m={m} idx={i + 1}/>)}
          </div>
        </section>
      </main>

      {/* Sticky payment footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)', zIndex: 20,
      }}>
        <div style={{
          background: 'rgba(108,99,255,0.08)',
          borderBottom: '1px solid rgba(108,99,255,0.18)',
          padding: '7px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12,
        }}>
          <span style={{
            background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '2px 7px', borderRadius: 'var(--r-pill)', letterSpacing: '0.06em', fontFamily: 'var(--font-latin)',
          }}>BETA</span>
          <span style={{ color: 'var(--fg-muted)' }}>{t.betaBanner}</span>
          <span className="num" style={{ color: 'var(--fg-secondary)', fontWeight: 600 }}>$100.00</span>
        </div>

        <div style={{ padding: '12px 24px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.detectedLevel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }}/>
                  <strong style={{ fontSize: 14 }}>{t.levelMediumLabel}</strong>
                </div>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--border)' }}/>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.priceAfterBeta}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-disabled)', textDecoration: 'line-through' }}>$100.00</span>
                  <span className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)' }}>$0.00</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn--secondary" onClick={onBack}>{t.editPlanBtn}</button>
              <button className="btn btn--secondary" disabled style={{ opacity: 0.35, cursor: 'not-allowed' }}>
                {t.payBtn} <span className="num">$100.00</span>
              </button>
              <button className="btn btn--primary btn--lg" onClick={onNext} style={{ gap: 8 }}>
                <IconBolt size={15}/>
                {t.useFreeBtn}
                <span style={{
                  background: 'rgba(255,255,255,0.18)', fontSize: 10, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 'var(--r-pill)',
                  fontFamily: 'var(--font-latin)', letterSpacing: '0.06em',
                }}>BETA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
