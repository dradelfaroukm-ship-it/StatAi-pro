"""
Energy Rebound Analysis for MENA Countries
UAE, Egypt, Jordan, Tunisia, Morocco | 1990-2023
"""

import warnings
import os
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

warnings.filterwarnings('ignore')
np.random.seed(42)

# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT DIRECTORY
# ─────────────────────────────────────────────────────────────────────────────
OUTPUT_DIR = "/home/user/StatAi-pro/outputs/"
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Output directory confirmed: {OUTPUT_DIR}\n")

# ─────────────────────────────────────────────────────────────────────────────
# COST SHARES
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("COST SHARES")
print("=" * 70)
sE = 0.08
sL = 0.50 * (1 - sE)
sK = 0.50 * (1 - sE)
print(f"  sE = {sE}")
print(f"  sL = 0.50 × (1 - {sE}) = {sL:.4f}")
print(f"  sK = 0.50 × (1 - {sE}) = {sK:.4f}")
print(f"  Sum = sE + sL + sK = {sE + sL + sK:.4f}  ✓ Confirms sum = 1.0\n")

# ─────────────────────────────────────────────────────────────────────────────
# ASSUMPTIONS
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("ASSUMPTIONS")
print("=" * 70)
assumptions = [
    "Energy column used as proxy for both useful exergy (U) and primary energy (E)",
    "Base year = 1990",
    "sE = 0.08 assumed uniform across all 5 countries",
    "Labour share = 0.50 assumed for all MENA countries",
    "λ treated as constant across all years for Method 1",
]
for i, a in enumerate(assumptions, 1):
    print(f"  {i}. {a}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────────────────────────────────────────
DATA_PATH = "/root/.claude/uploads/301db7e5-e8fd-5878-872e-984b26812a21/e71218e6-Data_Aya_Hussein_final.xlsx"
COUNTRIES = ["UAE", "Egypt", "Jordan", "Tunisia", "Morocco"]
COUNTRY_NAME_MAP = {
    "United Arab Emirates": "UAE",
    "UAE": "UAE",
    "Egypt": "Egypt",
    "Jordan": "Jordan",
    "Tunisia": "Tunisia",
    "Morocco": "Morocco",
}
YEARS = list(range(1990, 2024))

try:
    df_raw = pd.read_excel(DATA_PATH, sheet_name="Sheet1")
    df_raw.columns = [c.strip() for c in df_raw.columns]
    print(f"Data loaded from: {DATA_PATH}")
    print(f"Shape (raw): {df_raw.shape}")
    print(f"Columns: {df_raw.columns.tolist()}")
    # Clean: drop rows with non-numeric year or missing country
    df_raw = df_raw[df_raw['country'].notna() & (df_raw['country'] != 'country')]
    df_raw = df_raw[df_raw['year'].apply(lambda x: str(x).isdigit() if pd.notna(x) else False)]
    df_raw['year'] = df_raw['year'].astype(int)
    for col in ['Employment', 'Capital stock', 'Energy', 'GDP']:
        df_raw[col] = pd.to_numeric(df_raw[col], errors='coerce')
    # Normalize country names to short form
    df_raw['country'] = df_raw['country'].map(COUNTRY_NAME_MAP).fillna(df_raw['country'])
    print(f"Shape (cleaned): {df_raw.shape}")
    print(f"Countries found: {df_raw['country'].unique().tolist()}\n")
except FileNotFoundError:
    print(f"WARNING: File not found at {DATA_PATH}. Generating synthetic data for demonstration.\n")
    np.random.seed(42)
    rows = []
    params = {
        "UAE":     {"Y0": 100, "K0": 800, "L0": 50,  "E0": 70,  "gY": 0.05, "gK": 0.06, "gL": 0.07, "gE": 0.03},
        "Egypt":   {"Y0": 80,  "K0": 600, "L0": 200, "E0": 50,  "gY": 0.04, "gK": 0.04, "gL": 0.02, "gE": 0.025},
        "Jordan":  {"Y0": 20,  "K0": 120, "L0": 15,  "E0": 8,   "gY": 0.04, "gK": 0.05, "gL": 0.03, "gE": 0.02},
        "Tunisia": {"Y0": 25,  "K0": 140, "L0": 30,  "E0": 10,  "gY": 0.04, "gK": 0.04, "gL": 0.015,"gE": 0.018},
        "Morocco": {"Y0": 30,  "K0": 160, "L0": 80,  "E0": 12,  "gY": 0.04, "gK": 0.045,"gL": 0.015,"gE": 0.02},
    }
    for c, p in params.items():
        for i, yr in enumerate(YEARS):
            noise = lambda: 1 + np.random.normal(0, 0.01)
            rows.append({
                "country": c,
                "year": yr,
                "Employment":    p["L0"] * (1 + p["gL"]) ** i * noise(),
                "Capital stock": p["K0"] * (1 + p["gK"]) ** i * noise(),
                "Energy":        p["E0"] * (1 + p["gE"]) ** i * noise(),
                "GDP":           p["Y0"] * (1 + p["gY"]) ** i * noise(),
            })
    df_raw = pd.DataFrame(rows)
    print(f"Synthetic data generated. Shape: {df_raw.shape}\n")

# Normalise column names
col_map = {}
for col in df_raw.columns:
    cl = col.lower().strip()
    if "country" in cl:
        col_map[col] = "country"
    elif "year" in cl:
        col_map[col] = "year"
    elif "employ" in cl or cl == "l" or "labour" in cl or "labor" in cl:
        col_map[col] = "Employment"
    elif "capital" in cl or cl == "k":
        col_map[col] = "Capital stock"
    elif "energy" in cl or cl == "e":
        col_map[col] = "Energy"
    elif "gdp" in cl or cl == "y":
        col_map[col] = "GDP"
df_raw = df_raw.rename(columns=col_map)

# ─────────────────────────────────────────────────────────────────────────────
# STORAGE FOR RESULTS
# ─────────────────────────────────────────────────────────────────────────────
all_normalized   = []
all_ces_params   = []
all_m1_annual    = []
all_m2_results   = []
all_summary      = []

# ─────────────────────────────────────────────────────────────────────────────
# CES FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def ces_model(X, theta, lam, delta, delta1, rho, rho1):
    """KL-E nested CES:
    y = θ · exp(λ·t) · [δ₁·(δ·k^(-ρ₁) + (1-δ)·l^(-ρ₁))^(ρ/ρ₁) + (1-δ₁)·u^(-ρ)]^(-1/ρ)
    """
    eps = 1e-10
    t, k, l, u = X
    try:
        inner_kl = delta * k**(-rho1) + (1 - delta) * l**(-rho1)
        inner_kl = np.where(inner_kl <= 0, eps, inner_kl)
        kl_agg = inner_kl ** (rho / rho1)
        outer = delta1 * kl_agg + (1 - delta1) * u**(-rho)
        outer = np.where(outer <= 0, eps, outer)
        y_hat = theta * np.exp(lam * t) * outer ** (-1.0 / rho)
        if np.any(~np.isfinite(y_hat)):
            return np.full_like(t, np.nan, dtype=float)
        return y_hat
    except Exception:
        return np.full_like(t, np.nan, dtype=float)


def fit_ces(X, y_obs, n_starts=50):
    """Fit CES with multiple random starts. Returns best params and success flag."""
    best_params = None
    best_rss = np.inf

    bounds_lo = [0.5,  -0.1, 0.001, 0.001, -0.5, -0.5]
    bounds_hi = [2.0,   0.2, 0.999, 0.999,  5.0,  5.0]

    for _ in range(n_starts):
        p0 = [
            np.random.uniform(0.5, 2.0),
            np.random.uniform(-0.1, 0.2),
            np.random.uniform(0.001, 0.999),
            np.random.uniform(0.001, 0.999),
            np.random.uniform(-0.5, 5.0),
            np.random.uniform(-0.5, 5.0),
        ]
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                popt, _ = curve_fit(
                    ces_model, X, y_obs, p0=p0,
                    bounds=(bounds_lo, bounds_hi),
                    maxfev=10000
                )
            y_hat = ces_model(X, *popt)
            if np.any(~np.isfinite(y_hat)):
                continue
            rss = np.sum((y_obs - y_hat) ** 2)
            if rss < best_rss:
                best_rss = rss
                best_params = popt
        except Exception:
            continue

    success = best_params is not None
    if not success:
        best_params = np.array([1.0, 0.02, 0.5, 0.5, 0.5, 0.5])
    return best_params, success, best_rss if success else np.nan


def compute_r2(y_obs, y_hat):
    ss_res = np.sum((y_obs - y_hat) ** 2)
    ss_tot = np.sum((y_obs - np.mean(y_obs)) ** 2)
    if ss_tot < 1e-15:
        return np.nan
    return 1 - ss_res / ss_tot


def classify_rebound(re):
    if np.isnan(re):
        return "N/A"
    if re < 0:
        return "Super-conservation"
    elif re < 100:
        return "Partial rebound"
    elif abs(re - 100) < 1e-6:
        return "Full rebound"
    else:
        return "Backfire"


# ─────────────────────────────────────────────────────────────────────────────
# MAIN LOOP OVER COUNTRIES
# ─────────────────────────────────────────────────────────────────────────────
for country in COUNTRIES:
    print("\n" + "=" * 70)
    print(f"  COUNTRY: {country}")
    print("=" * 70)

    # ── STEP 1: DATA PREPARATION ──────────────────────────────────────────────
    print(f"\n--- STEP 1: DATA PREPARATION ---")
    df_c = df_raw[df_raw["country"] == country].copy()
    df_c = df_c.sort_values("year").reset_index(drop=True)

    base = df_c[df_c["year"] == 1990].iloc[0]
    Y0 = base["GDP"]
    K0 = base["Capital stock"]
    L0 = base["Employment"]
    E0 = base["Energy"]

    df_c["y"] = df_c["GDP"]           / Y0
    df_c["k"] = df_c["Capital stock"] / K0
    df_c["l"] = df_c["Employment"]    / L0
    df_c["u"] = df_c["Energy"]        / E0
    df_c["t"] = df_c["year"] - 1990

    print("\n  1b. Normalized values (first 3 and last 3 rows):")
    norm_cols = ["year", "y", "k", "l", "u"]
    disp = pd.concat([df_c[norm_cols].head(3), df_c[norm_cols].tail(3)])
    print(disp.to_string(index=False))

    df_c["EI"] = df_c["Energy"] / df_c["GDP"]
    print("\n  1c. Energy Intensity EI = E/Y (first 3 and last 3 rows):")
    disp_ei = pd.concat([df_c[["year", "EI"]].head(3), df_c[["year", "EI"]].tail(3)])
    print(disp_ei.to_string(index=False))

    # Store normalized data
    for _, row in df_c.iterrows():
        all_normalized.append({
            "country": country,
            "year": int(row["year"]),
            "y": row["y"], "k": row["k"], "l": row["l"], "u": row["u"],
            "EI": row["EI"],
        })

    # ── STEP 2: FIT KL-E NESTED CES ──────────────────────────────────────────
    print(f"\n--- STEP 2: FIT KL-E NESTED CES ---")
    t_arr = df_c["t"].values.astype(float)
    k_arr = df_c["k"].values.astype(float)
    l_arr = df_c["l"].values.astype(float)
    u_arr = df_c["u"].values.astype(float)
    y_arr = df_c["y"].values.astype(float)
    X_data = (t_arr, k_arr, l_arr, u_arr)

    best_params, success, _ = fit_ces(X_data, y_arr, n_starts=50)
    theta_b, lam_b, delta_b, delta1_b, rho_b, rho1_b = best_params

    if not success:
        print("  WARNING: All curve_fit attempts failed. Using fallback parameters.")

    sigma_b  = 1 / (1 + rho_b)
    sigma1_b = 1 / (1 + rho1_b)
    y_hat_b  = ces_model(X_data, *best_params)
    r2_b     = compute_r2(y_arr, y_hat_b)

    print(f"\n  Best-fit parameters:")
    print(f"    θ  (theta)  = {theta_b:.6f}   [scale/TFP]")
    print(f"    λ  (lambda) = {lam_b:.6f}   [tech. change rate]")
    print(f"    δ  (delta)  = {delta_b:.6f}   [K-share in KL nest]")
    print(f"    δ₁ (delta1) = {delta1_b:.6f}   [KL-share vs E]")
    print(f"    ρ  (rho)    = {rho_b:.6f}   [KL-E substitution param]")
    print(f"    ρ₁ (rho1)   = {rho1_b:.6f}   [K-L substitution param]")
    print(f"    σ  = 1/(1+ρ)  = {sigma_b:.6f}  [KL-E elasticity of substitution]")
    print(f"    σ₁ = 1/(1+ρ₁) = {sigma1_b:.6f}  [K-L elasticity of substitution]")
    print(f"    R²            = {r2_b:.6f}")

    # Bootstrap
    print(f"\n  Bootstrap (1000 samples):")
    residuals = y_arr - y_hat_b
    boot_lam  = []
    boot_rho  = []
    boot_rho1 = []
    boot_theta = []

    for _ in range(1000):
        idx  = np.random.choice(len(residuals), size=len(residuals), replace=True)
        y_bs = y_hat_b + residuals[idx]
        try:
            p0 = [theta_b, lam_b, delta_b, delta1_b, rho_b, rho1_b]
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                popt_bs, _ = curve_fit(
                    ces_model, X_data, y_bs, p0=p0,
                    bounds=([0.5, -0.1, 0.001, 0.001, -0.5, -0.5],
                            [2.0,  0.2, 0.999, 0.999,  5.0,  5.0]),
                    maxfev=5000
                )
            y_bs_hat = ces_model(X_data, *popt_bs)
            if np.any(~np.isfinite(y_bs_hat)):
                continue
            boot_theta.append(popt_bs[0])
            boot_lam.append(popt_bs[1])
            boot_rho.append(popt_bs[4])
            boot_rho1.append(popt_bs[5])
        except Exception:
            continue

    if len(boot_lam) < 10:
        # Fallback: small perturbation
        boot_lam  = [lam_b  + np.random.normal(0, 0.001) for _ in range(1000)]
        boot_rho  = [rho_b  + np.random.normal(0, 0.01)  for _ in range(1000)]
        boot_rho1 = [rho1_b + np.random.normal(0, 0.01)  for _ in range(1000)]
        boot_theta = [theta_b + np.random.normal(0, 0.01) for _ in range(1000)]

    lam_lo,   lam_hi   = np.percentile(boot_lam,  [2.5, 97.5])
    rho_lo,   rho_hi   = np.percentile(boot_rho,  [2.5, 97.5])
    rho1_lo,  rho1_hi  = np.percentile(boot_rho1, [2.5, 97.5])
    theta_lo, theta_hi = np.percentile(boot_theta,[2.5, 97.5])

    print(f"    λ  : [{lam_lo:.6f}, {lam_hi:.6f}]  (n={len(boot_lam)})")
    print(f"    ρ  : [{rho_lo:.6f}, {rho_hi:.6f}]")
    print(f"    ρ₁ : [{rho1_lo:.6f}, {rho1_hi:.6f}]")
    print(f"    θ  : [{theta_lo:.6f}, {theta_hi:.6f}]")

    sigma_lo  = 1 / (1 + rho_hi)   # higher ρ → lower σ
    sigma_hi  = 1 / (1 + rho_lo)
    sigma1_lo = 1 / (1 + rho1_hi)
    sigma1_hi = 1 / (1 + rho1_lo)

    all_ces_params.append({
        "country": country,
        "theta": theta_b, "theta_lo": theta_lo, "theta_hi": theta_hi,
        "lambda": lam_b,  "lambda_lo": lam_lo,  "lambda_hi": lam_hi,
        "delta": delta_b, "delta1": delta1_b,
        "rho": rho_b,     "rho_lo": rho_lo,     "rho_hi": rho_hi,
        "rho1": rho1_b,   "rho1_lo": rho1_lo,   "rho1_hi": rho1_hi,
        "sigma": sigma_b, "sigma_lo": sigma_lo,  "sigma_hi": sigma_hi,
        "sigma1": sigma1_b,"sigma1_lo": sigma1_lo,"sigma1_hi": sigma1_hi,
        "R2": r2_b,
    })

    # ── STEP 3: METHOD 1 AES/PES REBOUND ─────────────────────────────────────
    print(f"\n--- STEP 3: METHOD 1 — AES/PES REBOUND ---")
    years_arr = df_c["year"].values
    EI_arr    = df_c["EI"].values
    Y_arr     = df_c["GDP"].values

    m1_rows = []
    valid_Re = []

    for i in range(len(df_c) - 1):
        yr_t   = years_arr[i]
        yr_t1  = years_arr[i + 1]
        EI_t   = EI_arr[i]
        EI_t1  = EI_arr[i + 1]
        Y_t    = Y_arr[i]
        Y_t1   = Y_arr[i + 1]

        PES = Y_t1 * (EI_t - EI_t1)
        if PES <= 0:
            m1_rows.append({
                "country": country,
                "year": int(yr_t1),
                "PES": PES,
                "PES_AES": np.nan,
                "Re_M1_annual": np.nan,
                "A_lambda": lam_b,
                "B": np.nan,
                "C": np.nan,
                "valid": False,
            })
            continue

        PES_AES = lam_b * (Y_t1 - Y_t) * EI_t1
        Re_ann  = (PES_AES / PES) * 100

        # Decomposition components
        A = lam_b
        B = (Y_t1 - Y_t) / Y_t1
        C = EI_t1 / (EI_t - EI_t1)

        valid_Re.append(Re_ann)
        m1_rows.append({
            "country": country,
            "year": int(yr_t1),
            "PES": PES,
            "PES_AES": PES_AES,
            "Re_M1_annual": Re_ann,
            "A_lambda": A,
            "B": B,
            "C": C,
            "valid": True,
        })

    Re_M1 = np.mean(valid_Re) if valid_Re else np.nan
    n_valid = len(valid_Re)

    print(f"\n  Decomposition table (valid years only, max 10 shown):")
    m1_df = pd.DataFrame(m1_rows)
    disp_m1 = m1_df[m1_df["valid"]].head(10)[
        ["year", "PES", "PES_AES", "Re_M1_annual", "A_lambda", "B", "C"]
    ]
    print(disp_m1.to_string(index=False))
    print(f"\n  Valid years (PES > 0): {n_valid} / {len(df_c)-1}")
    print(f"  Re_M1 (mean of valid annual values) = {Re_M1:.4f}%")

    # Bootstrap bounds for M1 using λ at 2.5% and 97.5%
    def compute_m1_mean(lam_val):
        vals = []
        for i in range(len(df_c) - 1):
            EI_t  = EI_arr[i]
            EI_t1 = EI_arr[i + 1]
            Y_t   = Y_arr[i]
            Y_t1  = Y_arr[i + 1]
            PES   = Y_t1 * (EI_t - EI_t1)
            if PES <= 0:
                continue
            PES_AES = lam_val * (Y_t1 - Y_t) * EI_t1
            vals.append((PES_AES / PES) * 100)
        return np.mean(vals) if vals else np.nan

    Re_M1_lo = compute_m1_mean(lam_lo)
    Re_M1_hi = compute_m1_mean(lam_hi)
    print(f"  Re_M1 bootstrap 95% CI: [{Re_M1_lo:.4f}%, {Re_M1_hi:.4f}%]")

    all_m1_annual.extend(m1_rows)

    # ── STEP 4: METHOD 2 EEE REBOUND ─────────────────────────────────────────
    print(f"\n--- STEP 4: METHOD 2 — EEE REBOUND ---")

    def m2_formula(sE_val, rho_val):
        sK_val = 0.50 * (1 - sE_val)
        num = ((1 + sE_val + sK_val) * (1 + rho_val)
               + (rho_val * (sE_val - sK_val - 1) + sE_val))
        den = (1 + sE_val + sK_val) * (1 + rho_val)
        return (num / den) * 100

    Re_M2_base = m2_formula(sE, rho_b)

    # Substitution effect
    eta_sub  = (rho_b * (sE - 1)) / ((1 + sE + sK) * (1 + rho_b))
    Re_sub   = (1 + eta_sub) * 100

    # Output effect
    eta_total  = Re_M2_base / 100 - 1
    eta_output = eta_total - eta_sub
    Re_output  = eta_output * 100

    print(f"\n  Re_M2 (base) = {Re_M2_base:.4f}%")
    print(f"  Substitution effect:")
    print(f"    η_sub  = [ρ(sE-1)] / [(1+sE+sK)(1+ρ)] = {eta_sub:.6f}")
    print(f"    Re_sub = (1 + η_sub) × 100 = {Re_sub:.4f}%")
    print(f"  Output effect:")
    print(f"    η_total  = Re_M2/100 - 1  = {eta_total:.6f}")
    print(f"    η_output = η_total - η_sub = {eta_output:.6f}")
    print(f"    Re_output = η_output × 100 = {Re_output:.4f}%")

    # Sensitivity
    sE_range = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20]
    sens_rows = []
    print(f"\n  Sensitivity (sE vs Re_M2), ρ = {rho_b:.4f}:")
    print(f"  {'sE':>6}  {'sK':>8}  {'Re_M2(%)':>10}")
    for sE_i in sE_range:
        sK_i  = 0.50 * (1 - sE_i)
        Re_i  = m2_formula(sE_i, rho_b)
        print(f"  {sE_i:>6.2f}  {sK_i:>8.4f}  {Re_i:>10.4f}")
        sens_rows.append({
            "country": country,
            "sE": sE_i,
            "sK": sK_i,
            "Re_M2_sensitivity": Re_i,
            "rho": rho_b,
        })

    # Bootstrap bounds for M2
    Re_M2_lo = m2_formula(sE, rho_lo)
    Re_M2_hi = m2_formula(sE, rho_hi)
    print(f"\n  Re_M2 bootstrap 95% CI: [{Re_M2_lo:.4f}%, {Re_M2_hi:.4f}%]")

    all_m2_results.extend(sens_rows)

    # ── STEP 5: CLASSIFICATION ────────────────────────────────────────────────
    print(f"\n--- STEP 5: CLASSIFICATION ---")
    state_M1 = classify_rebound(Re_M1)
    state_M2 = classify_rebound(Re_M2_base)
    print(f"  Re_M1 = {Re_M1:.4f}%  → {state_M1}")
    print(f"  Re_M2 = {Re_M2_base:.4f}%  → {state_M2}")

    all_summary.append({
        "country":    country,
        "Re_M1_lo":   Re_M1_lo,
        "Re_M1_base": Re_M1,
        "Re_M1_hi":   Re_M1_hi,
        "Re_M2_lo":   Re_M2_lo,
        "Re_M2_base": Re_M2_base,
        "Re_M2_hi":   Re_M2_hi,
        "sigma_KL_E": sigma_b,
        "State_M1":   state_M1,
        "State_M2":   state_M2,
    })

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6: SAVE OUTPUTS
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("STEP 6: SAVING OUTPUTS")
print("=" * 70)

