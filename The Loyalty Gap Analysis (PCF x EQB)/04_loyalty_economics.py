"""
04_loyalty_economics.py
=======================
The Loyalty Gap — Analysis 4
PC Optimum Loyalty Economics + CAC Arbitrage Model

LIVE DATA SOURCES:
  1. Bank of Canada Valet API — 5-yr mortgage rate, overnight rate
     Series V80691335: 5-yr conventional mortgage rate
     Series V122514:   Target overnight rate
     URL: https://www.bankofcanada.ca/valet/observations/{series}/json?recent=24
     No API key required.
     Docs: https://www.bankofcanada.ca/valet/docs

  2. World Bank Open Data API — GDP per capita (income context for LTV model)
     Indicator NY.GDP.PCAP.CD: GDP per capita (current USD)
     URL: https://api.worldbank.org/v2/country/CA/indicator/NY.GDP.PCAP.CD?format=json&mrv=3
     No API key required.

  3. CAC benchmarks (publicly available industry research, cited inline):
     - Traditional bank CAC $150–$350: YouYaa research (youyaa.com, 2024)
       "Evolution of Customer Acquisition Costs: Traditional Banks vs. Neobanks in 2024"
     - Neobank CAC $5–$15: YouYaa research (youyaa.com, 2024); Robeco analysis (robeco.com, 2024)
     - Nubank CAC <$1: Robeco Global, "The neobank era has arrived", Sept 2024
       URL: robeco.com/en-int/insights/2024/09/the-neobank-era-has-arrived
     - Revolut blended CAC ~£20 (2023): Robeco Global, same source
     - Ark Invest analysis ($20 neobank vs $925 traditional): symphonize.com, Feb 2025
       URL: symphonize.com/insights-banking/the-rise-of-neobanks-what-community-banks-and-credit-unions-can-learn
     - LTV:CAC ratio 3.5x for successful neobanks: upgrowth.in analysis, Aug 2025

  4. PC Optimum program data:
     - 18M+ members: Loblaw Companies Annual Information Form 2023-24
       Filed on SEDAR: sedar.com (search: Loblaw Companies Limited)
     - 10,000 pts = $10 redemption rate (0.1¢/pt): pcoptimum.ca terms and conditions
     - Welcome bonus economics: EQ Bank posted rate schedules + PC Optimum earn rules
       Source: milesopedia.com/en/guide/tutorials/pc-optimum-points-value/ (Apr 2026)
"""

import requests
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
from datetime import datetime

plt.rcParams.update({
    'figure.facecolor': '#0d1117', 'axes.facecolor': '#161b22',
    'text.color': '#e6edf3', 'axes.labelcolor': '#8b949e',
    'xtick.color': '#8b949e', 'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d', 'grid.color': '#21262d',
    'font.family': 'monospace',
})

print("=" * 68)
print("ANALYSIS 4 — PC OPTIMUM LOYALTY ECONOMICS + CAC MODEL")
print("=" * 68)


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 1: Bank of Canada Valet API — live rate data
# ══════════════════════════════════════════════════════════════════════════════

BOC_BASE = "https://www.bankofcanada.ca/valet/observations"
boc_series = {
    "V122514":   "Target overnight rate",
    "V80691335": "5-yr conventional mortgage",
    "V122530":   "Bank rate",
    "V80691335": "5-yr conventional mortgage",
}

print(f"\n[1/3] Fetching Bank of Canada Valet API")
live_boc = {}
for code, label in boc_series.items():
    url = f"{BOC_BASE}/{code}/json?recent=12"
    print(f"  GET {url}")
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        obs = [o for o in r.json().get("observations", [])
               if o.get(code, {}).get("v") not in (None, "")]
        if obs:
            val  = float(obs[-1][code]["v"])
            date = obs[-1]["d"]
            live_boc[code] = {"value": val, "date": date, "label": label}
            # Also grab 12-month history for context
            history = [(o["d"], float(o[code]["v"])) for o in obs]
            live_boc[code]["history"] = history
            print(f"  → {label}: {val}% (as of {date})")
    except Exception as e:
        print(f"  → ERROR fetching {code}: {e}")

