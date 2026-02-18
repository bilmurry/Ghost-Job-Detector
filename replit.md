# Ghost Job Detector

## Overview

Ghost Job Detector is a web application that helps job seekers identify potentially fake or misleading job postings. Users can submit job posting details, and the system analyzes them for red flags, scam indicators, and signs of "ghost jobs" (listings that companies post without genuine intent to hire). The application returns a risk score, confidence level, categorized warnings, and actionable recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI transitions
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared for shared)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under /api prefix
- **Validation**: Zod schemas shared between client and server
- **Development**: tsx for TypeScript execution, Vite dev server with HMR proxy

### Project Structure
```
├── client/          # React frontend
│   └── src/
│       ├── components/ui/  # shadcn/ui components
│       ├── pages/          # Route components
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and query client
├── server/          # Express backend
│   ├── routes.ts    # API route definitions with analysis logic
│   ├── storage.ts   # In-memory data storage
│   └── static.ts    # Static file serving for production
├── shared/          # Shared types and schemas
│   └── schema.ts    # Zod schemas for job postings and analysis results
└── migrations/      # Drizzle database migrations
```

### Analysis Engine
The core job analysis logic lives in `server/routes.ts` and uses pattern matching against:
- Payment request keywords (critical red flags)
- "Too good to be true" phrases
- Vague job requirements
- Urgent/pressure language
- Resume harvesting detection:
  - Talent pool/pipeline language (always hiring, future opportunities, evergreen roles)
  - Direct resume submission requests without active opening
  - Excessive personal data requests (SSN, bank details) before hiring
- Compensation price point analysis:
  - 36 job titles with median/low/high salary ranges
  - Detects overpaying bait ($500k for data entry = critical)
  - Detects exploitative underpaying ($15k for customer service = high)
  - Flags vague compensation ("competitive salary", "depends on experience")
- Enhanced email/domain verification:
  - 34 personal email domains (gmail, yahoo, international providers)
  - 20 disposable/temporary email domains (tempmail, mailinator, etc.)
  - Company name vs email domain mismatch detection
  - Website vs email domain mismatch detection
  - Suspicious email patterns (auto-generated, numbered addresses)
  - Free subdomain service detection (wix, weebly, etc.)
- Color-coded severity mapping:
  - Critical (red): payment requests, scams, salary bait, disposable emails, SSN requests
  - High (amber): resume harvesting, exploitative pay, personal emails, unrealistic promises
  - Medium (orange): above/below market range, talent pool listings, vague compensation
  - Low (green): short descriptions, minor formatting issues

Analysis results include:
- Ghost score (0-100)
- Confidence percentage
- Risk level (low/low-medium/medium/high)
- Categorized red flags with severity levels
- Detailed breakdown by category (content, company, patterns, communication)

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations (no separate API key needed)
- **Model**: gpt-5-mini for job analysis
- **File**: `server/ghostAI.ts` - AI analysis function with structured JSON output
- **Strategy**: AI is the primary scoring engine; rule-based analysis is fallback only
  - AI returns full AnalysisResult including detailedAnalysis breakdown
  - If AI throws, falls back to rule-based `analyzeJobPosting()`
  - ghostAI.ts throws errors (no silent null returns)
- **Environment Variables**: AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL

### Data Flow
1. User submits job posting data via form
2. Frontend validates with Zod schema
3. POST request to /api/analyze endpoint
4. Server runs rule-based pattern analysis AND AI analysis in parallel
5. Results are merged: scores weighted, red flags deduplicated, AI recommendation used
6. Returns structured AnalysisResult
7. Frontend displays color-coded results with recommendations

## External Dependencies

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Tables**: users, sessions, analyses
- **Auth**: Replit Auth integration with secure session management
- **Analysis History**: Persists user analyses with IDOR-protected queries
- **Migration Tool**: drizzle-kit for schema management

### UI Component Library
- **shadcn/ui**: Full component set with Radix UI primitives
- **Styling**: CSS variables for theming, supports light/dark mode

### Key NPM Packages
- `@tanstack/react-query`: Async state management
- `zod`: Runtime type validation
- `react-hook-form`: Form state management
- `framer-motion`: Animation library
- `lucide-react`: Icon library
- `wouter`: Client-side routing

### Development Tools
- Replit-specific Vite plugins (error overlay, cartographer, dev banner)
- esbuild for production server bundling with dependency allowlist