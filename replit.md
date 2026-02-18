# Ghost Job Detector

## Overview

Ghost Job Detector is a web application that helps job seekers identify potentially fake or misleading job postings. Users submit job posting details, and the system analyzes them using AI-powered detection (with a rule-based fallback) to surface red flags, scam indicators, and signs of "ghost jobs" — listings that companies post without genuine intent to hire. The application returns a risk score, confidence level, categorized warnings, and actionable recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Design**: Apple-inspired aesthetic with SF Pro system font stack, metallic silver/space gray palette
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
│       ├── pages/          # Route components (home.tsx, history.tsx)
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and query client
├── server/          # Express backend
│   ├── routes.ts    # API route definitions with rule-based analysis logic
│   ├── ghostAI.ts   # AI-powered analysis using OpenAI
│   ├── storage.ts   # Database-backed data storage
│   └── static.ts    # Static file serving for production
├── shared/          # Shared types and schemas
│   └── schema.ts    # Zod schemas for job postings and analysis results
└── migrations/      # Drizzle database migrations
```

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations (no separate API key needed)
- **Model**: gpt-5-mini for job analysis
- **File**: `server/ghostAI.ts` - AI analysis function with structured JSON output
- **Strategy**: AI is the primary scoring engine; rule-based analysis is fallback only
  - AI returns full AnalysisResult including detailedAnalysis breakdown
  - If AI throws, falls back to rule-based `analyzeJobPosting()`
  - ghostAI.ts throws errors (no silent null returns)
- **Environment Variables**: AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL

### Rule-Based Fallback Engine
The fallback analysis logic lives in `server/routes.ts` and uses pattern matching against:
- Payment request keywords (critical red flags)
- "Too good to be true" phrases
- Vague job requirements
- Urgent/pressure language
- Resume harvesting detection (talent pool language, excessive data requests)
- Compensation price point analysis (36 job titles with salary ranges)
- Enhanced email/domain verification (34 personal, 20 disposable domains)
- Color-coded severity mapping (critical/high/medium/low)

### Data Flow
1. User submits job posting data via form
2. Frontend validates with Zod schema
3. POST request to /api/analyze endpoint
4. Server calls AI analysis (primary)
5. If AI fails, falls back to rule-based analysis
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
- `openai`: OpenAI client SDK for AI-powered analysis
- `@tanstack/react-query`: Async state management
- `zod`: Runtime type validation
- `react-hook-form`: Form state management
- `framer-motion`: Animation library
- `lucide-react`: Icon library
- `wouter`: Client-side routing

### Chrome Extension (Browser Extension)
- **Directory**: `/extension/` - self-contained Chrome MV3 extension
- **Purpose**: Analyze job postings directly on LinkedIn, Indeed, Glassdoor, ZipRecruiter
- **Architecture**: Content script + background service worker + settings popup
- **Files**:
  - `manifest.json` - MV3 manifest with host permissions for job sites
  - `content.js` - Floating button injection, DOM scraping, results panel
  - `background.js` - Message relay for API calls (avoids CORS in content script)
  - `popup.html/popup.js` - Settings UI for configuring API endpoint URL
  - `styles.css` - Dark-themed panel and button styles
  - `icons/` - Extension icons (16/48/128px)
- **Scraping**: Site-specific selectors for LinkedIn, Indeed, Glassdoor, ZipRecruiter + generic fallback
- **API**: Sends scraped data to configured Ghost Job Detector `/api/analyze` endpoint
- **CORS**: Backend has CORS headers on `/api/analyze` to allow extension requests
- **Installation**: Load unpacked in Chrome (chrome://extensions > Developer mode > Load unpacked > select /extension folder)

### Development Tools
- Replit-specific Vite plugins (error overlay, cartographer, dev banner)
- esbuild for production server bundling with dependency allowlist
