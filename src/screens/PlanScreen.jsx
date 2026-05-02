import { useState } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconCheck, IconEdit, IconTrash } from '../components/Icons';

const INITIAL_VARIABLES = [
  { name: 'الجنس',                 type: 'اسمي',   role: 'مستقل' },
  { name: 'المستوى الأكاديمي',      type: 'ترتيبي', role: 'مستقل' },
  { name: 'ساعات استخدام المنصة',   type: 'كمي',    role: 'مستقل' },
  { name: 'دوافع التعلم',          type: 'كمي',    role: 'مستقل' },
  { name: 'المعدل التراكمي (GPA)', type: 'كمي',    role: 'تابع' },
];

const METHODS = [
  {
    name: 'الإحصاء الوصفي',
    hyp: 'استكشافي',
    why: 'لازم نبدأ بفهم شكل البيانات: المتوسطات، الانحرافات المعيارية، التوزيعات. ده أساس أي تحليل لاحق.',
    rel: 'يغطي كل المتغيرات الكمية الخمسة في الدراسة، خاصة المعدل التراكمي وساعات الاستخدام.',
    stats: 'المتوسط الحسابي، الوسيط، الانحراف المعياري، الالتواء والتفلطح.',
  },
  {
    name: 'اختبار T للعينات المستقلة',
    hyp: 'الفرض الأول',
    why: 'الفرض الأول بيقارن متوسطين فقط (ذكور / إناث) في متغير كمي (المعدل التراكمي). T-test هو الاختيار الصح لما المتغير المستقل فئتين والتابع كمي.',
    rel: 'الجنس متغير اسمي ثنائي → مستقل. GPA كمي → تابع.',
    stats: 'قيمة t، درجات الحرية، مستوى الدلالة (p-value)، حجم الأثر (Cohen\'s d).',
  },
  {
    name: 'تحليل الانحدار المتعدد',
    hyp: 'الفرض الثاني',
    why: 'الفرض بيتكلم عن تأثير عدة متغيرات (ساعات الاستخدام، دوافع التعلم، المستوى الأكاديمي) على المعدل التراكمي. الانحدار المتعدد بيقيس مساهمة كل متغير مع تثبيت الباقي.',
    rel: 'ثلاث متغيرات مستقلة (كمي + ترتيبي) → معدل تراكمي (كمي تابع).',
    stats: 'معامل التحديد R²، معاملات بيتا β، قيمة F، اختبار VIF لتعدد الخطية.',
  },
];

const TYPE_OPTIONS = ['اسمي', 'ترتيبي', 'كمي'];
const ROLE_OPTIONS = ['مستقل', 'تابع', 'وسيط'];

const VarTypeChip = ({ type }) => {
  const map = { 'اسمي': 'chip--basic', 'ترتيبي': 'chip--medium', 'كمي': 'chip--advanced' };
  return <span className={`chip ${map[type] || 'chip--neutral'}`}>{type}</span>;
};

const RoleChip = ({ role }) => (
  <span className="chip" style={{
    color: role === 'تابع' ? 'var(--accent)' : 'var(--fg-secondary)',
    background: role === 'تابع' ? 'var(--accent-tint)' : 'var(--bg-hover)',
    borderColor: role === 'تابع' ? 'rgba(124,77,255,0.4)' : 'var(--border)',
  }}>{role}</span>
);

const iconBtnStyle = {
  background: 'transparent', border: '1px solid var(--border-subtle)',
  color: 'var(--fg-muted)', cursor: 'pointer', padding: 8,
  borderRadius: 8, display: 'flex',
};

