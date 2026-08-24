# EU AI Act Reference Document
## Regulation (EU) 2024/1689 — Curated Compliance Reference

This document is a structured summary for automated classification purposes.
Article numbers and annex references are provided where reliable; always consult
the official OJ L 2024/1689 for the definitive legal text.

---

## APPLICATION DATES

This document does not state application dates. Every date, its legal basis, the
act that last amended it, and whether it is currently in force live in the
APPLICATION TIMELINE section of the system prompt (rendered from `legal_corpus.py`)
and are resolved fresh for every request. Classify which regime applies using the
substance below; the timeline attaches when it applies.

---

## SCOPE (Article 2)

The Act applies to:
- **Providers** placing AI systems on the EU market or putting them into service
  in the EU — regardless of where the provider is established
- **Deployers** established or located in the EU
- **Providers and deployers** established in third countries where the AI
  system's output is used in the EU
- **Importers and distributors** of AI systems
- **Manufacturers** of products incorporating AI systems that are covered by
  Annex I product-safety legislation

### Out of Scope (Articles 2(3), 2(4), 2(6), 2(12)):
- AI used exclusively for military, national security, or defence purposes by
  member-state authorities
- AI by public authorities of third countries in cooperation frameworks
- Scientific research and development (Art 2(6), with conditions)
- Open-source AI models released publicly — exemption is narrow and does NOT
  cover providers of high-risk applications built on open models (Art 2(12))
- Personal, non-professional use

---

## DEFINITIONS (Article 3 — Key Terms)

**AI system (Art 3(1))**: A machine-based system designed to operate with varying
levels of autonomy, and that for explicit or implicit objectives infers, from the
input it receives, how to generate outputs such as predictions, content,
recommendations, or decisions that can influence physical or virtual environments.

**Provider (Art 3(3))**: A natural or legal person who develops an AI system or
GPAI model and places it on the market or puts it into service under their own
name or trademark, whether for payment or free of charge.

**Deployer (Art 3(4))**: A natural or legal person who uses an AI system under
their own authority except for personal non-professional use.

**Importer (Art 3(6))**: A person established in the EU who places on the market
an AI system bearing the name/trademark of a person established outside the EU.

**Distributor (Art 3(7))**: A person in the supply chain who makes an AI system
available on the EU market without substantial modification.

**General-purpose AI (GPAI) model (Art 3(63))**: An AI model trained on large
amounts of data, exhibiting significant generality, capable of competently
performing a wide range of distinct tasks.

**GPAI model with systemic risk (Art 51(1)(b))**: A GPAI model trained with
cumulative compute exceeding 10^25 FLOPs, or designated by the Commission.

---

## DECISION TREE — CLASSIFICATION ORDER

Use this sequence. Stop at the first match.

1. Is this even an AI system (Art 3(1)) operating in scope (Art 2)? → If no, out of scope
2. Does it match a prohibited practice (Art 5)? → PROHIBITED
3. Is it a GPAI model (Art 3(63))? → GPAI obligations (may also be high-risk)
4. Art 6(1) path: Is it a safety component of (or itself) a product under Annex I
   legislation that requires third-party conformity assessment? → HIGH_RISK_PRODUCT_SAFETY
5. Art 6(2) path: Does it fall under an Annex III category? → HIGH_RISK_ANNEX_III
6. Do transparency obligations apply (Art 50 — chatbot, deepfake, emotion)? → LIMITED_RISK
7. None of the above → MINIMAL_RISK

---

## TIER 1: PROHIBITED AI PRACTICES (Article 5)
### Regime key: art_5_prohibitions (Digital Omnibus additions: art_5_new_prohibitions_omnibus)

All of the following are BANNED throughout the EU:

**Art 5(1)(a)** — Subliminal manipulation: AI that deploys subliminal techniques
beyond the threshold of consciousness to distort behavior in a way that causes
or is likely to cause significant harm.

**Art 5(1)(b)** — Exploitation of vulnerabilities: AI that exploits
vulnerabilities of specific groups (age, disability, social/economic situation)
to distort behavior in a harmful way.

**Art 5(1)(c)** — Social scoring by public authorities: AI used by or on behalf
of public authorities to evaluate or classify natural persons based on social
behavior or personality characteristics, leading to detrimental or unfavorable
treatment unrelated to the context in which data was generated.