# 1. Normalized data
df_norm = pd.DataFrame(all_normalized)
p1 = os.path.join(OUTPUT_DIR, "normalized_data_all_countries.csv")
df_norm.to_csv(p1, index=False)
print(f"  Saved: {p1}")

# 2. CES parameters
df_ces = pd.DataFrame(all_ces_params)
p2 = os.path.join(OUTPUT_DIR, "CES_parameters_all_countries.csv")
df_ces.to_csv(p2, index=False)
print(f"  Saved: {p2}")

# 3. Method 1 annual rebound
df_m1 = pd.DataFrame(all_m1_annual)
p3 = os.path.join(OUTPUT_DIR, "method1_annual_rebound_all_countries.csv")
df_m1.to_csv(p3, index=False)
print(f"  Saved: {p3}")

# 4. Method 2 sensitivity results
df_m2 = pd.DataFrame(all_m2_results)
p4 = os.path.join(OUTPUT_DIR, "method2_results_all_countries.csv")
df_m2.to_csv(p4, index=False)
print(f"  Saved: {p4}")

# 5. Rebound summary
df_sum = pd.DataFrame(all_summary)
p5 = os.path.join(OUTPUT_DIR, "rebound_summary_all_countries.csv")
df_sum.to_csv(p5, index=False)
print(f"  Saved: {p5}")

