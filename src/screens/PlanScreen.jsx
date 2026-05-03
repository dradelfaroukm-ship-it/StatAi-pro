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
    why: 'لازم نبدأ بفهم شكل البيانات: المتوسطات، الانحرافات المعيارية، التوزيعات. ده أساس أي تحليل لاحق.',
    rel: 'يغطي كل المتغيرات الكمية الخمسة في الدراسة، خاصة المعدل التراكمي وساعات الاستخدام.',
    stats: 'المتوسط الحسابي، الوسيط، الانحراف المعياري، الالتواء والتفلطح.',
  },
  {
    name: 'اختبار T للعينات المستقلة', hyp: 'الفرض الأول',
    why: 'الفرض الأول بيقارن متوسطين فقط (ذكور / إناث) في متغير كمي (المعدل التراكمي). T-test هو الاختيار الصح.',
    rel: 'الجنس متغير اسمي ثنائي → مستقل. GPA كمي → تابع.',
    stats: 'قيمة t، درجات الحرية، مستوى الدلالة (p-value)، حجم الأثر (Cohen\'s d).',
  },
  {
    name: 'تحليل الانحدار المتعدد', hyp: 'الفرض الثاني',
    why: 'الفرض بيتكلم عن تأثير عدة متغيرات على المعدل التراكمي. الانحدار المتعدد بيقيس مساهمة كل متغير مع تثبيت الباقي.',
    rel: 'ثلاث متغيرات مستقلة (كمي + ترتيبي) → معدل تراكمي (كمي تابع).',
    stats: 'معامل التحديد R²، معاملات بيتا β، قيمة F، اختبار VIF لتعدد الخطية.',
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
      color: roleKey === 'roleDependent' ? 'var(--accent)' : 'var(--fg-secondary)',
      background: roleKey === 'roleDependent' ? 'var(--accent-tint)' : 'var(--bg-hover)',
      borderColor: roleKey === 'roleDependent' ? 'rgba(124,77,255,0.4)' : 'var(--border)',
    }}>{t[roleKey]}</span>
  );
};

const iconBtnStyle = {
  background: 'transparent', border: '1px solid var(--border-subtle)',
  color: 'var(--fg-muted)', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex',
};

const MethodCard = ({ m, idx }) => (
  <div className="card" style={{ padding: 24 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--accent-tint)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontFamily: 'var(--font-numeric)', fontSize: 15, flexShrink: 0,
        }}>{idx}</div>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>{m.name}</h3>
          <div style={{ marginTop: 6 }}><span className="chip chip--advanced">{m.hyp}</span></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button style={iconBtnStyle}><IconEdit size={16}/></button>
        <button style={iconBtnStyle}><IconTrash size={16}/></button>
      </div>
    </div>
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { q: 'ليه اتختار الأسلوب ده؟', a: m.why },
        { q: 'علاقته بالمتغيرات؟',     a: m.rel },
        { q: 'المعاملات الإحصائية؟',    a: m.stats },
      ].map(b => (
        <div key={b.q} className="explain-box">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{b.q}</div>
          <div style={{ fontSize: 14.5, color: 'var(--fg-primary)', lineHeight: 1.7 }}>{b.a}</div>
        </div>
      ))}
    </div>
  </div>
);

const thStyle = { textAlign: 'start', padding: '14px 18px', fontSize: 14, fontWeight: 700 };
const tdStyle = { textAlign: 'start', padding: '12px 18px', fontSize: 14.5, color: 'var(--fg-primary)', borderTop: '1px solid var(--border-subtle)' };

