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
│   ├── ghostAI.ts   # AI scoring using ChatGPT (OpenAI)
│   ├── claudeAI.ts  # Language/tone analysis using Claude (Anthropic)
│   ├── perplexityAI.ts # Company verification using Perplexity (web search)
│   ├── storage.ts   # Database-backed data storage
│   └── static.ts    # Static file serving for production
├── shared/          # Shared types and schemas
│   └── schema.ts    # Zod schemas for job postings and analysis results
└── migrations/      # Drizzle database migrations
```

### AI Analysis Layer (Agentic Sequential Pipeline)
Orchestrated by `server/agentPipeline.ts`. Each model runs in sequence, feeding context forward. The pipeline can loop if Claude requests additional web research.

**Flow:**
```
Step 1 → Perplexity: gather company context from live web search
Step 2 → Claude: deep language analysis WITH company context baked in
Step 3 → (if Claude.needsMoreInfo) → Perplexity follow-up search → Claude re-analysis
Step 4 → ChatGPT: final scoring with ALL accumulated context
```

1. **ChatGPT (OpenAI)** -- Risk Scoring
   - **Provider**: OpenAI via Replit AI Integrations
   - **Model**: gpt-5-mini
   - **File**: `server/ghostAI.ts`
   - **Role**: Primary ghost score, red flags, detailed analysis breakdown
   - **Fallback**: Rule-based engine in `routes.ts` if ChatGPT fails
   - **Env**: AI_INTEGRATIONS_OPENAI_API_KEY, AI_INTEGRATIONS_OPENAI_BASE_URL

2. **Claude (Anthropic)** -- Language Analysis
   - **Provider**: Anthropic via Replit AI Integrations
   - **Model**: claude-sonnet-4-6
   - **File**: `server/claudeAI.ts`
   - **Role**: Linguistic analysis (vagueness, professionalism, manipulative language, tone)
   - **Scoring impact**: Manipulative language +8, high vagueness +1-6, low professionalism +1-6
   - **Env**: AI_INTEGRATIONS_ANTHROPIC_API_KEY, AI_INTEGRATIONS_ANTHROPIC_BASE_URL

3. **Perplexity** -- Company Verification
   - **Provider**: Perplexity API (user-provided key)
   - **Model**: sonar
   - **File**: `server/perplexityAI.ts`
   - **Role**: Web search to verify company existence, web presence, industry match
   - **Scoring impact**: Company not found +15, not verified +8, industry mismatch +5, low web presence +5
   - **Env**: PERPLEXITY_API_KEY

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

### Job Fingerprinting & Repost Detection
- **File**: `server/fingerprint.ts` — SHA-256 fingerprint generation from normalized title+company+description
- **Table**: `job_fingerprints` — stores every analyzed listing with fingerprint, similarity key, normalized company
- **Detection**: Exact match (same fingerprint) and fuzzy match (same similarity key = same title+company combo)
- **API Response**: `repostDetection` field includes `isRepost`, `repostCount`, `firstSeen`, `sites`, `similarListings`

### Employer Reputation Scoring
- **File**: `server/employerScore.ts` — calculates reputation score (0-100) based on posting behavior
- **Table**: `employer_scores` — tracks per-employer metrics (total listings, reposts, avg ghost score, high risk count, vague pay count, perpetual hiring flag)
- **Score Formula**: Base 50, penalize for high repost rate, high avg ghost score, high-risk listings, vague pay ranges, perpetual hiring; reward for low ghost scores
- **API**: `GET /api/employer/:company` for standalone lookup; also included in analysis response as `employerReputation`

### Data Flow
1. User submits job posting data via form
2. Frontend validates with Zod schema
3. POST request to /api/analyze endpoint
4. Server calls AI analysis (primary)
5. If AI fails, falls back to rule-based analysis
6. Server generates fingerprint, detects reposts, stores fingerprint, updates employer score
7. Returns structured AnalysisResult with repostDetection and employerReputation
8. Frontend displays color-coded results with recommendations, repost detection, and employer reputation

## External Dependencies

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Tables**: users, sessions, analyses, job_fingerprints, employer_scores, page_views
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
- **Architecture**: Content script (data extractor) + background service worker (orchestrator) + popup (UI + settings)
- **Files**:
  - `manifest.json` - MV3 manifest with host permissions for job sites + API backend
  - `content.js` - Data extraction via JSON-LD, site-specific selectors, and generic fallback. Listens for SCAN_PAGE messages.
  - `background.js` - Orchestrates scan flow: sends SCAN_PAGE to content script → receives job data → calls /api/analyze → returns results
  - `popup.html/popup.js` - Scan button UI with results display (score, risk, flags) + collapsible settings panel
  - `icons/` - Properly sized extension icons (16/48/128px)
- **Data Extraction**: JSON-LD JobPosting schema (primary), site-specific DOM selectors (fallback), OG meta tags (generic fallback)
- **API**: Sends extracted job data to configured Ghost Job Detector `/api/analyze` endpoint (HTTPS enforced)
- **CORS**: Backend has CORS headers on `/api/analyze` to allow extension requests
- **Floating Ghost Button (FAB)**: Persistent floating button appears on job pages; click to scan directly from the page; shows expanded result panel (340px) with full ghost score, all red flags, repost detection stats/similar listings, and employer reputation breakdown
- **Auto-Scan**: Extension auto-detects job pages and scans when popup opens; badge shows "!" on job pages
- **Security**: All dynamic content in popup uses safe DOM methods to prevent XSS
- **Installation**: Load unpacked in Chrome (chrome://extensions > Developer mode > Load unpacked > select /extension folder)
- **Extension Page**: `/extension` route — instruction page with download link, installation guide, features, supported sites, FAQ
- **Privacy Page**: `/privacy` route — privacy & data practices page explaining no server-side scraping, user-controlled data, extension permissions, data flow
- **Download**: `/extension/ghost-hunter-mode.zip` — pre-built zip of the extension for easy download
- **No Server-Side Scraping**: `/api/scrape-url` endpoint has been removed; all job content comes from users via extension or manual entry

### Security Middleware
- **File**: `server/middleware.ts` - Custom security middleware (no external dependencies)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Strict-Transport-Security
- **Rate Limiting**: In-memory rate limiter with configurable windows. General API: 30 req/min, Analyze: 10 req/min
- **Request Size Limiting**: 100KB max request body
- **Error Boundary**: React ErrorBoundary component wraps the entire app (client/src/components/error-boundary.tsx)

### SEO & AEO
- **Per-page SEO**: `useSEO` hook (`client/src/hooks/use-seo.ts`) sets page title, meta description, OG tags, Twitter cards, and canonical URL per route
- **Structured Data**: JSON-LD in `index.html` includes WebApplication, Organization, BreadcrumbList, FAQPage, and SoftwareApplication schemas
- **Static Files**: `client/public/robots.txt` and `client/public/sitemap.xml` for search engine crawling
- **Meta Tags**: Full OG, Twitter Card, theme-color, apple-mobile-web-app tags in `index.html`
- **AEO**: FAQ structured data with 6 common questions for answer engine extraction

### Capacitor (iOS & Android Apps)
- **Config**: `capacitor.config.ts` — app ID `com.ghostjobdetector.app`, points to deployed backend
- **iOS Project**: `/ios/` — Xcode project generated by Capacitor
- **Android Project**: `/android/` — Android Studio project generated by Capacitor
- **Plugins**: @capacitor/app, @capacitor/haptics, @capacitor/keyboard, @capacitor/status-bar, @capacitor/android
- **Mode**: Uses `server.url` to load the deployed web app inside a native WebView
- **Theme**: Dark background (#111418), teal accent (#0D9488), dark splash screen with ghost logo
- **Build Steps — iOS** (on a Mac with Xcode):
  1. `npx cap sync ios` — sync web assets and plugins
  2. `npx cap open ios` — open Xcode project
  3. Build and run from Xcode, or archive for App Store submission
  - **Requirements**: Apple Developer account ($99/year), Mac with Xcode, CocoaPods installed
- **Build Steps — Android** (on any OS with Android Studio):
  1. `npx cap sync android` — sync web assets and plugins
  2. `npx cap open android` — open Android Studio project
  3. Build and run from Android Studio, or generate signed APK/AAB for Play Store
  - **Requirements**: Google Play Developer account ($25 one-time), Android Studio installed

### Admin Dashboard
- **Route**: `/admin` — only accessible to admin user (ID: 50135034)
- **Backend**: `GET /api/admin/stats` protected by `isAdmin` middleware (checks auth + user ID)
- **Tracks**: Total users, total analyses, page views (today/week/total), daily view chart, top pages, recent users, recent analyses
- **Page View Tracking**: `POST /api/track` records every page visit (path, user agent, referrer, IP) to `page_views` table
- **Frontend hook**: `usePageTracker()` in `client/src/hooks/use-page-tracker.ts` fires on page load

### Development Tools
- Replit-specific Vite plugins (error overlay, cartographer, dev banner)
- esbuild for production server bundling with dependency allowlist