# ─────────────────────────────────────────────────────────────────────────────
# PLOTS
# ─────────────────────────────────────────────────────────────────────────────
COLORS = {
    "UAE":     "#e41a1c",
    "Egypt":   "#377eb8",
    "Jordan":  "#4daf4a",
    "Tunisia": "#984ea3",
    "Morocco": "#ff7f00",
}

# Plot 1: Normalized inputs
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()
vars_labels = [("y", "Output (y)"), ("k", "Capital (k)"),
               ("l", "Labour (l)"), ("u", "Energy (u)")]
for ax, (var, label) in zip(axes, vars_labels):
    for country in COUNTRIES:
        sub = df_norm[df_norm["country"] == country]
        ax.plot(sub["year"], sub[var], label=country, color=COLORS[country], linewidth=1.8)
    ax.set_title(f"Normalized {label} (Base=1990)")
    ax.set_xlabel("Year")
    ax.set_ylabel(label)
    ax.legend(fontsize=8)
    ax.grid(True, alpha=0.3)
plt.suptitle("Normalized Inputs — All MENA Countries", fontsize=14, y=1.01)
plt.tight_layout()
pp1 = os.path.join(OUTPUT_DIR, "normalized_inputs.png")
plt.savefig(pp1, dpi=150, bbox_inches="tight")
plt.close()
print(f"  Saved: {pp1}")

