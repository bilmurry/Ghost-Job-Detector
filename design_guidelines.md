# Ghost Job Detector - Design Guidelines

## Design Approach

**Selected Framework:** Material Design-inspired system  
**Rationale:** Utility-focused application requiring clear information hierarchy, strong visual feedback for risk levels, and efficient data presentation. Material Design provides excellent patterns for forms, cards, and alert systems.

**Core Principles:**
- Trust through clarity: Professional, confident presentation of analysis results
- Immediate comprehension: Color-coded risk levels with clear visual hierarchy
- Scannable information: Organized red flags and recommendations
- Guided user journey: Intuitive flow from input to insights

---

## Typography

**Font Family:** Inter (Google Fonts) for interface text  
**Hierarchy:**
- H1 (Page Title): 2.5rem (40px), font-weight 700
- H2 (Section Headers): 1.75rem (28px), font-weight 600
- H3 (Card Titles): 1.25rem (20px), font-weight 600
- Body Text: 1rem (16px), font-weight 400
- Small Text (Labels): 0.875rem (14px), font-weight 500
- Risk Score Display: 3rem (48px), font-weight 700

---

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24  
**Container:** max-w-6xl centered with px-4 sm:px-6 lg:px-8  
**Grid System:** 12-column grid with gap-6 for card layouts

**Page Structure:**
- Header: py-6 with logo and tagline
- Hero/Input Section: py-12 with centered form (max-w-3xl)
- Results Section: py-16 with multi-card layout
- Footer: py-8 with links and disclaimer

---

## Component Library

### Input Form
- Large, prominent card with shadow-lg and rounded-xl
- Two-tab interface: "Analyze URL" and "Manual Entry"
- Input fields with floating labels, border-2 on focus
- Primary CTA button: Large (h-14), rounded-lg, full-width on mobile
- Helper text below fields explaining each input

### Risk Score Dashboard
- Hero card displaying numerical score (0-100)
- Circular progress indicator or large bold number
- Color-coded background: Red (70+), Yellow (50-69), Orange (30-49), Green (<30)
- Risk level badge and recommendation prominently displayed

### Red Flags Section
- Grouped cards by severity level (Critical, High, Medium, Low)
- Each flag as a list item with icon and description
- Severity indicators with colored left border accent
- Expandable details for each flag category

### Analysis Breakdown Cards
- Grid layout: 2 columns on desktop, stack on mobile
- Four cards: Content Analysis, Company Verification, Posting Patterns, Communication
- Each showing sub-score and top flags
- Icon representing each category

### Recommendation Panel
- Prominent alert-style component at top of results
- Large emoji/icon indicator
- Bold action-oriented text
- Secondary text explaining reasoning

### Navigation
- Simple top bar with logo/title
- "New Analysis" button always accessible
- No complex menu needed

---

## Visual Patterns

**Cards:**
- background: white with subtle border
- border-radius: rounded-xl (12px)
- shadow: shadow-md default, shadow-lg on hover
- padding: p-6 to p-8

**Risk Level Colors:**
- High Risk: Red accents (borders, backgrounds at 10% opacity)
- Medium Risk: Yellow/amber accents
- Low-Medium Risk: Orange accents
- Low Risk: Green accents

**Buttons:**
- Primary: Solid background, h-12, px-8, rounded-lg
- Secondary: Outline style with border-2
- Ghost: Text-only with hover background

**Form Elements:**
- Input fields: h-12, rounded-lg, border-2, px-4
- Focus state: Ring-2 with offset
- Textareas: min-h-32 for descriptions
- Select dropdowns: Matching input styling

**Icons:**
- Use Heroicons via CDN
- Size: w-5 h-5 for inline icons, w-8 h-8 for section headers
- Consistent stroke-width: 2

---

## Page Layout Details

**Hero Section (Input Area):**
- Centered content with max-w-3xl
- Headline explaining the tool's purpose
- Subtext about detection capabilities
- Form card with subtle elevation
- Background: Clean, minimal (no image needed - focus on utility)

**Results Layout:**
- Risk Score Dashboard: Full-width prominent card at top
- Recommendation Panel: Below score, full-width
- Analysis Grid: 2x2 grid of category cards
- Red Flags Accordion: Full-width expandable sections
- Detailed Breakdown: Expandable technical details at bottom

**Mobile Adaptations:**
- Stack all cards to single column
- Maintain generous padding (px-4)
- Risk score remains prominent but adjusts to mobile viewport
- Collapsible sections for red flags to manage vertical space

---

## Interactive States

**Form Validation:**
- Real-time validation with inline error messages
- Success state with checkmark icon
- Loading state during analysis with spinner

**Results Animation:**
- Fade-in animation for results section
- Staggered appearance of cards (delay-100, delay-200, etc.)
- Score counter animation from 0 to final value

**Hover States:**
- Cards: Subtle lift with shadow-lg transition
- Buttons: Slight darkening and scale (transform: scale(1.02))
- Links: Underline decoration

---

## Accessibility

- Form labels always visible (not placeholder-only)
- Color-coding supplemented with text and icons
- Focus indicators on all interactive elements (ring-2)
- Semantic HTML with proper heading hierarchy
- ARIA labels for icon-only buttons
- Keyboard navigation fully supported
- High contrast ratio maintained throughout

---

## Content Strategy

**Messaging:**
- Confident, authoritative tone
- Clear explanations without jargon
- Action-oriented recommendations
- Transparency about detection methods

**Empty States:**
- Welcoming message before first analysis
- Clear instructions on how to get started
- Example job posting data for demo

**Error Handling:**
- Friendly error messages
- Suggestions for resolution
- Fallback for failed analyses