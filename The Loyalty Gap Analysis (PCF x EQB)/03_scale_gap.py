"""
03_scale_gap.py
===============
The Loyalty Gap — Analysis 3
Challenger Bank Scale Gap + Market Concentration Analysis

LIVE DATA SOURCES:
  1. World Bank Open Data API — financial sector indicators
     Indicator FB.CBK.BRCH.P5: Bank branches per 100,000 adults
     Indicator FX.OWN.TOTL.ZS: Account ownership (% adults 15+)
     URL: https://api.worldbank.org/v2/country/{iso}/indicator/{ind}?format=json
     No API key required.
     Docs: https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures

  2. Bank of Canada Valet API — financial stability context
     Series V122514: Target overnight rate (policy context)
     URL: https://www.bankofcanada.ca/valet/observations/{series}/json?recent=3
     Docs: https://www.bankofcanada.ca/valet/docs

  3. WOWA.ca Q2 2025 deposit market share (sourced from OSFI / public filings)
     URL: wowa.ca/infographics-finance-realestate-canada/canada-financial-institutions-deposit-portfolio-market-share-q2-2025
     Original OSFI data: https://www.osfi-bsif.gc.ca/en/data-forms/financial-data/banks
     Note: OSFI does not expose a public JSON API; WOWA aggregates their quarterly PDF disclosures.

  4. EQB Inc. Investor Relations — acquisition announcement
     Press release, May 5, 2026: "EQB secures final approval for PC Financial acquisition"
     URL: https://eqb.investorroom.com/2026-05-05-EQB-secures-final-approval
     Key figures: $5.8B assets added, $800M retail deposits added, ~3.3M combined customers

  5. Customer counts from annual reports (SEDAR filings):
     RBC: 17M customers (RBC 2024 Annual Report)
     TD: 16.5M (TD 2024 Annual Report)
     Scotiabank: ~11M (Scotiabank 2024 Annual Report)
     BMO: ~8M (BMO 2024 Annual Report)
     CIBC: ~11M (CIBC 2024 Annual Report)
     National Bank: ~2.8M (National Bank 2024 Annual Report)

  HHI (Herfindahl-Hirschman Index) methodology:
     HHI = Σ(market_share_i²) for all firms i
     DOJ threshold: >2,500 = highly concentrated
     Source: Competition Bureau Canada, Merger Enforcement Guidelines
"""

import requests
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime

plt.rcParams.update({
    'figure.facecolor': '#0d1117', 'axes.facecolor': '#161b22',
    'text.color': '#e6edf3', 'axes.labelcolor': '#8b949e',
    'xtick.color': '#8b949e', 'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d', 'grid.color': '#21262d',
    'font.family': 'monospace',
})

print("=" * 68)
print("ANALYSIS 3 — SCALE GAP + MARKET CONCENTRATION")
print("=" * 68)


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 1: World Bank API — Account ownership + bank access indicators
# ══════════════════════════════════════════════════════════════════════════════

WB_BASE = "https://api.worldbank.org/v2/country"
INDICATORS = {
    "FX.OWN.TOTL.ZS":  "Account ownership % (adults 15+)",
    "FB.CBK.BRCH.P5":   "Bank branches per 100K adults",
}
G7_ISOS = ["CA", "US", "GB", "DE", "FR", "AU", "JP"]

print("\n[1/3] Fetching World Bank financial inclusion indicators")

wb_results = {}
for ind_code, ind_label in INDICATORS.items():
    country_str = ";".join(G7_ISOS)
    url = f"{WB_BASE}/{country_str}/indicator/{ind_code}?format=json&mrv=5&per_page=100"
    print(f"  GET {url[:85]}...")
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        data = r.json()
        records = data[1] if len(data) > 1 else []
        valid   = {d["countryiso3code"]: d for d in records
                   if d.get("value") is not None and d["countryiso3code"] in
                   ["CAN","USA","GBR","DEU","FRA","AUS","JPN"]}
        wb_results[ind_code] = valid
        print(f"  → {ind_label}:")
        for iso, d in sorted(valid.items(), key=lambda x: -x[1]["value"]):
            print(f"     {d['country']['value']:20s}: {d['value']:.1f}  ({d['date']})")
    except Exception as e:
        print(f"  → ERROR: {e}")
        wb_results[ind_code] = {}


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 2: Bank of Canada Valet API — rate context
# ══════════════════════════════════════════════════════════════════════════════

print("\n[2/3] Fetching Bank of Canada Valet API — rate context")
BOC_URL = "https://www.bankofcanada.ca/valet/observations/V122514/json?recent=3"
print(f"  GET {BOC_URL}")
try:
    r_boc = requests.get(BOC_URL, timeout=15)
    boc_obs = r_boc.json().get("observations", [])
    boc_rate = float(boc_obs[-1]["V122514"]["v"]) if boc_obs else 2.25
    boc_date = boc_obs[-1]["d"] if boc_obs else "n/a"
    print(f"  → Target overnight rate: {boc_rate}% (as of {boc_date})")