const MethodCard = ({ m, idx }) => (
  <div className="card" style={{ padding: 24, position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent-tint)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontFamily: 'var(--font-numeric)', fontSize: 15, flexShrink: 0,
        }}>{idx}</div>
        <div>
          <h3 className="h3" style={{ margin: 0 }}>{m.name}</h3>
          <div style={{ marginTop: 6 }}>
            <span className="chip chip--advanced">{m.hyp}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button aria-label="تعديل" style={iconBtnStyle}><IconEdit size={16}/></button>
        <button aria-label="حذف"   style={iconBtnStyle}><IconTrash size={16}/></button>
      </div>
    </div>

    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { q: 'ليه اتختار الأسلوب ده؟', a: m.why },
        { q: 'علاقته بالمتغيرات؟',     a: m.rel },
        { q: 'المعاملات الإحصائية؟',    a: m.stats },
      ].map(b => (
        <div key={b.q} className="explain-box">
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
            {b.q}
          </div>
          <div style={{ fontSize: 14.5, color: 'var(--fg-primary)', lineHeight: 1.7 }}>
            {b.a}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const thStyle = {
  textAlign: 'right', padding: '14px 18px',
  fontSize: 14, fontWeight: 700,
};
const tdStyle = {
  textAlign: 'right', padding: '12px 18px',
  fontSize: 14.5, color: 'var(--fg-primary)',
  borderTop: '1px solid var(--border-subtle)',
};

export default function PlanScreen({ onNext, onBack }) {
  const [variables, setVariables] = useState(INITIAL_VARIABLES);
  const [editingIdx, setEditingIdx] = useState(null);

  const updateVar = (idx, field, val) => {
    setVariables(vs => vs.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 24px 140px' }}>
        <h1 className="h1">الخطة الإحصائية المقترحة</h1>
        <div style={{ color: 'var(--fg-secondary)', marginTop: 4 }}>
          راجع الخطة وعدّل عليها قبل التحليل
        </div>

        <StepIndicator current={2} completed={[1]}/>

        {/* Quality banner */}
        <div className="banner banner--success" style={{ marginTop: 8 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(102,187,106,0.25)', color: 'var(--success)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><IconCheck size={16}/></span>
          <div>
            <strong>البيانات سليمة</strong> — <span className="num">350</span> مفردة،{' '}
            <span className="num">12</span> متغير، لا توجد قيم مفقودة.
          </div>
        </div>

        {/* Variables table */}
        <section style={{ marginTop: 32 }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>المتغيرات</h2>
          <div className="card table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--accent)', color: '#fff' }}>
                  <th style={thStyle}>اسم المتغير</th>
                  <th style={thStyle}>النوع</th>
                  <th style={thStyle}>الدور</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 80 }}>تعديل</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg-card)' : 'var(--bg-secondary)' }}>
                    <td style={tdStyle}>
                      {editingIdx === i ? (
                        <input
                          className="input"
                          value={v.name}
                          onChange={e => updateVar(i, 'name', e.target.value)}
                          style={{ padding: '6px 10px', fontSize: 14 }}
                        />
                      ) : v.name}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i ? (
                        <select
                          className="input"
                          value={v.type}
                          onChange={e => updateVar(i, 'type', e.target.value)}
                          style={{ padding: '6px 10px', fontSize: 14 }}>
                          {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      ) : <VarTypeChip type={v.type}/>}
                    </td>
                    <td style={tdStyle}>
                      {editingIdx === i ? (
                        <select
                          className="input"
                          value={v.role}
                          onChange={e => updateVar(i, 'role', e.target.value)}
                          style={{ padding: '6px 10px', fontSize: 14 }}>
                          {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                      ) : <RoleChip role={v.role}/>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        style={iconBtnStyle}
                        onClick={() => setEditingIdx(editingIdx === i ? null : i)}
                        aria-label="تعديل">
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
          <h2 className="h2" style={{ marginBottom: 12 }}>الأساليب الإحصائية</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {METHODS.map((m, i) => <MethodCard key={m.name} m={m} idx={i + 1}/>)}
          </div>
        </section>
      </main>

      {/* Sticky footer bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(17,24,39,0.92)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        padding: '16px 24px', zIndex: 20,
      }}>
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 2 }}>المستوى المُكتشف</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--info)', display: 'inline-block' }}/>
                <strong style={{ fontSize: 16 }}>متوسط</strong>
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }}/>
            <div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 2 }}>تكلفة التحليل</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--fg-primary)' }}>$100.00</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn--secondary" onClick={onBack}>تعديل الخطة</button>
            <button className="btn btn--primary btn--lg" onClick={onNext}>
              <IconCheck size={18}/> موافق — ادفع وابدأ التحليل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
