"""
Generate comprehensive Word (.docx) report for MENA Energy Rebound Analysis
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import io, os, warnings
from copy import deepcopy

from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import docx.opc.constants

warnings.filterwarnings('ignore')

# ─── paths ────────────────────────────────────────────────────────────────────
OUT_DIR  = "/home/user/StatAi-pro/outputs/"
DOCX_PATH = "/home/user/StatAi-pro/outputs/MENA_Energy_Rebound_Report.docx"

# ─── load CSVs ────────────────────────────────────────────────────────────────
df_sum  = pd.read_csv(OUT_DIR + "rebound_summary_all_countries.csv")
df_ces  = pd.read_csv(OUT_DIR + "CES_parameters_all_countries.csv")
df_m1   = pd.read_csv(OUT_DIR + "method1_annual_rebound_all_countries.csv")
df_m2   = pd.read_csv(OUT_DIR + "method2_results_all_countries.csv")
df_norm = pd.read_csv(OUT_DIR + "normalized_data_all_countries.csv")

COUNTRIES = ["UAE", "Egypt", "Jordan", "Tunisia", "Morocco"]
PALETTE   = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd"]
C_COLOR   = dict(zip(COUNTRIES, PALETTE))
sE, sL, sK = 0.08, 0.46, 0.46

STATE_COLORS = {
    'Super-conservation': RGBColor(0x00, 0x72, 0xB2),
    'Partial rebound':    RGBColor(0x00, 0x9E, 0x73),
    'Full rebound':       RGBColor(0xCC, 0xBB, 0x00),
    'Backfire':           RGBColor(0xD5, 0x5E, 0x00),
}

# ══════════════════════════════════════════════════════════════════════════════
# HELPER: fig → bytes
# ══════════════════════════════════════════════════════════════════════════════
def fig_bytes(fig, dpi=160):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=dpi, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    return buf

# ══════════════════════════════════════════════════════════════════════════════
# FIGURES
# ══════════════════════════════════════════════════════════════════════════════
def make_normalized_fig():
    vars_ = [("y","Normalized GDP (y)"),("k","Normalized Capital (k)"),
             ("l","Normalized Labour (l)"),("u","Normalized Energy (u)")]
    fig, axes = plt.subplots(2, 2, figsize=(13, 9))
    axes = axes.flatten()
    for ax, (col, title) in zip(axes, vars_):
        for c, color in C_COLOR.items():
            sub = df_norm[df_norm["country"]==c]
            ax.plot(sub["year"], sub[col], label=c, color=color, linewidth=1.8)
        ax.axhline(1, color='black', linestyle='--', linewidth=0.7, alpha=0.5)
        ax.set_title(title, fontsize=11, fontweight='bold')
        ax.set_xlabel("Year"); ax.set_ylabel("Index (1990 = 1)")
        ax.legend(fontsize=7, ncol=3); ax.grid(alpha=0.3)
    fig.suptitle("Normalized Production Function Inputs (Base Year = 1990)", fontsize=13, fontweight='bold')
    fig.tight_layout()
    return fig_bytes(fig)

def make_ei_fig():
    fig, ax = plt.subplots(figsize=(12, 5))
    for c, color in C_COLOR.items():
        sub = df_norm[df_norm["country"]==c]
        ax.plot(sub["year"], sub["EI"]*1e6, label=c, color=color, linewidth=2)
    ax.set_title("Energy Intensity (EI = E / Y) over Time", fontsize=12, fontweight='bold')
    ax.set_xlabel("Year"); ax.set_ylabel("EI (toe per million US$)")
    ax.legend(); ax.grid(alpha=0.3)
    fig.tight_layout()
    return fig_bytes(fig)

def make_ei_bar_fig():
    ei_1990, ei_2023 = [], []
    for c in COUNTRIES:
        sub = df_norm[df_norm["country"]==c]
        ei_1990.append(sub[sub["year"]==1990]["EI"].values[0]*1e6)
        ei_2023.append(sub[sub["year"]==2023]["EI"].values[0]*1e6)
    x = np.arange(len(COUNTRIES)); w=0.35
    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.bar(x-w/2, ei_1990, w, label='1990', color='#4878d0', alpha=0.85)
    ax.bar(x+w/2, ei_2023, w, label='2023', color='#ee854a', alpha=0.85)
    ax.set_xticks(x); ax.set_xticklabels(COUNTRIES)
    ax.set_ylabel("Energy Intensity (toe / million US$)")
    ax.set_title("Energy Intensity: 1990 vs 2023", fontsize=12, fontweight='bold')
    ax.legend(); ax.grid(axis='y', alpha=0.3)
    for i,(v0,v1) in enumerate(zip(ei_1990,ei_2023)):
        chg = (v1-v0)/v0*100
        ax.text(i, max(v0,v1)+0.5, f'{chg:+.1f}%', ha='center', fontsize=9, color='darkred')
    fig.tight_layout()
    return fig_bytes(fig)

def make_m1_fig():
    fig, axes = plt.subplots(1, 5, figsize=(18, 4.5), sharey=False)
    for ax, (c, color) in zip(axes, C_COLOR.items()):
        sub = df_m1[(df_m1["country"]==c) & (df_m1["valid"]==True)]
        ax.bar(sub["year"], sub["Re_M1_annual"], color=color, alpha=0.75, edgecolor='white')
        row = df_sum[df_sum["country"]==c].iloc[0]
        ax.axhline(row["Re_M1_base"], color='black', linewidth=1.5, linestyle='-', label=f'Mean={row["Re_M1_base"]:.2f}%')
        ax.axhline(row["Re_M1_lo"],   color='gray',  linewidth=1,   linestyle='--')
        ax.axhline(row["Re_M1_hi"],   color='gray',  linewidth=1,   linestyle='--')
        ax.axhline(0, color='red', linewidth=0.8, linestyle=':')
        ax.set_title(c, fontsize=11, fontweight='bold', color=color)
        ax.set_xlabel("Year")
        if ax == axes[0]: ax.set_ylabel("Re_M1 (%)")
        ax.legend(fontsize=7); ax.grid(alpha=0.25)
        ax.tick_params(axis='x', rotation=45)
    fig.suptitle("Method 1 (AES/PES): Annual Rebound per Country", fontsize=12, fontweight='bold')
    fig.tight_layout()
    return fig_bytes(fig)

def make_m2_sens_fig():
    fig, ax = plt.subplots(figsize=(11, 5.5))
    for c, color in C_COLOR.items():
        sub = df_m2[df_m2["country"]==c].sort_values("sE")
        ax.plot(sub["sE"]*100, sub["Re_M2_sensitivity"], label=c, color=color, linewidth=2, marker='o', markersize=4)
    ax.axhline(100, color='red', linestyle='--', linewidth=1.2, label='Backfire threshold (100%)')
    ax.set_title("Method 2 (EEE) Sensitivity: Energy Cost Share vs Rebound", fontsize=12, fontweight='bold')
    ax.set_xlabel("sE (%)"); ax.set_ylabel("Re_M2 (%)")
    ax.legend(); ax.grid(alpha=0.3)
    fig.tight_layout()
    return fig_bytes(fig)

def make_comparison_fig():
    x = np.arange(len(COUNTRIES)); w = 0.35
    m1_vals = [df_sum[df_sum["country"]==c]["Re_M1_base"].values[0] for c in COUNTRIES]
    m2_orig  = [df_sum[df_sum["country"]==c]["Re_M2_base"].values[0] for c in COUNTRIES]
    m2_vals  = [min(v, 220) for v in m2_orig]
    m1_lo = [abs(df_sum[df_sum["country"]==c]["Re_M1_base"].values[0] -
                  df_sum[df_sum["country"]==c]["Re_M1_lo"].values[0]) for c in COUNTRIES]
    m1_hi = [abs(df_sum[df_sum["country"]==c]["Re_M1_hi"].values[0] -
                  df_sum[df_sum["country"]==c]["Re_M1_base"].values[0]) for c in COUNTRIES]
    fig, ax = plt.subplots(figsize=(12, 5.5))
    bars1 = ax.bar(x-w/2, m1_vals, w, label='Method 1 (AES/PES)', color='#4878d0', alpha=0.85,
                   yerr=[m1_lo, m1_hi], capsize=4, error_kw={'elinewidth':1.5})
    bars2 = ax.bar(x+w/2, m2_vals, w, label='Method 2 (EEE)', color='#ee854a', alpha=0.85)
    ax.axhline(100, color='red', linestyle='--', linewidth=1.3, label='Backfire threshold (100%)')
    ax.axhline(0,   color='black', linewidth=0.7)
    ax.set_xticks(x); ax.set_xticklabels(COUNTRIES, fontsize=11)
    ax.set_ylabel("Rebound Estimate (%)"); ax.set_title("Rebound Estimates: Method 1 vs Method 2", fontsize=12, fontweight='bold')
    ax.legend(); ax.grid(axis='y', alpha=0.3)
    for bar, val in zip(bars1, m1_vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5, f'{val:.1f}%', ha='center', va='bottom', fontsize=8)
    for bar, val, orig in zip(bars2, m2_vals, m2_orig):
        label = f'{orig:.1f}%' if orig < 220 else '200%\n(Backfire)'
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5, label, ha='center', va='bottom', fontsize=8)
    fig.tight_layout()
    return fig_bytes(fig)

def make_spider_fig():
    params = ['θ (TFP)', 'λ×10', 'δ (K-share)', 'δ₁ (KL-share)', 'σ(KL-E)/2.5', 'R²']
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    angles = np.linspace(0, 2*np.pi, len(params), endpoint=False).tolist()
    angles += angles[:1]
    for c, color in C_COLOR.items():
        row = df_ces[df_ces["country"]==c].iloc[0]
        vals = [row['theta'], row['lambda']*10, row['delta'], row['delta1'],
                min(row['sigma'], 2.5)/2.5, row['R2']]
        vals += vals[:1]
        ax.plot(angles, vals, color=color, linewidth=2, label=c)
        ax.fill(angles, vals, alpha=0.08, color=color)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(params, fontsize=10)
    ax.set_title("CES Parameter Radar (normalised)", fontsize=12, fontweight='bold', pad=18)
    ax.legend(loc='upper right', bbox_to_anchor=(1.38, 1.12))
    fig.tight_layout()
    return fig_bytes(fig)

# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENT HELPERS
# ══════════════════════════════════════════════════════════════════════════════
def set_cell_bg(cell, hex_color):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)

def set_cell_border(cell, **kwargs):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top','left','bottom','right'):
        tag = OxmlElement(f'w:{edge}')
        tag.set(qn('w:val'),  kwargs.get('val',  'single'))
        tag.set(qn('w:sz'),   kwargs.get('sz',   '4'))
        tag.set(qn('w:space'),'0')
        tag.set(qn('w:color'),kwargs.get('color','AAAAAA'))
        tcBorders.append(tag)
    tcPr.append(tcBorders)

def fmt_cell(cell, text, bold=False, color=None, size=9, align='CENTER', bg=None, italic=False):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    para = cell.paragraphs[0]
    para.alignment = {'CENTER':WD_ALIGN_PARAGRAPH.CENTER,
                      'LEFT':WD_ALIGN_PARAGRAPH.LEFT,
                      'RIGHT':WD_ALIGN_PARAGRAPH.RIGHT}.get(align, WD_ALIGN_PARAGRAPH.CENTER)
    run = para.add_run(str(text))
    run.bold   = bold
    run.italic = italic
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    if bg:
        set_cell_bg(cell, bg)
    set_cell_border(cell)
    return cell

def add_header_row(table, headers, bg='1A3A5C', text_color=RGBColor(0xFF,0xFF,0xFF), size=9):
    row = table.rows[0]
    for i, h in enumerate(headers):
        fmt_cell(row.cells[i], h, bold=True, color=text_color, size=size, bg=bg)

def shade_table_rows(table, start=1, odd='EEF3FA', even='FFFFFF'):
    for i, row in enumerate(table.rows[start:], start):
        bg = odd if i % 2 == 1 else even
        for cell in row.cells:
            set_cell_bg(cell, bg)

def add_para(doc, text, style='Normal', bold=False, italic=False, size=None,
             color=None, align=None, space_before=None, space_after=None):
    p = doc.add_paragraph(style=style)
    if align:
        p.alignment = align
    pf = p.paragraph_format
    if space_before is not None: pf.space_before = Pt(space_before)
    if space_after  is not None: pf.space_after  = Pt(space_after)
    run = p.add_run(text)
    run.bold   = bold
    run.italic = italic
    if size:  run.font.size = Pt(size)
    if color: run.font.color.rgb = color
    return p

def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    if level == 1:
        run = p.runs[0] if p.runs else p.add_run(text)
        run.font.color.rgb = RGBColor(0x1A, 0x3A, 0x5C)
    return p

def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(10)
    run = p.add_run(text)
    run.italic   = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x55,0x55,0x55)

def add_figure(doc, img_bytes, width=Inches(6.3), caption=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(img_bytes, width=width)
    if caption:
        add_caption(doc, caption)

def add_bullet(doc, text, size=10):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(text)
    run.font.size = Pt(size)
    return p

def add_equation(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(6)
    run = p.add_run(text)
    run.font.size = Pt(11)
    run.italic = True
    # light gray background via XML shading on paragraph
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  'F0F4FF')
    pPr.append(shd)
    return p

def add_horizontal_rule(doc):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'AAAAAA')
    pBdr.append(bottom)
    pPr.append(pBdr)
    p.paragraph_format.space_after = Pt(6)
    return p

def add_body(doc, text, size=10, justify=True):
    p = doc.add_paragraph()
    if justify: p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(5)
    run = p.add_run(text)
    run.font.size = Pt(size)
    return p

# ══════════════════════════════════════════════════════════════════════════════
# BUILD DOCUMENT
# ══════════════════════════════════════════════════════════════════════════════
doc = Document()

# Page margins
section = doc.sections[0]
section.left_margin   = Cm(2.5)
section.right_margin  = Cm(2.5)
section.top_margin    = Cm(2.5)
section.bottom_margin = Cm(2.5)

# ─── COVER PAGE ───────────────────────────────────────────────────────────────
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(60)
p.paragraph_format.space_after  = Pt(6)
run = p.add_run("MENA National Energy Rebound Analysis")
run.bold = True; run.font.size = Pt(24)
run.font.color.rgb = RGBColor(0x1A, 0x3A, 0x5C)

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
p2.paragraph_format.space_after = Pt(20)
run2 = p2.add_run("Estimating National Energy Rebound Effects using Brockway et al. (2017)")
run2.font.size = Pt(13); run2.italic = True
run2.font.color.rgb = RGBColor(0x25, 0x63, 0xA8)

add_horizontal_rule(doc)

cover_rows = [
    ("Countries",            "UAE · Egypt · Jordan · Tunisia · Morocco"),
    ("Time Period",          "1990 – 2023  (34 years per country)"),
    ("Methods",              "Method 1: AES/PES  |  Method 2: EEE (Brockway et al. 2017)"),
    ("Production Function",  "Nested KL-E CES (3-factor, constant-returns)"),
    ("Base Year",            "1990"),
    ("Cost Shares",          "sE = 0.08  |  sL = 0.46  |  sK = 0.46  |  Sum = 1.00 ✓"),
    ("Data Source",          "PWT 11.0 (K, L, GDP)  |  OAPEC (Energy in Mtoe)"),
    ("Date",                 "June 2026"),
]
tbl = doc.add_table(rows=len(cover_rows), cols=2)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (k, v) in enumerate(cover_rows):
    fmt_cell(tbl.rows[i].cells[0], k, bold=True, size=10, align='LEFT',
             bg='E8F0FE' if i%2==0 else 'F8FAFF')
    fmt_cell(tbl.rows[i].cells[1], v, size=10, align='LEFT',
             bg='E8F0FE' if i%2==0 else 'F8FAFF')
    tbl.rows[i].cells[0].width = Cm(5)
    tbl.rows[i].cells[1].width = Cm(11)

doc.add_paragraph()

# State classification on cover
add_heading(doc, "Rebound State Classification", level=2)
state_tbl = doc.add_table(rows=5, cols=3)
state_tbl.style = 'Table Grid'
state_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
fmt_cell(state_tbl.rows[0].cells[0], "Rebound State", bold=True, bg='1A3A5C',
         color=RGBColor(0xFF,0xFF,0xFF), size=9)
fmt_cell(state_tbl.rows[0].cells[1], "Criterion",     bold=True, bg='1A3A5C',
         color=RGBColor(0xFF,0xFF,0xFF), size=9)
fmt_cell(state_tbl.rows[0].cells[2], "Interpretation",bold=True, bg='1A3A5C',
         color=RGBColor(0xFF,0xFF,0xFF), size=9)
states_info = [
    ("Super-conservation","Re < 0%",    "Energy falls faster than efficiency gains predict"),
    ("Partial rebound",   "0% < Re < 100%","Some efficiency gains offset by increased use"),
    ("Full rebound",      "Re = 100%",  "All efficiency gains completely offset"),
    ("Backfire",          "Re > 100%",  "Energy use rises beyond original pre-efficiency level"),
]
for i,(s,crit,interp) in enumerate(states_info,1):
    col = STATE_COLORS[s]
    hex_c = f'{col[0]:02X}{col[1]:02X}{col[2]:02X}'
    # lighter bg
    bg = f'{min(col[0]+180,255):02X}{min(col[1]+180,255):02X}{min(col[2]+180,255):02X}'
    fmt_cell(state_tbl.rows[i].cells[0], s,     bold=True, color=col, size=9, bg=bg)
    fmt_cell(state_tbl.rows[i].cells[1], crit,  size=9, bg='FFFFFF')
    fmt_cell(state_tbl.rows[i].cells[2], interp,size=9, align='LEFT', bg='FFFFFF')

doc.add_page_break()

# ─── SECTION 1: INTRODUCTION ──────────────────────────────────────────────────
add_heading(doc, "1. Introduction")
add_horizontal_rule(doc)
add_body(doc,
    "Energy efficiency improvements are often expected to reduce total energy consumption. "
    "However, the energy rebound effect describes the phenomenon by which some — or all — of the "
    "anticipated savings are offset by behavioural, economic, or structural responses. When the rebound "
    "exceeds 100%, a backfire is said to occur: energy use actually increases beyond the pre-efficiency baseline.")
add_body(doc,
    "This report estimates national-level energy rebound effects for five MENA economies — "
    "UAE, Egypt, Jordan, Tunisia, and Morocco — over 1990–2023, using the two complementary "
    "macroeconomic methods proposed by Brockway et al. (2017): the AES/PES method (Method 1) "
    "and the Energy-Economy-Environment (EEE) method (Method 2). Both methods require estimation "
    "of a nested constant-elasticity-of-substitution (CES) production function.")

# ─── SECTION 2: DATA & ASSUMPTIONS ───────────────────────────────────────────
add_heading(doc, "2. Data & Assumptions")
add_horizontal_rule(doc)
add_body(doc,
    "Dataset: Sheet1 of the supplied Excel workbook (Data_Aya_Hussein_final.xlsx). "
    "After removing embedded header artefacts, 170 usable country-year observations remain "
    "(34 years × 5 countries, 1990–2023).")

assumptions = [
    "Energy (Mtoe/yr) is used as a proxy for both primary energy and useful exergy — no separate exergy conversion dataset was available.",
    "All variables are normalised to 1990 = 1 as the base year: xt = Xt / X1990.",
    "sE = 0.08 applied uniformly across all five countries, consistent with Brockway et al. (2017) for developing economies.",
    "Labour income share = 0.50, implying sL = sK = 0.50 × (1 − sE) = 0.46.",
    "The embodied technical change parameter λ is treated as time-invariant for Method 1 annual rebound calculations.",
]
for a in assumptions:
    add_bullet(doc, a)

doc.add_paragraph()
add_heading(doc, "Cost Share Parameters", level=2)
cs_tbl = doc.add_table(rows=5, cols=4)
cs_tbl.style = 'Table Grid'
cs_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(cs_tbl, ["Parameter","Formula","Value","Verification"])
cs_data = [
    ("sE","Given","0.08","—"),
    ("sL","0.50 × (1 − sE)","0.46","—"),
    ("sK","0.50 × (1 − sE)","0.46","—"),
    ("Sum","sE + sL + sK","1.00","✓ Confirmed"),
]
for i,(p_,f,v,vf) in enumerate(cs_data,1):
    fmt_cell(cs_tbl.rows[i].cells[0], p_, bold=True, size=9, bg='EEF3FA' if i%2 else 'FFFFFF')
    fmt_cell(cs_tbl.rows[i].cells[1], f,  size=9, align='LEFT', bg='EEF3FA' if i%2 else 'FFFFFF')
    fmt_cell(cs_tbl.rows[i].cells[2], v,  size=9, bg='EEF3FA' if i%2 else 'FFFFFF')
    fmt_cell(cs_tbl.rows[i].cells[3], vf, size=9, bg='EEF3FA' if i%2 else 'FFFFFF',
             color=RGBColor(0,0x7B,0x3F) if '✓' in vf else None)

# ─── SECTION 3: PRODUCTION FUNCTION ──────────────────────────────────────────
doc.add_paragraph()
add_heading(doc, "3. Production Function: Nested KL-E CES")
add_horizontal_rule(doc)
add_body(doc,
    "A nested constant-elasticity-of-substitution (CES) production function is fitted "
    "separately for each country using non-linear least squares (scipy.optimize.curve_fit). "
    "The functional form is:")
add_equation(doc,
    "yt = θ · exp(λ·t) · [δ₁ · (δ · kt^(−ρ₁) + (1−δ) · lt^(−ρ₁))^(ρ/ρ₁) + (1−δ₁) · ut^(−ρ)]^(−1/ρ)")
add_body(doc,
    "where lower-case variables are normalised to 1990, and t = year − 1990. "
    "Parameters: θ = TFP scale, λ = embodied technical change rate, δ = capital share in KL nest, "
    "δ₁ = KL-aggregate share vs Energy, ρ = KL-Energy substitution parameter (σ = 1/(1+ρ)), "
    "ρ₁ = K-L substitution parameter (σ₁ = 1/(1+ρ₁)).")
add_body(doc,
    "Fitting procedure: 50 random starting points per country; solution with lowest residual sum of "
    "squares (RSS) retained. 1000-sample residual bootstrap provides 95% confidence intervals for "
    "all parameters and derived elasticities.")

doc.add_page_break()

# ─── SECTION 4: DATA OVERVIEW ─────────────────────────────────────────────────
add_heading(doc, "4. Data Overview: Normalised Inputs & Energy Intensity")
add_horizontal_rule(doc)

add_figure(doc, make_normalized_fig(), width=Inches(6.3),
           caption="Figure 1. Normalised production function inputs (base year 1990 = 1). "
                   "GDP (y) and Capital (k) show strong growth in all countries; Labour (l) "
                   "diverges strongly in UAE due to rapid workforce expansion.")
doc.add_paragraph()
add_figure(doc, make_ei_fig(), width=Inches(6.2),
           caption="Figure 2. Energy intensity (EI = E/Y, toe per million US$) over time. "
                   "A general declining trend confirms improving energy efficiency across all five economies.")
doc.add_paragraph()
add_figure(doc, make_ei_bar_fig(), width=Inches(6.0),
           caption="Figure 3. Energy intensity comparison: 1990 vs 2023. "
                   "Percentage change 1990→2023 annotated above each country pair.")

# Normalised data tables
doc.add_paragraph()
add_heading(doc, "4.1 Normalised Variable Tables (First 3 & Last 3 Years)", level=2)
for c in COUNTRIES:
    add_heading(doc, c, level=3)
    sub = df_norm[df_norm["country"]==c].copy()
    disp = pd.concat([sub.head(3), sub.tail(3)])
    cols = ["year","y","k","l","u","EI"]
    nt = doc.add_table(rows=len(disp)+1, cols=len(cols))
    nt.style = 'Table Grid'
    nt.alignment = WD_TABLE_ALIGNMENT.CENTER
    add_header_row(nt, ["Year","y (GDP)","k (Capital)","l (Labour)","u (Energy)","EI (toe/Mn$)"])
    for ri, (_, row) in enumerate(disp.iterrows(), 1):
        bg = 'EEF3FA' if ri%2 else 'FFFFFF'
        fmt_cell(nt.rows[ri].cells[0], str(int(row['year'])), size=9, bg=bg)
        fmt_cell(nt.rows[ri].cells[1], f"{row['y']:.4f}",   size=9, bg=bg)
        fmt_cell(nt.rows[ri].cells[2], f"{row['k']:.4f}",   size=9, bg=bg)
        fmt_cell(nt.rows[ri].cells[3], f"{row['l']:.4f}",   size=9, bg=bg)
        fmt_cell(nt.rows[ri].cells[4], f"{row['u']:.4f}",   size=9, bg=bg)
        fmt_cell(nt.rows[ri].cells[5], f"{row['EI']*1e6:.4f}", size=9, bg=bg)
    doc.add_paragraph()

doc.add_page_break()

# ─── SECTION 5: CES RESULTS ───────────────────────────────────────────────────
add_heading(doc, "5. CES Production Function Results")
add_horizontal_rule(doc)
add_body(doc,
    "Table 1 presents the best-fit CES parameters and 95% bootstrap confidence intervals for each country. "
    "R² values above 0.97 confirm excellent model fit in all five cases.")

ces_cols = ["Country","θ","θ CI","λ","λ CI","δ","δ₁","ρ","ρ CI","σ(KL-E)","σ₁(K-L)","R²"]
ces_tbl = doc.add_table(rows=len(COUNTRIES)+1, cols=len(ces_cols))
ces_tbl.style = 'Table Grid'
ces_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(ces_tbl, ces_cols, bg='1A3A5C')
for ri, c in enumerate(COUNTRIES, 1):
    r = df_ces[df_ces["country"]==c].iloc[0]
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    vals = [c,
        f"{r['theta']:.4f}",  f"[{r['theta_lo']:.3f}, {r['theta_hi']:.3f}]",
        f"{r['lambda']:.5f}", f"[{r['lambda_lo']:.4f}, {r['lambda_hi']:.4f}]",
        f"{r['delta']:.4f}",  f"{r['delta1']:.4f}",
        f"{r['rho']:.4f}",    f"[{r['rho_lo']:.3f}, {r['rho_hi']:.3f}]",
        f"{r['sigma']:.4f}",  f"{r['sigma1']:.4f}",
        f"{r['R2']:.4f}"]
    for ci, v in enumerate(vals):
        fmt_cell(ces_tbl.rows[ri].cells[ci], v, bold=(ci==0), size=8, bg=bg)
add_caption(doc, "Table 1. CES parameter estimates with 95% bootstrap confidence intervals. "
                 "CI = confidence interval. ρ at boundary (−0.5 or 5.0) indicates optimizer reached parameter bound.")

doc.add_paragraph()
add_heading(doc, "5.1 Elasticity of Substitution (σ) Interpretation", level=2)
interp_tbl = doc.add_table(rows=6, cols=3)
interp_tbl.style = 'Table Grid'
interp_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(interp_tbl, ["Country","σ (KL-E)","Interpretation"])
interp_data = [
    ("UAE",    "0.1667","σ < 1: KL & Energy are COMPLEMENTS — limited substitutability, lower rebound risk"),
    ("Egypt",  "2.0000","σ > 1: KL & Energy are SUBSTITUTES (at boundary) — high rebound/backfire risk"),
    ("Jordan", "2.0000","σ > 1: KL & Energy are SUBSTITUTES (at boundary) — high rebound/backfire risk"),
    ("Tunisia","0.2660","σ < 1: KL & Energy are weak COMPLEMENTS — moderate substitutability"),
    ("Morocco","2.0000","σ > 1: KL & Energy are SUBSTITUTES (at boundary) — high rebound/backfire risk"),
]
for ri,(c,s,interp) in enumerate(interp_data,1):
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    fmt_cell(interp_tbl.rows[ri].cells[0], c,     bold=True, size=9, bg=bg)
    fmt_cell(interp_tbl.rows[ri].cells[1], s,     size=9, bg=bg)
    fmt_cell(interp_tbl.rows[ri].cells[2], interp,size=9, align='LEFT', bg=bg)
add_caption(doc, "Table 2. KL-Energy elasticity of substitution and economic interpretation.")

doc.add_paragraph()
add_body(doc,
    "Note: Egypt, Jordan, and Morocco converge to the lower bound of ρ (−0.5 → σ = 2.0), "
    "indicating the optimizer could not find an interior solution with short time-series data. "
    "Wide bootstrap CI for ρ in these countries confirms high parameter uncertainty.")
doc.add_paragraph()
add_figure(doc, make_spider_fig(), width=Inches(4.5),
           caption="Figure 4. Radar chart of normalised CES parameters across countries (σ capped at 2.5 for scaling).")

doc.add_page_break()

# ─── SECTION 6: METHOD 1 ──────────────────────────────────────────────────────
add_heading(doc, "6. Method 1: AES/PES Rebound")
add_horizontal_rule(doc)
add_body(doc,
    "Method 1 quantifies rebound by comparing the Actual Energy Savings (AES) to the Potential "
    "Energy Savings (PES) that would have occurred if energy intensity had fallen without any "
    "output response. The parameter λ (from the CES fit) captures the rate of embodied "
    "technical change, driving the wedge between AES and PES.")

add_heading(doc, "6.1 Equations", level=2)
eq_rows = [
    ("Potential Energy Saved",  "PESt+1 = Yt+1 × (EIt − EIt+1)"),
    ("Rebound Energy Consumed", "(PES − AES)t+1 = λ × (Yt+1 − Yt) × EIt+1"),
    ("Annual Rebound",          "Ret+1 = [(PES − AES) / PES] × 100"),
    ("Mean Rebound (M1)",       "Re_M1 = (1/N) × Σ Ret+1   [valid years: PES > 0 only]"),
    ("Decomposition",           "Ret+1 = λ × [(Yt+1 − Yt)/Yt+1] × [EIt+1/(EIt − EIt+1)] × 100"),
    ("Decomposition terms",     "A = λ,   B = (Yt+1 − Yt)/Yt+1,   C = EIt+1/(EIt − EIt+1)"),
]
eq_tbl = doc.add_table(rows=len(eq_rows), cols=2)
eq_tbl.style = 'Table Grid'
eq_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for ri, (name, eq) in enumerate(eq_rows):
    bg = 'F0F4FF' if ri%2==0 else 'FFFFFF'
    fmt_cell(eq_tbl.rows[ri].cells[0], name, bold=True, size=9, align='LEFT', bg=bg)
    fmt_cell(eq_tbl.rows[ri].cells[1], eq,   italic=True, size=9, align='LEFT', bg=bg)
    eq_tbl.rows[ri].cells[0].width = Cm(5)
    eq_tbl.rows[ri].cells[1].width = Cm(11)

doc.add_paragraph()
add_body(doc,
    "Years with PES ≤ 0 (energy intensity did not decline year-on-year) are excluded from the "
    "mean rebound calculation. These correspond to periods of rising energy intensity, "
    "where no efficiency gain occurred to rebound from.")

doc.add_paragraph()
add_heading(doc, "6.2 Method 1 Summary", level=2)
m1_sum_tbl = doc.add_table(rows=6, cols=6)
m1_sum_tbl.style = 'Table Grid'
m1_sum_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(m1_sum_tbl, ["Country","Valid Years","Re_M1 (2.5%)","Re_M1 (Base)","Re_M1 (97.5%)","State"])
for ri, c in enumerate(COUNTRIES, 1):
    r = df_sum[df_sum["country"]==c].iloc[0]
    valid = df_m1[(df_m1["country"]==c)&(df_m1["valid"]==True)].shape[0]
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    fmt_cell(m1_sum_tbl.rows[ri].cells[0], c,           bold=True, size=9, bg=bg)
    fmt_cell(m1_sum_tbl.rows[ri].cells[1], str(valid),  size=9, bg=bg)
    fmt_cell(m1_sum_tbl.rows[ri].cells[2], f"{r['Re_M1_lo']:.2f}%",   size=9, bg=bg)
    fmt_cell(m1_sum_tbl.rows[ri].cells[3], f"{r['Re_M1_base']:.2f}%", size=9, bold=True, bg=bg)
    fmt_cell(m1_sum_tbl.rows[ri].cells[4], f"{r['Re_M1_hi']:.2f}%",   size=9, bg=bg)
    state = r['State_M1']
    col   = STATE_COLORS.get(state, RGBColor(0,0,0))
    fmt_cell(m1_sum_tbl.rows[ri].cells[5], state, size=9, color=col, bold=True, bg=bg)
add_caption(doc, "Table 3. Method 1 results summary with 95% bootstrap CI (derived from λ bootstrap distribution).")

doc.add_paragraph()
add_figure(doc, make_m1_fig(), width=Inches(6.4),
           caption="Figure 5. Annual Method 1 rebound per country (valid years only). "
                   "Solid line = mean base-fit; dashed lines = 95% bootstrap CI bounds.")

doc.add_page_break()

# Per-country annual decomposition tables
add_heading(doc, "6.3 Annual Rebound Decomposition Tables (All Valid Years)", level=2)
add_body(doc,
    "The following tables present the full A × B × C decomposition of annual rebound for each "
    "valid year (PES > 0) in each country. Columns: PES = Potential Energy Saved (Mtoe); "
    "(PES−AES) = Rebound Energy (Mtoe); A = λ; B = ΔY/Y; C = EIt+1/ΔEI.")
for c in COUNTRIES:
    row_ces = df_ces[df_ces["country"]==c].iloc[0]
    lam = row_ces['lambda']
    sub = df_m1[(df_m1["country"]==c)&(df_m1["valid"]==True)].copy()
    add_heading(doc, f"{c}  (λ = {lam:.6f})", level=3)
    det_hdr = ["Year","PES (Mtoe)","(PES−AES)(Mtoe)","Re annual (%)","A = λ","B = ΔY/Y","C = EI/ΔEI"]
    dt = doc.add_table(rows=len(sub)+1, cols=len(det_hdr))
    dt.style = 'Table Grid'
    dt.alignment = WD_TABLE_ALIGNMENT.CENTER
    add_header_row(dt, det_hdr, bg='2563A8')
    for ri, (_, rw) in enumerate(sub.iterrows(), 1):
        bg = 'EEF3FA' if ri%2 else 'FFFFFF'
        vals2 = [str(int(rw['year'])), f"{rw['PES']:.4f}", f"{rw['PES_AES']:.6f}",
                 f"{rw['Re_M1_annual']:.4f}", f"{rw['A_lambda']:.6f}",
                 f"{rw['B']:.6f}", f"{rw['C']:.4f}"]
        for ci, v in enumerate(vals2):
            fmt_cell(dt.rows[ri].cells[ci], v, size=8, bg=bg)
    doc.add_paragraph()

doc.add_page_break()

# ─── SECTION 7: METHOD 2 ──────────────────────────────────────────────────────
add_heading(doc, "7. Method 2: EEE Rebound")
add_horizontal_rule(doc)
add_body(doc,
    "Method 2 derives the national energy rebound directly from the estimated CES elasticity "
    "of substitution (ρ) and the cost share parameters, using the Energy-Economy-Environment "
    "(EEE) formula of Brockway et al. (2017). Unlike Method 1, it does not rely on observed "
    "energy intensity trends, but instead on structural production parameters.")

add_heading(doc, "7.1 Equations", level=2)
add_equation(doc,
    "Re_M2 = { [(1+sE+sK)(1+ρ) + ρ(sE−sK−1) + sE] / [(1+sE+sK)(1+ρ)] } × 100")
eq2_rows = [
    ("Substitution effect", "ηsub = ρ(sE − 1) / [(1+sE+sK)(1+ρ)]"),
    ("",                    "Re_sub = (1 + ηsub) × 100"),
    ("Output effect",       "ηtotal = Re_M2/100 − 1"),
    ("",                    "ηoutput = ηtotal − ηsub  ;  Re_output = ηoutput × 100"),
]
eq2_tbl = doc.add_table(rows=len(eq2_rows), cols=2)
eq2_tbl.style = 'Table Grid'
eq2_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
for ri, (name, eq) in enumerate(eq2_rows):
    bg = 'FFF8EE' if ri%2==0 else 'FFFFFF'
    fmt_cell(eq2_tbl.rows[ri].cells[0], name, bold=(name!=""), size=9, align='LEFT', bg=bg)
    fmt_cell(eq2_tbl.rows[ri].cells[1], eq,   italic=True, size=9, align='LEFT', bg=bg)
    eq2_tbl.rows[ri].cells[0].width = Cm(4)
    eq2_tbl.rows[ri].cells[1].width = Cm(12)

doc.add_paragraph()
add_heading(doc, "7.2 Method 2 Results", level=2)
m2_cols = ["Country","ρ","σ(KL-E)","ηsub","Re_sub(%)","ηoutput","Re_out(%)","Re_M2 Base","State"]
m2_tbl2 = doc.add_table(rows=6, cols=len(m2_cols))
m2_tbl2.style = 'Table Grid'
m2_tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(m2_tbl2, m2_cols, bg='7B3000')
for ri, c in enumerate(COUNTRIES, 1):
    r  = df_sum[df_sum["country"]==c].iloc[0]
    rc = df_ces[df_ces["country"]==c].iloc[0]
    rho = rc['rho']
    denom = (1+sE+sK)*(1+rho)
    h_sub = rho*(sE-1)/denom if abs(denom)>1e-9 else float('nan')
    re_m2 = r['Re_M2_base']
    h_tot = re_m2/100 - 1
    h_out = h_tot - h_sub
    bg = 'FFF3E8' if ri%2 else 'FFFFFF'
    state = r['State_M2']
    col   = STATE_COLORS.get(state, RGBColor(0,0,0))
    row_vals = [c, f"{rho:.4f}", f"{rc['sigma']:.4f}",
                f"{h_sub:.4f}", f"{(1+h_sub)*100:.2f}%",
                f"{h_out:.4f}", f"{h_out*100:.2f}%",
                f"{re_m2:.2f}%", state]
    for ci, v in enumerate(row_vals):
        is_state = ci == len(row_vals)-1
        fmt_cell(m2_tbl2.rows[ri].cells[ci], v,
                 bold=(ci==0 or is_state), size=9, bg=bg,
                 color=col if is_state else None)
add_caption(doc, "Table 4. Method 2 results with substitution and output effect decomposition. "
                 "Re_M2 = 200% indicates backfire (ρ at lower bound −0.5, σ = 2.0).")

doc.add_paragraph()
add_heading(doc, "7.3 Bootstrap Confidence Intervals", level=2)
m2b_tbl = doc.add_table(rows=6, cols=4)
m2b_tbl.style = 'Table Grid'
m2b_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(m2b_tbl, ["Country","Re_M2 (2.5%)","Re_M2 (Base)","Re_M2 (97.5%)"])
for ri, c in enumerate(COUNTRIES, 1):
    r = df_sum[df_sum["country"]==c].iloc[0]
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    fmt_cell(m2b_tbl.rows[ri].cells[0], c,                        bold=True, size=9, bg=bg)
    fmt_cell(m2b_tbl.rows[ri].cells[1], f"{r['Re_M2_lo']:.2f}%",  size=9, bg=bg)
    fmt_cell(m2b_tbl.rows[ri].cells[2], f"{r['Re_M2_base']:.2f}%",size=9, bold=True, bg=bg)
    fmt_cell(m2b_tbl.rows[ri].cells[3], f"{r['Re_M2_hi']:.2f}%",  size=9, bg=bg)
add_caption(doc, "Table 5. Method 2 bootstrap confidence intervals (95%), "
                 "derived from ρ at 2.5th and 97.5th bootstrap percentiles.")

doc.add_paragraph()
add_figure(doc, make_m2_sens_fig(), width=Inches(6.2),
           caption="Figure 6. Sensitivity of Re_M2 to energy cost share (sE). Countries with ρ = −0.5 "
                   "remain at 200% for all sE values. Red dashed line = backfire threshold.")

doc.add_paragraph()
add_heading(doc, "7.4 Sensitivity Tables: sE vs Re_M2", level=2)
add_body(doc, "For each country, the table below shows how Re_M2 varies across sE = 0%–20%, "
              "holding ρ fixed at its base-fit value.")
for c in COUNTRIES:
    sub = df_m2[df_m2["country"]==c].sort_values("sE")
    rho_val = sub["rho"].iloc[0]
    add_heading(doc, f"{c}  (ρ = {rho_val:.4f})", level=3)
    st = doc.add_table(rows=len(sub)+1, cols=3)
    st.style = 'Table Grid'
    st.alignment = WD_TABLE_ALIGNMENT.CENTER
    add_header_row(st, ["sE (%)","sK (%)","Re_M2 (%)"])
    for ri, (_, rw) in enumerate(sub.iterrows(), 1):
        bg = 'EEF3FA' if ri%2 else 'FFFFFF'
        is_base = abs(rw['sE'] - 0.08) < 0.001
        fmt_cell(st.rows[ri].cells[0], f"{rw['sE']*100:.0f}%",         size=9, bg='D4EFDF' if is_base else bg, bold=is_base)
        fmt_cell(st.rows[ri].cells[1], f"{rw['sK']*100:.1f}%",         size=9, bg='D4EFDF' if is_base else bg, bold=is_base)
        fmt_cell(st.rows[ri].cells[2], f"{rw['Re_M2_sensitivity']:.2f}%",size=9, bg='D4EFDF' if is_base else bg, bold=is_base)
    doc.add_paragraph()

doc.add_page_break()

# ─── SECTION 8: COMPARISON ────────────────────────────────────────────────────
add_heading(doc, "8. Cross-Country Comparison & Final Summary")
add_horizontal_rule(doc)
add_figure(doc, make_comparison_fig(), width=Inches(6.4),
           caption="Figure 7. Method 1 vs Method 2 rebound estimates (base-fit). "
                   "Error bars on Method 1 bars show 95% bootstrap CI. Red dashed line = backfire threshold.")
doc.add_paragraph()

add_heading(doc, "8.1 Master Summary Table", level=2)
fs_cols = ["Country","Re_M1\n(2.5%)","Re_M1\n(Base)","Re_M1\n(97.5%)","Re_M2\n(2.5%)","Re_M2\n(Base)","Re_M2\n(97.5%)","σ(KL-E)","State M1","State M2"]
fs_tbl = doc.add_table(rows=6, cols=len(fs_cols))
fs_tbl.style = 'Table Grid'
fs_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(fs_tbl, fs_cols)
for ri, c in enumerate(COUNTRIES, 1):
    r = df_sum[df_sum["country"]==c].iloc[0]
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    s1, s2 = r['State_M1'], r['State_M2']
    c1, c2 = STATE_COLORS.get(s1, RGBColor(0,0,0)), STATE_COLORS.get(s2, RGBColor(0,0,0))
    row_v = [c,
        f"{r['Re_M1_lo']:.2f}%",   f"{r['Re_M1_base']:.2f}%", f"{r['Re_M1_hi']:.2f}%",
        f"{r['Re_M2_lo']:.2f}%",   f"{r['Re_M2_base']:.2f}%", f"{r['Re_M2_hi']:.2f}%",
        f"{r['sigma_KL_E']:.4f}",   s1, s2]
    for ci, v in enumerate(row_v):
        col_arg = None
        if ci == 8: col_arg = c1
        if ci == 9: col_arg = c2
        fmt_cell(fs_tbl.rows[ri].cells[ci], v,
                 bold=(ci==0 or ci in (8,9)), size=9, bg=bg, color=col_arg)
add_caption(doc, "Table 6. Master rebound summary for all five MENA countries with 95% bootstrap CI "
                 "and rebound state classification.")

doc.add_page_break()

# ─── SECTION 9: DISCUSSION ────────────────────────────────────────────────────
add_heading(doc, "9. Discussion")
add_horizontal_rule(doc)

add_heading(doc, "9.1 Method 1 (AES/PES) Findings", level=2)
add_body(doc,
    "Method 1 yields low rebound estimates for all five countries (< 2%), suggesting that energy "
    "efficiency improvements in MENA economies have generally delivered net energy savings. "
    "UAE stands out as the only country showing super-conservation (Re_M1 = −0.50%), driven by "
    "a negative λ (−0.0046), implying slight embodied technological regress in the fitted CES — "
    "possibly reflecting the UAE's energy-intensive economic structure (oil sector dominance) "
    "partially offsetting efficiency gains. Egypt, Jordan, Tunisia, and Morocco exhibit positive "
    "but small partial rebound (0.8%–1.8%), consistent with developing-economy patterns where "
    "income growth moderately offsets efficiency savings.")

add_heading(doc, "9.2 Method 2 (EEE) Findings", level=2)
add_body(doc,
    "Method 2 results diverge substantially from Method 1. Egypt, Jordan, and Morocco register "
    "backfire (Re_M2 = 200%), a consequence of the optimizer converging to the lower bound of ρ "
    "(−0.5), implying σ = 2.0 (strong KL-Energy substitutability). Under such high substitutability, "
    "the EEE formula mechanically produces large rebound. Tunisia (Re_M2 = 35.6%, σ = 0.27) and "
    "UAE (Re_M2 = 26.2%, σ = 0.17) produce more moderate estimates, as their fitted ρ lies in the "
    "interior, implying complementarity between the KL aggregate and energy.")

add_heading(doc, "9.3 Methodological Divergence", level=2)
add_body(doc,
    "The large gap between Method 1 and Method 2 estimates is consistent with findings in "
    "Brockway et al. (2017), who note that the two methods measure different aspects of rebound: "
    "Method 1 captures observed energy intensity trends and attributes changes to technical progress (λ), "
    "while Method 2 derives rebound from structural elasticities (ρ) and is therefore highly sensitive "
    "to the CES parameter estimates. The boundary solutions for ρ in three countries limit the "
    "reliability of Method 2 for those cases.")

add_heading(doc, "9.4 Limitations", level=2)
limitations = [
    "Energy proxy: using primary energy (Mtoe) as useful exergy proxy introduces measurement error. Ideally, exergy conversion factors should be applied.",
    "Short CES panel (34 years) limits identification of ρ, particularly when growth in K, L, and E are co-linear.",
    "Uniform sE = 0.08 does not account for cross-country variation in energy prices and cost shares.",
    "Bootstrap CI for Method 2 is wide when ρ hits its boundary, reflecting genuine structural uncertainty.",
    "λ is assumed time-invariant; in reality, embodied technical change may accelerate or decelerate over time.",
    "Base-year 1990 choice affects normalisation and may introduce level-bias if 1990 is not a 'normal' year for any country.",
]
for lim in limitations:
    add_bullet(doc, lim)

doc.add_page_break()

# ─── SECTION 10: CONCLUSIONS ──────────────────────────────────────────────────
add_heading(doc, "10. Conclusions")
add_horizontal_rule(doc)
add_body(doc,
    "This study applied the Brockway et al. (2017) dual-method framework to estimate national "
    "energy rebound for five MENA economies over 1990–2023. The key findings are:")

concl_data = [
    ("UAE",    "Super-conservation","Partial rebound","Negative λ and low σ (0.17) indicate energy-KL complementarity and genuine efficiency gains exceeding direct savings."),
    ("Egypt",  "Partial rebound",  "Backfire",       "Low Method 1 rebound (1.4%) is reliable; Method 2 backfire is driven by ρ at boundary and should be treated with caution."),
    ("Jordan", "Partial rebound",  "Backfire",       "Method 1 rebound (1.2%) is modest; ρ boundary issue makes Method 2 unreliable for this country."),
    ("Tunisia","Partial rebound",  "Partial rebound","Only country where both methods agree (M1=1.8%, M2=35.6%); higher confidence in partial rebound conclusion."),
    ("Morocco","Partial rebound",  "Backfire",       "Low Method 1 rebound (0.8%); ρ boundary makes Method 2 backfire finding unreliable."),
]
c_tbl = doc.add_table(rows=len(concl_data)+1, cols=4)
c_tbl.style = 'Table Grid'
c_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
add_header_row(c_tbl, ["Country","State M1","State M2","Key Finding"])
for ri, (country, s1, s2, finding) in enumerate(concl_data, 1):
    bg = 'EEF3FA' if ri%2 else 'FFFFFF'
    fmt_cell(c_tbl.rows[ri].cells[0], country, bold=True, size=9, bg=bg)
    c1 = STATE_COLORS.get(s1, RGBColor(0,0,0))
    c2 = STATE_COLORS.get(s2, RGBColor(0,0,0))
    fmt_cell(c_tbl.rows[ri].cells[1], s1, size=9, color=c1, bold=True, bg=bg)
    fmt_cell(c_tbl.rows[ri].cells[2], s2, size=9, color=c2, bold=True, bg=bg)
    fmt_cell(c_tbl.rows[ri].cells[3], finding, size=9, align='LEFT', bg=bg)
add_caption(doc, "Table 7. Country-level conclusions and key findings.")

doc.add_paragraph()
add_body(doc,
    "Overall, the AES/PES method provides consistent evidence that energy efficiency policies "
    "across all five MENA economies have delivered genuine energy savings, with only modest rebound "
    "(< 2%). Tunisia is the most robust case, with both methods independently confirming partial "
    "rebound. For Egypt, Jordan, and Morocco, the high-σ CES solutions warrant further investigation "
    "— potentially with longer time series, exergy data, or cross-sectional identification strategies.")

doc.add_page_break()

# ─── SECTION 11: REFERENCES ───────────────────────────────────────────────────
add_heading(doc, "11. References")
add_horizontal_rule(doc)
refs = [
    "Brockway, P.E., Sorrell, S., Semieniuk, G., Heun, M.K., & Court, V. (2017). Energy rebound as a potential threat to a low-carbon future: findings from a new exergy-based analysis. Energies, 10(1), 51.",
    "Feenstra, R.C., Inklaar, R., & Timmer, M.P. (2015). The Next Generation of the Penn World Table. American Economic Review, 105(10), 3150–3182.",
    "OAPEC — Organisation of Arab Petroleum Exporting Countries. Energy statistics, various years.",
    "Sorrell, S. (2007). The Rebound Effect: an assessment of the evidence for economy-wide energy savings from improved energy efficiency. UK Energy Research Centre (UKERC), London.",
    "Arrow, K.J., Chenery, H.B., Minhas, B.S., & Solow, R.M. (1961). Capital-labour substitution and economic efficiency. Review of Economics and Statistics, 43(3), 225–250.",
]
for ref in refs:
    add_bullet(doc, ref)

# ─── SAVE ─────────────────────────────────────────────────────────────────────
doc.save(DOCX_PATH)
print(f"Word report saved: {DOCX_PATH}")
size_mb = os.path.getsize(DOCX_PATH)/1e6
print(f"File size: {size_mb:.2f} MB")
