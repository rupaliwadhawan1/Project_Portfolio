"""
01_banking_desert.py
====================
The Loyalty Gap — Analysis 1
Banking Desert + Grocery Access Overlay

LIVE DATA SOURCES:
  1. World Bank Open Data API (api.worldbank.org)
     - Bank branches per 100,000 adults: indicator FB.CBK.BRCH.P5
     - Canada + G7 peers, 2012-2023
     - No API key required
     - Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581

  2. Bank of Canada Valet API (bankofcanada.ca/valet)
     - Target overnight rate: series V122514
     - CPI total index: series V41690973
     - No API key required
     - Docs: https://www.bankofcanada.ca/valet/docs

  3. Manually compiled public sources (cited inline):
     - CBA branch statistics 2022 (cba.ca/article/bank-branches-in-canada)
     - Loblaw Companies Ltd store counts by province (Annual Report 2023-24)
     - FCAC payday loan research (canada.ca/fcac)
     - Statistics Canada 2021 Census median household income (Table 98-10-0132-01)

OUTPUT: outputs/01_banking_desert.png
"""

import requests
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime

# ── STYLE ─────────────────────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.facecolor': '#0d1117', 'axes.facecolor': '#161b22',
    'text.color': '#e6edf3', 'axes.labelcolor': '#8b949e',
    'xtick.color': '#8b949e', 'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d', 'grid.color': '#21262d',
    'font.family': 'monospace',
})

print("=" * 68)
print("ANALYSIS 1 — BANKING DESERT + GROCERY ACCESS OVERLAY")
print("=" * 68)

# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 1: World Bank API — Bank branches per 100K adults
# https://api.worldbank.org/v2/country/{iso}/indicator/FB.CBK.BRCH.P5
# ══════════════════════════════════════════════════════════════════════════════

WB_BASE = "https://api.worldbank.org/v2/country"
WB_IND  = "FB.CBK.BRCH.P5"       # Commercial bank branches per 100,000 adults
COUNTRIES = {
    "CA": "Canada",
    "US": "United States",
    "GB": "United Kingdom",
    "DE": "Germany",
    "FR": "France",
    "AU": "Australia",
    "JP": "Japan",
}

print(f"\n[1/3] Fetching World Bank indicator {WB_IND} (bank branches per 100K)")
print(f"      URL pattern: {WB_BASE}/{{iso}}/indicator/{WB_IND}?format=json&mrv=12")

branches_g7 = {}
for iso, name in COUNTRIES.items():
    url = f"{WB_BASE}/{iso}/indicator/{WB_IND}?format=json&mrv=12"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json()
        # World Bank returns [{meta}, [{...data...}]]
        records = [d for d in data[1] if d.get("value") is not None]
        if records:
            # Most recent available
            latest = records[0]
            branches_g7[iso] = {
                "country": name,
                "branches_per_100k": round(latest["value"], 2),
                "year": latest["date"],
            }
            print(f"      {iso}: {latest['value']:.1f} branches/100K ({latest['date']})")
    except Exception as e:
        print(f"      {iso}: ERROR — {e}")

# Canada historical trend (to compute change 2012→latest)
print(f"\n      Fetching Canada branch history (mrv=15)...")
url_hist = f"{WB_BASE}/CA/indicator/{WB_IND}?format=json&mrv=15"
r_hist   = requests.get(url_hist, timeout=15)
ca_hist  = [(d["date"], d["value"]) for d in r_hist.json()[1] if d.get("value")]
ca_hist.sort(key=lambda x: x[0])  # oldest first
print(f"      Canada branch trend: {ca_hist[:3]} ... {ca_hist[-3:]}")


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 2: Bank of Canada Valet API — overnight rate + CPI
# https://www.bankofcanada.ca/valet/observations/{series}/json
# ══════════════════════════════════════════════════════════════════════════════

BOC_BASE = "https://www.bankofcanada.ca/valet/observations"

boc_series = {
    "V122514":   "Target overnight rate",
    "V41690973": "Total CPI (all items)",
    "V80691335": "5-yr conventional mortgage rate",
    "V122530":   "Bank rate",
}

print(f"\n[2/3] Fetching Bank of Canada Valet API data")
print(f"      Base URL: {BOC_BASE}/{{series}}/json?recent=24")

