import { useState } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconCheck, IconEdit, IconTrash, IconBolt } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_VARIABLES = [
  { nameAr: 'الجنس',                 typeKey: 'typeNominal',       roleKey: 'roleIndependent' },
  { nameAr: 'المستوى الأكاديمي',      typeKey: 'typeOrdinal',       roleKey: 'roleIndependent' },
  { nameAr: 'ساعات استخدام المنصة',   typeKey: 'typeQuantitative',  roleKey: 'roleIndependent' },
  { nameAr: 'دوافع التعلم',           typeKey: 'typeQuantitative',  roleKey: 'roleIndependent' },
  { nameAr: 'المعدل التراكمي (GPA)',  typeKey: 'typeQuantitative',  roleKey: 'roleDependent'   },
];

const METHODS = [
  {
    name: 'الإحصاء الوصفي', hyp: 'استكشافي',
    why: 'ينبغي البدء بفهم طبيعة البيانات من خلال المتوسطات الحسابية والانحرافات المعيارية والتوزيعات، إذ يُشكّل ذلك الأساس المنهجي لأي تحليل استدلالي لاحق.',
    rel: 'يشمل جميع المتغيرات الكمية في الدراسة، ولا سيما المعدل التراكمي وساعات استخدام المنصة.',
    stats: 'المتوسط الحسابي، الوسيط، الانحراف المعياري، معاملا الالتواء والتفلطح.',
  },
  {
    name: 'اختبار T للعينات المستقلة', hyp: 'الفرض الأول',
    why: 'يقارن الفرض الأول متوسطَين مستقلَّين (الذكور والإناث) في متغير كمي (المعدل التراكمي)، وهو ما يجعل اختبار T للعينات المستقلة الأسلوب الإحصائي الأنسب منهجياً.',
    rel: 'الجنس متغير اسمي ثنائي → مستقل. GPA كمي → تابع.',
    stats: 'قيمة t، درجات الحرية، مستوى الدلالة الإحصائية (p-value)، حجم الأثر (Cohen\'s d).',
  },
  {
    name: 'تحليل الانحدار المتعدد', hyp: 'الفرض الثاني',
    why: 'يتناول الفرض تأثير متغيرات مستقلة متعددة في المعدل التراكمي، ويقيس تحليل الانحدار المتعدد إسهام كل متغير بمعزل عن الآخرين مع تثبيت تأثيرها.',
    rel: 'ثلاثة متغيرات مستقلة (كمية وترتيبية) → المعدل التراكمي (متغير تابع كمي).',
    stats: 'معامل التحديد R²، معاملات بيتا المعيارية β، قيمة F، اختبار VIF للكشف عن تعدد الخطية.',
  },
];

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

const MethodCard = ({ m, idx }) => (
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
        { q: 'لماذا اختُير هذا الأسلوب؟',            a: m.why },
        { q: 'ما علاقته بالمتغيرات؟',                a: m.rel },
        { q: 'ما المعاملات الإحصائية المستخدمة؟',     a: m.stats },
      ].map(b => (
        <div key={b.q} className="explain-box">
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{b.q}</div>
          <div style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.7 }}>{b.a}</div>
        </div>
      ))}
    </div>
  </div>
);

const thStyle = { textAlign: 'start', padding: '11px 16px', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' };
const tdStyle = { textAlign: 'start', padding: '10px 16px', fontSize: 13, color: 'var(--fg-primary)', borderTop: '1px solid var(--border-subtle)' };

export default function PlanScreen({ onNext, onBack }) {
  const { t } = useLanguage();
  const [variables, setVariables] = useState(INITIAL_VARIABLES);
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
            <strong>{t.dataValid}</strong> — <span className="num">350</span> {t.rowsLabel || 'مفردة'}،{' '}
            <span className="num">12</span> {t.varNameCol || 'متغير'}، لا توجد قيم مفقودة.
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
                        ? <input className="input" value={v.nameAr} onChange={e => updateVar(i, 'nameAr', e.target.value)} style={{ padding: '5px 8px', fontSize: 13 }}/>
                        : v.nameAr}
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
            {METHODS.map((m, i) => <MethodCard key={m.name} m={m} idx={i + 1}/>)}
          </div>
        </section>
      </main>

      {/* Sticky payment footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)', zIndex: 20,
      }}>
        {/* Beta banner */}
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
