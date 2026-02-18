# Ghost Job Detector

AI-powered job posting analyzer that identifies ghost jobs, scam listings, and misleading postings before candidates waste time applying.

---

## The Problem

The modern job market contains a growing number of listings that:

- Remain posted despite inactive hiring ("ghost jobs")
- Collect resumes without any real role available
- Request upfront payments or excessive personal data
- Contain vague, recycled, or misleading descriptions
- Use urgency tactics and unrealistic promises

Job seekers currently have no structured way to assess listing credibility before applying.

---

## The Solution

Ghost Job Detector uses AI-powered analysis to evaluate job postings and produce:

- **Risk Score** (0-100) with color-coded severity
- **Confidence Level** indicating assessment reliability
- **Categorized Red Flags** across content, company, patterns, and communication
- **Actionable Recommendations** explaining what to watch for

---

## How It Works

1. User submits job posting details (title, company, description, salary, etc.)
2. AI analyzes the posting for ghost job indicators, scam patterns, and red flags
3. If AI is unavailable, a comprehensive rule-based engine provides fallback analysis
4. Results are displayed with color-coded severity and detailed breakdowns

### What Gets Detected

- **Payment scams**: Upfront fees, training material costs, deposit requests
- **MLM/pyramid schemes**: Multi-level marketing language, "unlimited income" promises
- **Resume harvesting**: Talent pool listings, excessive data collection, evergreen postings
- **Salary anomalies**: Unrealistic compensation, exploitative underpayment
- **Suspicious contacts**: Disposable emails, personal email domains, domain mismatches
- **Ghost job patterns**: Vague descriptions, urgency tactics, "always hiring" language

---

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Apple-inspired design (SF Pro font stack, metallic palette, frosted glass effects)
- Framer Motion animations
- TanStack Query for server state
- React Hook Form with Zod validation

### Backend
- Node.js + Express (TypeScript)
- OpenAI integration via Replit AI Integrations (gpt-5-mini)
- Rule-based fallback analysis engine
- Zod schema validation shared with frontend

### Database & Auth
- PostgreSQL (Neon-backed via Replit)
- Drizzle ORM with migration support
- Replit Auth for user authentication
- Analysis history with per-user access control

---

## API

### POST /api/analyze

Analyze a job posting for red flags and ghost job indicators.

**Request:**
```json
{
  "title": "Marketing Manager",
  "company": "Success LLC",
  "description": "Make $150,000+ working 10 hours per week...",
  "salary": 150000,
  "requirements": "Must be 18+",
  "contactEmail": "opportunities123@gmail.com"
}
```

**Response:**
```json
{
  "ghostScore": 90,
  "confidence": 93,
  "riskLevel": "high",
  "recommendation": "Do not send money or personal documents; treat this listing as a likely scam.",
  "redFlags": [
    {
      "severity": "critical",
      "message": "Listing requires an upfront payment — legitimate employers do not ask candidates to pay.",
      "category": "content"
    }
  ],
  "detailedAnalysis": {
    "contentAnalysis": { "score": 35, "flags": ["..."] },
    "companyVerification": { "score": 20, "flags": ["..."] },
    "postingPatterns": { "score": 15, "flags": ["..."] },
    "communication": { "score": 10, "flags": ["..."] }
  }
}
```

### GET /api/analyses
Returns authenticated user's analysis history.

### GET /api/analyses/:id
Returns a single analysis (user-scoped).

### DELETE /api/analyses/:id
Deletes an analysis (user-scoped).

---

## Running Locally

```bash
npm install
npm run dev
```

The app runs on port 5000 with Vite HMR for frontend and tsx for backend.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session encryption key |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (auto-provided by Replit) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (auto-provided by Replit) |
