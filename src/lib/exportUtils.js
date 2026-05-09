const RTL_CODES = new Set(['ar', 'fa', 'he', 'ur']);

function isRTL(langCode) {
  return RTL_CODES.has(langCode);
}

function safeFileName(name) {
  return (name || 'Analysis')
    .replace(/[^\w؀-ۿ一-鿿ऀ-ॿЀ-ӿ]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50);
}

// ── Plain text formatting ────────────────────────────────────────────────────

function textTable(headers, rows) {
  const cols = headers.length;
  const widths = headers.map((h, i) =>
    Math.max(String(h).length, ...rows.map(r => String(r[i] ?? '').length))
  );
  const sep = widths.map(w => '-'.repeat(w + 2)).join('+');
  const row = (cells) => '| ' + cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join(' | ') + ' |';
  return [sep, row(headers), sep, ...rows.map(row), sep].join('\n');
}

export function buildPlainText({ t, resultsText, descTable, regressionTable, hypotheses }) {
  const lines = [t.resultsTitle, '='.repeat(50), ''];

  if (resultsText) {
    lines.push(resultsText);
  } else {
    lines.push(t.descStats, '-'.repeat(30));
    lines.push(textTable(
      [t.thVariable, 'N', t.thMean, t.thSD, t.thMin, t.thMax],
      descTable.map(r => [r.v, r.n, r.mean.toFixed(2), r.sd.toFixed(2), r.min, r.max])
    ));
    lines.push('', t.descCommentary, '');
    lines.push(t.regression, '-'.repeat(30));
    lines.push(textTable(
      [t.thVariable, 'B', 'β', 't', 'p'],
      regressionTable.map(r => [r.v, typeof r.b === 'number' ? r.b.toFixed(3) : r.b, r.beta, r.t_, r.p])
    ));
    lines.push('', t.regCommentary, '');
    lines.push(t.hypothesesSummary, '-'.repeat(30));
    hypotheses.forEach(h => {
      lines.push(`${t.hypothesisLabel} ${h.id}: ${h.text} — ${h.accepted ? t.accepted : t.rejected}`);
    });
  }
  return lines.join('\n');
}

// ── Word export ──────────────────────────────────────────────────────────────