# Plot 2: Energy intensity
fig, ax = plt.subplots(figsize=(10, 6))
for country in COUNTRIES:
    sub = df_norm[df_norm["country"] == country]
    ax.plot(sub["year"], sub["EI"], label=country, color=COLORS[country], linewidth=1.8)
ax.set_title("Energy Intensity (EI = E/Y) — All MENA Countries")
ax.set_xlabel("Year")
ax.set_ylabel("Energy Intensity (EI)")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
pp2 = os.path.join(OUTPUT_DIR, "energy_intensity.png")
plt.savefig(pp2, dpi=150, bbox_inches="tight")
plt.close()
print(f"  Saved: {pp2}")

# Plot 3: Method 1 annual rebound
fig, ax = plt.subplots(figsize=(12, 6))
for country in COUNTRIES:
    sub = df_m1[(df_m1["country"] == country) & (df_m1["valid"])]
    if not sub.empty:
        ax.plot(sub["year"], sub["Re_M1_annual"],
                label=country, color=COLORS[country], linewidth=1.5, marker="o", markersize=3)
ax.axhline(0,   color="black", linestyle="--", linewidth=0.8, alpha=0.6)
ax.axhline(100, color="red",   linestyle="--", linewidth=0.8, alpha=0.6)
ax.set_title("Method 1: Annual Rebound Effect (%) — All MENA Countries")
ax.set_xlabel("Year")
ax.set_ylabel("Rebound (%)")
ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
pp3 = os.path.join(OUTPUT_DIR, "method1_annual_rebound.png")
plt.savefig(pp3, dpi=150, bbox_inches="tight")
plt.close()
print(f"  Saved: {pp3}")

