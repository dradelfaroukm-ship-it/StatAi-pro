"""
Generate comprehensive PDF report for MENA Energy Rebound Analysis
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import io, os, textwrap, warnings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                 TableStyle, Image, PageBreak, HRFlowable,
                                 KeepTogether)
from reportlab.platypus.flowables import BalancedColumns
from reportlab.lib.utils import ImageReader

warnings.filterwarnings('ignore')

# ─── paths ────────────────────────────────────────────────────────────────────
OUT_DIR = "/home/user/StatAi-pro/outputs/"
PDF_PATH = "/home/user/StatAi-pro/outputs/MENA_Energy_Rebound_Report.pdf"

# ─── load CSVs ────────────────────────────────────────────────────────────────
df_sum   = pd.read_csv(OUT_DIR + "rebound_summary_all_countries.csv")
df_ces   = pd.read_csv(OUT_DIR + "CES_parameters_all_countries.csv")
df_m1    = pd.read_csv(OUT_DIR + "method1_annual_rebound_all_countries.csv")
df_m2    = pd.read_csv(OUT_DIR + "method2_results_all_countries.csv")
df_norm  = pd.read_csv(OUT_DIR + "normalized_data_all_countries.csv")

COUNTRIES = ["UAE", "Egypt", "Jordan", "Tunisia", "Morocco"]
PALETTE   = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd"]
C_COLOR   = dict(zip(COUNTRIES, PALETTE))

sE, sL, sK = 0.08, 0.46, 0.46

# ─── helper: fig → ReportLab Image ────────────────────────────────────────────
def fig_to_rl_image(fig, width_cm=17, height_cm=None):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=160, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    w = width_cm * cm
    if height_cm:
        return Image(buf, width=w, height=height_cm*cm)
    img = Image(buf, width=w)
    return img

# ══════════════════════════════════════════════════════════════════════════════
# BUILD ALL CUSTOM FIGURES
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
    fig.suptitle("Normalized Production Function Inputs (Base Year = 1990)", fontsize=13, fontweight='bold', y=1.01)
    fig.tight_layout()
    return fig

def make_ei_fig():
    fig, ax = plt.subplots(figsize=(13, 5))
    for c, color in C_COLOR.items():
        sub = df_norm[df_norm["country"]==c]
        ax.plot(sub["year"], sub["EI"]*1e6, label=c, color=color, linewidth=2)
    ax.set_title("Energy Intensity (EI = E / Y) over Time", fontsize=12, fontweight='bold')
    ax.set_xlabel("Year"); ax.set_ylabel("EI (toe per million US$)")
    ax.legend(); ax.grid(alpha=0.3)
    fig.tight_layout()
    return fig

def make_m1_fig():
    fig, axes = plt.subplots(1, 5, figsize=(18, 4.5), sharey=False)
    for ax, (c, color) in zip(axes, C_COLOR.items()):
        sub = df_m1[(df_m1["country"]==c) & (df_m1["valid"]==True)]
        ax.bar(sub["year"], sub["Re_M1_annual"], color=color, alpha=0.75, edgecolor='white')
        # CI band from summary
        row = df_sum[df_sum["country"]==c].iloc[0]
        ax.axhline(row["Re_M1_base"], color='black', linewidth=1.5, linestyle='-', label=f'Mean={row["Re_M1_base"]:.2f}%')
        ax.axhline(row["Re_M1_lo"], color='gray', linewidth=1, linestyle='--')
        ax.axhline(row["Re_M1_hi"], color='gray', linewidth=1, linestyle='--')
        ax.axhline(0, color='red', linewidth=0.8, linestyle=':')
        ax.set_title(c, fontsize=11, fontweight='bold', color=color)
        ax.set_xlabel("Year"); ax.set_ylabel("Re_M1 (%)") if ax == axes[0] else None
        ax.legend(fontsize=7); ax.grid(alpha=0.25)
        ax.tick_params(axis='x', rotation=45)
    fig.suptitle("Method 1 (AES/PES): Annual Rebound per Country", fontsize=12, fontweight='bold')
    fig.tight_layout()
    return fig

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
    return fig

def make_comparison_fig():
    x = np.arange(len(COUNTRIES))
    w = 0.35
    m1_vals = [df_sum[df_sum["country"]==c]["Re_M1_base"].values[0] for c in COUNTRIES]
    m2_vals = [min(df_sum[df_sum["country"]==c]["Re_M2_base"].values[0], 220) for c in COUNTRIES]
    m1_lo = [abs(df_sum[df_sum["country"]==c]["Re_M1_base"].values[0] -
                  df_sum[df_sum["country"]==c]["Re_M1_lo"].values[0]) for c in COUNTRIES]
    m1_hi = [abs(df_sum[df_sum["country"]==c]["Re_M1_hi"].values[0] -
                  df_sum[df_sum["country"]==c]["Re_M1_base"].values[0]) for c in COUNTRIES]
    fig, ax = plt.subplots(figsize=(12, 5.5))
    bars1 = ax.bar(x - w/2, m1_vals, w, label='Method 1 (AES/PES)', color='#4878d0', alpha=0.85,
                   yerr=[m1_lo, m1_hi], capsize=4, error_kw={'elinewidth':1.5})
    bars2 = ax.bar(x + w/2, m2_vals, w, label='Method 2 (EEE)', color='#ee854a', alpha=0.85)
    ax.axhline(100, color='red', linestyle='--', linewidth=1.3, label='Backfire threshold (100%)')
    ax.axhline(0,   color='black', linestyle='-',  linewidth=0.7)
    ax.set_xticks(x); ax.set_xticklabels(COUNTRIES, fontsize=11)
    ax.set_ylabel("Rebound Estimate (%)"); ax.set_title("Rebound Estimates: Method 1 vs Method 2 (base-fit)", fontsize=12, fontweight='bold')
    ax.legend(); ax.grid(axis='y', alpha=0.3)
    # Annotate bars
    for bar, val in zip(bars1, m1_vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5, f'{val:.1f}%', ha='center', va='bottom', fontsize=8)
    for bar, val, orig in zip(bars2, m2_vals, [df_sum[df_sum["country"]==c]["Re_M2_base"].values[0] for c in COUNTRIES]):
        label = f'{orig:.1f}%' if orig < 220 else '200%\n(Backfire)'
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.5, label, ha='center', va='bottom', fontsize=8)
    fig.tight_layout()
    return fig

def make_spider_fig():
    # Radar chart comparing CES parameters across countries
    params = ['θ', 'λ×10', 'δ', 'δ₁', 'σ(KL-E)', 'R²']
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
    ax.set_xticklabels(params, fontsize=11)
    ax.set_title("CES Parameter Radar (normalized)", fontsize=12, fontweight='bold', pad=18)
    ax.legend(loc='upper right', bbox_to_anchor=(1.35, 1.1))
    fig.tight_layout()
    return fig

def make_ei_bar_fig():
    # EI in 1990 vs 2023
    ei_1990, ei_2023 = [], []
    for c in COUNTRIES:
        sub = df_norm[df_norm["country"]==c]
        ei_1990.append(sub[sub["year"]==1990]["EI"].values[0]*1e6)
        ei_2023.append(sub[sub["year"]==2023]["EI"].values[0]*1e6)
    x = np.arange(len(COUNTRIES)); w=0.35
    fig, ax = plt.subplots(figsize=(10,4.5))
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
    return fig

# ══════════════════════════════════════════════════════════════════════════════
# REPORTLAB STYLES
# ══════════════════════════════════════════════════════════════════════════════
styles = getSampleStyleSheet()

H1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1a3a5c'),
                    spaceAfter=6, spaceBefore=14, leading=24)
H2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#2563a8'),
                    spaceAfter=4, spaceBefore=10, leading=18)
H3 = ParagraphStyle('H3', parent=styles['Heading3'], fontSize=11, textColor=colors.HexColor('#1a3a5c'),
                    spaceAfter=3, spaceBefore=7, leading=14)
BODY = ParagraphStyle('BODY', parent=styles['Normal'], fontSize=9.5, leading=14,
                      spaceAfter=5, alignment=TA_JUSTIFY)
SMALL = ParagraphStyle('SMALL', parent=styles['Normal'], fontSize=8.5, leading=12, spaceAfter=3)
CENTER = ParagraphStyle('CENTER', parent=styles['Normal'], fontSize=9.5, alignment=TA_CENTER, leading=12)
CAPTION = ParagraphStyle('CAPTION', parent=styles['Normal'], fontSize=8.5, leading=11,
                          textColor=colors.HexColor('#555555'), alignment=TA_CENTER, spaceAfter=8)
MONO = ParagraphStyle('MONO', parent=styles['Code'], fontSize=8, leading=11, spaceAfter=3,
                       backColor=colors.HexColor('#f4f4f4'), leftIndent=10)
BULLET = ParagraphStyle('BULLET', parent=styles['Normal'], fontSize=9.5, leading=13,
                         leftIndent=14, bulletIndent=4, spaceAfter=2)

def hr(): return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc'), spaceAfter=6)
def sp(h=6): return Spacer(1, h)

def tbl_style(header_color='#2563a8'):
    return TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor(header_color)),
        ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,0), 8),
        ('FONTNAME',   (0,1), (-1,-1),'Helvetica'),
        ('FONTSIZE',   (0,1), (-1,-1), 8),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, colors.HexColor('#eef3fa')]),
        ('GRID',       (0,0), (-1,-1), 0.4, colors.HexColor('#cccccc')),
        ('ALIGN',      (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0), (-1,-1), 5),
        ('RIGHTPADDING',(0,0),(-1,-1), 5),
    ])

# state colors
STATE_COLORS = {
    'Super-conservation': '#0072B2',
    'Partial rebound':    '#009E73',
    'Full rebound':       '#F0E442',
    'Backfire':           '#D55E00',
}

def state_cell(s):
    col = STATE_COLORS.get(s, '#888888')
    return Paragraph(f'<font color="{col}"><b>{s}</b></font>', CENTER)

# ══════════════════════════════════════════════════════════════════════════════
# BUILD PDF
# ══════════════════════════════════════════════════════════════════════════════
doc = SimpleDocTemplate(PDF_PATH, pagesize=A4,
                        leftMargin=2*cm, rightMargin=2*cm,
                        topMargin=2.2*cm, bottomMargin=2.2*cm,
                        title="MENA National Energy Rebound Analysis")
story = []

# ─── COVER PAGE ───────────────────────────────────────────────────────────────
story.append(sp(40))
story.append(Paragraph("MENA National Energy Rebound Analysis", ParagraphStyle('Cover', parent=H1,
    fontSize=24, alignment=TA_CENTER, textColor=colors.HexColor('#1a3a5c'), spaceAfter=10)))
story.append(Paragraph("Estimating National Energy Rebound Effects using Brockway et al. (2017)", ParagraphStyle(
    'CoverSub', parent=BODY, fontSize=13, alignment=TA_CENTER, textColor=colors.HexColor('#2563a8'), spaceAfter=6)))
story.append(hr())
story.append(sp(12))

cover_info = [
    ["Countries",  "UAE · Egypt · Jordan · Tunisia · Morocco"],
    ["Time Period","1990 – 2023  (34 years per country)"],
    ["Methods",    "Method 1: AES/PES  |  Method 2: EEE (Brockway et al. 2017)"],
    ["Production Function", "Nested KL-E CES (3-factor, constant-returns)"],
    ["Base Year",  "1990"],
    ["Cost Shares","sE = 0.08  |  sL = 0.46  |  sK = 0.46"],
    ["Data Source","PWT 11.0 (K, L, GDP)  |  OAPEC (Energy in Mtoe)"],
    ["Date",       "June 2026"],
]
ci_tbl = Table([[Paragraph(f'<b>{r[0]}</b>', SMALL), Paragraph(r[1], SMALL)] for r in cover_info],
               colWidths=[4.5*cm, 12*cm])
ci_tbl.setStyle(TableStyle([
    ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#eef3fa'), colors.white]),
    ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cccccc')),
    ('TOPPADDING',(0,0),(-1,-1),5), ('BOTTOMPADDING',(0,0),(-1,-1),5),
    ('LEFTPADDING',(0,0),(-1,-1),8), ('RIGHTPADDING',(0,0),(-1,-1),8),
]))
story.append(ci_tbl)
story.append(sp(20))

# coloured state legend on cover
legend_data = [["Rebound State", "Criterion", "Interpretation"]]
for state, crit, interp in [
    ("Super-conservation", "Re < 0%",     "Energy use falls faster than efficiency gains"),
    ("Partial rebound",    "0% < Re < 100%","Some of efficiency gain is taken back"),
    ("Full rebound",       "Re = 100%",   "All efficiency gains are taken back"),
    ("Backfire",           "Re > 100%",   "Energy use rises beyond original level"),
]:
    legend_data.append([Paragraph(f'<font color="{STATE_COLORS[state]}"><b>{state}</b></font>', CENTER),
                         Paragraph(crit, CENTER), Paragraph(interp, SMALL)])
ltbl = Table(legend_data, colWidths=[4.5*cm, 3.5*cm, 9*cm])
ltbl.setStyle(tbl_style())
story.append(Paragraph("Rebound State Classification", H3))
story.append(ltbl)
story.append(PageBreak())

# ─── SECTION 1: INTRODUCTION & METHODOLOGY ────────────────────────────────────
story.append(Paragraph("1. Introduction", H1))
story.append(hr())
story.append(Paragraph(
    "Energy efficiency improvements are often expected to reduce total energy consumption. "
    "However, the <b>energy rebound effect</b> describes the phenomenon by which some — "
    "or all — of the anticipated savings are offset by behavioural, economic, or structural responses. "
    "When the rebound exceeds 100%, a <i>backfire</i> is said to occur: energy use actually increases "
    "beyond the pre-efficiency baseline.", BODY))
story.append(Paragraph(
    "This report estimates national-level energy rebound effects for five MENA economies — "
    "<b>UAE, Egypt, Jordan, Tunisia, and Morocco</b> — over 1990–2023, using the two complementary "
    "macroeconomic methods proposed by <b>Brockway et al. (2017)</b>: the AES/PES method (Method 1) "
    "and the Energy-Economy-Environment (EEE) method (Method 2). Both methods require estimation of "
    "a nested constant-elasticity-of-substitution (CES) production function.", BODY))

story.append(Paragraph("2. Data & Assumptions", H1))
story.append(hr())
story.append(Paragraph("<b>Dataset:</b> Sheet1 of the supplied Excel workbook; 170 usable observations "
    "after removing header artefacts.", BODY))

assump = [
    "Energy (Mtoe/yr) used as proxy for <i>both</i> primary energy and useful exergy — no separate exergy dataset available.",
    "All variables normalised to 1990 = 1 as base year.",
    "sE = 0.08 applied uniformly (consistent with Brockway et al. 2017 for developing economies).",
    "Labour income share = 0.50 → sL = sK = 0.50 × (1 − sE) = 0.46.",
    "λ (embodied technical change) treated as time-invariant for Method 1 annual rebound calculation.",
]
for a in assump:
    story.append(Paragraph(f"• {a}", BULLET))
story.append(sp(4))

# Cost share confirmation table
cs_data = [["Parameter","Formula","Value","Verify"],
           ["sE","Given","0.08","—"],
           ["sL","0.50 × (1 − sE)","0.46","—"],
           ["sK","0.50 × (1 − sE)","0.46","—"],
           ["Sum","sE + sL + sK","1.00","✓"]]
cs_tbl = Table(cs_data, colWidths=[3*cm,6*cm,3*cm,3*cm])
cs_tbl.setStyle(tbl_style())
story.append(Paragraph("Cost Share Parameters", H3))
story.append(cs_tbl)
story.append(sp(8))

story.append(Paragraph("3. Production Function", H1))
story.append(hr())
story.append(Paragraph("A <b>nested KL-E constant-elasticity-of-substitution (CES) production function</b> "
    "is fitted separately for each country using non-linear least squares:", BODY))
story.append(Paragraph(
    "<i>y<sub>t</sub> = θ · exp(λ·t) · [δ₁ · (δ · k<sub>t</sub><sup>−ρ₁</sup> + (1−δ) · l<sub>t</sub><sup>−ρ₁</sup>)<sup>ρ/ρ₁</sup> + (1−δ₁) · u<sub>t</sub><sup>−ρ</sup>]<sup>−1/ρ</sup></i>",
    ParagraphStyle('eq', parent=BODY, fontSize=10, alignment=TA_CENTER, spaceBefore=6, spaceAfter=6)))
story.append(Paragraph("where all lower-case variables are normalised to 1990, and <i>t</i> is years since 1990. "
    "Parameters: θ (TFP scale), λ (embodied technical change), δ (K-share in KL nest), "
    "δ₁ (KL-share vs Energy), ρ (KL-Energy substitution), ρ₁ (K-L substitution). "
    "Elasticities: σ = 1/(1+ρ), σ₁ = 1/(1+ρ₁).", BODY))
story.append(Paragraph("Fitting used <b>50 random starting points</b> per country to avoid local minima; "
    "the solution with lowest RSS was retained. <b>1000-sample residual bootstrap</b> provides 95% CIs.", BODY))
story.append(PageBreak())

# ─── SECTION 4: NORMALIZED INPUTS ─────────────────────────────────────────────
story.append(Paragraph("4. Data Overview: Normalized Inputs", H1))
story.append(hr())
story.append(fig_to_rl_image(make_normalized_fig(), width_cm=17, height_cm=12))
story.append(Paragraph("Figure 1. Normalized production function inputs (base year 1990 = 1). "
    "Strong growth in GDP (y) and Capital (k) is visible in all countries, particularly UAE. "
    "Labour (l) diverges notably: UAE exhibits rapid workforce expansion, while Tunisian and Moroccan "
    "labour inputs remain relatively stable.", CAPTION))
story.append(sp(8))
story.append(fig_to_rl_image(make_ei_fig(), width_cm=17, height_cm=7))
story.append(Paragraph("Figure 2. Energy intensity (EI = E/Y, in toe per million US$) over time. "
    "A general declining trend indicates improving energy efficiency in all five economies.", CAPTION))
story.append(sp(6))
story.append(fig_to_rl_image(make_ei_bar_fig(), width_cm=17, height_cm=7))
story.append(Paragraph("Figure 3. Energy intensity comparison 1990 vs 2023. "
    "Percentage change annotated above each pair.", CAPTION))
story.append(PageBreak())

# ─── SECTION 5: CES RESULTS ───────────────────────────────────────────────────
story.append(Paragraph("5. CES Production Function Results", H1))
story.append(hr())
story.append(Paragraph("Table 1 reports the best-fit CES parameters and 95% bootstrap confidence intervals "
    "for each country. R² values above 0.97 confirm excellent model fit across all five economies.", BODY))

ces_hdr = ["Country","θ [CI]","λ [CI]","δ","δ₁","ρ [CI]","σ (KL-E)","σ₁ (K-L)","R²"]
ces_rows = [ces_hdr]
for c in COUNTRIES:
    r = df_ces[df_ces["country"]==c].iloc[0]
    def fmt_ci(val, lo, hi): return f"{val:.4f}\n[{lo:.3f}, {hi:.3f}]"
    ces_rows.append([
        c,
        fmt_ci(r['theta'],  r['theta_lo'],  r['theta_hi']),
        fmt_ci(r['lambda'], r['lambda_lo'], r['lambda_hi']),
        f"{r['delta']:.4f}",
        f"{r['delta1']:.4f}",
        fmt_ci(r['rho'],   r['rho_lo'],   r['rho_hi']),
        f"{r['sigma']:.4f}",
        f"{r['sigma1']:.4f}",
        f"{r['R2']:.4f}",
    ])
ces_tbl = Table(ces_rows, colWidths=[2.0*cm,2.7*cm,2.4*cm,1.5*cm,1.5*cm,2.4*cm,1.8*cm,1.8*cm,1.5*cm])
ces_tbl.setStyle(tbl_style())
story.append(ces_tbl)
story.append(Paragraph("Table 1. CES parameter estimates. CI = 95% bootstrap confidence interval. "
    "ρ at bound (−0.5 or 5.0) indicates the optimizer reached the parameter boundary.", CAPTION))
story.append(sp(8))

story.append(Paragraph("5.1 Elasticity of Substitution Interpretation", H2))
interp_rows = [["Country","σ (KL-E)","Interpretation"],
["UAE",   "0.167","KL & Energy are <b>complements</b> (σ < 1) — limited substitutability"],
["Egypt", "2.000","KL & Energy are <b>strong substitutes</b> (σ > 1, at boundary)"],
["Jordan","2.000","KL & Energy are <b>strong substitutes</b> (σ > 1, at boundary)"],
["Tunisia","0.266","KL & Energy are <b>weak complements</b> (σ < 1)"],
["Morocco","2.000","KL & Energy are <b>strong substitutes</b> (σ > 1, at boundary)"],
]
it = Table([[Paragraph(str(c), SMALL) for c in row] for row in interp_rows],
           colWidths=[2.5*cm,2.5*cm,12*cm])
it.setStyle(tbl_style())
story.append(it)
story.append(Paragraph("Table 2. KL-Energy elasticity of substitution and economic interpretation.", CAPTION))
story.append(sp(6))
story.append(Paragraph("Note: Egypt, Jordan, and Morocco converge to the lower bound of ρ (−0.5 → σ = 2.0), "
    "indicating the optimizer could not identify an interior solution. This is a known challenge with short "
    "time-series CES estimation and should be interpreted with caution. Wide bootstrap intervals for ρ "
    "in these countries confirm high parameter uncertainty.", BODY))
story.append(sp(4))
story.append(fig_to_rl_image(make_spider_fig(), width_cm=11, height_cm=10))
story.append(Paragraph("Figure 4. Radar chart of normalised CES parameters across countries "
    "(σ capped at 2.5 for scaling).", CAPTION))
story.append(PageBreak())

# ─── SECTION 6: METHOD 1 ──────────────────────────────────────────────────────
story.append(Paragraph("6. Method 1: AES/PES Rebound", H1))
story.append(hr())
story.append(Paragraph("<b>Equations:</b>", H3))
eqs_m1 = [
    ("Potential Energy Saved",    "PESₜ₊₁ = Yₜ₊₁ × (EIₜ − EIₜ₊₁)"),
    ("Rebound Energy Consumed",   "(PES − AES)ₜ₊₁ = λ × (Yₜ₊₁ − Yₜ) × EIₜ₊₁"),
    ("Annual Rebound",            "Reₜ₊₁ = [(PES − AES) / PES] × 100"),
    ("Mean Rebound (Method 1)",   "Re_M1 = (1/N) × Σ Reₜ₊₁   [valid years only, PES > 0]"),
    ("Decomposition",             "Reₜ₊₁ = λ × [(Yₜ₊₁ − Yₜ)/Yₜ₊₁] × [EIₜ₊₁/(EIₜ − EIₜ₊₁)] × 100"),
]
eq_tbl = Table([[Paragraph(f"<b>{n}</b>", SMALL), Paragraph(f"<i>{e}</i>", SMALL)]
               for n,e in eqs_m1], colWidths=[5.5*cm,11.5*cm])
eq_tbl.setStyle(TableStyle([
    ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#f4f8ff'),colors.white]),
    ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cccccc')),
    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
]))
story.append(eq_tbl)
story.append(sp(6))
story.append(Paragraph("Years with PES ≤ 0 (energy intensity did not decline) are excluded from the mean; "
    "this reflects periods when technological progress did not improve energy efficiency.", BODY))
story.append(sp(6))

# M1 summary table
m1_hdr = ["Country","Valid Years","Re_M1 (2.5%)","Re_M1 (base)","Re_M1 (97.5%)","State"]
m1_rows = [m1_hdr]
for c in COUNTRIES:
    r = df_sum[df_sum["country"]==c].iloc[0]
    valid = df_m1[(df_m1["country"]==c)&(df_m1["valid"]==True)].shape[0]
    m1_rows.append([c, str(valid),
        f"{r['Re_M1_lo']:.2f}%", f"{r['Re_M1_base']:.2f}%", f"{r['Re_M1_hi']:.2f}%",
        state_cell(r['State_M1'])])
m1_tbl = Table(m1_rows, colWidths=[2.5*cm,2.5*cm,3.2*cm,3.2*cm,3.2*cm,4.4*cm])
m1_tbl.setStyle(tbl_style())
story.append(m1_tbl)
story.append(Paragraph("Table 3. Method 1 results summary with 95% bootstrap CI (derived from λ uncertainty).", CAPTION))
story.append(sp(8))
story.append(fig_to_rl_image(make_m1_fig(), width_cm=17, height_cm=8))
story.append(Paragraph("Figure 5. Annual Method 1 rebound per country. Bars show valid years only. "
    "Horizontal lines: solid = mean base-fit, dashed = 95% bootstrap CI bounds.", CAPTION))
story.append(PageBreak())

# Annual detail tables — one per country
story.append(Paragraph("6.1 Annual Rebound Decomposition Tables", H2))
story.append(Paragraph("For each country, the table below shows all valid years (PES > 0) with "
    "the full A × B × C decomposition of annual rebound.", BODY))
for c in COUNTRIES:
    row_ces = df_ces[df_ces["country"]==c].iloc[0]
    lam = row_ces['lambda']
    sub = df_m1[(df_m1["country"]==c)&(df_m1["valid"]==True)].copy()
    story.append(Paragraph(f"<b>{c}</b>  (λ = {lam:.6f})", H3))
    det_hdr = ["Year","PES (Mtoe)","(PES-AES)(Mtoe)","Re annual (%)","A=λ","B=(ΔY/Y)","C=(EI₁/ΔEI)"]
    det_rows = [det_hdr]
    for _, rw in sub.iterrows():
        det_rows.append([str(int(rw['year'])),
            f"{rw['PES']:.4f}", f"{rw['PES_AES']:.6f}", f"{rw['Re_M1_annual']:.4f}",
            f"{rw['A_lambda']:.6f}", f"{rw['B']:.6f}", f"{rw['C']:.4f}"])
    dt = Table(det_rows, colWidths=[1.5*cm,2.8*cm,3.2*cm,2.8*cm,2.5*cm,2.5*cm,2.7*cm])
    dt.setStyle(tbl_style('#2563a8'))
    story.append(dt)
    story.append(sp(5))
story.append(PageBreak())

# ─── SECTION 7: METHOD 2 ──────────────────────────────────────────────────────
story.append(Paragraph("7. Method 2: EEE Rebound", H1))
story.append(hr())
story.append(Paragraph("<b>Equation (Brockway et al. 2017, eq. 11):</b>", H3))
story.append(Paragraph(
    "<i>Re_M2 = { [(1 + sE + sK)(1+ρ) + ρ(sE − sK − 1) + sE ] / [(1 + sE + sK)(1+ρ)] } × 100</i>",
    ParagraphStyle('eq2', parent=BODY, fontSize=10, alignment=TA_CENTER, spaceBefore=5, spaceAfter=5)))
story.append(Paragraph("Decomposition into substitution and output effects:", BODY))
eqs_m2 = [
    ("Substitution effect", "η_sub = ρ(sE − 1) / [(1 + sE + sK)(1 + ρ)]  ;  Re_sub = (1 + η_sub) × 100"),
    ("Total effect",        "η_total = Re_M2/100 − 1"),
    ("Output effect",       "η_output = η_total − η_sub  ;  Re_output = η_output × 100"),
]
eq2_tbl = Table([[Paragraph(f"<b>{n}</b>", SMALL), Paragraph(f"<i>{e}</i>", SMALL)]
               for n,e in eqs_m2], colWidths=[4*cm,13*cm])
eq2_tbl.setStyle(TableStyle([
    ('ROWBACKGROUNDS',(0,0),(-1,-1),[colors.HexColor('#fff8ee'),colors.white]),
    ('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#cccccc')),
    ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
]))
story.append(eq2_tbl)
story.append(sp(6))

# M2 results table
m2_hdr = ["Country","ρ","σ(KL-E)","η_sub","Re_sub(%)","η_out","Re_out(%)","Re_M2 base","State"]
m2_rows_data = [m2_hdr]
for c in COUNTRIES:
    r  = df_sum[df_sum["country"]==c].iloc[0]
    rc = df_ces[df_ces["country"]==c].iloc[0]
    rho = rc['rho']
    denom = (1 + sE + sK)*(1 + rho)
    h_sub = rho*(sE - 1)/denom if abs(denom)>1e-9 else float('nan')
    re_m2 = r['Re_M2_base']
    h_tot = re_m2/100 - 1
    h_out = h_tot - h_sub
    m2_rows_data.append([c, f"{rho:.4f}", f"{rc['sigma']:.4f}",
        f"{h_sub:.4f}", f"{(1+h_sub)*100:.2f}%",
        f"{h_out:.4f}", f"{h_out*100:.2f}%",
        f"{re_m2:.2f}%", state_cell(r['State_M2'])])
m2_tbl = Table(m2_rows_data, colWidths=[2*cm,1.8*cm,2*cm,2*cm,2*cm,2*cm,2*cm,2.4*cm,3*cm])
m2_tbl.setStyle(tbl_style('#c05a00'))
story.append(m2_tbl)
story.append(Paragraph("Table 4. Method 2 results with effect decomposition. "
    "Re_M2 = 200% indicates backfire (ρ at lower bound −0.5 → σ = 2.0).", CAPTION))
story.append(sp(6))

# M2 bootstrap table
m2b_hdr = ["Country","Re_M2 (2.5%)","Re_M2 (base)","Re_M2 (97.5%)"]
m2b_rows = [m2b_hdr]
for c in COUNTRIES:
    r = df_sum[df_sum["country"]==c].iloc[0]
    m2b_rows.append([c, f"{r['Re_M2_lo']:.2f}%", f"{r['Re_M2_base']:.2f}%", f"{r['Re_M2_hi']:.2f}%"])
m2b_tbl = Table(m2b_rows, colWidths=[4*cm,4.5*cm,4.5*cm,4.5*cm])
m2b_tbl.setStyle(tbl_style())
story.append(Paragraph("Method 2 Bootstrap Confidence Intervals (95%)", H3))
story.append(m2b_tbl)
story.append(Paragraph("Table 5. Re_M2 bootstrap CI using ρ at 2.5th and 97.5th percentile. "
    "Wide intervals (including both 200% and ~26%) reflect high ρ uncertainty.", CAPTION))
story.append(sp(8))

# Sensitivity plot
story.append(fig_to_rl_image(make_m2_sens_fig(), width_cm=17, height_cm=8))
story.append(Paragraph("Figure 6. Sensitivity of Re_M2 to energy cost share sE. "
    "Countries with ρ at lower bound (−0.5) remain at 200% regardless of sE. "
    "Red dashed line marks the backfire threshold.", CAPTION))

# Sensitivity tables
story.append(Paragraph("7.1 Sensitivity Tables: sE vs Re_M2", H2))
for c in COUNTRIES:
    sub = df_m2[df_m2["country"]==c].sort_values("sE")
    rho_val = sub["rho"].iloc[0]
    story.append(Paragraph(f"<b>{c}</b>  (ρ = {rho_val:.4f})", H3))
    sh = [["sE (%)","sK (%)","Re_M2 (%)"]]
    for _, rw in sub.iterrows():
        sh.append([f"{rw['sE']*100:.0f}%", f"{rw['sK']*100:.1f}%", f"{rw['Re_M2_sensitivity']:.2f}%"])
    st_tbl = Table(sh, colWidths=[3.5*cm, 3.5*cm, 3.5*cm])
    st_tbl.setStyle(tbl_style())
    story.append(st_tbl); story.append(sp(5))
story.append(PageBreak())

# ─── SECTION 8: COMPARISON & SUMMARY ─────────────────────────────────────────
story.append(Paragraph("8. Cross-Country Comparison & Final Summary", H1))
story.append(hr())
story.append(fig_to_rl_image(make_comparison_fig(), width_cm=17, height_cm=8))
story.append(Paragraph("Figure 7. Grouped bar chart comparing Re_M1 (with 95% CI error bars) and "
    "Re_M2 base-fit for all five countries. Red dashed line = backfire threshold (100%).", CAPTION))
story.append(sp(8))

# Final summary table
fs_hdr = ["Country","Re_M1 2.5%","Re_M1 Base","Re_M1 97.5%","Re_M2 2.5%","Re_M2 Base","Re_M2 97.5%","σ(KL-E)","State M1","State M2"]
fs_rows = [fs_hdr]
for c in COUNTRIES:
    r = df_sum[df_sum["country"]==c].iloc[0]
    fs_rows.append([
        c,
        f"{r['Re_M1_lo']:.2f}%", f"{r['Re_M1_base']:.2f}%", f"{r['Re_M1_hi']:.2f}%",
        f"{r['Re_M2_lo']:.2f}%", f"{r['Re_M2_base']:.2f}%", f"{r['Re_M2_hi']:.2f}%",
        f"{r['sigma_KL_E']:.4f}",
        state_cell(r['State_M1']), state_cell(r['State_M2']),
    ])
fs_tbl = Table(fs_rows, colWidths=[1.8*cm,2*cm,2*cm,2.1*cm,2*cm,2*cm,2.1*cm,1.8*cm,2.9*cm,2.9*cm])
fs_tbl.setStyle(tbl_style())
story.append(fs_tbl)
story.append(Paragraph("Table 6. Comprehensive rebound summary for all five MENA countries. "
    "Colour-coded states: <font color='#0072B2'>■ Super-conservation</font>  "
    "<font color='#009E73'>■ Partial rebound</font>  "
    "<font color='#D55E00'>■ Backfire</font>.", CAPTION))
story.append(PageBreak())

# ─── SECTION 9: DISCUSSION ────────────────────────────────────────────────────
story.append(Paragraph("9. Discussion", H1))
story.append(hr())

story.append(Paragraph("9.1 Method 1 (AES/PES) Findings", H2))
story.append(Paragraph(
    "Method 1 yields low rebound estimates for all five countries (< 2%), suggesting that "
    "efficiency improvements in MENA economies have generally delivered net energy savings. "
    "<b>UAE</b> is the single outlier showing <i>super-conservation</i> (Re_M1 = −0.50%), driven by "
    "a <b>negative λ</b> (−0.0046), implying slight embodied technological regress in the fitted CES — "
    "possibly reflecting the UAE's energy-intensive economic structure (oil sector dominance) "
    "partially offsetting efficiency gains. "
    "Egypt, Jordan, Tunisia, and Morocco all exhibit positive but small partial rebound (0.8%–1.8%), "
    "consistent with developing-economy patterns where income growth moderately offsets efficiency savings.", BODY))

story.append(Paragraph("9.2 Method 2 (EEE) Findings", H2))
story.append(Paragraph(
    "Method 2 results diverge substantially from Method 1. <b>Egypt, Jordan, and Morocco</b> "
    "register backfire (Re_M2 = 200%), a consequence of the optimizer converging to the lower "
    "bound of ρ (−0.5), implying σ = 2.0 (strong KL-Energy substitutability). "
    "Under such high substitutability, the EEE formula mechanically produces large rebound. "
    "<b>Tunisia</b> (Re_M2 = 35.6%, σ = 0.27) and <b>UAE</b> (Re_M2 = 26.2%, σ = 0.17) "
    "produce more moderate estimates, as their fitted ρ lies in the interior, "
    "implying complementarity between KL aggregate and energy.", BODY))

story.append(Paragraph("9.3 Methodological Divergence", H2))
story.append(Paragraph(
    "The large gap between Method 1 and Method 2 estimates is consistent with findings in "
    "Brockway et al. (2017), who note that the two methods measure different aspects of rebound: "
    "Method 1 captures observed energy intensity trends and attributes changes to technical progress (λ), "
    "while Method 2 derives rebound from structural elasticities (ρ) and is therefore highly sensitive "
    "to the CES parameter estimates. The boundary solutions for ρ in three countries limit the "
    "reliability of Method 2 for those cases, and suggest a need for richer data (more years, "
    "auxiliary instruments) to identify ρ precisely.", BODY))

story.append(Paragraph("9.4 Limitations", H2))
for lim in [
    "Energy proxy: using primary energy (Mtoe) as useful exergy proxy introduces measurement error — ideally, exergy conversion factors should be applied.",
    "Short CES panel (34 years) limits identification of ρ, particularly when growth in K, L, and E are co-linear.",
    "Uniform sE = 0.08 does not account for cross-country variation in energy prices and shares.",
    "Bootstrap CI for Method 2 is dominated by ρ uncertainty, producing very wide intervals when ρ hits its bound.",
    "λ is assumed time-invariant; in reality, embodied technical change may accelerate or decelerate.",
]:
    story.append(Paragraph(f"• {lim}", BULLET))
story.append(PageBreak())

# ─── SECTION 10: CONCLUSIONS ──────────────────────────────────────────────────
story.append(Paragraph("10. Conclusions", H1))
story.append(hr())
concl_rows = [
    ["UAE",     "Super-conservation (M1)","Partial rebound (M2)","Negative λ, low σ (0.17) → energy-KL complementarity"],
    ["Egypt",   "Partial rebound (M1)",   "Backfire (M2)",       "Moderate M1, but ρ at bound → M2 unreliable"],
    ["Jordan",  "Partial rebound (M1)",   "Backfire (M2)",       "Moderate M1, but ρ at bound → M2 unreliable"],
    ["Tunisia", "Partial rebound (M1)",   "Partial rebound (M2)","Both methods agree → moderate rebound ~2% / ~36%"],
    ["Morocco", "Partial rebound (M1)",   "Backfire (M2)",       "Low M1 (0.8%), but ρ at bound → M2 unreliable"],
]
c_hdr = [["Country","State M1","State M2","Key Finding"]]
ct = Table(c_hdr + [[Paragraph(str(x), SMALL) for x in row] for row in concl_rows],
           colWidths=[2.5*cm,3.5*cm,3.5*cm,8*cm])
ct.setStyle(tbl_style())
story.append(ct)
story.append(sp(10))
story.append(Paragraph(
    "Overall, the AES/PES method suggests that energy efficiency policies in all five MENA countries "
    "have delivered genuine energy savings with only small rebound (< 2%). The EEE method produces "
    "higher and more uncertain estimates, driven by the structural elasticity of substitution. "
    "Tunisia stands out as the only country where both methods independently confirm partial rebound, "
    "providing greater confidence in its result. For Egypt, Jordan, and Morocco, the EEE-based backfire "
    "finding should be treated with caution due to boundary convergence of ρ.", BODY))

story.append(sp(8))
story.append(Paragraph("11. References", H1))
story.append(hr())
refs = [
    "Brockway, P.E., Sorrell, S., Semieniuk, G., Heun, M.K., & Court, V. (2017). "
    "Energy rebound as a potential threat to a low-carbon future: findings from a new exergy-based analysis. "
    "<i>Energies</i>, 10(1), 51. https://doi.org/10.3390/en10010051",
    "Feenstra, R.C., Inklaar, R., & Timmer, M.P. (2015). The Next Generation of the Penn World Table. "
    "<i>American Economic Review</i>, 105(10), 3150–3182.",
    "OAPEC (Organisation of Arab Petroleum Exporting Countries). Energy data, various years.",
    "Sorrell, S. (2007). The Rebound Effect: an assessment of the evidence for economy-wide energy savings "
    "from improved energy efficiency. UK Energy Research Centre.",
]
for ref in refs:
    story.append(Paragraph(f"• {ref}", BULLET))

# ─── BUILD ────────────────────────────────────────────────────────────────────

def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawString(2*cm, 1.4*cm, "MENA Energy Rebound Analysis — Brockway et al. (2017) Methods")
    canvas.drawRightString(w - 2*cm, 1.4*cm, f"Page {doc.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"PDF saved: {PDF_PATH}")
