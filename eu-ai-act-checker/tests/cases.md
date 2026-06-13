# EU AI Act Readiness Check — Test Cases

Five canonical scenarios used to validate classification quality.
Run each through the app and record the actual output below.

---

## Case 1: Customer Service Chatbot

**Input**

| Field | Value |
|-------|-------|
| Company | Mid-size e-commerce retailer, 300 employees, sells across the EU, headquarters in Germany. |
| AI system | A conversational AI chatbot embedded on our website and mobile app. Customers can ask it questions about orders, returns, and product availability. It responds in natural language. There is no human-in-the-loop for most queries; complex issues are escalated to a human agent. |
| Sector | Other |
| Role | Deployer |

**Expected classification**

- **In scope**: Yes (deployer in EU, system operates in EU)
- **Risk category**: Limited risk (transparency obligation)
- **Key obligation**: Art 50(1) — must inform users in real time that they are interacting with an AI system; clear and prominent disclosure at chat start.
- **Deadline**: 2 August 2026 (Art 50 application date)
- **Notes**: No high-risk Annex III category applies. Chatbot does not screen candidates, score credit, or make consequential decisions about individuals. Simple transparency disclosure is the main requirement.

**Actual output**

```
Classification: limited_risk — "Limited Risk – Conversational AI / Chatbot (Article 50(1) Transparency Obligation)"
Articles cited: Article 3(1), Article 5, Article 6(1), Article 6(2), Article 50(1)
Confidence: high
Key obligation (fact_from_act): Inform users in real time they are interacting with an AI
  system at the start of the interaction (Art 50(1))
Notable: Correctly flagged that if the chatbot handled financial products or HR
  queries, it could reclassify into Annex III — good edge-case awareness.
RESULT: PASS ✓
```

---

## Case 2: CV-Screening Tool for Hiring

**Input**

| Field | Value |
|-------|-------|
| Company | HR-tech startup, 40 employees, building and licensing AI products to EU employers. Established in Ireland. |
| AI system | An AI-powered applicant tracking module. It ingests CVs and cover letters, scores each candidate on a 0–100 fit scale, and automatically moves candidates below 40 to a "rejected" pile that recruiters rarely review. Employers can adjust weights but rarely do. |
| Sector | HR / Employment |
| Role | Provider |

**Expected classification**

- **In scope**: Yes
- **Risk category**: High-risk — Annex III §4 (employment, workers management)
- **Key articles**: Art 6(2), Annex III §4
- **Key obligations (provider)**: Risk management system (Art 9), data governance and bias testing (Art 10), technical documentation (Art 11), automatic logging (Art 12), instructions for use (Art 13), human oversight design (Art 14), conformity assessment (Art 43), CE marking (Art 48), EU database registration (Art 49), post-market monitoring (Art 72).
- **Deadline**: 2 August 2026 — **URGENT** (7 weeks from reference date).
- **Notes**: The automatic rejection pile means the system materially influences hiring decisions. The Art 6(3) narrow-use exception does NOT apply here. Providers bear the heaviest obligations.

**Actual output**

```
Classification: high_risk_annex_iii — "High-Risk (Annex III §4 – Employment, Workers Management &
  Access to Employment)"
Articles cited: 3(1), 3(3), 6(2), 6(3), 9, 10, 11, 12, 13, 14, 15, 16, 17, 43, 47, 48, 49
Confidence: high
Key finding: Correctly flagged the "rejected pile recruiters rarely review" as a red flag
  violating Art 14 human oversight — and required product redesign, not just documentation.
All 14 provider obligations correctly identified, all tagged fact_from_act.
RESULT: PASS ✓
```

---

## Case 3: Energy Consumption Forecasting for a Utility

**Input**

| Field | Value |
|-------|-------|
| Company | National electricity utility in Finland, ~5,000 employees, operates the distribution grid and retail supply. |
| AI system | A machine-learning model that forecasts household and industrial electricity demand 24 and 72 hours ahead. Outputs are used internally by grid planners to schedule generation and manage reserves. No individual person is assessed; the model aggregates over thousands of customers. Final dispatch decisions are made by human operators. |
| Sector | Energy |
| Role | Deployer |

**Expected classification**

- **In scope**: Yes (deployer in EU)
- **Risk category**: Likely minimal risk — **discuss**
  - Argument for minimal: The system does aggregate forecasting, not individual management/operation decisions; human operators make dispatch calls.
  - Argument for high-risk (Annex III §2): If the utility uses the forecast to automate load-shedding or dispatch decisions affecting electricity supply, it could qualify as "management and operation" of critical infrastructure.
  - **Classification hinges on**: Does the AI output directly trigger operational commands, or is it purely advisory to human operators?