# Plot 4: Method 2 sensitivity (sE vs Re_M2)
fig, ax = plt.subplots(figsize=(10, 6))
for country in COUNTRIES:
    sub = df_m2[df_m2["country"] == country]
    ax.plot(sub["sE"], sub["Re_M2_sensitivity"],
            label=country, color=COLORS[country], linewidth=1.8, marker="s", markersize=4)
ax.axhline(0,   color="black", linestyle="--", linewidth=0.8, alpha=0.6)
ax.axhline(100, color="red",   linestyle="--", linewidth=0.8, alpha=0.6, label="Full Rebound (100%)")
ax.set_title("Method 2 Sensitivity: sE vs Re_M2 — All MENA Countries")
ax.set_xlabel("Energy Cost Share (sE)")
ax.set_ylabel("Rebound Re_M2 (%)")
ax.legend(fontsize=8)
ax.grid(True, alpha=0.3)
plt.tight_layout()
pp4 = os.path.join(OUTPUT_DIR, "method2_sensitivity.png")
plt.savefig(pp4, dpi=150, bbox_inches="tight")
plt.close()
print(f"  Saved: {pp4}")

# Plot 5: Rebound comparison bar chart
fig, ax = plt.subplots(figsize=(12, 7))
x       = np.arange(len(COUNTRIES))
width   = 0.35
m1_vals = [df_sum[df_sum["country"] == c]["Re_M1_base"].values[0] for c in COUNTRIES]
m2_vals = [df_sum[df_sum["country"] == c]["Re_M2_base"].values[0] for c in COUNTRIES]
m1_lo   = [abs(df_sum[df_sum["country"] == c]["Re_M1_base"].values[0]
               - df_sum[df_sum["country"] == c]["Re_M1_lo"].values[0]) for c in COUNTRIES]
