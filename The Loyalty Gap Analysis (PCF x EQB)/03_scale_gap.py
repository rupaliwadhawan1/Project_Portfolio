"""
03_scale_gap.py
===============
The Loyalty Gap: Analysis 3
What does the acquisition do to market concentration?

Calculates HHI (Herfindahl-Hirschman Index) and deposit market share
before and after the EQB+PC Financial acquisition.

Data sources:
- WOWA.ca Q2 2025 deposit market share (sourced from OSFI / public filings)
- EQB Inc. investor relations: acquisition adds $5.8B assets, $800M retail deposits
- Customer count estimates from public reporting
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

plt.rcParams.update({
    'figure.facecolor': '#0d1117', 'axes.facecolor': '#161b22',
    'text.color': '#e6edf3', 'axes.labelcolor': '#8b949e',
    'xtick.color': '#8b949e', 'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d', 'grid.color': '#21262d',
    'font.family': 'monospace',
})

# ── DEPOSIT DATA (WOWA Q2 2025, sourced from OSFI/public filings) ─────────────
pre_acq = pd.DataFrame({
    'institution': ['TD', 'RBC', 'Scotiabank', 'BMO', 'CIBC', 'National Bank',
                    'Desjardins', 'ATB', 'EQ Bank', 'PC Financial', 'All Others'],
    'deposits_B':  [1490.2, 1411.2, 969.5, 958.3, 764.7, 388.0,
                    309.4, 43.3, 34.8, 5.8, 130.5],
    'customers_M': [16.5, 17.0, 11.0, 8.0, 11.0, 2.8,
                    7.0, 0.8, 0.8, 2.5, None],
    'type':        ['Big 6','Big 6','Big 6','Big 6','Big 6','Big 6',
                    'Credit Union','Regional','Challenger','Challenger','Other'],
})

total = pre_acq['deposits_B'].sum()
pre_acq['share_pct'] = pre_acq['deposits_B'] / total * 100

# Post-acquisition: merge EQ Bank + PC Financial
post_acq = pre_acq[~pre_acq['institution'].isin(['EQ Bank', 'PC Financial'])].copy()
eqpc_row = pd.DataFrame([{
    'institution': 'EQB + PC Financial',
    'deposits_B': 34.8 + 5.8,
    'customers_M': 0.8 + 2.5,  # ~3.3M
    'type': 'Challenger Combined',
}])
post_acq = pd.concat([post_acq, eqpc_row], ignore_index=True)
post_total = post_acq['deposits_B'].sum()
post_acq['share_pct'] = post_acq['deposits_B'] / post_total * 100

# ── HHI CALCULATION ───────────────────────────────────────────────────────────
def calc_hhi(shares):
    return round(sum(s**2 for s in shares), 1)

hhi_pre  = calc_hhi(pre_acq['share_pct'].fillna(0))
hhi_post = calc_hhi(post_acq['share_pct'].fillna(0))

big6_share_pre  = pre_acq[pre_acq['type']=='Big 6']['share_pct'].sum()
big6_share_post = post_acq[post_acq['type']=='Big 6']['share_pct'].sum()

print("=" * 65)
print("ANALYSIS 3: MARKET CONCENTRATION + SCALE GAP")
print("=" * 65)
print(f"\nHHI Pre-acquisition:  {hhi_pre:.1f}")
print(f"HHI Post-acquisition: {hhi_post:.1f}")
print(f"(HHI >2,500 = highly concentrated; Canada sits at ~{hhi_pre:.0f})")
print(f"\nBig 6 deposit share pre:  {big6_share_pre:.1f}%")
print(f"Big 6 deposit share post: {big6_share_post:.1f}%")
print(f"\nEQB post-acq deposit share: {post_acq[post_acq['institution']=='EQB + PC Financial']['share_pct'].values[0]:.2f}%")
print(f"EQB post-acq customers: ~3.3M (vs Big Five avg ~13M)")

# ── VISUALISATION ──────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(18, 7))
fig.suptitle('The Scale Gap: Challenger Banks vs. The Oligopoly\nDeposit market share before and after EQB + PC Financial acquisition',
             fontsize=13, fontweight='bold', color='#e6edf3', y=1.01)

COLORS_MAP = {
    'Big 6': '#f85149', 'Credit Union': '#e6712d', 'Regional': '#58a6ff',
    'Challenger': '#3fb950', 'Challenger Combined': '#b57efb', 'Other': '#4a5568'
}

# LEFT: Pre-acquisition treemap-style bar
ax1 = axes[0]
sorted_pre = pre_acq.sort_values('deposits_B', ascending=True)
colors_pre = [COLORS_MAP.get(t, '#4a5568') for t in sorted_pre['type']]
bars = ax1.barh(sorted_pre['institution'], sorted_pre['deposits_B'],
                color=colors_pre, alpha=0.85, edgecolor='none')
for bar, pct in zip(bars, sorted_pre['share_pct']):
    if bar.get_width() > 20:
        ax1.text(bar.get_width() - 30, bar.get_y() + bar.get_height() / 2,
                 f'{pct:.1f}%', va='center', ha='right', color='white', fontsize=9)
ax1.set_xlabel('Deposits ($B)', fontsize=10)
ax1.set_title('PRE-ACQUISITION\nDeposit share by institution', fontsize=11, color='#8b949e')
ax1.grid(axis='x', alpha=0.2)

# MIDDLE: Post-acquisition
ax2 = axes[1]
sorted_post = post_acq.sort_values('deposits_B', ascending=True)
colors_post = [COLORS_MAP.get(t, '#4a5568') for t in sorted_post['type']]
bars2 = ax2.barh(sorted_post['institution'], sorted_post['deposits_B'],
                 color=colors_post, alpha=0.85, edgecolor='none')
for bar, pct in zip(bars2, sorted_post['share_pct']):
    if bar.get_width() > 20:
        ax2.text(bar.get_width() - 30, bar.get_y() + bar.get_height() / 2,
                 f'{pct:.1f}%', va='center', ha='right', color='white', fontsize=9)
ax2.set_xlabel('Deposits ($B)', fontsize=10)
ax2.set_title('POST-ACQUISITION\nDeposit share by institution', fontsize=11, color='#8b949e')
ax2.grid(axis='x', alpha=0.2)

# Highlight the EQB+PC row
for bar, inst in zip(bars2, sorted_post['institution']):
    if inst == 'EQB + PC Financial':
        bar.set_edgecolor('#b57efb')
        bar.set_linewidth(2)

# RIGHT: Customer count comparison
ax3 = axes[2]
customer_data = {
    'TD': 16.5, 'RBC': 17.0, 'Scotiabank': 11.0, 'BMO': 8.0,
    'CIBC': 11.0, 'National Bank': 2.8, 'EQB + PC\n(combined)': 3.3,
    'EQ Bank\n(pre-acq)': 0.8, 'PC Financial\n(pre-acq)': 2.5
}
c_colors = ['#f85149' if k not in ['EQB + PC\n(combined)', 'EQ Bank\n(pre-acq)', 'PC Financial\n(pre-acq)']
            else ('#b57efb' if 'combined' in k else '#3fb950')
            for k in customer_data]
bars3 = ax3.bar(customer_data.keys(), customer_data.values(),
                color=c_colors, alpha=0.85, edgecolor='none', width=0.7)
ax3.set_ylabel('Customers (millions)', fontsize=10)
ax3.set_title('Customer Base: The Scale Gap\nPost-acq EQB = 3.3M vs Big 5 avg ~13M',
              fontsize=11, color='#8b949e')
ax3.grid(axis='y', alpha=0.2)
plt.setp(ax3.get_xticklabels(), rotation=30, ha='right', fontsize=9)
for bar, val in zip(bars3, customer_data.values()):
    ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2,
             f'{val}M', ha='center', va='bottom', fontsize=9, color='#8b949e')

# Legend
legend_patches = [mpatches.Patch(color=v, label=k, alpha=0.85) for k, v in COLORS_MAP.items()
                  if k not in ['Other']]
fig.legend(handles=legend_patches, loc='lower center', ncol=5, framealpha=0.2,
           fontsize=9, bbox_to_anchor=(0.5, -0.05))

plt.tight_layout()
plt.savefig('outputs/03_scale_gap.png', dpi=180, bbox_inches='tight', facecolor='#0d1117')
print("\n[✓] Saved: outputs/03_scale_gap.png")
plt.close()
