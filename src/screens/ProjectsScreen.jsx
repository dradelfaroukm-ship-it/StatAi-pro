import { useState } from 'react';
import { NavBar } from '../components/Common';
import { supabase } from '../lib/supabase';
import { IconPlus, IconMore, IconEdit, IconCopy, IconTrash, IconCheck, IconRefresh } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const PROJECT_META = [
  { id: 1, key: 'proj1', level: 'advanced', date: '2026-04-28', status: 'done' },
  { id: 2, key: 'proj2', level: 'medium',   date: '2026-04-22', status: 'running' },
  { id: 3, key: 'proj3', level: 'basic',    date: '2026-04-15', status: 'done' },
  { id: 4, key: 'proj4', level: 'medium',   date: '2026-04-10', status: 'draft' },
  { id: 5, key: 'proj5', level: 'advanced', date: '2026-03-30', status: 'done' },
  { id: 6, key: 'proj6', level: 'medium',   date: '2026-03-22', status: 'running' },
];

const LEVEL_DOT = { basic: 'var(--success)', medium: 'var(--info)', advanced: 'var(--accent)' };

const StatusChip = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'done') return (
    <span className="chip chip--success">
      <IconCheck size={11}/> {t.statusDone}
    </span>
  );
  if (status === 'running') return (
    <span className="chip chip--warning" style={{ gap: 5 }}>
      <IconRefresh size={11} style={{ animation: 'spin 1.8s linear infinite' }}/>
      {t.statusRunning}
    </span>
  );
  return <span className="chip chip--neutral">{t.statusDraft}</span>;
};

const LevelChip = ({ level }) => {
  const { t } = useLanguage();
  const label = { basic: t.levelBasic, medium: t.levelMedium, advanced: t.levelAdvanced };
  return (
    <span className={`chip chip--${level}`}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: LEVEL_DOT[level], display: 'inline-block', flexShrink: 0 }}/>
      {label[level]}
    </span>
  );
};

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px',
  cursor: 'pointer', borderRadius: 4, fontSize: 13,
};

const ProjectCard = ({ p, onOpen }) => {
  const { t } = useLanguage();
  const [menu, setMenu] = useState(false);
  return (
    <div className="card card--hover" style={{ padding: 18, position: 'relative', cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 className="h3" style={{ margin: 0, flex: 1, lineHeight: 1.55, fontWeight: 500 }}>{p.title}</h3>
        <button onClick={e => { e.stopPropagation(); setMenu(m => !m); }} aria-label="menu"
          style={{ background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 4, flexShrink: 0 }}>
          <IconMore size={16}/>
        </button>
        {menu && (
          <div style={{
            position: 'absolute', insetInlineEnd: 10, top: 40, zIndex: 5,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-input)', boxShadow: 'var(--shadow-lg)',
            minWidth: 148, padding: 4,
          }} onClick={e => e.stopPropagation()}>
            {[
              { icon: <IconEdit size={14}/>, label: t.menuEdit },
              { icon: <IconCopy size={14}/>, label: t.menuCopy },
              { icon: <IconTrash size={14}/>, label: t.menuDelete, danger: true },
            ].map(it => (
              <div key={it.label} style={{
                ...menuItemStyle,
                color: it.danger ? 'var(--error)' : 'var(--fg-secondary)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {it.icon} <span>{it.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        <LevelChip level={p.level}/>
        <StatusChip status={p.status}/>
      </div>

      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-muted)',
      }}>
        <span>{t.createdAt} <span className="num" style={{ color: 'var(--fg-secondary)' }}>{p.date}</span></span>
        <span style={{ color: 'var(--accent)', fontSize: 12 }}>{t.openProject}</span>
      </div>
    </div>
  );
};

export default function ProjectsScreen({ onNew, onOpen, onSignOut }) {
  const { t } = useLanguage();
  const projects = PROJECT_META.map(p => ({ ...p, title: t[p.key] }));
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <button type="button" onClick={async () => { await supabase.auth.signOut(); onSignOut?.(); }} style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>خروج</button>
      <NavBar onSignOut={onSignOut}/>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 32px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="h-display" style={{ margin: 0 }}>{t.myProjects}</h1>
            <div style={{ marginTop: 6, color: 'var(--fg-muted)', fontSize: 13 }}>{t.projectsSubtitle}</div>
          </div>
          <button className="btn btn--primary" onClick={onNew} style={{ marginTop: 4 }}>
            <IconPlus size={15}/> {t.newProject}
          </button>
        </div>
        <div className="grid-3">
          {projects.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen}/>)}
        </div>
      </main>
    </div>
  );
}