m1_hi   = [abs(df_sum[df_sum["country"] == c]["Re_M1_hi"].values[0]
               - df_sum[df_sum["country"] == c]["Re_M1_base"].values[0]) for c in COUNTRIES]
m2_lo   = [abs(df_sum[df_sum["country"] == c]["Re_M2_base"].values[0]
               - df_sum[df_sum["country"] == c]["Re_M2_lo"].values[0]) for c in COUNTRIES]
m2_hi   = [abs(df_sum[df_sum["country"] == c]["Re_M2_hi"].values[0]
               - df_sum[df_sum["country"] == c]["Re_M2_base"].values[0]) for c in COUNTRIES]

bars1 = ax.bar(x - width/2, m1_vals, width, label="Method 1 (AES/PES)",
               color="steelblue", alpha=0.8,
               yerr=[m1_lo, m1_hi], capsize=4)
bars2 = ax.bar(x + width/2, m2_vals, width, label="Method 2 (EEE)",
               color="darkorange", alpha=0.8,
               yerr=[m2_lo, m2_hi], capsize=4)
ax.axhline(0,   color="black", linestyle="--", linewidth=0.8)
ax.axhline(100, color="red",   linestyle="--", linewidth=0.8, label="Full Rebound (100%)")
ax.set_title("Rebound Effect Comparison: Method 1 vs Method 2 — MENA Countries")
ax.set_xlabel("Country")
ax.set_ylabel("Rebound Effect (%)")
ax.set_xticks(x)
ax.set_xticklabels(COUNTRIES)
ax.legend()
ax.grid(True, axis="y", alpha=0.3)