except Exception as e:
    boc_rate = 2.25
    print(f"  → ERROR: {e}, using fallback {boc_rate}%")


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 3: OSFI / WOWA deposit market share data
# Original source: OSFI public quarterly data (aggregated by WOWA Q2 2025)
# ══════════════════════════════════════════════════════════════════════════════

print("\n[3/3] Loading OSFI deposit market share data")
print("      Source: WOWA.ca aggregation of OSFI quarterly filings, Q2 2025")
print("      URL: wowa.ca/infographics-finance-realestate-canada/canada-financial-institutions-deposit-portfolio-market-share-q2-2025")
print("      OSFI primary source: osfi-bsif.gc.ca/en/data-forms/financial-data/banks")

# Deposit data from WOWA Q2 2025 (sourced from OSFI public filings)
# Total deposits across institutions with assets >$1B: $6.7 trillion
pre_acq = pd.DataFrame([
    # institution, deposits_B, customers_M, type
    # Deposit figures: WOWA/OSFI Q2 2025 · Customer counts: 2024 Annual Reports (SEDAR)
    ("TD Bank",           1490.2,  16.5, "Big 6"),
    ("RBC",               1411.2,  17.0, "Big 6"),
    ("Scotiabank",         969.5,  11.0, "Big 6"),
    ("BMO",                958.3,   8.0, "Big 6"),
    ("CIBC",               764.7,  11.0, "Big 6"),
    ("National Bank",      388.0,   2.8, "Big 6"),
    ("Desjardins",         309.4,   7.0, "Credit Union"),
    ("ATB Financial",       43.3,   0.8, "Regional"),
    ("EQ Bank",             34.8,   0.8, "Challenger"),
    ("PC Financial",         5.8,   2.5, "Challenger"),
    ("All Others",         130.5,  None, "Other"),
], columns=["institution", "deposits_B", "customers_M", "type"])

total_deposits = pre_acq["deposits_B"].sum()
pre_acq["share_pct"] = pre_acq["deposits_B"] / total_deposits * 100

print(f"\n  Total Canadian deposits tracked: ${total_deposits/1000:.1f}T")
print(f"  Big 6 share: {pre_acq[pre_acq['type']=='Big 6']['share_pct'].sum():.1f}%")

# Post-acquisition: merge EQ Bank + PC Financial
post_acq = pre_acq[~pre_acq["institution"].isin(["EQ Bank", "PC Financial"])].copy()
eqpc = pd.DataFrame([{
    "institution": "EQB + PC Financial",
    # Assets added: $5.8B per EQB press release May 5, 2026
    # Source: https://eqb.investorroom.com/2026-05-05-EQB-secures-final-approval
    "deposits_B":  34.8 + 5.8,
    "customers_M": 0.8 + 2.5,   # ~3.3M combined, per EQB investor presentation
    "type": "Challenger Combined",
}])
post_acq = pd.concat([post_acq, eqpc], ignore_index=True)
post_total = post_acq["deposits_B"].sum()
post_acq["share_pct"] = post_acq["deposits_B"] / post_total * 100

# ── HHI CALCULATION ────────────────────────────────────────────────────────────
# HHI = Σ(share_i²) — standard measure of market concentration
# DOJ / Competition Bureau: >2,500 = "highly concentrated"
def hhi(shares): return sum(s**2 for s in shares)

hhi_pre  = hhi(pre_acq["share_pct"].fillna(0))
hhi_post = hhi(post_acq["share_pct"].fillna(0))
big6_pre  = pre_acq[pre_acq["type"] == "Big 6"]["share_pct"].sum()
big6_post = post_acq[post_acq["type"] == "Big 6"]["share_pct"].sum()
eqpc_share = post_acq[post_acq["institution"] == "EQB + PC Financial"]["share_pct"].values[0]

print(f"\n  HHI pre-acquisition:  {hhi_pre:.0f}  (Competition Bureau 'highly concentrated' threshold: 2,500)")
print(f"  HHI post-acquisition: {hhi_post:.0f}  (change: {hhi_post-hhi_pre:+.0f})")
print(f"  Big 6 share pre:  {big6_pre:.1f}%")
print(f"  Big 6 share post: {big6_post:.1f}%")
print(f"  EQB + PC Financial post-acquisition share: {eqpc_share:.2f}%")
print(f"  EQB + PC Financial post-acquisition customers: ~3.3M")
print(f"  Source: EQB press release May 5, 2026 (eqb.investorroom.com)")


# ── VISUALISATION ─────────────────────────────────────────────────────────────
COLORS_MAP = {
    "Big 6":               "#f85149",
    "Credit Union":        "#e6712d",
    "Regional":            "#58a6ff",
    "Challenger":          "#3fb950",
    "Challenger Combined": "#b57efb",
    "Other":               "#4a5568",
}