- **Confidence**: Medium — additional information about the operational integration is needed.
- **Notes**: This is a deliberately borderline case to test the tool's nuance. A purely advisory forecasting model used by human planners should be minimal risk. An AI that auto-dispatches or triggers automated grid responses crosses into Annex III §2.

**Actual output**

```
Classification: minimal_risk — "Minimal Risk – Internal Demand Forecasting Tool"
Articles cited: Article 2, Article 3(1), Article 3(4), Article 5, Article 6(1), Article 6(2),
  Article 6(3), Article 50, Annex III
Confidence: high
Key finding: Correctly resolved the borderline case — pure advisory forecasting to human
  operators = minimal risk. Correctly identified the reclassification trigger: "if outputs
  are ever used to trigger automated or semi-automated grid actions without human review,
  the system could cross into Annex III §2."
RESULT: PASS ✓ (nuanced borderline correctly handled)
```

---

## Case 4: AI Component in a Medical Device

**Input**

| Field | Value |
|-------|-------|
| Company | Medical device manufacturer, 800 employees, based in the Netherlands, sells across the EU and globally. |
| AI system | An AI module integrated into a Class IIb medical device (digital X-ray system). The AI analyses chest X-ray images and flags potential anomalies (pneumonia, nodules) for radiologist review. The device has CE marking under MDR (Regulation 2017/745) and required notified body conformity assessment. The AI module is a safety component of the device. |
| Sector | Healthcare |
| Role | Provider |

**Expected classification**

- **In scope**: Yes
- **Risk category**: High-risk — product safety path (Art 6(1))
- **Key articles**: Art 6(1), Annex I (MDR 2017/745)
- **Application date**: **2 August 2027** (Art 6(1) has a later deadline than Annex III)
- **Key obligations (provider)**: Same as high-risk provider obligations (Art 9–17), PLUS the device must undergo conformity assessment under BOTH MDR and the AI Act. Technical documentation must cover the AI system specifically (Annex IV).
- **Notes**: This is the product-safety path, not the Annex III path. The notified body requirement under MDR is what triggers Art 6(1). The later 2027 deadline gives this company slightly more time than Annex III high-risk systems, but planning should start immediately.

**Actual output**

```
Classification: high_risk_product_safety — "High-Risk – Product Safety Path
  (Article 6(1), Annex I – MDR Class IIb Medical Device)"
Articles cited: Article 6(1), Article 3(1), Article 3(3), Annex I (MDR – Regulation (EU) 2017/745)
Confidence: high
Key finding: Correctly identified the 2027 deadline (not 2026) — Art 6(1) product-safety
  path has the later application date. Correctly flagged the open question about whether
  the MDR notified body assessment overlaps with AI Act conformity assessment, and advised
  engaging the notified body to clarify (tagged interpretation — good epistemic honesty).
RESULT: PASS ✓
```

---

## Case 5: Email Spam Filter

**Input**

| Field | Value |
|-------|-------|
| Company | SaaS company providing a cloud email platform to EU business customers. 150 employees, headquartered in Estonia. |
| AI system | A spam and phishing detection filter built into our email platform. The model classifies incoming emails as spam/not-spam and moves detected spam to a junk folder. It processes ~5 million emails per day. No individual profiles are built; the model looks at email content and metadata only. |
| Sector | Other |
| Role | Provider |

**Expected classification**

- **In scope**: Yes (provider placing system on EU market)
- **Risk category**: Minimal risk
- **Key obligations**: None mandatory. Voluntary code of conduct encouraged.
- **Notes**: Spam filtering does not fall under any Annex III category. It does not assess individuals, does not gate access to services, and is not a safety component of a regulated product. No transparency obligation under Art 50 applies — there is no direct user interaction where the AI presents itself as a human. This is the baseline minimal-risk case.

**Actual output**

```
Classification: minimal_risk — "Minimal Risk – Spam/Content Filter"
Articles cited: Article 5, Article 3(63), Article 6(1), Article 6(2), Article 50
Confidence: high
Key finding: No mandatory obligations. Correctly identified reclassification triggers
  (individual user profiling, pipeline into consequential decisions). Sensible governance
  recommendation even with no legal requirement.
RESULT: PASS ✓
```

---

## How to run the tests

1. Start the app: `uvicorn main:app --reload`
2. Open `http://localhost:8000`
3. Enter each case's inputs into the form
4. Copy the classification, cited articles, and confidence into the "Actual output" blocks above
5. Compare against expected — look for:
   - Correct risk tier
   - Correct articles cited (no invented numbers)
   - Fact vs interpretation correctly labelled
   - Urgency of 2 Aug 2026 deadline flagged where relevant