**Art 5(1)(d)** — Real-time remote biometric identification (RTBI) in public
spaces for law enforcement: BANNED except in the following narrow cases with
prior judicial/admin authorization: (i) targeted search for specific victims of
abduction/trafficking/sexual exploitation, (ii) prevention of specific, imminent
terrorist threats, (iii) identification of perpetrators of serious criminal
offences. Emergency use possible without prior authorization but requiring
retroactive review.

**Art 5(1)(e)** — Post-remote biometric identification for law enforcement:
BANNED except for targeted searches relating to criminal investigations for
serious crimes, requiring judicial or administrative authorization.

**Art 5(1)(f)** — Emotion recognition in workplace and educational institutions:
BANNED except for medical or safety reasons (e.g., monitoring driver drowsiness
in safety-critical settings).

**Art 5(1)(g)** — Biometric categorization inferring sensitive attributes:
BANNED — AI that categorizes individuals based on biometric data to deduce or
infer race, political opinions, trade union membership, religious or
philosophical beliefs, sex life, or sexual orientation. Narrow law enforcement
exception applies with strict conditions.

**Art 5(1)(h)** — AI-based criminal risk prediction from profiling: AI systems
that assess or predict individual risk of criminal offending based solely on
profiling or personality traits. BANNED. (Evidence-based systems used in crime
pattern analysis do not automatically fall here.)

---

## TIER 2A: HIGH-RISK — PRODUCT SAFETY PATH (Article 6(1))
### Regime key: high_risk_annex_i

Conditions for high-risk classification under this path:
1. The AI system is a **safety component** of a product covered by Annex I
   legislation, OR the AI system itself is such a product; AND
2. That product is required to undergo **third-party conformity assessment**
   (notified body) under the applicable Annex I legislation.

If BOTH conditions are met → HIGH-RISK under Art 6(1).

### Annex I — Key Union Harmonization Legislation:

**Medical devices**: Regulation (EU) 2017/745 (MDR) — most class IIa and above
devices require notified body assessment. AI embedded in or functioning as a
medical device is almost always high-risk under this path.

**In vitro diagnostic medical devices**: Regulation (EU) 2017/746 (IVDR) — class
B and above IVDs typically require notified body. AI for diagnostic interpretation
of patient samples likely falls here.

**Machinery**: Regulation (EU) 2023/1230 — AI as a safety function in machinery
(e.g., automated safety stops, collision avoidance) may require notified body
depending on machinery category.

**Civil aviation**: Regulation (EU) 2018/1139 — AI systems certified under EASA
(e.g., flight management, collision avoidance) are in scope.

**Motor vehicles**: Regulation (EU) 2019/2144 — AI in ADAS, autonomous driving
features requiring type approval.

**Agricultural/forestry vehicles**: Regulation (EU) 2016/1628.

**Personal protective equipment**: Regulation (EU) 2016/425.

**Recreational craft**: Directive 2013/53/EU.

**KEY QUESTION**: Does the product require a notified body? If self-declaration
of conformity is sufficient → Art 6(1) does NOT apply (no high-risk via this
path). If notified body is mandatory → Art 6(1) applies.

---

## TIER 2B: HIGH-RISK — ANNEX III STAND-ALONE SYSTEMS (Article 6(2))
### Regime key: high_risk_annex_iii

Eight domains. Read each carefully — subcategories matter.

### Annex III §1 — Biometric and biometric-based systems
- Remote biometric identification systems used in contexts other than real-time
  law enforcement (post-remote RBI)
- Biometric categorization systems for law enforcement based on sensitive attributes
  (distinct from Art 5(1)(g) prohibition — note overlap)
- Emotion recognition systems (in contexts not prohibited under Art 5(1)(f))

### Annex III §2 — Critical infrastructure
- AI for the management and operation of critical digital infrastructure
- AI for the management and operation of road traffic
- AI for the supply of water, gas, heating, or electricity
Note: "management and operation" — passive monitoring/analytics tools may not
qualify; active control/management decisions are the target.

