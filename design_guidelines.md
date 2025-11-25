# Design Guidelines: Women's Health Tracking Platform

## Design Approach & Philosophy

**Selected Approach:** Healthcare-focused Material Design principles
**Justification:** Healthcare applications require trust, clarity, and accessibility. Material Design provides robust patterns for data-dense interfaces while maintaining visual hierarchy and user confidence.

**Core Principles:**
- **Trust through Clarity:** Medical data presentation must be unambiguous and professional
- **Supportive Experience:** Calming, encouraging interface that reduces health anxiety
- **Scannable Information:** Quick access to critical health metrics and tasks
- **Progressive Disclosure:** Show essential info first, details on demand

## Typography

**Font Families:**
- Primary: Inter (headings and UI) - clean, medical-grade legibility
- Secondary: System UI fonts for body text (optimal readability for long-form content)

**Hierarchy:**
- Page Titles: text-3xl to text-4xl, font-semibold
- Section Headers: text-2xl, font-semibold  
- Card Titles/Metrics: text-xl, font-medium
- Labels: text-sm, font-medium, uppercase tracking-wide
- Body Text: text-base leading-relaxed
- Helper Text: text-sm
- Critical Metrics (Risk Score): text-5xl to text-6xl, font-bold

## Layout System

**Spacing Units:** Use Tailwind units of 3, 4, 6, 8, 12, 16
- Consistent padding: p-6 for cards, p-8 for sections
- Generous vertical rhythm: space-y-6 to space-y-8 between sections
- Grid gaps: gap-6 for card grids

**Container Strategy:**
- Dashboard: max-w-7xl with full-width data visualization sections
- Forms/Assessments: max-w-3xl centered for optimal completion
- Report Upload: max-w-4xl for generous dropzone area

## Component Library

### Navigation
- Sticky top navigation with clear section indicators
- Active state shows current health tracking section
- Quick access to: Dashboard, Upload Report, Assessment, History, Profile

### Medical Report Upload
- Large dropzone area (min-h-96) with drag-and-drop visual feedback
- Supported formats clearly listed (PDF, JPG, PNG)
- Upload progress indicator with file name display
- Success state showing thumbnail preview of uploaded report

### Dashboard Cards
- **Risk Score Card:** Prominent display with circular progress indicator, score (0-100), risk level label, and brief interpretation
- **Daily Tasks Card:** Checklist format with completion toggles, icons for task types (water drop, dumbbell, pill, protein)
- **Key Metrics Grid:** 3-column grid (lg:grid-cols-3) showing extracted medical parameters with labels, values, and reference ranges
- **Insights Card:** AI-generated explanations in supportive, conversational tone with expandable details

### Assessment Interface
- Single-question per screen for focus (mobile-first)
- Progress bar showing completion (e.g., "Question 3 of 12")
- Large touch-friendly option buttons
- Previous/Next navigation clearly visible

### Condition Tracking
- Line charts showing parameter trends over time
- Date range selector (1 month, 3 months, 6 months, 1 year)
- Data points clickable to view specific report details
- Color-coded zones for normal/warning/critical ranges

### Forms & Inputs
- Floating labels on text inputs
- Clear validation states with helpful error messages
- Large clickable areas for checkboxes and radio buttons
- Primary action buttons: full-width on mobile, auto-width on desktop

### Data Tables (Report History)
- Responsive table collapsing to cards on mobile
- Sortable columns for date, report type, risk score
- Row actions: View details, Download, Delete
- Empty state with encouraging message to upload first report

## Images

**Hero Section (Landing/Welcome):**
- Use supportive healthcare imagery: diverse women engaging in wellness activities (yoga, healthy eating, medical consultation)
- Image treatment: Soft overlay to ensure text readability
- Position: Full-width hero section with content overlay (h-96 to h-[32rem])

**Dashboard Illustrations:**
- Small supportive icons throughout (medical symbols, wellness icons)
- Success states: Celebratory illustrations when completing tasks or achieving goals
- Empty states: Friendly illustrations encouraging first upload or assessment completion

**Trust Indicators:**
- No explicit images needed, but include badge-style indicators for "AI-Powered," "Medical-Grade," "Secure & Private"

## Accessibility Requirements

- WCAG AA contrast ratios minimum for all text
- Keyboard navigation fully supported throughout assessment flow
- Screen reader labels for all interactive elements and data visualizations
- Focus indicators clearly visible on all interactive elements
- Medical terminology accompanied by plain-language explanations
- Error messages specific and actionable (not generic)

## Animation Guidelines

**Minimal and Purposeful:**
- Smooth transitions on card appearances (fade-in, subtle slide-up)
- Progress indicators for file upload and data processing
- Subtle pulse on newly generated daily tasks
- NO decorative animations that distract from health data

**Loading States:**
- Skeleton screens for dashboard while fetching data
- Spinner with reassuring message during AI analysis ("Analyzing your report...")

This comprehensive design creates a trustworthy, supportive healthcare experience that balances professional medical presentation with user-friendly interactions.