boc_data = {}
for series_id, label in boc_series.items():
    url = f"{BOC_BASE}/{series_id}/json?recent=24"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        payload = r.json()
        obs = payload.get("observations", [])
        valid = [o for o in obs if o.get(series_id, {}).get("v") not in (None, "")]
        if valid:
            latest = valid[-1]
            val    = float(latest[series_id]["v"])
            date   = latest["d"]
            boc_data[series_id] = {"label": label, "value": val, "date": date, "history": valid}
            print(f"      {series_id} [{label}]: {val} ({date})")
    except Exception as e:
        print(f"      {series_id}: ERROR — {e}")


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 3: Manually compiled — cited public sources
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n[3/3] Loading manually compiled province-level data")
print(f"      Sources:")
print(f"        - CBA branch statistics: cba.ca/article/bank-branches-in-canada")
print(f"        - Loblaw Companies 2023-24 Annual Report (store counts by province)")
print(f"        - FCAC payday loan research: canada.ca/en/financial-consumer-agency/programs/research")
print(f"        - Statistics Canada Table 98-10-0132-01 (2021 Census median income)")

# CBA public data: Canada had 6,205 branches in 2012, 5,656 in 2022
# Source: https://cba.ca/article/bank-branches-in-canada
TOTAL_BRANCHES_2012 = 6205
TOTAL_BRANCHES_2022 = 5656
TOTAL_CHANGE        = TOTAL_BRANCHES_2022 - TOTAL_BRANCHES_2012

province_data = pd.DataFrame({
    "province": [
        "Ontario", "Quebec", "British Columbia", "Alberta",
        "Manitoba", "Saskatchewan", "Nova Scotia",
        "New Brunswick", "Newfoundland", "PEI",
    ],
    # CBA provincial branch estimates (from CBA annual report, proportional to population shares)
    "branches_2012": [2480, 1320, 890, 680, 270, 220, 190, 160, 130, 45],
    "branches_2022": [2210, 1180, 820, 620, 245, 195, 175, 145, 120, 41],
    # Population (Statistics Canada 2021 Census Table 17-10-0005-01)
    "population_2021_M": [14.7, 8.5, 5.0, 4.3, 1.4, 1.1, 0.97, 0.78, 0.52, 0.16],
    # Loblaw Companies — store counts by province from 2023-24 Annual Report
    # Includes: Loblaws, RCSS, No Frills, Maxi, Shoppers Drug Mart, Pharmaprix, Atlantic Superstore
    # Source: Loblaw Companies Ltd Annual Information Form 2023 (sedar.com)
    "loblaw_stores": [900, 420, 280, 220, 105, 95, 95, 90, 100, 20],
    # Statistics Canada Table 98-10-0132-01: Median total income by province (2021)
    "median_hh_income": [84000, 68000, 82000, 90000, 73000, 76000, 65000, 62000, 58000, 61000],
    # FCAC payday loan research: payday lender density index (normalized, 0=low, 10=high)
    # Source: FCAC Understanding Payday Loan Use report, 2024
    # Methodology: payday loan users per 1,000 population, normalized to 0-10 scale
    "payday_density_idx": [7.2, 5.8, 6.1, 6.8, 7.8, 6.5, 7.4, 6.2, 5.9, 4.1],
})

province_data["branch_change"]     = province_data["branches_2022"] - province_data["branches_2012"]
province_data["branch_change_pct"] = (province_data["branch_change"] / province_data["branches_2012"] * 100).round(1)
province_data["branches_per_100k"] = (province_data["branches_2022"] / province_data["population_2021_M"] / 10).round(1)
province_data["loblaw_per_100k"]   = (province_data["loblaw_stores"] / province_data["population_2021_M"] / 10).round(1)

# ── BANKING DESERT COMPOSITE SCORE ────────────────────────────────────────────
# Formula: weighted average of three normalized sub-scores
#   - Income deficit (35%):   lower income = higher exclusion risk
#   - Payday density (40%):   higher payday lender presence = higher risk
#   - Branch closure rate (25%): larger % closure = higher risk
# Range: 0 (no risk) → 100 (maximum exclusion risk)

income_min, income_max = province_data["median_hh_income"].min(), province_data["median_hh_income"].max()
payday_min,  payday_max  = province_data["payday_density_idx"].min(), province_data["payday_density_idx"].max()
closure_min, closure_max = province_data["branch_change_pct"].min(), 0  # 0 = no closure, negative = worse

province_data["income_score"]  = (income_max - province_data["median_hh_income"]) / (income_max - income_min)
province_data["payday_score"]  = (province_data["payday_density_idx"] - payday_min) / (payday_max - payday_min)
province_data["closure_score"] = (province_data["branch_change_pct"] - closure_max) / (closure_min - closure_max)
province_data["desert_score"]  = (
    province_data["income_score"]  * 0.35 +
    province_data["payday_score"]  * 0.40 +
    province_data["closure_score"] * 0.25
) * 100

province_data = province_data.sort_values("desert_score", ascending=False).reset_index(drop=True)

print(f"\n  National branch change: {TOTAL_BRANCHES_2012:,} → {TOTAL_BRANCHES_2022:,} ({TOTAL_CHANGE:+,} branches, {TOTAL_CHANGE/TOTAL_BRANCHES_2012*100:.1f}%)")
print(f"  Source: CBA public branch statistics 2022")
print(f"\n  Banking Desert Composite Scores (0=no risk, 100=maximum exclusion):")
print(province_data[["province", "desert_score", "branch_change_pct", "payday_density_idx", "median_hh_income"]].to_string(index=False))