### Annex III §3 — Education and vocational training
- AI to determine access or admission to educational/vocational institutions
- AI to evaluate and assess learning outcomes, including exam grading
- AI to detect prohibited behavior during exams (cheating detection)
Note: Content recommendation tools within education are likely NOT high-risk
under this annex unless they gate access to the institution.

### Annex III §4 — Employment, workers management, self-employment access
HIGH PRIORITY for HR sector:
- **Recruitment**: AI for screening/filtering CVs or job applications; ranking
  or filtering candidates; evaluating/assessing candidates during interviews
- **Performance monitoring**: AI for monitoring and evaluating job performance
- **Allocation/promotion/termination**: AI for assigning tasks, deciding on
  promotion or demotion, or terminating employment contracts
- **Access to self-employment**: AI to assess creditworthiness for
  self-employment purposes

Any AI that materially influences a hiring or employment decision → likely
Annex III §4 high-risk, regardless of final human approval.

### Annex III §5 — Access to essential private and public services
- **Credit scoring**: AI to evaluate creditworthiness or credit score of
  natural persons (excluding fraud detection that does not affect credit access)
- **Insurance pricing**: AI for risk assessment and pricing of life insurance
  and health insurance
- **Emergency dispatch**: AI to evaluate priority and dispatch emergency services
- **Public benefits**: AI to evaluate eligibility for public assistance or
  allocate social benefits
- **Identity verification in administrative procedures**: AI for authentication
  of natural persons in administrative or legal proceedings

### Annex III §6 — Law enforcement
- AI for individual risk assessment (recidivism prediction, criminal profiling)
- Polygraph/emotion detection for lie detection
- Evaluation of reliability of evidence in criminal proceedings
- Profiling of natural persons in criminal investigations
- Crime analytics predicting patterns of individual criminal offenses

### Annex III §7 — Migration, asylum, border control
- AI for risk assessment of persons seeking entry or requesting asylum
- Examination and verification of asylum applications
- Verifying authenticity of travel documents
- Border control and identity management

### Annex III §8 — Administration of justice and democratic processes
- AI to assist judicial authorities in researching facts and law
- AI designed to influence elections or voting behavior
- AI used in electoral campaign targeting

### Narrow Exception (Article 6(3)):
An AI system falling under an Annex III category is NOT automatically high-risk
if it performs only preparatory tasks for human assessment, has no material
influence on the outcome of decisions, OR performs narrow procedural tasks.
INTERPRETATION: This exception is narrow and contested. Err on the side of
classifying as high-risk until legal counsel confirms otherwise.

---

## TIER 3: LIMITED RISK — TRANSPARENCY OBLIGATIONS (Article 50)
### Regime key: art_50_transparency (marking transition for pre-existing systems: art_50_2_marking_legacy)

These systems do not carry the full high-risk compliance burden but must meet
transparency requirements:

**Art 50(1) — Chatbots and conversational AI**: Providers must ensure the system
informs natural persons in real time that they are interacting with an AI system,
unless this is obvious from context. Deployers have the same obligation.

**Art 50(2) — Deepfakes and synthetic content**: Providers of AI that generates
synthetic audio, image, video, or text must mark the output in a machine-readable
format as artificially generated or manipulated; deployers of deepfake content
must disclose its AI-generated nature. Narrow exception for satire/parody if
adequately labeled. TRANSITIONAL RELIEF: systems already placed on the market
before the art_50_transparency regime applies get a separate, later grace period
for the machine-readable marking duty specifically — regime key
art_50_2_marking_legacy. Content generated before that regime applied does not
need to be marked retroactively. Systems placed on the market on or after that
date are bound by the ordinary art_50_transparency regime with no grace period.

**Art 50(4) — AI-generated text on public-interest topics**: Providers must
ensure AI-generated text on elections, public health, economics, or similar
public-interest matters is machine-readable labeled.

**Art 50(3) — Emotion recognition**: Must inform natural persons when emotion
recognition is being used on them (if not captured by Art 5 prohibition).

---

## TIER 4: MINIMAL RISK

All AI systems not matching Tiers 1–3. No mandatory compliance obligations
under the Act. Voluntary codes of conduct are encouraged.