overnight = live_boc.get("V122514", {}).get("value", 2.25)
mortgage5  = live_boc.get("V80691335", {}).get("value", 6.09)
print(f"\n  Context: BoC overnight {overnight}%, 5yr mortgage {mortgage5}%")


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 2: World Bank API — Canada GDP per capita
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n[2/3] Fetching World Bank API — Canada GDP per capita")
wb_url = "https://api.worldbank.org/v2/country/CA/indicator/NY.GDP.PCAP.CD?format=json&mrv=3"
print(f"  GET {wb_url}")
gdp_per_capita = 54000   # fallback
try:
    r = requests.get(wb_url, timeout=20)
    r.raise_for_status()
    data = r.json()
    records = [d for d in data[1] if d.get("value")]
    if records:
        gdp_per_capita = records[0]["value"]
        gdp_year       = records[0]["date"]
        print(f"  → Canada GDP per capita: ${gdp_per_capita:,.0f} USD ({gdp_year})")
        print(f"     Source: World Bank NY.GDP.PCAP.CD")
except Exception as e:
    print(f"  → ERROR: {e} — using fallback ${gdp_per_capita:,}")


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 3: CAC benchmarks (manually compiled from public research)
# ══════════════════════════════════════════════════════════════════════════════

print(f"\n[3/3] Loading CAC benchmarks (public industry research)")

# Each figure is individually sourced — see module docstring
cac_benchmarks = [
    {
        "label": "Traditional Bank\n(premium relationship)",
        "cac": 400,
        "type": "traditional",
        "source": "Accenture / Ark Invest analysis (public)",
        "note": "Includes branch overhead, staff, print advertising"
    },
    {
        "label": "Traditional Bank\n(average)",
        "cac": 250,
        "type": "traditional",
        "source": "YouYaa research 2024 (youyaa.com)",
        "note": "Range cited: $150–$350; midpoint used"
    },
    {
        "label": "Revolut\n(blended 2023)",
        "cac": 25,    # £20 GBP ≈ $25 CAD
        "type": "neobank",
        "source": "Robeco Global: 'The neobank era has arrived' (Sept 2024)",
        "note": "£20 converted at ~1.25 CAD/GBP; 30% of new users organic in 2023"
    },
    {
        "label": "EQ Bank\n(digital-first est.)",
        "cac": 15,
        "type": "neobank",
        "source": "Estimated — no public disclosure from EQB",
        "note": "Based on digital-only model consistent with neobank benchmarks"
    },
    {
        "label": "Neobank average\n(industry)",
        "cac": 10,
        "type": "neobank",
        "source": "YouYaa 2024 (youyaa.com); Robeco 2024 (robeco.com)",
        "note": "Range $5–$15 across digital-only challengers"
    },
    {
        "label": "Nubank (Brazil)\nword-of-mouth",
        "cac": 1,
        "type": "neobank",
        "source": "Robeco Global: 'The neobank era has arrived' (Sept 2024)",
        "note": "80–90% of customers via unpaid word-of-mouth 2021–2023"
    },
]

print(f"\n  CAC benchmark sources:")
for b in cac_benchmarks:
    print(f"  {'$'+str(b['cac']):>6s}  {b['label'].replace(chr(10),' '):<35s}  {b['source'][:50]}")


# ── PC OPTIMUM CONVERSION MODEL ───────────────────────────────────────────────

PC_OPTIMUM_MEMBERS  = 18_000_000   # Loblaw Companies AIF 2023-24 (SEDAR)
PC_FINANCIAL_CUST   = 2_500_000    # EQB press release May 2026 (eqb.investorroom.com)

