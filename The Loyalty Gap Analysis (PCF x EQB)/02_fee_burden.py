"""
02_fee_burden.py
================
The Loyalty Gap: Analysis 2
How much more do low-income Canadians pay in banking fees (as % of income)?

Models annual banking cost for families at different income levels comparing:
- Big Five average (chequing fee + HISA opportunity cost + card fees)
- PC Financial / EQ Bank (no-fee + PC Optimum rewards)
- Hypothetical EQ+PC combined offering

Data sources:
- Published bank fee schedules (June 2026)
- Bank of Canada research on household financial vulnerability
- PC Optimum earn rates (Milesopedia, Apr 2026)
- EQ Bank posted HISA rate 2.75% (June 2026)
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

# ── INCOME SCENARIOS ──────────────────────────────────────────────────────────
income_levels = [20_000, 35_000, 50_000, 75_000, 100_000, 150_000]
grocery_pct   = 0.15   # families spend ~15% of income on groceries (Statistics Canada)

def calc_costs(annual_income):
    """
    Model annual banking net cost/benefit at a given income level.
    Returns dict with costs for each institution type.
    """
    grocery_spend = annual_income * grocery_pct
    savings_balance = min(annual_income * 0.08, 15_000)  # 8% of income, max $15K

    results = {}

    # BIG FIVE AVERAGE
    monthly_fee   = 17.00   # avg unlimited chequing (RBC/TD/BMO/CIBC/Scotia)
    annual_fee    = monthly_fee * 12
    hisa_rate     = 0.0004  # avg Big Five HISA rate 0.04%
    hisa_income   = savings_balance * hisa_rate
    cc_rewards    = grocery_spend * 0.02   # avg 2% rewards on grocery spend
    cc_annual_fee = 120.00                  # typical rewards card annual fee
    # Opportunity cost: holding $4K in chequing for fee waiver vs EQ Bank 2.75%
    opp_cost      = 4_000 * 0.0275
    net_cost      = annual_fee + cc_annual_fee + opp_cost - hisa_income - cc_rewards
    results['Big Five Avg'] = {'net_cost': net_cost, 'pct_income': net_cost / annual_income * 100,
        'breakdown': {'Chequing fees': annual_fee, 'Card annual fee': cc_annual_fee,
                      'Opportunity cost': opp_cost, 'HISA interest': -hisa_income,
                      'Card rewards': -cc_rewards}}

    # PC FINANCIAL (standalone)
    pc_hisa       = savings_balance * 0.015  # PC HISA 1.5%
    pc_rewards    = grocery_spend * 0.015    # 1.5% PC Optimum base (15pts/$1 at 0.1¢)
    pc_net        = 0 - pc_hisa - pc_rewards  # no fees
    results['PC Financial'] = {'net_cost': pc_net, 'pct_income': pc_net / annual_income * 100,
        'breakdown': {'Chequing fees': 0, 'Card annual fee': 0,
                      'HISA interest': -pc_hisa, 'PC Optimum rewards': -pc_rewards}}

    # EQ BANK (standalone)
    eq_hisa      = savings_balance * 0.0275  # EQ Bank 2.75%
    eq_rewards   = grocery_spend * 0.005     # EQ Card 0.5% cashback (limited)
    eq_net       = 0 - eq_hisa - eq_rewards
    results['EQ Bank'] = {'net_cost': eq_net, 'pct_income': eq_net / annual_income * 100,
        'breakdown': {'Chequing fees': 0, 'Card annual fee': 0,
                      'HISA interest': -eq_hisa, 'Card rewards': -eq_rewards}}

    # EQ+PC COMBINED (hypothetical)
    eqpc_hisa    = savings_balance * 0.0275  # EQ Bank rate
    eqpc_rewards = grocery_spend * 0.05      # PC Financial 5% on grocery (World Elite)
    eqpc_opt     = grocery_spend * 0.0150    # + PC Optimum base earn on top
    eqpc_net     = 0 - eqpc_hisa - eqpc_rewards - eqpc_opt
    results['EQ+PC Combined'] = {'net_cost': eqpc_net, 'pct_income': eqpc_net / annual_income * 100,
        'breakdown': {'Chequing fees': 0, 'Card annual fee': 0,
                      'HISA interest': -eqpc_hisa, 'PC card rewards': -eqpc_rewards,
                      'PC Optimum bonus': -eqpc_opt}}

    return results

# Build full model across income levels
rows = []
for income in income_levels:
    result = calc_costs(income)
    for bank, data in result.items():
        rows.append({'income': income, 'bank': bank,
                     'net_cost': data['net_cost'], 'pct_income': data['pct_income']})

df = pd.DataFrame(rows)
df_pivot = df.pivot(index='income', columns='bank', values='net_cost')

print("=" * 65)
print("ANALYSIS 2: FEE BURDEN BY INCOME LEVEL")
print("Net annual banking cost (-ve = net benefit to customer)")
print("=" * 65)
print(df_pivot.round(0).to_string())
print("\nAs % of annual income (fee burden — higher is worse for consumer):")
pct_pivot = df.pivot(index='income', columns='bank', values='pct_income')
print(pct_pivot.round(3).to_string())

# ── VISUALISE ─────────────────────────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
fig.suptitle('The Fee Burden: Who Pays Most for Banking?\nAnnual net banking cost by income level',
             fontsize=14, fontweight='bold', color='#e6edf3', y=1.01)

income_labels = ['$20K', '$35K', '$50K', '$75K', '$100K', '$150K']
COLORS = {'Big Five Avg': '#f85149', 'PC Financial': '#e6712d',
          'EQ Bank': '#58a6ff', 'EQ+PC Combined': '#3fb950'}

# LEFT: Absolute net cost
for bank in ['Big Five Avg', 'PC Financial', 'EQ Bank', 'EQ+PC Combined']:
    vals = [df_pivot.loc[i, bank] for i in income_levels]
    ax1.plot(income_labels, vals, marker='o', label=bank, color=COLORS[bank],
             linewidth=2.5, markersize=7)
ax1.axhline(0, color='#8b949e', linewidth=0.8, linestyle='--', alpha=0.5)
ax1.set_xlabel('Annual Household Income', fontsize=11)
ax1.set_ylabel('Net Annual Banking Cost ($)', fontsize=11)
ax1.set_title('Net Annual Banking Cost / Benefit\n(negative = customer earns value)', fontsize=11, color='#8b949e')
ax1.legend(loc='upper left', framealpha=0.3, fontsize=10)
ax1.grid(alpha=0.2)
ax1.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f'${x:,.0f}'))

# RIGHT: Fee burden as % of income
for bank in ['Big Five Avg', 'EQ+PC Combined']:
    vals = [pct_pivot.loc[i, bank] for i in income_levels]
    ax2.plot(income_labels, vals, marker='o', label=bank, color=COLORS[bank],
             linewidth=3, markersize=8)
ax2.fill_between(income_labels,
                 [pct_pivot.loc[i, 'Big Five Avg'] for i in income_levels],
                 [pct_pivot.loc[i, 'EQ+PC Combined'] for i in income_levels],
                 alpha=0.15, color='#3fb950', label='Value gap (EQ+PC advantage)')
ax2.axhline(0, color='#8b949e', linewidth=0.8, linestyle='--', alpha=0.5)
ax2.set_xlabel('Annual Household Income', fontsize=11)
ax2.set_ylabel('Banking cost as % of income', fontsize=11)
ax2.set_title('Fee Burden (% of Income)\nLow-income Canadians pay more',
              fontsize=11, color='#8b949e')
ax2.legend(loc='upper right', framealpha=0.3, fontsize=10)
ax2.grid(alpha=0.2)
ax2.yaxis.set_major_formatter(mtick.FuncFormatter(lambda x, _: f'{x:.2f}%'))

# Annotation: the key stat
ax2.annotate(
    'At $20K income, Big Five banking\ncosts ~1.8% of annual income.\nEQ+PC delivers net VALUE.',
    xy=(0, pct_pivot.loc[20_000, 'Big Five Avg']),
    xytext=(1.5, 0.8),
    fontsize=9, color='#f85149',
    arrowprops=dict(arrowstyle='->', color='#f85149', lw=1.5)
)

plt.tight_layout()
plt.savefig('outputs/02_fee_burden.png', dpi=180, bbox_inches='tight', facecolor='#0d1117')
print("\n[✓] Saved: outputs/02_fee_burden.png")
plt.close()
