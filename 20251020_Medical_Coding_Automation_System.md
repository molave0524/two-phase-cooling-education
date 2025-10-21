# AI-Assisted Medical Coding & Billing Automation System

**Document Version:** 1.0
**Date:** October 20, 2025
**Status:** Concept / Requirements Gathering
**Classification:** Internal Discussion Document

---

## Executive Summary

### Overview

This document outlines a proposed **AI-assisted medical coding and billing automation system** designed to streamline the medical billing process while maintaining human oversight and continuously learning from expert corrections.

### Problem Statement

Medical coding and billing involves:

- **Manual data entry** of CPT and ICD codes into third-party billing systems
- **Time-consuming process** requiring specialized knowledge
- **High error rates** when done manually
- **Repetitive work** for similar procedures
- **Training burden** for new staff

### Proposed Solution

An intelligent automation system that:

1. **AI generates** initial medical codes from procedure notes
2. **Human supervisor reviews** and approves/modifies codes
3. **System learns** from supervisor corrections
4. **Auto-submits** high-confidence cases
5. **Flags low-confidence** cases for human review
6. **Automates submission** to third-party billing systems via browser automation

### Expected Benefits

| Benefit                 | Impact                                        |
| ----------------------- | --------------------------------------------- |
| **Time Savings**        | 70-80% reduction in manual coding time        |
| **Error Reduction**     | 90%+ accuracy after learning period           |
| **Cost Savings**        | $30-50K annually (based on 1 FTE @ 2 hrs/day) |
| **Scalability**         | Handle 10x volume without additional staff    |
| **Compliance**          | Audit trail for every submission              |
| **Knowledge Retention** | System "remembers" expert corrections         |

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Components](#core-components)
3. [Workflow Overview](#workflow-overview)
4. [Learning & Adaptation](#learning-and-adaptation)
5. [Safety & Compliance](#safety-and-compliance)
6. [Technical Implementation](#technical-implementation)
7. [Implementation Phases](#implementation-phases)
8. [Cost-Benefit Analysis](#cost-benefit-analysis)
9. [Risk Assessment](#risk-assessment)
10. [Success Metrics](#success-metrics)
11. [Appendices](#appendices)

---

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Medical Provider                          │
│              (Enters procedure notes in EHR)                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Medical Coding System                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AI Coding Engine                                      │  │
│  │  • Extract medical entities (procedures, diagnoses)    │  │
│  │  • Map to CPT/ICD codes                               │  │
│  │  • Calculate confidence score                         │  │
│  │  • Apply learned rules                                │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    [Confidence ≥95%]     [Confidence <95%]
          │                     │
          ▼                     ▼
┌──────────────────┐   ┌──────────────────────┐
│  Auto-Submit     │   │  Human Supervisor    │
│  Queue           │   │  Review Queue        │
│  (Background)    │   │  (Dashboard UI)      │
└────────┬─────────┘   └──────────┬───────────┘
         │                        │
         │              ┌─────────┴──────────┐
         │              │  Supervisor Actions │
         │              │  • Approve         │
         │              │  • Modify codes    │
         │              │  • Reject          │
         │              │  • Add notes       │
         │              └─────────┬──────────┘
         │                        │
         └────────┬───────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│            Browser Automation Worker                          │
│  (Playwright-based submission to 3rd party billing system)   │
│  • Login to billing portal                                   │
│  • Fill form fields with codes                               │
│  • Submit claim                                              │
│  • Capture confirmation number                              │
│  • Handle errors/retries                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Third-Party Billing System                       │
│              (External billing portal/website)                │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Learning & Feedback Loop                         │
│  • Track supervisor modifications                            │
│  • Update confidence scores                                  │
│  • Refine coding rules                                       │
│  • Improve future predictions                                │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Human-in-the-Loop**: Supervisors maintain final approval authority
2. **Progressive Autonomy**: System earns trust through demonstrated accuracy
3. **Continuous Learning**: Every correction improves future predictions
4. **Audit Trail**: Complete logging of all actions for compliance
5. **Fail-Safe Design**: Uncertain cases always go to human review

---

## Core Components

### 1. Case Intake & Management

**Purpose**: Capture medical procedures and manage their lifecycle

**Features**:

- Import from EHR systems or manual entry
- Case status tracking (Staged, Under Review, Approved, Submitted)
- Priority queue based on confidence scores
- Patient data linkage (HIPAA-compliant)

**Data Model**:

```
Medical Case:
  - Case ID (unique identifier)
  - Patient ID (linked to patient record)
  - Procedure Date
  - Procedure Notes (free text from provider)
  - Status (Staged, Approved, Submitted, etc.)
  - Confidence Score (0-100%)
  - AI-Suggested Codes (CPT, ICD)
  - Final Codes (after supervisor review)
  - Supervisor Notes
  - Submission Details
```

---

### 2. AI Coding Engine

**Purpose**: Automatically generate medical codes from procedure notes

**Capabilities**:

- **Natural Language Processing**: Extract medical entities from free text
- **Code Mapping**: Convert procedures/diagnoses to CPT/ICD codes
- **Modifier Selection**: Choose appropriate CPT modifiers
- **Bundling Rules**: Apply CMS bundling/unbundling rules
- **Medical Necessity**: Validate ICD codes support CPT codes

**Technology Options**:

| Approach                   | Pros                                   | Cons                                         | Recommended For        |
| -------------------------- | -------------------------------------- | -------------------------------------------- | ---------------------- |
| **OpenAI GPT-4**           | Excellent accuracy, easy to implement  | Costs $0.01-0.03/case, data privacy concerns | Quick MVP, testing     |
| **Claude (Anthropic)**     | Great for medical text, longer context | Similar cost to GPT-4                        | Production (with BAA)  |
| **Fine-tuned Open Source** | Data privacy, no per-use cost          | Requires ML expertise, training data         | Long-term production   |
| **Rule-Based + ML Hybrid** | Transparent, auditable                 | Limited to known patterns                    | Regulated environments |

**Confidence Scoring Algorithm**:

```
Confidence = Weighted Average of:
  - Historical Accuracy (40%): Success rate for similar procedures
  - Rule Strength (30%): How well procedure matches known patterns
  - Code Frequency (20%): How common these codes are
  - Modifier Confidence (10%): Certainty in modifier selection
```

---

### 3. Supervisor Dashboard

**Purpose**: Enable efficient human review and approval

**Key Features**:

**Priority Queue**:

- Low confidence cases shown first (need most attention)
- Color-coded by urgency
- Batch approval for high-confidence cases

**Review Interface**:

- Side-by-side view: Procedure notes | Suggested codes
- Similar case history for reference
- Quick approval/modification actions
- Ability to add notes for future reference

**Analytics**:

- Personal accuracy metrics
- Team performance dashboard
- Learning curve visualization
- Common correction patterns

**UI Mockup Concept**:

```
┌─────────────────────────────────────────────────────────────┐
│  Medical Coding Supervisor Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cases Awaiting Review: 12    Auto-Submitted Today: 45      │
│  Your Accuracy: 96.2%         Team Accuracy: 94.8%          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  PRIORITY QUEUE (Low Confidence First)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔴 Case #2847 | Confidence: 62% | Patient: J.Smith         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Procedure Notes:                                     │   │
│  │ "Laparoscopic cholecystectomy with intraoperative   │   │
│  │  cholangiogram. No complications."                  │   │
│  │                                                      │   │
│  │ AI Suggested Codes:                                 │   │
│  │  CPT: 47562 (Laparoscopic cholecystectomy)         │   │
│  │  CPT: 74300 (Cholangiography)                       │   │
│  │  ICD: K80.20 (Calculus of gallbladder)             │   │
│  │                                                      │   │
│  │ ⚠️ Flagged: Possible bundling issue with 74300      │   │
│  │                                                      │   │
│  │ Similar Cases (3 found):                            │   │
│  │  • Case #2401 - Same procedure, no 74300 needed    │   │
│  │  • Case #2156 - Used modifier -59 with 74300       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Actions:  [✓ Approve] [✏️ Modify] [❌ Reject] [💬 Note]   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  🟡 Case #2848 | Confidence: 78% | Patient: M.Johnson      │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Browser Automation (Playwright)

**Purpose**: Automate submission to third-party billing websites

**Why Browser Automation?**

- Many billing systems are **web portals** without APIs
- Playwright can **automate any web-based workflow**
- Handles complex scenarios (multi-step forms, CAPTCHAs, file uploads)
- Captures screenshots for audit trail

**Workflow**:

1. **Login** to billing portal (credentials stored securely)
2. **Navigate** to claim submission form
3. **Fill fields**: Patient info, procedure date, provider NPI
4. **Enter codes**: CPT codes, modifiers, units, ICD codes
5. **Validate**: Check for inline errors
6. **Screenshot**: Capture pre-submission state
7. **Submit**: Click submit button
8. **Confirm**: Extract confirmation number
9. **Screenshot**: Capture post-submission confirmation
10. **Update database**: Mark case as submitted

**Error Handling**:

- Retry on transient failures (network issues)
- Flag for manual intervention on persistent errors
- Screenshot error state
- Notify supervisor immediately

**Sample Code Structure**:

```typescript
async function submitToBillingSystem(medicalCase) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Login
    await login(page)

    // Navigate to form
    await page.click('text=New Claim')

    // Fill patient info
    await page.fill('#patient-id', medicalCase.patientId)
    await page.fill('#dob', medicalCase.patient.dob)

    // Enter CPT codes
    for (const code of medicalCase.codes.cpt) {
      await page.fill('#cpt-code', code.code)
      await page.fill('#modifier', code.modifier)
      await page.fill('#units', code.units)
    }

    // Screenshot before submit
    await page.screenshot({ path: 'pre-submit.png' })

    // Submit
    await page.click('button#submit')

    // Wait for confirmation
    const confirmNum = await page.locator('.confirmation').text()

    // Screenshot after submit
    await page.screenshot({ path: 'post-submit.png' })

    return { success: true, confirmationNumber: confirmNum }
  } catch (error) {
    await page.screenshot({ path: 'error.png' })
    throw error
  } finally {
    await browser.close()
  }
}
```

---

### 5. Learning & Adaptation System

**Purpose**: Continuously improve accuracy based on supervisor corrections

**How It Works**:

**Step 1: Track Corrections**

- Record every modification made by supervisor
- Capture: Original codes → Corrected codes
- Store: Reason for change (if provided)

**Step 2: Identify Patterns**

```
Example Pattern Detected:
  Procedure Type: "Laparoscopic cholecystectomy"
  Original AI Suggestion: CPT 47562 + 74300
  Supervisor Correction: CPT 47562 only (removed 74300)
  Frequency: 8 out of 10 similar cases

  → Create Rule: For laparoscopic cholecystectomy,
                  don't include cholangiogram code unless
                  explicitly mentioned as "separate procedure"
```

**Step 3: Update Confidence Scores**

```
Coding Rule:
  Procedure Pattern: "Laparoscopic cholecystectomy"
  Suggested Codes: [47562]
  Usage Count: 50
  Success Rate: 96% (approved without modification)
  Confidence Score: 98

  → Future cases matching this pattern get 98% confidence
  → Likely to auto-submit
```

**Step 4: Continuous Refinement**

- Weekly analysis of correction patterns
- Monthly review with supervisor
- Adjust confidence thresholds based on accuracy trends

---

## Workflow Overview

### Complete Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: CASE CREATION                                      │
├─────────────────────────────────────────────────────────────┤
│  Provider completes procedure                               │
│  → Procedure notes entered in EHR                           │
│  → System imports notes OR manual entry                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: AI CODING                                          │
├─────────────────────────────────────────────────────────────┤
│  AI analyzes procedure notes:                               │
│  • Extract medical entities (procedures, diagnoses)         │
│  • Map to CPT/ICD codes                                    │
│  • Select appropriate modifiers                            │
│  • Calculate confidence score                              │
│                                                             │
│  Output: Suggested codes + Confidence (0-100%)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: ROUTING DECISION                                   │
├─────────────────────────────────────────────────────────────┤
│  IF Confidence ≥ 95%:                                       │
│    → Route to Auto-Submit Queue                            │
│    → Skip human review                                     │
│                                                             │
│  IF Confidence < 95%:                                       │
│    → Route to Supervisor Review Queue                      │
│    → Wait for human approval                               │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐
│  AUTO-SUBMIT PATH    │      │  HUMAN REVIEW PATH   │
├──────────────────────┤      ├──────────────────────┤
│  • Add to queue      │      │  • Notify supervisor │
│  • Process in        │      │  • Show in dashboard │
│    background        │      │  • Supervisor reviews│
│  • Skip to Step 5    │      │  • Approve/Modify    │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           │                             ▼
           │               ┌──────────────────────┐
           │               │  Supervisor Actions: │
           │               │  [Approve] → Step 4  │
           │               │  [Modify]  → Step 4  │
           │               │  [Reject]  → End     │
           │               └──────────┬───────────┘
           │                          │
           └────────────┬─────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: LEARNING (if modified)                             │
├─────────────────────────────────────────────────────────────┤
│  IF supervisor made changes:                                │
│  • Record original codes vs corrected codes                 │
│  • Identify patterns in corrections                         │
│  • Update coding rules                                      │
│  • Adjust confidence scores                                 │
│                                                             │
│  IF approved without changes:                               │
│  • Increase confidence for similar cases                    │
│  • Reinforce existing rules                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: BILLING SUBMISSION                                 │
├─────────────────────────────────────────────────────────────┤
│  Browser automation (Playwright):                           │
│  1. Login to third-party billing portal                     │
│  2. Navigate to claim submission form                       │
│  3. Fill patient information                                │
│  4. Enter CPT codes with modifiers                          │
│  5. Enter ICD diagnosis codes                               │
│  6. Take screenshot (pre-submission)                        │
│  7. Submit claim                                            │
│  8. Capture confirmation number                             │
│  9. Take screenshot (post-submission)                       │
│  10. Update case status in database                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: CONFIRMATION & AUDIT TRAIL                         │
├─────────────────────────────────────────────────────────────┤
│  • Mark case as "Submitted"                                 │
│  • Store confirmation number                                │
│  • Archive screenshots                                      │
│  • Send notification to supervisor                          │
│  • Log all actions for audit trail                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Daily Operations

**Morning**:

- System processes overnight cases
- High-confidence cases auto-submitted
- Low-confidence cases queued for review
- Supervisor receives morning summary email

**During Day**:

- New cases flow in continuously
- AI codes and routes based on confidence
- Supervisor reviews queue during breaks
- Urgent cases flagged for immediate attention

**Evening**:

- Batch processing of remaining approved cases
- System generates daily report
- Learning system analyzes day's corrections
- Confidence scores updated for next day

---

## Learning and Adaptation

### Learning Mechanisms

#### 1. Pattern Recognition

**What It Learns**:

- Procedure descriptions → Code mappings
- Common modifier usage
- Diagnosis-procedure pairings
- Provider-specific patterns

**Example Learning Cycle**:

```
Week 1:
  Procedure: "Routine colonoscopy with biopsy"
  AI Suggests: CPT 45380, 45380-59 (incorrect - double billing)
  Supervisor Corrects: CPT 45380 only
  Confidence: 60% → Queue for review

Week 5:
  Same procedure type seen 20 times
  Supervisor never includes -59 modifier
  Pattern identified: Don't use -59 for routine biopsy
  Confidence: 95% → Auto-submit eligible

Week 10:
  Same procedure: Auto-submitted 50 times
  100% success rate (no rejections)
  Confidence: 99% → Fully learned
```

#### 2. Confidence Score Evolution

**Initial State** (No history):

```
New Procedure Type:
  Confidence: 50% (neutral)
  Action: Always route to human review
```

**After Positive Feedback** (Approved without changes):

```
10 approvals, 0 modifications:
  Confidence: 70% → Still requires review

25 approvals, 0 modifications:
  Confidence: 85% → Still requires review

50 approvals, 0 modifications:
  Confidence: 95% → Eligible for auto-submit

100 approvals, 0 modifications:
  Confidence: 98% → Highly trusted
```

**After Corrections**:

```
10 cases, 5 modified:
  Success Rate: 50%
  Confidence: 50% → Requires review (no change)

10 cases, 2 modified:
  Success Rate: 80%
  Confidence: 80% → Still requires review

50 cases, 2 modified:
  Success Rate: 96%
  Confidence: 96% → Eligible for auto-submit
```

#### 3. Coding Rules Database

**Structure**:

```
Coding Rule #47:
  Trigger Pattern: "laparoscopic cholecystectomy"
  Suggested Codes:
    CPT: 47562 (Laparoscopic cholecystectomy)
    ICD: K80.20 (Calculus of gallbladder) OR
         K81.0 (Acute cholecystitis)

  Modifiers:
    - Do NOT use -59 unless explicitly separate site
    - Use -22 only if documented complications

  Bundling Rules:
    - Do NOT bill 74300 (cholangiogram) separately
    - Do NOT bill 49320 (laparoscopy) separately

  Statistics:
    Total Uses: 127
    Approved Without Modification: 122
    Success Rate: 96.1%
    Confidence Score: 96

  Last Updated: 2025-10-15
  Created By: Supervisor corrections analysis
```

### Adaptive Thresholds

**Confidence Threshold for Auto-Submit**:

The system can adjust thresholds based on performance:

```
Initial Setting: 95% confidence required

After 1 month:
  Auto-submitted: 200 cases
  Billing rejections: 2 cases (1% error rate)

  → Threshold remains 95% (acceptable error rate)

After 3 months:
  Auto-submitted: 800 cases
  Billing rejections: 1 case (0.125% error rate)

  → System suggests lowering threshold to 90%
  → Supervisor reviews and approves
  → More cases become eligible for auto-submit

After 6 months:
  Auto-submitted: 2000 cases
  Billing rejections: 5 cases (0.25% error rate)

  → System performs well
  → 70% of cases now auto-submit
  → 30% still require human review
```

---

## Safety and Compliance

### HIPAA Compliance

**Protected Health Information (PHI) Handling**:

✅ **Data Encryption**:

- All PHI encrypted at rest (AES-256)
- All PHI encrypted in transit (TLS 1.3)
- Database encryption enabled

✅ **Access Controls**:

- Role-based access control (RBAC)
- Multi-factor authentication (MFA) required
- Session timeouts after 15 minutes inactivity

✅ **Audit Logging**:

- Every access to PHI logged
- Logs include: Who, What, When, From Where
- Logs retained for 7 years
- Regular audit reviews

✅ **Business Associate Agreements (BAA)**:

- Required for all third-party services handling PHI
- OpenAI/Claude: Requires BAA (available for Enterprise)
- Vercel/Hosting: Requires BAA
- Monitoring tools: Must be HIPAA-compliant

**Sample Audit Log Entry**:

```json
{
  "timestamp": "2025-10-20T14:32:15Z",
  "userId": "supervisor_001",
  "action": "VIEW_CASE",
  "resourceType": "MedicalCase",
  "resourceId": "case_2847",
  "ipAddress": "10.0.1.25",
  "userAgent": "Mozilla/5.0...",
  "outcome": "SUCCESS",
  "phiAccessed": ["patientId", "procedureNotes", "codes"]
}
```

---

### Safety Mechanisms

#### 1. Pre-Submission Validation

**Code Validation Checks**:

```
Before submission, validate:
  ✓ CPT codes are valid and current
  ✓ ICD codes are valid and current
  ✓ Modifiers are appropriate for procedures
  ✓ No conflicting modifier combinations
  ✓ Medical necessity (ICD supports CPT)
  ✓ No duplicate billing (same date/provider/patient)
  ✓ Age/gender edits (e.g., pregnancy codes for males)
  ✓ Bundling rules compliance
```

**Validation Failure Actions**:

- **Critical Error**: Block submission, require supervisor review
- **Warning**: Flag for supervisor attention but allow override
- **Info**: Log for review but don't block

#### 2. Duplicate Detection

```
Before auto-submit, check:
  • Same patient + Same CPT code + Same date = DUPLICATE
  • Same patient + Similar procedure + Within 30 days = FLAG

If duplicate detected:
  → Block auto-submission
  → Route to supervisor with warning
  → Show previous submission details
```

#### 3. Confidence Calibration

**Regular Recalibration**:

- Monthly review of auto-submitted cases
- Compare predicted confidence vs. actual outcomes
- Adjust scoring algorithm if drift detected

**Example Calibration Check**:

```
Cases predicted 95-100% confidence:
  Actual success rate: 94.2%

  → Confidence is overestimated by ~1%
  → Recalibrate: Add -1% to future predictions
  → Monitor for next month
```

---

### Medical Coding Compliance

#### CMS Guidelines

✅ **Bundling/Unbundling Rules** (NCCI):

- System enforces CMS bundling edits
- Flags procedures that shouldn't be billed together
- Suggests appropriate modifiers when override justified

✅ **Medical Necessity**:

- Validates ICD codes support CPT codes
- Warns if procedure doesn't match diagnosis
- References LCD/NCD policies

✅ **Modifier Usage**:

- Validates modifier compatibility
- Prevents inappropriate modifier stacking
- Enforces modifier 59/X{EPSU} guidelines

#### Billing Accuracy

**Pre-Submission Checklist**:

```
Before submitting to billing system:
  ☐ All required fields completed
  ☐ CPT codes validated against current year
  ☐ ICD codes validated against current year
  ☐ Modifiers appropriate and documented
  ☐ Units/quantity within acceptable range
  ☐ Date of service valid
  ☐ Provider NPI verified
  ☐ Place of service appropriate
  ☐ No duplicate claims detected
  ☐ Medical necessity established
```

---

## Technical Implementation

### Technology Stack

#### Core Application

```typescript
{
  "framework": "Next.js 14",
  "runtime": "Node.js 20 LTS",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.x",
  "stateManagement": "Zustand 4.x"
}
```

**Why Next.js?**

- ✅ Built-in API routes (no separate backend needed)
- ✅ Server-side rendering for fast dashboards
- ✅ Easy deployment (Vercel)
- ✅ Excellent TypeScript support
- ✅ Large community and ecosystem

#### Database

```typescript
{
  "database": "PostgreSQL 15+",
  "orm": "Prisma 5.x",
  "hosting": "Neon / Supabase / Railway"
}
```

**Why PostgreSQL?**

- ✅ JSONB columns for flexible code storage
- ✅ Full-text search for procedure notes
- ✅ Complex queries for pattern matching
- ✅ ACID compliance for billing accuracy
- ✅ Proven reliability

#### Queue System

```typescript
{
  "queue": "BullMQ",
  "store": "Redis (Upstash)",
  "workers": "Background Node.js processes"
}
```

**Why Queue System?**

- ✅ Decouple submission from approval (async)
- ✅ Retry failed submissions automatically
- ✅ Rate limiting (don't overwhelm billing system)
- ✅ Prioritization (urgent cases first)
- ✅ Monitoring and observability

#### Browser Automation

```typescript
{
  "automation": "Playwright",
  "browsers": "Chromium (headless)",
  "deployment": "Docker containers"
}
```

**Why Playwright?**

- ✅ Reliable and fast
- ✅ Excellent error handling
- ✅ Screenshot/video recording
- ✅ Network request interception
- ✅ Works with modern web apps

#### AI/ML Services

**Option 1: Cloud AI APIs**

```typescript
{
  "provider": "OpenAI GPT-4 / Claude",
  "cost": "$0.01-0.03 per case",
  "latency": "2-5 seconds",
  "accuracy": "90-95% initial"
}
```

**Option 2: Self-Hosted Models**

```typescript
{
  "provider": "Fine-tuned Llama 3 / Mistral",
  "cost": "Infrastructure only (~$500/mo)",
  "latency": "1-3 seconds",
  "accuracy": "85-90% initial, improves with training"
}
```

**Recommendation**: Start with Cloud APIs (faster to market), migrate to self-hosted if volume justifies

---

### Data Models

#### Medical Case

```typescript
interface MedicalCase {
  // Identity
  id: string
  caseNumber: string

  // Patient Information (PHI)
  patientId: string
  patient: {
    firstName: string
    lastName: string
    dob: Date
    gender: 'M' | 'F' | 'O'
    memberId: string
  }

  // Procedure Information
  procedureDate: Date
  procedureNotes: string // Free text from provider
  providerId: string
  placeOfService: string

  // AI-Generated Codes
  aiSuggestedCodes: {
    cpt: Array<{
      code: string // e.g., "47562"
      modifier?: string // e.g., "-59"
      units: number // Usually 1
      description: string
    }>
    icd: Array<{
      code: string // e.g., "K80.20"
      description: string
    }>
  }

  // Confidence & Routing
  confidenceScore: number // 0-100
  confidenceDetails: {
    historicalAccuracy: number
    ruleStrength: number
    codeFrequency: number
    modifierConfidence: number
  }

  // Workflow Status
  status: 'STAGED' | 'APPROVED' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'REJECTED' | 'NEEDS_REVIEW'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

  // Review Information
  reviewedBy?: string
  reviewedAt?: Date
  supervisorNotes?: string

  // Final Codes (after review)
  finalCodes?: {
    cpt: Array<CPTCode>
    icd: Array<ICDCode>
  }

  // Corrections Tracking
  wasModified: boolean
  modifications?: {
    originalCodes: any
    correctedCodes: any
    changeReason?: string
  }

  // Submission Details
  submittedAt?: Date
  submissionMethod: 'AUTO' | 'MANUAL' | 'BATCH'
  billingRefNumber?: string
  submissionScreenshots?: {
    preSubmit: string
    postSubmit: string
  }

  // Learning Data
  learningFeatures: {
    procedureType: string
    procedureKeywords: string[]
    diagnosisKeywords: string[]
    providerSpecialty?: string
    patientAge?: number
  }

  // Audit Trail
  createdAt: Date
  updatedAt: Date
  createdBy: string
  auditLog: Array<AuditLogEntry>
}
```

#### Coding Rule

```typescript
interface CodingRule {
  id: string

  // Pattern Matching
  procedurePattern: string // "laparoscopic cholecystectomy"
  keywordTriggers: string[] // ["laparoscopic", "cholecystectomy"]
  diagnosisPatterns?: string[] // ["K80", "K81"]

  // Suggested Codes
  suggestedCPTCodes: Array<{
    code: string
    modifier?: string
    units: number
    probability: number // % of time this code is used
  }>

  suggestedICDCodes: Array<{
    code: string
    probability: number
  }>

  // Rules & Exceptions
  bundlingNotes?: string // "Do not bill 74300 separately"
  modifierGuidance?: string // "Use -59 only if separate site"
  specialInstructions?: string

  // Performance Metrics
  usageCount: number // Times this rule has been applied
  approvalCount: number // Times approved without modification
  modificationCount: number // Times modified by supervisor
  successRate: number // approvalCount / usageCount

  // Confidence
  confidenceScore: number // 0-100, based on success rate

  // Metadata
  createdAt: Date
  lastUsed: Date
  lastUpdated: Date
  createdBy: 'SYSTEM' | 'SUPERVISOR' | 'IMPORT'

  // Version Control
  version: number
  previousVersions?: Array<CodingRule>
}
```

---

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Security Layers                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Network Security                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • HTTPS/TLS 1.3 encryption                         │   │
│  │  • Web Application Firewall (WAF)                   │   │
│  │  • DDoS protection                                  │   │
│  │  • IP allowlisting (optional)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 2: Authentication & Authorization                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Multi-factor authentication (MFA)                │   │
│  │  • Role-based access control (RBAC)                 │   │
│  │  • Session management (15-min timeout)              │   │
│  │  • Password policies (complexity, rotation)         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 3: Application Security                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Input validation & sanitization                  │   │
│  │  • SQL injection prevention (parameterized queries) │   │
│  │  • XSS protection (Content Security Policy)         │   │
│  │  • CSRF tokens                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 4: Data Security                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Encryption at rest (AES-256)                     │   │
│  │  • Encryption in transit (TLS 1.3)                  │   │
│  │  • Database access controls                         │   │
│  │  • Secure credential storage (vault/secrets mgr)    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Layer 5: Audit & Monitoring                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Comprehensive audit logging                      │   │
│  │  • Real-time security monitoring                    │   │
│  │  • Intrusion detection                              │   │
│  │  • Regular security audits                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Build core infrastructure and manual workflow

**Deliverables**:

- ✅ Database schema implementation
- ✅ User authentication system
- ✅ Basic case management (manual code entry)
- ✅ Supervisor dashboard (view/approve cases)
- ✅ Playwright automation for billing submission
- ✅ Basic audit logging

**Success Criteria**:

- Supervisor can manually enter codes
- System can submit to billing portal
- Audit logs capture all actions

**Technical Tasks**:

```
Week 1: Project setup
  • Initialize Next.js project
  • Set up PostgreSQL database
  • Configure Prisma ORM
  • Implement authentication

Week 2: Core features
  • Build case management UI
  • Create supervisor dashboard
  • Implement approval workflow

Week 3: Automation
  • Set up Playwright
  • Build billing submission script
  • Add error handling & screenshots

Week 4: Testing & refinement
  • End-to-end testing
  • Security audit
  • Deploy to staging environment
```

---

### Phase 2: AI Integration (Weeks 5-8)

**Goal**: Add AI-powered code suggestions

**Deliverables**:

- ✅ AI coding engine integration
- ✅ Confidence score calculation
- ✅ AI suggestions displayed in dashboard
- ✅ Comparison view (AI vs manual codes)
- ✅ Basic correction tracking

**Success Criteria**:

- AI generates codes for 90%+ of cases
- Supervisor can approve/modify AI suggestions
- System tracks all modifications

**Technical Tasks**:

```
Week 5: AI integration
  • Integrate OpenAI/Claude API
  • Build prompt engineering for medical coding
  • Test code generation accuracy

Week 6: Confidence system
  • Implement confidence scoring algorithm
  • Build historical accuracy tracking
  • Create rule-based confidence boosting

Week 7: Dashboard enhancements
  • Add AI suggestions to review UI
  • Build side-by-side comparison view
  • Implement quick modification tools

Week 8: Correction tracking
  • Build correction recording system
  • Create correction analytics
  • Deploy to production for pilot testing
```

**Pilot Testing**:

- Select 1-2 supervisor volunteers
- Process 50-100 real cases
- Measure: AI accuracy, time savings, user satisfaction

---

### Phase 3: Learning System (Weeks 9-12)

**Goal**: Implement learning and auto-submission

**Deliverables**:

- ✅ Pattern detection from corrections
- ✅ Coding rules database
- ✅ Adaptive confidence scoring
- ✅ Auto-submission for high-confidence cases
- ✅ Analytics dashboard

**Success Criteria**:

- System learns from 100% of corrections
- Confidence scores improve over time
- 20%+ of cases auto-submit by end of phase

**Technical Tasks**:

```
Week 9: Learning infrastructure
  • Build pattern detection algorithms
  • Create coding rules database
  • Implement rule-based code generation

Week 10: Auto-submission
  • Build auto-submit queue
  • Add confidence threshold controls
  • Implement supervisor override options

Week 11: Analytics
  • Build learning curve visualization
  • Create performance dashboards
  • Add correction pattern reports

Week 12: Optimization
  • Fine-tune confidence thresholds
  • Optimize AI prompts
  • Performance testing & scaling
```

---

### Phase 4: Production Rollout (Weeks 13-16)

**Goal**: Full team rollout and optimization

**Deliverables**:

- ✅ All supervisors trained
- ✅ Full production deployment
- ✅ Monitoring & alerting
- ✅ Documentation & training materials
- ✅ Ongoing optimization processes

**Success Criteria**:

- 50%+ cases auto-submit
- 95%+ accuracy rate
- 60%+ time savings vs manual
- User satisfaction score 4.5+/5

**Activities**:

```
Week 13: Training
  • Supervisor training sessions
  • Create training materials & videos
  • Q&A sessions

Week 14: Rollout
  • Gradual rollout to all supervisors
  • Monitor closely for issues
  • Daily check-ins with users

Week 15: Optimization
  • Analyze usage patterns
  • Tune confidence thresholds
  • Address feedback

Week 16: Documentation
  • Finalize user documentation
  • Create troubleshooting guides
  • Establish ongoing support process
```

---

## Cost-Benefit Analysis

### Implementation Costs

| Category                            | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total       |
| ----------------------------------- | ------- | ------- | ------- | ------- | ----------- |
| **Development** (400 hrs @ $150/hr) | $20,000 | $15,000 | $15,000 | $10,000 | **$60,000** |
| **Infrastructure** (4 months)       | $400    | $400    | $400    | $400    | **$1,600**  |
| **AI API costs** (testing)          | -       | $500    | $1,000  | $1,000  | **$2,500**  |
| **Training & rollout**              | -       | -       | -       | $5,000  | **$5,000**  |
| **Contingency** (10%)               | -       | -       | -       | -       | **$6,900**  |
| **TOTAL**                           | $20,400 | $15,900 | $16,400 | $16,400 | **$76,100** |

---

### Ongoing Operational Costs

| Category                               | Monthly    | Annual      |
| -------------------------------------- | ---------- | ----------- |
| **Infrastructure** (Vercel, DB, Redis) | $100       | $1,200      |
| **AI API** (at scale: 1000 cases/mo)   | $200       | $2,400      |
| **Monitoring** (Sentry, logs)          | $50        | $600        |
| **Maintenance** (5 hrs/mo @ $150/hr)   | $750       | $9,000      |
| **TOTAL**                              | **$1,100** | **$13,200** |

---

### Expected Benefits

#### Time Savings

**Current State** (Manual):

```
Average time per case: 8 minutes
  • Review procedure notes: 2 min
  • Look up codes: 3 min
  • Enter in billing system: 2 min
  • Double-check: 1 min

Volume: 50 cases/day
Total time: 400 minutes/day = 6.7 hours/day

Staff cost: $40/hr (loaded)
Daily cost: 6.7 hrs × $40 = $268/day
Annual cost: $268 × 250 days = $67,000/year
```

**With Automation**:

```
High-confidence cases (60%): Fully automated
  • 30 cases × 0 minutes = 0 minutes

Low-confidence cases (40%): Supervisor review
  • 20 cases × 3 minutes = 60 minutes
  • (AI codes already suggested, just review/approve)

Total time: 60 minutes/day = 1 hour/day

Staff cost: $40/hr
Daily cost: 1 hr × $40 = $40/day
Annual cost: $40 × 250 days = $10,000/year

Savings: $67,000 - $10,000 = $57,000/year
```

#### Error Reduction

**Current Error Rate**: ~5% (industry average)

```
50 cases/day × 5% error = 2.5 errors/day
Annual errors: 625 errors/year

Rejection/rework cost: $25/error
Annual rework cost: 625 × $25 = $15,625
```

**With AI Assistance** (95%+ accuracy):

```
50 cases/day × 1% error = 0.5 errors/day
Annual errors: 125 errors/year

Rejection/rework cost: $25/error
Annual rework cost: 125 × $25 = $3,125

Savings: $15,625 - $3,125 = $12,500/year
```

---

### Return on Investment (ROI)

**Summary**:

```
Initial Investment: $76,100
Annual Operational Cost: $13,200
Annual Benefits: $69,500 ($57,000 time + $12,500 error reduction)

Year 1: -$76,100 + $69,500 - $13,200 = -$19,800 (break-even in ~14 months)
Year 2: +$69,500 - $13,200 = +$56,300
Year 3: +$69,500 - $13,200 = +$56,300

3-Year Net Benefit: $92,800
3-Year ROI: 122%
```

**Intangible Benefits** (not quantified):

- Improved job satisfaction (less tedious work)
- Scalability (handle growth without hiring)
- Consistency (standardized coding practices)
- Knowledge retention (system "remembers" expertise)
- Faster billing (reduced days to payment)
- Staff can focus on complex cases

---

## Risk Assessment

### Technical Risks

| Risk                         | Probability | Impact   | Mitigation                                                                                            |
| ---------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------- |
| **AI accuracy insufficient** | Medium      | High     | • Start with manual review<br>• Gradual rollout<br>• Human always in loop                             |
| **Billing portal changes**   | Medium      | Medium   | • Screenshot comparison alerts<br>• Quick Playwright script updates<br>• Fallback to manual           |
| **Data breach**              | Low         | Critical | • Strong encryption<br>• Access controls<br>• Regular security audits<br>• Incident response plan     |
| **System downtime**          | Low         | Medium   | • High availability hosting<br>• Database backups<br>• Queue persistence<br>• Manual fallback process |
| **Integration failures**     | Medium      | Low      | • Robust error handling<br>• Retry mechanisms<br>• Alerting system                                    |

---

### Operational Risks

| Risk                            | Probability | Impact | Mitigation                                                                         |
| ------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------- |
| **User resistance**             | Medium      | Medium | • Early user involvement<br>• Clear communication<br>• Training & support          |
| **Over-reliance on automation** | Medium      | High   | • Regular accuracy audits<br>• Mandatory review periods<br>• Confidence thresholds |
| **Regulatory changes**          | Low         | High   | • Monitor CMS updates<br>• Flexible code database<br>• Quick update process        |
| **Learning from bad data**      | Low         | High   | • Supervisor review required<br>• Periodic rule audits<br>• Ability to reset rules |

---

### Compliance Risks

| Risk                              | Probability | Impact   | Mitigation                                                                                                  |
| --------------------------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| **HIPAA violation**               | Low         | Critical | • Encryption<br>• Access controls<br>• Audit logging<br>• Regular training<br>• BAAs with vendors           |
| **Billing fraud (unintentional)** | Low         | Critical | • Validation checks<br>• Human review<br>• Audit trails<br>• Regular compliance reviews                     |
| **Incorrect coding**              | Medium      | High     | • Confidence thresholds<br>• Supervisor approval<br>• Medical necessity checks<br>• Regular accuracy audits |

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### 1. Automation Rate

```
Metric: % of cases auto-submitted without human review

Targets:
  Month 1: 0% (learning phase)
  Month 3: 20%
  Month 6: 50%
  Month 12: 70%
```

#### 2. Accuracy Rate

```
Metric: % of submitted claims accepted without rejection/rework

Targets:
  Current (manual): 95%
  Month 1: 96%
  Month 6: 98%
  Month 12: 99%
```

#### 3. Time Savings

```
Metric: Average minutes per case

Current: 8 minutes
Target: 2 minutes (75% reduction)
```

#### 4. Confidence Calibration

```
Metric: Difference between predicted confidence and actual accuracy

Target: <2% deviation
  • Cases predicted 95% confidence should actually be 93-97% accurate
```

#### 5. Learning Rate

```
Metric: Time to reach 95% confidence for new procedure types

Targets:
  Month 3: 30 cases
  Month 6: 20 cases
  Month 12: 10 cases
```

---

### Monitoring Dashboard

**Supervisor View**:

```
┌─────────────────────────────────────────────────────────────┐
│  System Performance - Last 30 Days                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Automation Rate:    67% ▲ +5% from last month             │
│  Accuracy Rate:      98.2% ▲ +0.5% from last month         │
│  Time per Case:      2.3 min ▼ -0.4 min from last month    │
│  Cases Processed:    1,247                                  │
│  Auto-Submitted:     836 (67%)                              │
│  Human Reviewed:     411 (33%)                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Learning Progress                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Graph showing accuracy improving over time]               │
│                                                              │
│  New Patterns Learned: 12                                   │
│  Rules Updated: 47                                          │
│  Average Confidence: 89% ▲ +3%                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Top Modification Patterns                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Modifier -59 removed (8 cases)                          │
│  2. ICD code K80.20 → K81.0 (6 cases)                      │
│  3. CPT 74300 unbundled (4 cases)                          │
│                                                              │
│  [Action: Review these patterns]                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendices

### Appendix A: Glossary

| Term                  | Definition                                                          |
| --------------------- | ------------------------------------------------------------------- |
| **CPT Code**          | Current Procedural Terminology - codes for medical procedures       |
| **ICD Code**          | International Classification of Diseases - diagnosis codes          |
| **Modifier**          | Two-digit code appended to CPT to indicate special circumstances    |
| **Bundling**          | Multiple procedures billed as one when performed together           |
| **NCCI**              | National Correct Coding Initiative - CMS bundling rules             |
| **Medical Necessity** | Requirement that diagnosis supports the need for procedure          |
| **LCD/NCD**           | Local/National Coverage Determination - insurance coverage policies |
| **Confidence Score**  | System's estimate of accuracy (0-100%)                              |
| **Auto-Submit**       | Automated submission without human review                           |
| **Staged**            | Case awaiting supervisor review                                     |
| **HIPAA**             | Health Insurance Portability and Accountability Act                 |
| **PHI**               | Protected Health Information                                        |
| **BAA**               | Business Associate Agreement (HIPAA requirement)                    |

---

### Appendix B: Sample Procedure Notes

**Example 1: High Confidence**

```
Procedure: Laparoscopic cholecystectomy
Date: 10/15/2025
Provider: Dr. Smith

Notes: "Routine laparoscopic cholecystectomy performed for
cholelithiasis. Standard 4-port technique. Gallbladder removed
intact. No complications. Patient tolerated procedure well."

AI Suggested Codes:
  CPT: 47562 (Laparoscopic cholecystectomy)
  ICD: K80.20 (Calculus of gallbladder without obstruction)

Confidence: 98%
Action: Auto-submit
```

**Example 2: Low Confidence**

```
Procedure: Complex wound closure
Date: 10/15/2025
Provider: Dr. Jones

Notes: "Complex layered closure of 8cm laceration on right
forearm following traumatic injury with tissue loss. Required
undermining and layered suturing."

AI Suggested Codes:
  CPT: 13121 (Repair complex, intermediate, 7.6-12.5 cm)
  ICD: S51.819A (Laceration, forearm, initial encounter)

Confidence: 72%
Flagged: Uncertain between simple, intermediate, complex repair
Action: Route to supervisor review
```

---

### Appendix C: Implementation Checklist

**Pre-Launch Checklist**:

**Legal & Compliance**:

- [ ] HIPAA compliance review completed
- [ ] BAAs signed with all vendors
- [ ] Privacy policy updated
- [ ] Security audit completed
- [ ] Incident response plan documented

**Technical**:

- [ ] Production environment configured
- [ ] Database backups automated
- [ ] Monitoring & alerting set up
- [ ] Error tracking configured
- [ ] SSL certificates installed

**Training**:

- [ ] Supervisor training completed
- [ ] User documentation finalized
- [ ] Training videos recorded
- [ ] FAQ document created
- [ ] Support process established

**Testing**:

- [ ] End-to-end testing completed
- [ ] Load testing passed
- [ ] Security testing passed
- [ ] UAT with real users completed
- [ ] Rollback plan documented

---

### Appendix D: Support & Escalation

**Support Tiers**:

**Tier 1: User Self-Service**

- Documentation portal
- FAQ
- Video tutorials
- In-app help

**Tier 2: Supervisor Support**

- Email: support@company.com
- Response time: 4 hours
- Handles: How-to questions, case-specific issues

**Tier 3: Technical Support**

- Handles: System errors, bugs, outages
- Response time: 1 hour for critical, 4 hours for non-critical
- On-call rotation for after-hours

**Escalation Path**:

```
User encounters issue
  ↓
Check documentation (Tier 1)
  ↓
Email supervisor support (Tier 2)
  ↓ (if unresolved)
Escalate to technical team (Tier 3)
  ↓ (if critical)
Page on-call engineer
```

---

### Appendix E: Future Enhancements

**Potential Future Features** (Post-MVP):

1. **EHR Integration**
   - Direct import from Epic, Cerner, etc.
   - Automatic case creation from completed procedures

2. **Multi-Payer Support**
   - Different coding rules per insurance carrier
   - Payer-specific validation

3. **Advanced Analytics**
   - Revenue cycle analytics
   - Denial prediction
   - Reimbursement optimization

4. **Mobile App**
   - Review cases on mobile
   - Quick approvals
   - Push notifications

5. **Voice Input**
   - Dictate procedure notes
   - Voice-activated approvals

6. **Provider Feedback Loop**
   - Send coding questions to providers
   - Improve procedure note quality

7. **Batch Processing**
   - End-of-day batch submission
   - Bulk approval workflows

8. **Claims Tracking**
   - Track claim status
   - Automated follow-up on denials
   - Appeals management

---

## Document Revision History

| Version | Date       | Author            | Changes                   |
| ------- | ---------- | ----------------- | ------------------------- |
| 1.0     | 2025-10-20 | James (Dev Agent) | Initial document creation |

---

## Next Steps

**For SME Review**:

1. Review system architecture and workflow
2. Validate medical coding requirements
3. Assess compliance requirements
4. Provide feedback on implementation approach

**For Project Planning**:

1. Secure stakeholder buy-in
2. Allocate budget and resources
3. Assemble development team
4. Schedule Phase 1 kickoff

**Questions for Discussion**:

1. What billing systems are currently in use?
2. Current case volume and growth projections?
3. Existing EHR system integration requirements?
4. Specific regulatory/compliance concerns?
5. Preferred timeline for rollout?

---

**Document End**

_This document is intended for internal discussion and planning purposes. All technical specifications, timelines, and cost estimates are preliminary and subject to change based on detailed requirements gathering and stakeholder input._