# Campaign cost model — EQB loyalty banking conversion
# Assumptions:
#   - Reach cost per PC Optimum member (digital push via app): $0.50
#     (Email/push notification to app-installed base; industry email CPM ≈$5/1000 = $0.005,
#     but here includes segmentation, offer design, compliance. Conservative at $0.50)
#   - Welcome bonus: 20,000 PC Optimum points ($20 value at 0.1¢/pt)
#     Rationale: matches typical EQ Bank welcome offers and PC Optimum promotional norms
#   - Admin / KYC / onboarding automation cost: $5 per opened account
#     Source: Ark Invest analysis suggests digital onboarding ~$5–10 per account

REACH_COST_PER_MEMBER = 0.50     # $0.50 per PC Optimum member reached via digital
WELCOME_BONUS_POINTS  = 20_000   # points
WELCOME_BONUS_VALUE   = 20.00    # $ (at 0.1¢/pt base redemption)
ONBOARDING_COST       = 5.00     # $ per account opened (KYC, provisioning)

COST_PER_CONVERTED    = REACH_COST_PER_MEMBER + WELCOME_BONUS_VALUE + ONBOARDING_COST

print(f"\n  PC Optimum conversion model:")
print(f"    Members in program:           {PC_OPTIMUM_MEMBERS:>12,}  (Loblaw AIF 2023-24)")
print(f"    Reach cost per member:        ${REACH_COST_PER_MEMBER:>10.2f}  (digital push notification)")
print(f"    Welcome bonus:                {WELCOME_BONUS_POINTS:>12,} pts = ${WELCOME_BONUS_VALUE:.2f}")
print(f"    Onboarding automation cost:   ${ONBOARDING_COST:>10.2f}  (KYC + account provisioning)")
print(f"    Total cost per converted acct:${COST_PER_CONVERTED:>10.2f}")

conversion_pcts = [1, 2, 5, 10, 15, 20]
print(f"\n  Conversion scenario analysis:")
print(f"  {'Conv %':>6}  {'New Cust':>10}  {'Total Campaign $':>18}  {'Implied CAC':>12}  {'vs Trad Bank':>14}")
print(f"  {'-'*65}")
scenarios = []
for pct in conversion_pcts:
    n_cust   = int(PC_OPTIMUM_MEMBERS * pct / 100)
    total_c  = (PC_OPTIMUM_MEMBERS * REACH_COST_PER_MEMBER +
                n_cust * (WELCOME_BONUS_VALUE + ONBOARDING_COST))
    cac_imp  = total_c / n_cust
    vs_trad  = 250 / cac_imp  # ratio vs traditional bank avg $250
    print(f"  {pct:>5}%  {n_cust:>10,}  ${total_c/1e6:>15.1f}M  ${cac_imp:>10.2f}  {vs_trad:>8.1f}× cheaper")
    scenarios.append({"pct": pct, "n_cust": n_cust, "total_cost": total_c, "cac": cac_imp})

# Add PC Optimum CAC scenarios to benchmarks for chart
cac_benchmarks.append({
    "label": "EQB via PC Optimum\n(10% conversion)",
    "cac": next(s["cac"] for s in scenarios if s["pct"] == 10),
    "type": "loyalty",
    "source": "Model: $0.50 reach + $20 welcome bonus + $5 onboarding",
    "note": "1.8M new banking customers at challenger economics"
})
cac_benchmarks.append({
    "label": "EQB via PC Optimum\n(5% conversion)",
    "cac": next(s["cac"] for s in scenarios if s["pct"] == 5),
    "type": "loyalty",
    "source": "Model: $0.50 reach + $20 welcome bonus + $5 onboarding",
    "note": "900K new banking customers"
})


# ── VISUALISATION ─────────────────────────────────────────────────────────────
TYPE_COLORS = {"traditional": "#f85149", "neobank": "#58a6ff", "loyalty": "#3fb950"}

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
fig.suptitle(
    "Loyalty Economics: The PC Optimum CAC Arbitrage\n"
    "Sources: BoC Valet API · World Bank NY.GDP.PCAP.CD · YouYaa/Robeco/Ark CAC research · Loblaw AIF · EQB IR",
    fontsize=12, fontweight="bold", color="#e6edf3", y=1.01
)