export default function PlanScreen({ onNext, onBack }) {
  const { t } = useLanguage();
  const [variables, setVariables] = useState(INITIAL_VARIABLES);
  const [editingIdx, setEditingIdx] = useState(null);

  const updateVar = (idx, field, val) =>
    setVariables(vs => vs.map((v, i) => i === idx ? { ...v, [field]: val } : v));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 140px' }}>
        <h1 className="h1">{t.planTitle}</h1>
        <div style={{ color: 'var(--fg-secondary)', marginTop: 4 }}>{t.planSubtitle}</div>

        <StepIndicator current={2} completed={[1]}/>

        <div className="banner banner--success" style={{ marginTop: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%', background: 'rgba(102,187,106,0.25)',
            color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><IconCheck size={16}/></span>
          <div>
            <strong>{t.dataValid}</strong> — <span className="num">350</span> {t.rowsLabel || 'مفردة'}،{' '}
            <span className="num">12</span> {t.varNameCol || 'متغير'}، لا توجد قيم مفقودة.
          </div>
        </div>

        {/* Variables table */}
        <section style={{ marginTop: 32 }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>{t.variablesSection}</h2>
          <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--accent)', color: '#fff' }}>
                  <th style={thStyle}>{t.varNameCol}</th>
                  <th style={thStyle}>{t.varTypeCol}</th>
                  <th style={thStyle}>{t.varRoleCol}</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>{t.varRoleCol && '✎'}</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <input className="input" value={v.nameAr} onChange={e => updateVar(i, 'nameAr', e.target.value)} style={{ padding: '6px 10px', fontSize: 14 }}/>
                        : v.nameAr}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <select className="input" value={v.typeKey} onChange={e => updateVar(i, 'typeKey', e.target.value)} style={{ padding: '6px 10px', fontSize: 14 }}>
                            {TYPE_KEYS.map(k => <option key={k} value={k}>{t[k]}</option>)}
                          </select>
                        : <VarTypeChip typeKey={v.typeKey}/>}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i
                        ? <select className="input" value={v.roleKey} onChange={e => updateVar(i, 'roleKey', e.target.value)} style={{ padding: '6px 10px', fontSize: 14 }}>
                            {ROLE_KEYS.map(k => <option key={k} value={k}>{t[k]}</option>)}
                          </select>
                        : <RoleChip roleKey={v.roleKey}/>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button style={iconBtnStyle} onClick={() => setEditingIdx(editingIdx === i ? null : i)}>
                        {editingIdx === i ? <IconCheck size={16}/> : <IconEdit size={16}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Methods */}
        <section style={{ marginTop: 32 }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>{t.methodsSection}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {METHODS.map((m, i) => <MethodCard key={m.name} m={m} idx={i + 1}/>)}
          </div>
        </section>
      </main>

      {/* Sticky payment footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)', zIndex: 20,
      }}>
        {/* Beta banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(124,77,255,0.18) 0%, rgba(78,161,255,0.12) 100%)',
          borderBottom: '1px solid rgba(124,77,255,0.25)',
          padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13,
        }}>
          <span style={{
            background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 'var(--r-pill)', letterSpacing: '0.04em', fontFamily: 'var(--font-latin)',
          }}>BETA</span>
          <span style={{ color: 'var(--fg-secondary)' }}>{t.betaBanner}</span>
          <span className="num" style={{ color: 'var(--fg-primary)', fontWeight: 700 }}>$100.00</span>
        </div>

        <div style={{ padding: '14px 24px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 2 }}>{t.detectedLevel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }}/>
                  <strong style={{ fontSize: 16 }}>{t.levelMediumLabel}</strong>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: 'var(--border)' }}/>
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 2 }}>{t.priceAfterBeta}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--fg-disabled)', textDecoration: 'line-through' }}>$100.00</span>
                  <span className="num" style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>$0.00</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn--secondary" onClick={onBack} style={{ fontSize: 14 }}>{t.editPlanBtn}</button>
              <button className="btn btn--secondary" disabled style={{ fontSize: 14, opacity: 0.45, cursor: 'not-allowed' }}>
                {t.payBtn} <span className="num">$100.00</span>
              </button>
              <button className="btn btn--primary btn--lg" onClick={onNext} style={{
                background: 'linear-gradient(135deg, #7c4dff 0%, #4ea1ff 100%)',
                boxShadow: '0 4px 20px rgba(124,77,255,0.4)', gap: 10,
              }}>
                <IconBolt size={18}/>
                {t.useFreeBtn}
                <span style={{
                  background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 'var(--r-pill)',
                  fontFamily: 'var(--font-latin)', letterSpacing: '0.04em',
                }}>BETA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