Examples of minimal-risk AI:
- Spam and content filters
- AI in video games (non-safety-critical)
- General content recommendation engines (outside essential services)
- Demand/energy/inventory forecasting tools for internal operations
- Sentiment analysis for market research
- Grammar/spelling correction tools
- Simple image classification for internal quality control

---

## GPAI MODELS (Chapter V, Articles 51–56)
### Regime key: gpai_obligations

### Who qualifies as a GPAI provider?
Organizations that develop, train, and make available a general-purpose AI model —
including via API, cloud service, or open source. Fine-tuning an existing GPAI
model may also create provider obligations depending on modification level.

### All GPAI providers must (Article 53):
1. Draw up and maintain technical documentation (Annex XI/XII)
2. Provide information and documentation to downstream AI system providers
3. Publish a summary of training data used (copyright transparency)
4. Comply with EU copyright law (Directive 2001/29/EC, Directive 2019/790)
5. Register in the EU database when used in high-risk systems

### Additional obligations for systemic-risk GPAI (Article 55):
Applies when training compute exceeds 10^25 FLOPs or Commission designation:
- Perform adversarial testing (red-teaming) before deployment
- Report serious incidents and corrective measures to the Commission
- Implement cybersecurity measures commensurate with systemic risk
- Report energy consumption of training and inference

### GPAI + High-Risk overlap (Article 25):
A GPAI model integrated into a high-risk AI system triggers BOTH sets of
obligations. Providers of the downstream high-risk system who integrate a GPAI
model must fulfill the high-risk obligations; the GPAI model developer retains
GPAI obligations.

---

## OBLIGATIONS BY ROLE

### Provider of a High-Risk AI System (Article 16)
The provider bears the primary compliance burden. Before placing on market:

1. **Risk management system (Art 9)**: Continuous identification, analysis, and
   mitigation of risks throughout the lifecycle.
2. **Data governance (Art 10)**: Training/validation/test data must be relevant,
   sufficiently representative, and as free from errors as possible. Bias
   identification required.
3. **Technical documentation (Art 11, Annex IV)**: Before market placement —
   system description, design choices, risk management, data sheets.
4. **Logging and record-keeping (Art 12)**: AI system must enable automatic
   logging of events (audit trail) for post-incident review.
5. **Transparency and instructions for use (Art 13)**: Clear instructions for
   deployers covering system capabilities, limitations, human oversight measures.
6. **Human oversight (Art 14)**: Design must allow deployers/users to understand,
   monitor, override, or stop the system.
7. **Accuracy, robustness, cybersecurity (Art 15)**: Appropriate performance
   levels; resilience to errors and attacks.
8. **Quality management system (Art 17)**: Internal policies, procedures, and
   documentation system.
9. **Conformity assessment (Art 43)**: Self-assessment for most Annex III systems;
   notified body required for Art 6(1) systems and biometric systems (Annex III §1).
10. **EU declaration of conformity (Art 47)**: Signed declaration before placement.
11. **CE marking (Art 48)**: Affix CE marking to the system or documentation.
12. **Registration in EU database (Art 49(1))**: Before placing on market.
13. **Post-market monitoring (Art 72)**: Active collection and review of data
    on performance after deployment.
14. **Serious incident reporting (Art 73)**: Report to national authority within
    15 days (or immediately for life-threatening incidents).

### Deployer of a High-Risk AI System (Article 26)
Uses the system under own responsibility; lighter obligations but significant:

1. **Use per instructions (Art 26(1))**: Use only in accordance with provider's
   instructions for use. Using outside stated purpose converts you to a provider.
2. **Human oversight (Art 26(2))**: Assign appropriately trained natural persons
   to oversee the system.
3. **Input data quality (Art 26(4))**: Ensure input data is relevant and
   sufficiently representative.
4. **Monitor operation (Art 26(5))**: Actively monitor system performance;
   inform provider of anomalies.
5. **Fundamental rights impact assessment — FRIA (Art 27)**: MANDATORY for
   deployers using high-risk AI in certain contexts: public authorities, credit
   scoring, insurance, recruitment, access to education, law enforcement, migration.
   Must be conducted BEFORE deployment.
6. **Inform affected persons (Art 26(11))**: When decisions significantly affect
   a natural person, that person must be informed of the AI involvement.
