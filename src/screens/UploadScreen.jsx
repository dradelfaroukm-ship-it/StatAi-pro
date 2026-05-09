import { useState, useRef } from 'react';
import { NavBar, StepIndicator, LoadingOverlay } from '../components/Common';
import { IconArrowR, IconArrowL, IconUpload, IconFile, IconCheck, IconX, IconSpark } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';
import { generateStatisticalPlan } from '../lib/claudeClient';

const FORMATS = ['CSV', 'Excel', 'SPSS', 'JSON'];
const FILE_CONTENT_LIMIT = 4000;

async function readFileContent(file) {
  const name = file.name.toLowerCase();
  const isText = name.endsWith('.csv') || name.endsWith('.json');
  if (!isText) {
    return `[Binary file: ${file.name}, size: ${(file.size / 1024).toFixed(1)} KB]`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      resolve(text.length > FILE_CONTENT_LIMIT ? text.slice(0, FILE_CONTENT_LIMIT) + '\n[truncated…]' : text);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function countRowsCols(fileContent, fileName) {
  if (!fileContent || fileContent.startsWith('[Binary')) return { rows: '?', cols: '?' };
  if (fileName.toLowerCase().endsWith('.json')) {
    try {
      const parsed = JSON.parse(fileContent.replace('\n[truncated…]', ''));
      if (Array.isArray(parsed)) {
        const cols = parsed.length ? Object.keys(parsed[0]).length : 0;
        return { rows: parsed.length, cols };
      }
    } catch { /* fall through */ }
  }
  const lines = fileContent.split('\n').filter(l => l.trim());
  return { rows: Math.max(0, lines.length - 1), cols: lines[0] ? lines[0].split(',').length : '?' };
}

export default function UploadScreen({ onNext, onBack, onSignOut }) {
  const { t, code } = useLanguage();
  const [file, setFile]         = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle]       = useState(() => t.defaultResearchTitle);
  const [hyp, setHyp]           = useState(() => t.defaultHypotheses);
  const [goals, setGoals]       = useState(() => t.defaultGoals);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const fileInput = useRef(null);

  const handleFile = async (f) => {
    setFile(f);
    setError(null);
    const content = await readFileContent(f);
    setFileContent(content);
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) await handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };

  const { rows, cols } = file && fileContent ? countRowsCols(fileContent, file.name) : { rows: null, cols: null };

  const handleNext = async () => {
    setError(null);
    setLoading(true);
    try {
      const uploadData = {
        title, hypotheses: hyp, goals,
        rows, cols,
        fileContent: fileContent || '',
        fileName: file?.name || '',
      };
      const { planText, methods, pricing } = await generateStatisticalPlan(uploadData, code);
      onNext({ ...uploadData, planText, methods, pricing });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {loading && <LoadingOverlay messageKey="aiGeneratingPlan"/>}
      <NavBar onSignOut={onSignOut}/>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 56px' }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: 'var(--fg-muted)',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
          gap: 5, fontSize: 13, padding: 0, marginBottom: 12, fontFamily: 'inherit',
        }}>
          <IconArrowR size={14}/> {t.backToProjects}
        </button>

        <h1 className="h1">{t.newProjectTitle}</h1>
        <StepIndicator current={1} completed={[]}/>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragging(false)}
          onClick={() => !file && fileInput.current?.click()}
          style={{
            marginTop: 20,
            background: dragging ? 'var(--accent-tint-2)' : 'var(--bg-card)',
            border: `1px dashed ${dragging ? 'var(--accent)' : file ? 'transparent' : 'var(--border-strong)'}`,
            borderRadius: 'var(--r-card)',
            padding: '36px 24px', textAlign: 'center',
            transition: 'all 180ms var(--ease-out)',
            cursor: file ? 'default' : 'pointer',
          }}>
          <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls,.sav,.json"
                 style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}/>

          {!file ? (
            <>
              <div style={{
                width: 52, height: 52, margin: '0 auto 14px', borderRadius: 'var(--r-card)',
                background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
              }}><IconUpload size={24}/></div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg-primary)' }}>{t.dragHere}</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {FORMATS.map(f => <span key={f} className="chip">{f}</span>)}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--fg-muted)' }}>
                {t.maxSize} <span className="num">50 MB</span>
              </div>
              <button className="btn btn--secondary" style={{ marginTop: 16 }}
                      onClick={e => { e.stopPropagation(); fileInput.current?.click(); }}>
                {t.chooseFile}
              </button>
            </>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--bg-input)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--r-input)', padding: '12px 16px', textAlign: 'start',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, background: 'var(--success-tint)',
                color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}><IconFile size={18}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: 'var(--fg-primary)', fontSize: 13 }}>
                  <span className="latin">{file.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>
                  <span className="num">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  {rows != null && <> · <span className="num">{rows}</span> {t.rowsLabel}</>}
                  {cols != null && <> · <span className="num">{cols}</span> {t.colsLabel}</>}
                </div>
              </div>
              <span className="chip chip--success"><IconCheck size={11}/> {t.fileUploaded}</span>
              <button onClick={() => { setFile(null); setFileContent(null); }} aria-label="remove"
                style={{ background: 'transparent', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <IconX size={14}/>
              </button>
            </div>
          )}
        </div>

        {/* Optional info */}
        <section style={{ marginTop: 28 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{t.additionalInfo}</h2>
          <div style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 16 }}>{t.additionalInfoSub}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 5 }}>{t.researchTitleLabel}</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)}/>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 5 }}>{t.hypothesesLabel}</label>
              <textarea className="textarea" value={hyp} onChange={e => setHyp(e.target.value)} rows={4}/>
            </div>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: 5 }}>{t.goalsLabel}</label>
              <textarea className="textarea" value={goals} onChange={e => setGoals(e.target.value)} rows={3}/>
            </div>
            <button className="btn btn--secondary" style={{ alignSelf: 'flex-start' }}>
              <IconUpload size={15}/> {t.uploadPlanBtn} <span className="latin" style={{ color: 'var(--fg-muted)' }}>(PDF / Word)</span>
            </button>
          </div>
        </section>

        {error && (
          <div className="banner banner--error" style={{ marginTop: 20 }}>
            <div>
              <strong>{t.aiError}</strong> — {error}
            </div>
            <button className="btn btn--secondary" onClick={handleNext} style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
              {t.retryBtn}
            </button>
          </div>
        )}

        <button className="btn btn--primary btn--full btn--lg" style={{ marginTop: 28 }} onClick={handleNext} disabled={loading}>
          <IconSpark size={15}/> {t.nextBtn} <IconArrowL size={15}/>
        </button>
      </main>
    </div>
  );
}
