# Ghost Job Detector

AI-powered job posting credibility analyzer designed to identify suspicious, inactive, or misleading job listings before candidates waste time applying.

Ghost Job Detector evaluates structured job attributes and surfaces risk indicators commonly associated with “ghost jobs” — postings that appear active but lack genuine hiring intent.

---

## The Problem

The modern job market contains a growing number of listings that:

- Remain posted despite inactive hiring
- Collect resumes without immediate roles available
- Contain vague or recycled descriptions
- Lack verifiable contact or transparency

These listings distort labor market signals, waste applicant time, and reduce trust in hiring platforms.

Job seekers currently have no structured way to assess listing credibility before applying.

---

## The Solution

Ghost Job Detector analyzes job posting data and applies heuristic validation logic to produce:

- Risk score
- Confidence level
- Categorized warning indicators
- Actionable recommendations

Instead of blindly submitting applications, users receive structured feedback about potential red flags.

---

## How It Works

1. User submits job posting details
2. Backend applies validation rules and scoring logic
3. Risk indicators are evaluated across multiple dimensions
4. A credibility assessment is returned in structured format

The scoring model evaluates signals such as:
- Compensation clarity
- Posting metadata consistency
- Contact transparency
- Description quality
- Structural anomalies

---

## System Architecture

### Frontend

- React 18 with TypeScript
- Wouter (lightweight routing)
- TanStack Query (React Query) for server state
- React Hook Form with Zod validation
- Tailwind CSS with shadcn/ui components
- Framer Motion for UI transitions
- Vite build tooling

### Backend

- Node.js + Express
- REST API architecture
- Authentication layer
- Structured scoring logic engine

---

## API Response Structure (Example)

```json
{
  "riskScore": 72,
  "confidence": "High",
  "flags": [
    "Salary range missing",
    "Generic job description",
    "No direct company contact provided"
  ],
  "recommendation": "Proceed with caution and verify employer legitimacy before applying."
}