fig, axes = plt.subplots(1, 3, figsize=(18, 7))
fig.suptitle(
    "The Scale Gap: Challenger Banks vs. The Oligopoly\n"
    "Sources: World Bank API (FX.OWN.TOTL.ZS, FB.CBK.BRCH.P5) · WOWA/OSFI Q2 2025 · EQB IR May 2026",
    fontsize=12, fontweight="bold", color="#e6edf3", y=1.01
)

# PANEL 1 — Account ownership comparison (World Bank live data)
ax1 = axes[0]
acct_data = wb_results.get("FX.OWN.TOTL.ZS", {})
if acct_data:
    labels = [d["country"]["value"][:12] for d in acct_data.values()]
    vals   = [d["value"] for d in acct_data.values()]
    order  = np.argsort(vals)
    colors = ["#3fb950" if "Canada" in labels[i] else "#58a6ff" for i in order]
    ax1.barh([labels[i] for i in order], [vals[i] for i in order],
             color=colors, alpha=0.85, edgecolor="none")
    ax1.set_xlabel("% of adults with bank account")
    ax1.set_title(
        "Account Ownership — G7 Countries\nWorld Bank API · FX.OWN.TOTL.ZS · Most recent yr",
        fontsize=10, color="#8b949e"
    )
    ax1.grid(axis="x", alpha=0.3)
    ax1.set_xlim([95, 101])
else:
    ax1.text(0.5, 0.5, "World Bank data\nnot retrieved", ha="center", va="center",
             transform=ax1.transAxes, color="#8b949e")

# PANEL 2 — Deposit market share (OSFI via WOWA)
ax2 = axes[1]
sorted_post = post_acq.sort_values("deposits_B", ascending=True)
bar_colors  = [COLORS_MAP.get(t, "#4a5568") for t in sorted_post["type"]]
bars = ax2.barh(sorted_post["institution"], sorted_post["deposits_B"],
                color=bar_colors, alpha=0.85, edgecolor="none")
ax2.set_xlabel("Total deposits ($B) · Source: OSFI via WOWA Q2 2025")
ax2.set_title(
    "Deposit Market Share — Post Acquisition\nOSFI Quarterly Data · Total: $6.7T",
    fontsize=10, color="#8b949e"
)
ax2.grid(axis="x", alpha=0.2)
for bar, row in zip(bars, sorted_post.itertuples()):
    if bar.get_width() > 50:
        ax2.text(bar.get_width() - 60, bar.get_y() + bar.get_height()/2,
                 f"{row.share_pct:.1f}%", va="center", ha="right", color="white", fontsize=8)

# Highlight EQB+PC
for bar, inst in zip(bars, sorted_post["institution"]):
    if inst == "EQB + PC Financial":
        bar.set_edgecolor("#b57efb")
        bar.set_linewidth(2)

# Legend
patches = [mpatches.Patch(color=v, label=k, alpha=0.85) for k, v in COLORS_MAP.items()]
ax2.legend(handles=patches, loc="lower right", framealpha=0.3, fontsize=8)

# PANEL 3 — Customer count scale gap
ax3 = axes[2]
cust_data = {
    "TD Bank": 16.5, "RBC": 17.0, "Scotiabank": 11.0, "BMO": 8.0,
    "CIBC": 11.0, "National Bank": 2.8,
    "EQB+PC\n(combined)": 3.3,
    "EQ Bank\n(pre-acq)": 0.8,
}
c_colors = ["#f85149" if k not in ["EQB+PC\n(combined)", "EQ Bank\n(pre-acq)"] else
            ("#b57efb" if "combined" in k else "#3fb950") for k in cust_data]
bars3 = ax3.bar(list(cust_data.keys()), list(cust_data.values()),
                color=c_colors, alpha=0.85, edgecolor="none", width=0.7)
ax3.set_ylabel("Customers (millions)")
ax3.set_title(
    "Customer Base: The Scale Gap\nSource: 2024 Annual Reports (SEDAR) · EQB IR 2026",
    fontsize=10, color="#8b949e"
)
ax3.grid(axis="y", alpha=0.2)
plt.setp(ax3.get_xticklabels(), rotation=30, ha="right", fontsize=9)
for bar, val in zip(bars3, cust_data.values()):
    ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.15,
             f"{val}M", ha="center", va="bottom", fontsize=9, color="#8b949e")

ax3.annotate(
    f"HHI pre: {hhi_pre:.0f}\nHHI post: {hhi_post:.0f}\n(>2,500 = highly\nconcentrated)",
    xy=(0.98, 0.97), xycoords="axes fraction", ha="right", va="top",
    fontsize=8, color="#8b949e",
    bbox=dict(boxstyle="round,pad=0.4", facecolor="#161b22", edgecolor="#30363d"),
)

plt.tight_layout()
plt.savefig("outputs/03_scale_gap.png", dpi=180, bbox_inches="tight", facecolor="#0d1117")
print(f"\n[✓] Chart saved: outputs/03_scale_gap.png")
print(f"    Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
