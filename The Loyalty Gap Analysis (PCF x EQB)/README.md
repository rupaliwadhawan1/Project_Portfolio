# The Loyalty Gap: Mapping Financial Exclusion in Canada's Grocery-Linked Banking Ecosystem

**A data analysis project exploring the EQB × PC Financial acquisition through the lens of financial inclusion.**

> *"It would also be hard to argue, on any objective measure, that Canada's banking system is anything other than an oligopoly."*  
> — Carolyn Rogers, Senior Deputy Governor, Bank of Canada, October 2025

---

## Project Overview

Canada's Big Six banks hold over 93% of all banking assets (Bank of Canada, 2025). At the same time, approximately **1 million Canadians are unbanked** and **5 million are underbanked** — excluded from mainstream financial services by high fees, minimum balance requirements, and branch deserts in low-income neighbourhoods (FCAC / Prosper Canada).

The EQB acquisition of PC Financial (closing July 1, 2026) is the most significant structural challenge to this oligopoly in a generation. This project maps why it matters — using only public data.

---

## Analyses Included

| # | File | Question |
|---|------|----------|
| 1 | `analysis/01_banking_desert.py` | Where do bank branches close while Loblaw stores remain? |
| 2 | `analysis/02_fee_burden.py` | How much more do low-income Canadians pay in banking fees? |
| 3 | `analysis/03_scale_gap.py` | What does the acquisition do to market concentration? |
| 4 | `analysis/04_loyalty_economics.py` | What is the implied CAC via PC Optimum conversion? |
| 5 | `analysis/05_financial_inclusion_index.py` | Composite province-level inclusion scoring |

---

## Data Sources (All Public)

| Source | Data | URL |
|--------|------|-----|
| Statistics Canada | Census income/age by FSA | statcan.gc.ca |
| CBA / OSFI | Bank branch counts by province 2012–2024 | cba.ca |
| FCAC | Payday loan usage, consumer vulnerability data | canada.ca/fcac |
| Bank of Canada | Speech: Carolyn Rogers, Oct 2025 (oligopoly) | bankofcanada.ca |
| Loblaw Companies Ltd | Store count by banner and province (public annual report) | loblaw.ca |
| EQB Inc. | Investor relations, acquisition announcement May 2026 | eqb.investorroom.com |
| Prosper Canada / DUCA | Underbanked/unbanked population estimates | prospercanada.org |
| YouYaa / Ark Invest | Neobank vs traditional bank CAC benchmarks | public research |

---

## Key Findings

1. **The branch desert problem is real.** Canada lost ~550 bank branches between 2012–2022 (-9%), with closures concentrated in lower-income postal codes where payday lender density increased.

2. **The fee burden falls hardest on those least able to pay.** A family earning under $40K/year pays a higher share of income in banking fees. The average Big Five chequing fee ($17/mo = $204/yr) represents 0.5% of a $40K income vs. 0.17% of a $120K income.

3. **The scale gap remains massive — but the template is real.** Post-acquisition, EQB reaches ~3.3M customers. The Big Five average is ~15M+. But the combination of 2,500 Loblaw locations + PC Optimum's 18M members creates an acquisition channel no prior challenger has had.

4. **PC Optimum conversion is an extraordinary CAC arbitrage.** Traditional bank CAC: $150–$350. Neobank CAC: $5–$15. If EQB converts 10% of 18M PC Optimum members via the loyalty integration at even $20 CAC, that's 1.8M customers at a fraction of traditional bank cost.

5. **The grocery-banking stack solves a structural access problem.** In low-income FSAs where bank branches have closed, Loblaw banner stores often remain. PC Financial ATMs and EQ Bank's zero-fee digital account turn those stores into de facto banking infrastructure.

---

## Setup

```bash
git clone https://github.com/[your-handle]/loyalty-gap-canada
cd loyalty-gap-canada
pip install -r requirements.txt
python analysis/01_banking_desert.py
```

---

## Requirements

```
pandas>=2.0
numpy>=1.24
matplotlib>=3.7
seaborn>=0.12
plotly>=5.15
folium>=0.14        # for geographic mapping
requests>=2.31
openpyxl>=3.1
```

---

## Methodology Notes

All financial models use publicly available rates as of June 2026. Income scenarios use Statistics Canada median household income estimates. CAC benchmarks are from publicly available industry research (Ark Invest, Accenture, YouYaa). No proprietary bank data is used.

This project is shared for transparency and reproducibility. If you find errors in the data or methodology, please open an issue.

---

## Author
Rupali Wadhawan
Senior Data Analyst, PC Financial → EQ Bank (July 2026)  
[LinkedIn] | [GitHub]
