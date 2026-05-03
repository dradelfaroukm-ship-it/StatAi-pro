import { useState } from 'react';
import { NavBar } from '../components/Common';
import { IconPlus, IconMore, IconEdit, IconCopy, IconTrash, IconCheck } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const SAMPLE_PROJECTS = [
  { id: 1, title: 'أثر استخدام التعلم الإلكتروني على التحصيل الأكاديمي', level: 'advanced', date: '2026-04-28', status: 'done' },
  { id: 2, title: 'العلاقة بين ساعات النوم والأداء الدراسي لدى طلاب الجامعة', level: 'medium', date: '2026-04-22', status: 'running' },
  { id: 3, title: 'تحليل وصفي لمستويات القلق الاختباري', level: 'basic', date: '2026-04-15', status: 'done' },
  { id: 4, title: 'الفروق بين الجنسين في الذكاء العاطفي', level: 'medium', date: '2026-04-10', status: 'draft' },
  { id: 5, title: 'نمذجة المعادلات الهيكلية لدوافع الإنجاز', level: 'advanced', date: '2026-03-30', status: 'done' },
  { id: 6, title: 'مقارنة طرق التدريس الثلاث على نتائج الرياضيات', level: 'medium', date: '2026-03-22', status: 'running' },
];

const LEVEL_DOT = { basic: 'var(--success)', medium: 'var(--info)', advanced: 'var(--accent)' };

const StatusChip = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'done')    return <span className="chip chip--success"><IconCheck size={12}/> {t.statusDone}</span>;
  if (status === 'running') return <span className="chip chip--warning"><span style={{ display: 'inline-block', animation: 'spin 1.4s linear infinite' }}>⟳</span> {t.statusRunning}</span>;
  return <span className="chip chip--neutral">{t.statusDraft}</span>;
};

const LevelChip = ({ level }) => {
  const { t } = useLanguage();
  const label = { basic: t.levelBasic, medium: t.levelMedium, advanced: t.levelAdvanced };
  return (
    <span className={`chip chip--${level}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: LEVEL_DOT[level], display: 'inline-block' }}/>
      {label[level]}
    </span>
  );
};

const ProjectCard = ({ p, onOpen }) => {
  const { t } = useLanguage();
  const [menu, setMenu] = useState(false);
  return (
    <div className="card card--hover" style={{ padding: 20, position: 'relative', cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 className="h3" style={{ margin: 0, flex: 1, fontSize: 18, lineHeight: 1.4 }}>{p.title}</h3>
        <button onClick={e => { e.stopPropagation(); setMenu(m => !m); }} aria-label="menu"
          style={{ background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 6 }}>
          <IconMore/>
        </button>
        {menu && (
          <div style={{
            position: 'absolute', insetInlineEnd: 12, top: 44, zIndex: 5,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-input)', boxShadow: 'var(--shadow-lg)',
            minWidth: 160, padding: 4,
          }} onClick={e => e.stopPropagation()}>
            {[
              { icon: <IconEdit size={16}/>, label: t.menuEdit },
              { icon: <IconCopy size={16}/>, label: t.menuCopy },
              { icon: <IconTrash size={16}/>, label: t.menuDelete, danger: true },
            ].map(it => (
              <div key={it.label} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                cursor: 'pointer', borderRadius: 6,
                color: it.danger ? 'var(--error)' : 'var(--fg-secondary)', fontSize: 14,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {it.icon} <span>{it.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <LevelChip level={p.level}/>
        <StatusChip status={p.status}/>
      </div>

      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-muted)',
      }}>
        <span>{t.createdAt} <span className="num" style={{ color: 'var(--fg-secondary)' }}>{p.date}</span></span>
        <span>{t.openProject}</span>
      </div>
    </div>
  );
};

export default function ProjectsScreen({ onNew, onOpen }) {
  const { t } = useLanguage();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="h-display" style={{ fontSize: 36, margin: 0 }}>{t.myProjects}</h1>
            <div style={{ marginTop: 6, color: 'var(--fg-secondary)', fontSize: 16 }}>{t.projectsSubtitle}</div>
          </div>
          <button className="btn btn--primary btn--lg" onClick={onNew}>
            <IconPlus/> {t.newProject}
          </button>
        </div>
        <div className="grid-3">
          {SAMPLE_PROJECTS.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen}/>)}
        </div>
      </main>
    </div>
  );
}
