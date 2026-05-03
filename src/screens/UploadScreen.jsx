import { useState, useRef } from 'react';
import { NavBar, StepIndicator } from '../components/Common';
import { IconArrowR, IconArrowL, IconUpload, IconFile, IconCheck, IconX } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

const FORMATS = ['CSV', 'Excel', 'SPSS', 'JSON'];

export default function UploadScreen({ onNext, onBack }) {
  const { t } = useLanguage();
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState('أثر التعلم الإلكتروني على التحصيل الأكاديمي لدى طلاب الجامعة');
  const [hyp, setHyp] = useState('1. توجد فروق دالة إحصائياً في التحصيل بين مستخدمي المنصة وغيرهم.\n2. توجد علاقة ارتباطية بين عدد ساعات الاستخدام والمعدل التراكمي.');
  const [goals, setGoals] = useState('الكشف عن أثر استخدام منصات التعلم الإلكتروني على متوسط درجات الطلاب في مقررات السنة الثانية.');
  const fileInput = useRef(null);

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length > 0) setUploaded(true); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <NavBar/>
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '24px 24px 64px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: 'var(--fg-muted)',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          gap: 6, fontSize: 14, padding: 0, marginBottom: 12, fontFamily: 'inherit',
        }}>
          <IconArrowR size={16}/> {t.backToProjects}
        </button>

        <h1 className="h1">{t.newProjectTitle}</h1>
        <StepIndicator current={1} completed={[]}/>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploaded && fileInput.current?.click()}
          style={{
            marginTop: 24,
            background: dragging ? 'var(--accent-tint-2)' : 'var(--bg-card)',
            border: `2px dashed ${dragging ? 'var(--accent)' : uploaded ? 'transparent' : 'var(--accent)'}`,
            borderRadius: 'var(--r-card)',
            padding: '40px 24px', textAlign: 'center',
            transition: 'all 200ms var(--ease-out)',
            cursor: uploaded ? 'default' : 'pointer',
          }}>
          <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls,.sav,.json"
                 style={{ display: 'none' }} onChange={e => { if (e.target.files.length > 0) setUploaded(true); }}/>

          {!uploaded ? (
            <>
              <div style={{
                width: 64, height: 64, margin: '0 auto 16px', borderRadius: 'var(--r-card)',
                background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
              }}><IconUpload size={32}/></div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-primary)' }}>{t.dragHere}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {FORMATS.map(f => <span key={f} className="chip chip--advanced">{f}</span>)}
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--fg-muted)' }}>
                {t.maxSize} <span className="num">50MB</span>
              </div>
              <button className="btn btn--secondary" style={{ marginTop: 18 }}
                      onClick={e => { e.stopPropagation(); fileInput.current?.click(); }}>
                {t.chooseFile}
              </button>
            </>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'var(--bg-input)', border: '1px solid rgba(102,187,106,0.4)',
              borderRadius: 'var(--r-input)', padding: '14px 18px', textAlign: 'start',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: 'var(--success-tint)',
                color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}><IconFile size={22}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--fg-primary)', fontSize: 15 }}>
                  <span className="latin">student_data_2026.csv</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
                  <span className="num">2.4 MB</span> · <span className="num">350</span> {t.rowsLabel} · <span className="num">12</span> {t.colsLabel}
                </div>
              </div>
              <span className="chip chip--success"><IconCheck size={12}/> {t.fileUploaded}</span>
              <button onClick={() => setUploaded(false)} aria-label="remove"
                style={{ background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <IconX/>
              </button>
            </div>
          )}
        </div>

        {/* Optional info */}
        <section style={{ marginTop: 32 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t.additionalInfo}</h2>
          <div style={{ color: 'var(--fg-muted)', fontSize: 14, marginBottom: 18 }}>{t.additionalInfoSub}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>{t.researchTitleLabel}</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)}/>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>{t.hypothesesLabel}</label>
              <textarea className="textarea" value={hyp} onChange={e => setHyp(e.target.value)} rows={4}/>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 6 }}>{t.goalsLabel}</label>
              <textarea className="textarea" value={goals} onChange={e => setGoals(e.target.value)} rows={3}/>
            </div>
            <button className="btn btn--secondary" style={{ alignSelf: 'flex-start' }}>
              <IconUpload size={18}/> {t.uploadPlanBtn} <span className="latin">(PDF / Word)</span>
            </button>
          </div>
        </section>

        <button className="btn btn--primary btn--full btn--lg" style={{ marginTop: 32 }} onClick={onNext}>
          {t.nextBtn} <IconArrowL size={18}/>
        </button>
      </main>
    </div>
  );
}
