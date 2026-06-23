"""
04_loyalty_economics.py
=======================
The Loyalty Gap: Analysis 4
The PC Optimum conversion model: what does loyalty-linked CAC look like?

If EQB can convert even a fraction of the 18M PC Optimum members to
banking products, what does that imply for customer acquisition cost?
Compare to neobank and traditional bank CAC benchmarks.

Data sources:
- PC Optimum: 18M active members (Loblaw annual report / Milesopedia)
- CAC benchmarks: YouYaa / Ark Invest / Accenture research (public)
- EQB: 800K customers pre-acquisition; adding PC Financial 2.5M
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick

plt.rcParams.update({
    'figure.facecolor': '#0d1117', 'axes.facecolor': '#161b22',
    'text.color': '#e6edf3', 'axes.labelcolor': '#8b949e',
    'xtick.color': '#8b949e', 'ytick.color': '#8b949e',
    'axes.edgecolor': '#30363d', 'grid.color': '#21262d',
    'font.family': 'monospace',
})

# ── CAC BENCHMARKS (public industry data) ─────────────────────────────────────
cac_benchmarks = {
    'Traditional Bank (avg)':      250,   # YouYaa, Accenture; range $150–$350
    'Traditional Bank (premium)':  400,   # for full-service relationship banking
    'Neobank (avg)':               12,    # YouYaa; range $5–$20
    'Nubank (Brazil, word-of-mouth)': 1,  # Robeco / public reporting
    'Revolut (2023 blended)':      25,    # Robeco; £20 ≈ $25 CAD
    'EQ Bank (digital-first est.)': 15,   # estimated, digital-first
    'EQB via PC Optimum\n(10% conversion)': None,  # modelled below
    'EQB via PC Optimum\n(5% conversion)':  None,
}

# ── PC OPTIMUM CONVERSION MODEL ───────────────────────────────────────────────
pc_optimum_members   = 18_000_000
pc_financial_members  = 2_500_000

# Assumptions for PC Optimum banking conversion campaign
# EQ Bank would offer an account opening bonus tied to PC Optimum points
# Marketing cost: digital push to existing PC Optimum app users
# App install base already exists → near-zero media cost
# Estimated cost per acquired banking customer via loyalty integration
loyalty_cam_cost_per_send = 0.50   # cost to reach each PC Optimum member digitally
welcome_bonus_points = 20_000      # bonus points ($20 value) for account opening
welcome_bonus_dollar = 20.00
admin_onboarding     = 5.00        # KYC, account setup automation

cost_per_banking_customer_if_opened = (
    loyalty_cam_cost_per_send + welcome_bonus_dollar + admin_onboarding
)  # = $25.50 per converted customer

conversion_scenarios = {
    '2% conversion':  int(pc_optimum_members * 0.02),
    '5% conversion':  int(pc_optimum_members * 0.05),
    '10% conversion': int(pc_optimum_members * 0.10),
    '15% conversion': int(pc_optimum_members * 0.15),
}

print("=" * 65)
print("ANALYSIS 4: LOYALTY ECONOMICS — PC OPTIMUM CAC MODEL")
print("=" * 65)
print(f"\nPC Optimum members:       {pc_optimum_members:,}")
print(f"Cost per converted user:  ${cost_per_banking_customer_if_opened:.2f}")
print(f"\nConversion Scenarios:")
print(f"{'Scenario':<20} {'New Customers':>15} {'Total Campaign Cost':>22} {'Implied CAC':>14}")
print("-" * 75)
for scenario, n_customers in conversion_scenarios.items():
    total_cost = (pc_optimum_members * loyalty_cam_cost_per_send +
                  n_customers * (welcome_bonus_dollar + admin_onboarding))
    implied_cac = total_cost / n_customers
    print(f"{scenario:<20} {n_customers:>15,}  ${total_cost/1e6:>18.1f}M  ${implied_cac:>12.2f}")

cac_benchmarks['EQB via PC Optimum\n(10% conversion)'] = (
    (pc_optimum_members * loyalty_cam_cost_per_send + 
     conversion_scenarios['10% conversion'] * (welcome_bonus_dollar + admin_onboarding))
    / conversion_scenarios['10% conversion']
)
cac_benchmarks['EQB via PC Optimum\n(5% conversion)'] = (
    (pc_optimum_members * loyalty_cam_cost_per_send + 
     conversion_scenarios['5% conversion'] * (welcome_bonus_dollar + admin_onboarding))
    / conversion_scenarios['5% conversion']
)

print("\nImplied CAC vs. benchmarks:")
for inst, cac in cac_benchmarks.items():
    if cac:
        print(f"  {inst.replace(chr(10), ' '):<45}: ${cac:.2f}")

# ── VISUALISATION ─────────────────────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
fig.suptitle('Loyalty Economics: The PC Optimum CAC Arbitrage\nWhy PC Optimum changes EQB\'s customer acquisition math',
             fontsize=13, fontweight='bold', color='#e6edf3', y=1.01)

# LEFT: CAC comparison
cac_labels = list(cac_benchmarks.keys())
cac_vals   = [v for v in cac_benchmarks.values()]
bar_colors = ['#f85149' if 'Traditional' in l else
              '#58a6ff' if any(x in l for x in ['Nubank','Revolut','EQ Bank']) else
              '#b57efb' if 'Neobank' in l else
              '#3fb950' for l in cac_labels]
bars = ax1.barh(cac_labels, cac_vals, color=bar_colors, alpha=0.85, edgecolor='none')
ax1.set_xlabel('Customer Acquisition Cost (CAD $)', fontsize=11)
ax1.set_title('CAC Comparison: Banks vs. Neobanks vs.\nPC Optimum Loyalty Conversion',
              fontsize=11, color='#8b949e')
ax1.grid(axis='x', alpha=0.2)
ax1.xaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f'${x:.0f}'))
for bar, val in zip(bars, cac_vals):
    ax1.text(bar.get_width() + 3, bar.get_y() + bar.get_height()/2,
             f'${val:.0f}', va='center', ha='left', fontsize=9, color='#8b949e')

# RIGHT: New customers + CAC at different conversion rates
scenarios_pct = [1, 2, 5, 10, 15, 20]
new_customers  = [int(pc_optimum_members * p/100) for p in scenarios_pct]
implied_cacs   = []
for pct, nc in zip(scenarios_pct, new_customers):
    tc = (pc_optimum_members * loyalty_cam_cost_per_send + nc * (welcome_bonus_dollar + admin_onboarding))
    implied_cacs.append(tc / nc)

ax2_twin = ax2.twinx()
ax2.bar([f'{p}%' for p in scenarios_pct], [n/1e6 for n in new_customers],
        color='#3fb950', alpha=0.6, edgecolor='none', label='New banking customers (M)')
ax2_twin.plot([f'{p}%' for p in scenarios_pct], implied_cacs, 'o-',
              color='#b57efb', linewidth=2.5, markersize=7, label='Implied CAC ($)')

# Reference lines
ax2_twin.axhline(250, color='#f85149', linewidth=1, linestyle='--', alpha=0.7)
ax2_twin.text(0.02, 255, 'Traditional Bank CAC avg ($250)', color='#f85149', fontsize=8, alpha=0.8)
ax2_twin.axhline(12, color='#58a6ff', linewidth=1, linestyle='--', alpha=0.7)
ax2_twin.text(0.02, 17, 'Neobank avg CAC ($12)', color='#58a6ff', fontsize=8, alpha=0.8)

ax2.set_xlabel('% of PC Optimum members converted to banking', fontsize=11)
ax2.set_ylabel('New EQB banking customers (millions)', fontsize=11, color='#3fb950')
ax2_twin.set_ylabel('Implied CAC ($)', fontsize=11, color='#b57efb')
ax2.set_title('If EQB converts X% of PC Optimum Members\nNew customers + implied CAC per acquired user',
              fontsize=11, color='#8b949e')
ax2.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f'{x:.1f}M'))
ax2_twin.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f'${x:.0f}'))
lines1, labels1 = ax2.get_legend_handles_labels()
lines2, labels2 = ax2_twin.get_legend_handles_labels()
ax2.legend(lines1 + lines2, labels1 + labels2, loc='upper right', framealpha=0.3, fontsize=9)
ax2.grid(axis='y', alpha=0.2)

plt.tight_layout()
plt.savefig('outputs/04_loyalty_economics.png', dpi=180, bbox_inches='tight', facecolor='#0d1117')
print("\n[✓] Saved: outputs/04_loyalty_economics.png")
plt.close()