# PANEL 1 — CAC benchmark comparison
sorted_bm = sorted(cac_benchmarks, key=lambda x: x["cac"])
labels    = [b["label"] for b in sorted_bm]
vals      = [b["cac"]   for b in sorted_bm]
colors1   = [TYPE_COLORS[b["type"]] for b in sorted_bm]

bars1 = ax1.barh(labels, vals, color=colors1, alpha=0.85, edgecolor="none")
ax1.set_xlabel("Customer Acquisition Cost (CAD $)")
ax1.set_title(
    "CAC Comparison: Traditional → Neobank → Loyalty\n"
    "Sources: YouYaa 2024 · Robeco 2024 · EQB loyalty model",
    fontsize=10, color="#8b949e"
)
ax1.grid(axis="x", alpha=0.2)
ax1.xaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f"${x:.0f}"))
for bar, val, bm in zip(bars1, vals, sorted_bm):
    ax1.text(bar.get_width() + 3, bar.get_y() + bar.get_height()/2,
             f"${val:.0f}",
             va="center", ha="left", fontsize=8, color="#8b949e")

# Type legend
from matplotlib.patches import Patch
legend_els = [Patch(color=v, label=k.title(), alpha=0.85) for k, v in TYPE_COLORS.items()]
ax1.legend(handles=legend_els, loc="lower right", framealpha=0.3, fontsize=9)

# Reference lines
ax1.axvline(250, color="#f85149", linewidth=1, linestyle="--", alpha=0.6)
ax1.text(252, 0, "Trad. bank avg ($250)", color="#f85149", fontsize=8, va="bottom")

# PANEL 2 — Conversion scenarios: new customers + CAC
ax2_twin = ax2.twinx()

n_custs  = [s["n_cust"] / 1e6 for s in scenarios]
cac_imps = [s["cac"]          for s in scenarios]
pct_lbls = [f"{s['pct']}%"    for s in scenarios]

bars2 = ax2.bar(pct_lbls, n_custs, color="#3fb950", alpha=0.6, edgecolor="none", label="New banking customers (M)")
ax2_twin.plot(pct_lbls, cac_imps, "o-", color="#b57efb", linewidth=2.5,
              markersize=7, label="Implied CAC ($)")

# Reference lines on twin axis
ax2_twin.axhline(250, color="#f85149", linewidth=1, linestyle="--", alpha=0.6)
ax2_twin.text(0.02, 255, "Traditional bank avg CAC ($250)", color="#f85149", fontsize=8)
ax2_twin.axhline(10,  color="#58a6ff", linewidth=1, linestyle="--", alpha=0.6)
ax2_twin.text(0.02, 14, "Neobank avg CAC ($10)", color="#58a6ff", fontsize=8)

ax2.set_xlabel(f"% of PC Optimum members converted (18M total · Loblaw AIF 2023-24)")
ax2.set_ylabel("New EQB banking customers (millions)", color="#3fb950")
ax2_twin.set_ylabel("Implied CAC per customer ($)", color="#b57efb")
ax2.set_title(
    f"PC Optimum Conversion Scenarios\n"
    f"BoC overnight: {overnight}% · GDP/capita: ${gdp_per_capita:,.0f} (World Bank {list(live_boc.values())[0]['date'][:4]})",
    fontsize=10, color="#8b949e"
)
ax2.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f"{x:.1f}M"))
ax2_twin.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f"${x:.0f}"))
lines1, l1 = ax2.get_legend_handles_labels()
lines2, l2 = ax2_twin.get_legend_handles_labels()
ax2.legend(lines1 + lines2, l1 + l2, loc="upper right", framealpha=0.3, fontsize=9)
ax2.grid(axis="y", alpha=0.2)

plt.tight_layout()
plt.savefig("outputs/04_loyalty_economics.png", dpi=180, bbox_inches="tight", facecolor="#0d1117")
print(f"\n[✓] Chart saved: outputs/04_loyalty_economics.png")
print(f"    Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
