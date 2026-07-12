# ScreenSage — UI/UX Audit Assistant

ScreenSage is a professional, developer-focused tool designed to perform instant visual hierarchy, alignment, typography, and contrast audits of user interfaces from static screenshots.

## Project Problem & MVP Goal
When designing or building web and mobile interfaces, it is common to have elements that "feel off"—whether due to poor visual hierarchy, uneven spacing, low text contrast, or small interactive tap targets. Inspecting these manually is time-consuming and often subjective.

**ScreenSage** provides an automated, AI-assisted first-pass review of static interface screenshots. It delivers immediate, prioritized, and structured feedback so developers and designers can quickly detect visual design issues.

---

## Key Features
- **Drag-and-Drop Workspace:** A clean workspace supporting file selection, image previews, and responsive file replacements.
- **Optional Context Details:** Users can provide up to 300 characters of high-level context (e.g., target user base or specific issues they want reviewed) to improve audit specificity.
- **Severity-Prioritized Findings:** Reports are structured with a summary banner and categorized findings (High, Medium, and Low severity) with actionable recommendations.
- **Category Filter Tabs:** Interactive filters to view findings by specific dimensions (Hierarchy, Spacing, Typography, Contrast, Usability, Accessibility).
- **Clipboard Export:** One-click copy of the entire structured audit report as a clean Markdown document.
- **Epistemic-Safety Refinement:** Built-in safeguards to strip unsupported visual precision (like raw hex codes or WCAG compliance statements) from static screenshot analysis.

---

## Supported Formats
- **Accepted MIME Types:** PNG, JPEG, and WebP.
- **Maximum File Size:** 4 MB.

---

## Technology Stack
- **Framework:** Next.js (App Router)
- **Frontend library:** React
- **Styling:** Tailwind CSS (v4)
- **Image Processing:** Sharp (decompression-bomb guards, rotation, downsizing <= 1536px)
- **AI SDK:** Official `@google/genai` (Interactions API)
- **Validation:** Zod
- **Testing:** Vitest

---

## High-Level Architecture & Request Flow

```
[Browser Client]
       │
       │  1. Upload Screenshot & Context
       ▼
[Next.js API Route: POST /api/audit]
       │
       │  2. Validate File Size & MIME (Zod)
       │  3. Normalize Image (Sharp: resize, rotate, 1st frame extraction)
       ▼
[Gemini API Integration]
       │
       │  4. Initial Audit Call (gemini-3.5-flash)
       │  5. Scan for Unsupported Precision (Hex, px, WCAG claims)
       │
       ├──► [No Precision Found] ──┐
       │                           ▼
       └──► [Precision Found] ─────┼─► 6. Text-Only Repair Call
                                   │   (Or Sanitizing Fallback if it fails)
                                   ▼
                            [JSON Validation] (Zod)
                                   │
                                   ▼
[Browser Client: Report Render] ◄──┘
```

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18.x or above)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd screensage
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the local environment file:
   - Create a `.env.local` file in the project root.
   - Add your Gemini API key:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
   *(Note: `.env.local` is listed in `.gitignore` and will not be tracked or committed to Git).*

4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing Commands
Run the automated Vitest test suite (includes schema validation, Sharp pipelines, precision detection, and API route mocks):
```bash
npm run test
```

For linting and TypeScript checks:
```bash
npx tsc --noEmit
npm run lint
```

---

## Security & Privacy Behavior
- **Local Normalization:** Image files are processed locally on the server (Sharp) before being sent to the AI model.
- **Provider Protection:** The `GEMINI_API_KEY` is loaded securely on the server-side, never exposed to client browsers, and blocked from console logs.
- **No Persistence:** Temporary upload files and preview blob URLs are created in the browser memory and programmatically revoked upon file replacement, start-over resets, or page unmounts.

---

## Epistemic-Safety Behavior
Analyzing a static, non-interactive screenshot has inherent limitations. To prevent returning misleading or speculative information, ScreenSage implements the following:
- **Hedged Wording:** Instructs the model to use relative observations (e.g. *"appears to have low contrast"*, *"may be difficult to read"*) rather than absolute claims.
- **Automatic Detector:** A server-side checker scans findings for precise hex codes, RGB/HSL colors, contrast ratios (e.g. `4.5:1`), pixel values (e.g. `16px`), touch dimensions (e.g. `44x44`), or WCAG compliance statements.
- **Refinement Fallback:** If any unsafe precision is detected, a single text-only repair call is sent to rewrite the finding with safe relative phrasing. If the repair call fails, a deterministic regex sanitizer replaces exact values with generic placeholders.

---

## Known MVP Limitations
- **Static Screenshots Only:** Interactive elements, animations, hidden menus, screen readers, hover states, and dynamic resizing behavior cannot be audited.
- **No Real Measurements:** Spacing, font sizes, and contrast percentages are estimates and must be verified using dedicated inspect tools or contrast checkers.
- **Single Page Scope:** The audit processes one screenshot at a time. It does not track state changes, multi-step flows, or site-wide visual consistency.

---

## Vercel Deployment Overview
This Next.js application is ready for Vercel deployment:
1. Push your changes to your remote Git repository (GitHub, GitLab, or Bitbucket).
2. Connect your repository to Vercel.
3. Configure the environment variable in Vercel's Project Settings:
   - Key: `GEMINI_API_KEY`
   - Value: `<your_gemini_api_key>`
4. Deploy. Vercel will automatically run the production build (`npm run build`).

---

## Future Improvements
- **Interactive Element Inspector:** Allow users to highlight specific areas or components on the screenshot for focused inspection.
- **Multipage flows:** Auditing multi-step checkout pages, forms, or navigation menus in sequence.
- **Figma Integration:** Pulling layouts directly from Figma frames to inspect visual properties against design tokens.
