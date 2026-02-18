# Ghost Job Detector - Design Document

## Design Philosophy

**Design System:** Apple-inspired minimalist aesthetic
**Rationale:** A utility-focused application requiring trust, clarity, and precision. The Apple design language communicates authority and sophistication, making users feel confident in the analysis results. Clean surfaces, refined typography, and restrained color usage let the data speak for itself.

**Core Principles:**
- Trust through precision: Clean, confident presentation of analysis results
- Immediate comprehension: Color-coded risk levels with clear visual hierarchy
- Scannable information: Organized red flags and recommendations
- Quiet confidence: Let the content lead, not the chrome

---

## Typography

**Font Stack:** SF Pro-like system font stack
```
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

**Characteristics:**
- Tight letter-spacing (tracking-tight on headings)
- Uppercase labels with tracking-wider for form fields and section headers
- Tabular numerals (font-variant-numeric: tabular-nums) for scores and percentages
- Light font weights for large display text, medium/semibold for labels

**Hierarchy:**
- Hero Heading: text-4xl/5xl, font-bold, tracking-tight
- Section Headers: text-lg, font-semibold, tracking-tight
- Form Labels: text-xs, font-medium, uppercase, tracking-wider, muted-foreground
- Body Text: text-sm, font-normal
- Risk Score Display: text-6xl, font-bold, tabular-nums
- Confidence/Stats: text-2xl, font-semibold, tabular-nums

---

## Color System

### Light Mode (Silver/Metallic)
- **Background**: Cool gray-white (0 0% 98%)
- **Card surfaces**: Pure white (0 0% 100%)
- **Primary accent**: Deep blue-gray (220 15% 25%)
- **Muted text**: Medium gray (220 10% 46%)
- **Borders**: Subtle gray (220 13% 91%)

### Dark Mode (Space Gray/Black)
- **Background**: Near-black (220 15% 8%)
- **Card surfaces**: Dark charcoal (220 15% 12%)
- **Primary accent**: Light silver (220 10% 90%)
- **Muted text**: Medium silver (220 10% 55%)
- **Borders**: Subtle dark (220 13% 18%)

### Severity Colors (Both Modes)
- **Critical**: Red (0 84% 60%) - payment requests, scams, disposable emails
- **High**: Amber (38 92% 50%) - resume harvesting, exploitative pay, unrealistic promises
- **Medium**: Orange (25 95% 53%) - market range issues, talent pool listings
- **Low**: Emerald (142 71% 45%) - minor formatting issues, short descriptions

---

## Layout System

**Spacing:** Consistent use of Tailwind spacing scale (2, 3, 4, 5, 6, 8)
**Container:** max-w-4xl centered with responsive padding
**Border Radius:** rounded-md (small, consistent)

**Page Structure:**
- Header: Frosted glass effect (backdrop-blur-xl, bg-background/80), sticky, h-14
- Main Content: Centered column, max-w-4xl, py-8 to py-12
- No footer (minimal approach)

---

## Component Patterns

### Header
- Frosted glass with backdrop blur
- ShieldCheck icon + "Ghost Job Detector" wordmark
- Right-aligned auth controls and dark mode toggle
- Sticky positioning with high z-index

### Job Input Form
- Single Card component with CardHeader/CardContent
- Two-tab interface: "Manual Entry" and "From URL" (URL tab disabled/coming soon)
- Form fields: Job Title, Company, Description, Salary, Requirements, Contact Email
- Labels: Uppercase, xs size, tracking-wider, muted color
- "Load Example" button in card header for demo data
- Full-width "Analyze Posting" submit button

### Results View
- Animated entrance via Framer Motion (fade + slide up)
- "New Analysis" button in header when results are showing

**Risk Score Circle:**
- Large centered circular indicator with SVG ring
- Score number (text-6xl, tabular-nums) in center
- Ring color matches risk level severity
- Risk level badge below (uppercase, tracking-wider)

**Stats Row:**
- Three-column grid: Confidence %, Red Flags count, Risk Level
- Each in a subtle card with icon, label, and value
- Tabular numbers for all numeric values

**Recommendation Panel:**
- Full-width Card with quote-style presentation
- AI-generated actionable advice text

**Detected Issues Section:**
- Collapsible accordion by category (Content, Company, Patterns, Communication)
- Each category shows flag count badge
- Individual flags listed with severity-colored indicators
- Severity badge (CRITICAL/HIGH/MEDIUM/LOW) next to each flag message

### History Page
- List of past analyses (requires authentication)
- Each entry shows job title, company, score, risk badge, date
- Delete capability per entry

---

## Interactive States

**Loading:**
- Spinner animation during AI analysis (can take 5-15 seconds)
- Disabled submit button with loading indicator

**Animations:**
- Framer Motion for results entrance (staggered fade-in)
- Smooth transitions between form and results views
- Scale animation on risk score appearance

**Hover/Active:**
- Uses built-in shadcn/ui hover-elevate and active-elevate-2 utilities
- No custom hover colors on Buttons or Badges
- Cards use subtle elevation on hover where appropriate

---

## Icons

**Library:** Lucide React
**Key Icons:**
- ShieldCheck: Logo/header, low risk
- ShieldAlert: Medium risk indicator
- ShieldX: High/critical risk indicator
- AlertTriangle: Warning/red flag indicator
- FileText: Content analysis category
- Building2: Company verification category
- Activity: Posting patterns category
- MessageSquare: Communication category
- TrendingUp: Confidence stat
- Flag: Red flags count stat
- Gauge: Risk level stat

---

## Accessibility

- Form labels always visible (uppercase label pattern, not placeholder-only)
- Color-coding supplemented with text labels and icons
- Focus indicators on all interactive elements
- Semantic HTML with proper heading hierarchy
- Keyboard navigation fully supported
- Severity communicated through both color AND text badges

---

## API Response Structure

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

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Provider | OpenAI via Replit AI Integrations | No API key management, billed to credits |
| AI Model | gpt-5-mini | Cost-effective for structured analysis |
| Fallback | Rule-based pattern matching | Ensures availability if AI is down |
| Auth | Replit Auth | Native integration, no password management |
| Database | PostgreSQL (Neon-backed) | Replit built-in, supports rollback |
| Styling | Tailwind + shadcn/ui | Consistent component library with theming |
| State | TanStack Query | Server state caching and mutation handling |
