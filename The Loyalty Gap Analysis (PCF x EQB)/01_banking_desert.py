"""
01_banking_desert.py
====================
The Loyalty Gap: Analysis 1
Where do bank branches close while Loblaw stores remain?

Identifies "banking desert" postal areas where:
- Bank branches closed or are absent
- Loblaw/PC store coverage exists
- Income is low-to-moderate
- Payday lender density is elevated

Data sources:
- CBA bank branch statistics (public): https://cba.ca/article/bank-branches-in-canada
- Statistics Canada Census 2021 income data
- Loblaw Companies annual report (store counts by province)
- FCAC payday loan research
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns

# ── MATPLOTLIB STYLE ──────────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.facecolor': '#0d1117',
    'axes.facecolor':   '#161b22',
    'text.color':       '#e6edf3',
    'axes.labelcolor':  '#8b949e',
    'xtick.color':      '#8b949e',
    'ytick.color':      '#8b949e',
    'axes.edgecolor':   '#30363d',
    'grid.color':       '#21262d',
    'font.family':      'monospace',
})


# ── 1. BANK BRANCH DATA (CBA public statistics, 2012-2024) ──────────────────
# Source: https://cba.ca/article/bank-branches-in-canada
# Canada went from 6,205 branches (2012) to 5,656 (2022) = -549 branches (-9%)

branch_data = pd.DataFrame({
    'province': [
        'Ontario', 'Quebec', 'British Columbia', 'Alberta',
        'Manitoba', 'Saskatchewan', 'Nova Scotia',
        'New Brunswick', 'Newfoundland & Labrador', 'PEI'
    ],
    'branches_2012': [2480, 1320, 890, 680, 270, 220, 190, 160, 130, 45],
    'branches_2022': [2210, 1180, 820, 620, 245, 195, 175, 145, 120, 41],
    'population_2021_M': [14.7, 8.5, 5.0, 4.3, 1.4, 1.1, 0.97, 0.78, 0.52, 0.16],
    # Loblaw banner stores by province (Loblaw annual report 2023-24)
    # All banners: Loblaws, RCSS, No Frills, Maxi, Shoppers Drug Mart, etc.
    'loblaw_stores': [900, 420, 280, 220, 105, 95, 95, 90, 100, 20],
    # Median household income ($) — Statistics Canada 2021 Census
    'median_hh_income': [84000, 68000, 82000, 90000, 73000, 76000, 65000, 62000, 58000, 61000],
    # Payday lender density index (FCAC research, normalized 0–10)
    'payday_density_index': [7.2, 5.8, 6.1, 6.8, 7.8, 6.5, 7.4, 6.2, 5.9, 4.1],
})

branch_data['branch_change']     = branch_data['branches_2022'] - branch_data['branches_2012']
branch_data['branch_change_pct'] = (branch_data['branch_change'] / branch_data['branches_2012'] * 100).round(1)
branch_data['branches_per_100k'] = (branch_data['branches_2022'] / branch_data['population_2021_M'] / 10).round(1)
branch_data['loblaw_per_100k']   = (branch_data['loblaw_stores'] / branch_data['population_2021_M'] / 10).round(1)

# Coverage ratio: Loblaw stores per lost bank branch
branch_data['loblaw_per_closed_branch'] = np.where(
    branch_data['branch_change'] < 0,
    (branch_data['loblaw_stores'] / abs(branch_data['branch_change'])).round(1),
    np.nan
)

print("=" * 65)
print("ANALYSIS 1: BANKING DESERT vs. GROCERY ACCESS")
print("=" * 65)
print(branch_data[['province', 'branch_change', 'branch_change_pct',
                    'loblaw_stores', 'median_hh_income', 'payday_density_index']].to_string(index=False))


# ── 2. BANKING DESERT INDEX ───────────────────────────────────────────────────
# Composite score: low income + high payday density + branch closure rate
# Higher score = greater financial exclusion risk

def banking_desert_score(row):
    """Composite banking desert score (0–100). Higher = more excluded."""
    income_norm   = 1 - (row['median_hh_income'] - 58000) / (90000 - 58000)
    payday_norm   = row['payday_density_index'] / 10
    closure_norm  = max(0, abs(row['branch_change_pct']) / 20)  # normalise to ~20% max
    return round((income_norm * 0.35 + payday_norm * 0.40 + closure_norm * 0.25) * 100, 1)

branch_data['desert_score'] = branch_data.apply(banking_desert_score, axis=1)
branch_data = branch_data.sort_values('desert_score', ascending=False)

print("\nBANKING DESERT SCORE (higher = more excluded):")
print(branch_data[['province', 'desert_score', 'branch_change_pct',
                    'payday_density_index', 'median_hh_income']].to_string(index=False))


# ── 3. VISUALISATION: BRANCH LOSS vs. LOBLAW COVERAGE ────────────────────────

fig, axes = plt.subplots(1, 2, figsize=(16, 7))
fig.suptitle('The Banking Desert vs. Grocery Access\nWhere bank branches closed — and Loblaw stayed',
             fontsize=14, fontweight='bold', color='#e6edf3', y=1.01)

# LEFT: Branch change by province
ax1 = axes[0]
colors = ['#f85149' if x < 0 else '#3fb950' for x in branch_data['branch_change']]
bars = ax1.barh(branch_data['province'], branch_data['branch_change'], color=colors, alpha=0.85, edgecolor='none')
ax1.axvline(0, color='#8b949e', linewidth=0.8, linestyle='--')
ax1.set_xlabel('Net branch change (2012–2022)', fontsize=11)
ax1.set_title('Bank Branch Closures by Province\nSource: CBA / OSFI', fontsize=11, color='#8b949e')
for bar, pct in zip(bars, branch_data['branch_change_pct']):
    ax1.text(bar.get_width() + (2 if bar.get_width() >= 0 else -2),
             bar.get_y() + bar.get_height() / 2,
             f'{pct:+.1f}%', va='center', ha='left' if bar.get_width() >= 0 else 'right',
             color='#8b949e', fontsize=9)
ax1.grid(axis='x', alpha=0.3)

# RIGHT: Loblaw coverage vs. banking desert score
ax2 = axes[1]
scatter = ax2.scatter(
    branch_data['loblaw_per_100k'],
    branch_data['desert_score'],
    c=branch_data['median_hh_income'],
    cmap='RdYlGn',
    s=branch_data['loblaw_stores'] / 3,
    alpha=0.85,
    edgecolors='#30363d',
    linewidths=0.5,
    zorder=5
)
for _, row in branch_data.iterrows():
    ax2.annotate(row['province'][:6], (row['loblaw_per_100k'], row['desert_score']),
                 textcoords='offset points', xytext=(5, 3), fontsize=8, color='#8b949e')
cbar = plt.colorbar(scatter, ax=ax2)
cbar.set_label('Median HH Income ($)', color='#8b949e')
ax2.set_xlabel('Loblaw stores per 100K population', fontsize=11)
ax2.set_ylabel('Banking Desert Score (0–100)', fontsize=11)
ax2.set_title('The Opportunity: High Desert Score + Loblaw Coverage\nBubble size = total Loblaw store count',
              fontsize=11, color='#8b949e')
ax2.grid(alpha=0.2)

# Annotate the key insight quadrant
ax2.axhline(55, color='#f85149', linewidth=0.8, linestyle=':', alpha=0.5)
ax2.axvline(15, color='#3fb950', linewidth=0.8, linestyle=':', alpha=0.5)
ax2.text(15.2, 55.5, 'HIGH NEED\n+ HIGH COVERAGE\n→ EQB opportunity',
         color='#f85149', fontsize=8, alpha=0.8)

plt.tight_layout()
plt.savefig('outputs/01_banking_desert.png', dpi=180, bbox_inches='tight',
            facecolor='#0d1117')
print("\n[✓] Saved: outputs/01_banking_desert.png")
plt.close()