7. **Register use (Art 49(2))**: Register use of high-risk Annex III systems
   where required by Art 49.
8. **DPIA integration (Art 26(9))**: Where a GDPR DPIA is required, the FRIA
   should be integrated with or conducted alongside the DPIA.

### Importer (Article 23)
1. Verify that the relevant conformity assessment has been carried out by the provider
2. Verify technical documentation is available and in appropriate EU language
3. Verify the provider has appointed an EU authorized representative
4. Do not place on market if non-compliant; inform provider and market surveillance authority

### Distributor (Article 24)
1. Verify the CE marking is affixed
2. Verify required documentation and instructions are available in EU language(s)
3. Do not make available if evidently non-compliant
4. Inform importer/provider of any risks; keep records of complaints

---

## SECTOR-SPECIFIC CLASSIFICATION NOTES

**Healthcare**: AI embedded in medical devices regulated under MDR (2017/745) or
IVDR (2017/746) → almost certainly high-risk via Art 6(1) if requiring notified
body assessment. Clinical decision support that does NOT require notified body
under MDR/IVDR may still fall under Annex III §1 (if biometric) or §5.
Diagnostic AI reading medical images (MRI, X-ray) typically requires notified body
under MDR class IIb → high-risk Art 6(1).

**Finance/Banking**: Credit scoring → Annex III §5 (high-risk). Insurance
pricing for life/health → Annex III §5 (high-risk). Fraud detection that
does not block transactions → likely minimal/limited risk. Algorithmic trading
is not explicitly listed in Annex III — likely minimal risk unless used for
retail credit decisions.

**HR/Employment**: CV screening and candidate filtering → Annex III §4
(high-risk). Interview scoring AI → Annex III §4 (high-risk). Internal
HR scheduling optimization without hiring decisions → likely minimal risk.
Performance monitoring tied to promotion/termination decisions → Annex III §4.

**Energy/Utilities**: Active grid management and dispatch → Annex III §2
(high-risk). Demand/consumption forecasting for internal planning → minimal risk.
Predictive maintenance → minimal risk. Smart meter anomaly detection that
could interrupt supply → potentially high-risk §2.

**Public sector**: Benefits eligibility assessment → Annex III §5 (high-risk).
Identity verification in administrative procedures → Annex III §5 (high-risk).
Public service chatbot providing information → limited risk (Art 50 transparency).
Document processing in regulatory workflows → evaluate case by case.

**Manufacturing**: AI safety function in machinery needing notified body →
Art 6(1) high-risk. Predictive quality control → minimal risk. Collaborative
robot safety stop triggered by AI → likely Art 6(1); check notified body requirement.

---

## PENALTIES (Article 99)

| Violation | Maximum fine |
|-----------|-------------|
| Prohibited AI practices (Art 5) | €35,000,000 or 7% global annual turnover |
| Other obligation violations | €15,000,000 or 3% global annual turnover |
| Providing false/misleading information | €7,500,000 or 1.5% global annual turnover |

Proportionality applies for SMEs (Art 99(6)). The higher of the two figures applies.
National market surveillance authorities enforce; the AI Office has oversight of GPAI.

---

## COMMON CLASSIFICATION ERRORS TO AVOID

1. **"We're just a deployer, not a provider"** — Deployers of high-risk Annex III
   systems still have material obligations (Art 26, 27). FRIA is mandatory.
2. **"It only helps humans decide"** — If the AI output materially influences
   decisions covered by Annex III, the Art 6(3) exception is unlikely to apply.
3. **"The model is open source"** — The deployer who builds a high-risk application
   on an open-source model IS a provider and bears provider obligations (Art 25(2)).
4. **"We're a UK/US company"** — If EU natural persons are affected by the AI
   output, the Act applies to you (Art 2(1)(c)).
5. **"It's just analytics/forecasting"** — Forecasting tools used in essential
   services (energy dispatch, credit, insurance) may cross into Annex III.
6. **"The human makes the final call"** — Human-in-the-loop is required for
   oversight (Art 14) but doesn't automatically remove high-risk classification.
7. **"Chatbots are low-risk"** — A chatbot used for recruitment screening or
   insurance intake is high-risk under Annex III, not just limited-risk.