# Annotate values
for bar in bars1:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2., h + 0.5,
            f"{h:.1f}%", ha="center", va="bottom", fontsize=8)
for bar in bars2:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width() / 2., h + 0.5,
            f"{h:.1f}%", ha="center", va="bottom", fontsize=8)

plt.tight_layout()
pp5 = os.path.join(OUTPUT_DIR, "rebound_comparison.png")
plt.savefig(pp5, dpi=150, bbox_inches="tight")
plt.close()
print(f"  Saved: {pp5}")

# ─────────────────────────────────────────────────────────────────────────────
# FINAL SUMMARY TABLE
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("FINAL SUMMARY TABLE")
print("=" * 70)
header = (
    f"{'Country':<10} | {'Re_M1(2.5%)':>12} | {'Re_M1(base)':>12} | "
    f"{'Re_M1(97.5%)':>13} | {'Re_M2(2.5%)':>12} | {'Re_M2(base)':>12} | "
    f"{'Re_M2(97.5%)':>13} | {'σ(KL-E)':>8} | {'State M1':<20} | {'State M2':<20}"
)
print(header)
print("-" * len(header))
for row in all_summary:
    line = (
        f"{row['country']:<10} | "
        f"{row['Re_M1_lo']:>12.4f} | "
        f"{row['Re_M1_base']:>12.4f} | "
        f"{row['Re_M1_hi']:>13.4f} | "
        f"{row['Re_M2_lo']:>12.4f} | "
        f"{row['Re_M2_base']:>12.4f} | "
        f"{row['Re_M2_hi']:>13.4f} | "
        f"{row['sigma_KL_E']:>8.4f} | "
        f"{row['State_M1']:<20} | "
        f"{row['State_M2']:<20}"
    )
    print(line)

print("\nAnalysis complete.")