export async function exportWord({ t, langCode, projectTitle, resultsText, descTable, regressionTable, hypotheses }) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, ShadingType,
  } = await import('docx');

  const rtl = isRTL(langCode);
  const align = rtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

  const para = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text: String(text), font: 'Arial', ...opts })],
    alignment: align,
    bidirectional: rtl,
  });

  const h1 = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, font: 'Arial' })],
    heading: HeadingLevel.HEADING_1,
    alignment: align,
    bidirectional: rtl,
  });

  const h2 = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial' })],
    heading: HeadingLevel.HEADING_2,
    alignment: align,
    bidirectional: rtl,
  });

  const makeTable = (headers, rows) => new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          shading: { type: ShadingType.SOLID, fill: 'E5E7EB' },
          children: [new Paragraph({
            children: [new TextRun({ text: String(h), bold: true, font: 'Arial', size: 20 })],
            alignment: align,
            bidirectional: rtl,
          })],
        })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: String(cell ?? ''), font: 'Arial', size: 20 })],
            alignment: align,
            bidirectional: rtl,
          })],
        })),
      })),
    ],
  });

  const empty = () => para(' ');

  const children = [
    h1(t.resultsTitle),
    para(t.resultsSubtitle, { italics: true, color: '6B7280', size: 22 }),
    empty(),
  ];

  if (resultsText) {
    resultsText.split('\n').forEach(line => children.push(para(line || ' ')));
  } else {
    children.push(h2(t.descStats));
    children.push(makeTable(
      [t.thVariable, 'N', t.thMean, t.thSD, t.thMin, t.thMax],
      descTable.map(r => [r.v, r.n, r.mean.toFixed(2), r.sd.toFixed(2), r.min, r.max])
    ));
    children.push(empty(), para(t.descCommentary, { italics: true }), empty());
    children.push(h2(t.regression));
    children.push(makeTable(
      [t.thVariable, 'B', 'β', 't', 'p'],
      regressionTable.map(r => [r.v, typeof r.b === 'number' ? r.b.toFixed(3) : r.b, r.beta, r.t_, r.p])
    ));
    children.push(empty(), para(t.regCommentary, { italics: true }), empty());
    children.push(h2(t.hypothesesSummary));
    hypotheses.forEach(h => children.push(para(
      `${t.hypothesisLabel} ${h.id}: ${h.text} — ${h.accepted ? t.accepted : t.rejected}`
    )));
  }

  const doc = new Document({
    creator: 'StatAI',
    title: t.resultsTitle,
    sections: [{ properties: { bidi: rtl }, children }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `StatAI_Analysis_${safeFileName(projectTitle)}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── PDF export ───────────────────────────────────────────────────────────────

function buildPdfHtml({ t, langCode, resultsText, descTable, regressionTable, hypotheses }) {
  const rtl = isRTL(langCode);
  const dir = rtl ? 'rtl' : 'ltr';
  const ta  = rtl ? 'right' : 'left';

  const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const htmlTable = (headers, rows) => `
    <table>
      <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr class="${i%2?'alt':''}">${r.map((c,j) => `<td class="${j===0?'':'num'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;

  let body;
  if (resultsText) {
    body = resultsText.split('\n').map(l => `<p>${esc(l) || '&nbsp;'}</p>`).join('');
  } else {
    body = `
      <h2>${esc(t.descStats)}</h2>
      ${htmlTable([t.thVariable,'N',t.thMean,t.thSD,t.thMin,t.thMax], descTable.map(r=>[r.v,r.n,r.mean.toFixed(2),r.sd.toFixed(2),r.min,r.max]))}
      <p class="commentary">${esc(t.descCommentary)}</p>
      <hr>
      <h2>${esc(t.regression)}</h2>
      ${htmlTable([t.thVariable,'B','β','t','p'], regressionTable.map(r=>[r.v,typeof r.b==='number'?r.b.toFixed(3):r.b,r.beta,r.t_,r.p]))}
      <p class="commentary">${esc(t.regCommentary)}</p>
      <hr>
      <h2>${esc(t.hypothesesSummary)}</h2>
      <div class="hyps">
        ${hypotheses.map(h=>`
          <div class="hyp ${h.accepted?'accepted':'rejected'}">
            <span class="icon">${h.accepted?'✓':'✗'}</span>
            <span class="text">${esc(t.hypothesisLabel)} ${h.id}: ${esc(h.text)}</span>
            <span class="verdict">${esc(h.accepted?t.accepted:t.rejected)}</span>
          </div>`).join('')}
      </div>`;
  }

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${langCode}">
<head><meta charset="UTF-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, 'Tahoma', 'Microsoft YaHei', 'Noto Sans', system-ui, sans-serif;
    font-size: 13px; color: #1f2937; direction: ${dir};
    margin: 0; padding: 40px; background: #fff;
  }
  h1 { font-size: 22px; margin: 0 0 6px; }
  h2 { font-size: 16px; margin: 24px 0 10px; color: #111827; }
  p  { margin: 6px 0; line-height: 1.7; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 7px 12px; text-align: ${ta}; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  td { border: 1px solid #e5e7eb; padding: 7px 12px; font-size: 12px; text-align: ${ta}; }
  td.num { text-align: center; font-variant-numeric: tabular-nums; }
  tr.alt td { background: #f9fafb; }
  .commentary { font-style: italic; color: #4b5563; font-size: 12px; margin: 10px 0 4px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  .hyps { display: flex; flex-direction: column; gap: 8px; }
  .hyp { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 6px; font-size: 13px; }
  .hyp.accepted { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .hyp.rejected { background: #fff5f5; border: 1px solid #fecaca; }
  .hyp .icon { font-size: 16px; font-weight: bold; flex-shrink: 0; }
  .accepted .icon { color: #059669; }
  .rejected .icon { color: #dc2626; }
  .hyp .text { flex: 1; }
  .hyp .verdict { font-size: 11px; font-weight: 600; flex-shrink: 0; }
  .accepted .verdict { color: #059669; }
  .rejected .verdict { color: #dc2626; }
</style>
</head>
<body>
  <h1>${esc(t.resultsTitle)}</h1>
  <p class="subtitle">${esc(t.resultsSubtitle)}</p>
  ${body}
</body>
</html>`;
}

export async function exportPdf({ t, langCode, projectTitle, resultsText, descTable, regressionTable, hypotheses }) {
  const htmlContent = buildPdfHtml({ t, langCode, resultsText, descTable, regressionTable, hypotheses });

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;';
  container.innerHTML = htmlContent;

  // Grab the inner body from the HTML string via a temporary iframe for correct font loading
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:auto;border:none;z-index:-1;';
  document.body.appendChild(iframe);

  await new Promise(resolve => {
    iframe.onload = resolve;
    iframe.srcdoc = htmlContent;
  });

  // Let fonts and images settle
  await new Promise(r => setTimeout(r, 300));

  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF }       = await import('jspdf');

  const iframeBody = iframe.contentDocument.body;
  // Expand iframe to full content height for complete capture
  iframe.style.height = iframeBody.scrollHeight + 'px';

  const canvas = await html2canvas(iframeBody, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    scrollX: 0,
    scrollY: 0,
  });

  document.body.removeChild(iframe);

  const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW   = pdf.internal.pageSize.getWidth();
  const pageH   = pdf.internal.pageSize.getHeight();
  const margin  = 10;
  const imgW    = pageW - margin * 2;
  const imgH    = (canvas.height / canvas.width) * imgW;
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  // Slice the large canvas into A4 pages
  const sliceH = Math.floor((canvas.width * (pageH - margin * 2)) / imgW);
  let yOffset  = 0;

  while (yOffset < canvas.height) {
    if (yOffset > 0) pdf.addPage();
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width  = canvas.width;
    sliceCanvas.height = Math.min(sliceH, canvas.height - yOffset);
    sliceCanvas.getContext('2d').drawImage(canvas, 0, -yOffset);
    const slice = sliceCanvas.toDataURL('image/jpeg', 0.92);
    const sliceImgH = (sliceCanvas.height / sliceCanvas.width) * imgW;
    pdf.addImage(slice, 'JPEG', margin, margin, imgW, sliceImgH);
    yOffset += sliceH;
  }

  pdf.save(`StatAI_Analysis_${safeFileName(projectTitle)}.pdf`);
}