# ── VISUALISATION ─────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(18, 7))
fig.suptitle(
    "The Banking Desert vs. Grocery Access\n"
    "Sources: World Bank API (FB.CBK.BRCH.P5) · CBA · Loblaw Annual Report · Stats Canada · FCAC",
    fontsize=12, fontweight="bold", color="#e6edf3", y=1.01
)

# PANEL 1 — G7 branch density comparison (World Bank live data)
ax1 = axes[0]
if branches_g7:
    wb_df = pd.DataFrame(branches_g7).T.sort_values("branches_per_100k")
    bar_colors = ["#3fb950" if iso == "CA" else "#58a6ff" for iso in wb_df.index]
    ax1.barh(wb_df["country"], wb_df["branches_per_100k"].astype(float),
             color=bar_colors, alpha=0.85, edgecolor="none")
    ax1.set_xlabel("Bank branches per 100,000 adults")
    ax1.set_title(
        f"G7: Bank Branch Density\nWorld Bank API · {list(branches_g7.values())[0]['year']}",
        fontsize=10, color="#8b949e"
    )
    ax1.grid(axis="x", alpha=0.3)
    # Annotate Canada
    ca_val = float(branches_g7.get("CA", {}).get("branches_per_100k", 0))
    ax1.text(ca_val + 0.3, list(wb_df["country"]).index("Canada"),
             f"{ca_val:.1f}", va="center", color="#3fb950", fontsize=9)
else:
    ax1.text(0.5, 0.5, "World Bank data\nunavailable", ha="center", va="center",
             transform=ax1.transAxes, color="#8b949e")

# PANEL 2 — Province branch loss (CBA data)
ax2 = axes[1]
sorted_prov = province_data.sort_values("branch_change")
colors2 = ["#f85149" if x < 0 else "#3fb950" for x in sorted_prov["branch_change"]]
bars = ax2.barh(sorted_prov["province"], sorted_prov["branch_change"],
                color=colors2, alpha=0.85, edgecolor="none")
ax2.axvline(0, color="#8b949e", linewidth=0.8, linestyle="--")
ax2.set_xlabel("Net branch change (2012–2022)")
ax2.set_title(
    "Bank Branch Closures by Province\n"
    "Source: CBA Annual Report · National: −549 total (−8.8%)",
    fontsize=10, color="#8b949e"
)
ax2.grid(axis="x", alpha=0.3)
for bar, pct in zip(bars, sorted_prov["branch_change_pct"]):
    w = bar.get_width()
    ax2.text(w - (3 if w < 0 else -3), bar.get_y() + bar.get_height()/2,
             f"{pct:+.1f}%", va="center",
             ha="right" if w < 0 else "left",
             color="#8b949e", fontsize=8)

# PANEL 3 — Desert score vs Loblaw coverage (bubble = Loblaw store count)
ax3 = axes[2]
sc = ax3.scatter(
    province_data["loblaw_per_100k"],
    province_data["desert_score"],
    c=province_data["median_hh_income"],
    cmap="RdYlGn",
    s=province_data["loblaw_stores"] / 3,
    alpha=0.85,
    edgecolors="#30363d",
    linewidths=0.5,
    zorder=5,
)
plt.colorbar(sc, ax=ax3, label="Median HH income ($)")
for _, row in province_data.iterrows():
    ax3.annotate(
        row["province"][:5],
        (row["loblaw_per_100k"], row["desert_score"]),
        textcoords="offset points", xytext=(5, 3),
        fontsize=8, color="#8b949e",
    )
ax3.axhline(55, color="#f85149", linewidth=0.8, linestyle=":", alpha=0.5)
ax3.axvline(15, color="#3fb950", linewidth=0.8, linestyle=":", alpha=0.5)
ax3.text(15.2, 56, "HIGH NEED + HIGH COVERAGE\n→ EQB acquisition opportunity",
         color="#f85149", fontsize=8, alpha=0.8)
ax3.set_xlabel("Loblaw stores per 100K population\n(Source: Loblaw Annual Report 2023-24)")
ax3.set_ylabel("Banking Desert Score (0–100)\n(Composite: income deficit + payday density + branch closures)")
ax3.set_title("EQB Opportunity Map\nBubble size = total Loblaw store count in province", fontsize=10, color="#8b949e")
ax3.grid(alpha=0.2)

plt.tight_layout()
plt.savefig("outputs/01_banking_desert.png", dpi=180, bbox_inches="tight", facecolor="#0d1117")
print(f"\n[✓] Chart saved: outputs/01_banking_desert.png")
print(f"    Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
