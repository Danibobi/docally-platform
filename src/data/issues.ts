export type Severity = "Critical" | "High" | "Medium" | "Low";

export type Issue = {
  slug: string;
  title: string;
  description: string;
  severity: Severity;
  wcag: string;
  impact: string;
  icon: string;
  layoutClass?: "card-large" | "card-tall" | "card-wide";
  gradient: "mint" | "peach" | "lavender" | "lemon" | "sky" | "blush" | "sage";
  group: "contrast" | "keyboard" | "screen-reader" | "forms" | "semantic";
  questions: string[];
  implementations: string[];
  codeSnippet: string;
};

export const attentionIssues: Issue[] = [
  {
    slug: "text-contrast",
    title: "Text contrast is too low",
    description:
      "Body and muted text fall under the WCAG 4.5:1 ratio against the page background.",
    severity: "Critical",
    wcag: "WCAG 1.4.3",
    impact: "High impact",
    icon: "Aa",
    layoutClass: "card-large",
    gradient: "peach",
    group: "contrast",
    questions: [
      "Which text elements fail contrast requirements?",
      "What foreground and background colors are used?",
      "Does the fix work in hover, disabled, and focused states?",
    ],
    implementations: [
      "Update muted-text tokens to meet 4.5:1.",
      "Audit disabled and placeholder states for the same ratio.",
      "Re-test against light and dark surfaces.",
    ],
    codeSnippet: `:root {
  --text-muted: oklch(0.40 0.012 120); /* >= 4.5:1 on #F7F8F5 */
}
.btn:disabled { opacity: 1; color: var(--text-muted); }`,
  },
  {
    slug: "low-contrast-buttons",
    title: "Buttons fail contrast in hover state",
    description:
      "Primary and secondary buttons drop below required contrast on hover and disabled states.",
    severity: "High",
    wcag: "WCAG 1.4.3",
    impact: "High impact",
    icon: "◐",
    layoutClass: "card-wide",
    gradient: "lemon",
    group: "contrast",
    questions: [
      "Which buttons fail contrast checks?",
      "Do hover, active, disabled, and focus states pass?",
    ],
    implementations: [
      "Lock button text to a single accessible color across states.",
      "Avoid lowering opacity to indicate hover.",
      "Create reusable accessible button tokens.",
    ],
    codeSnippet: `.btn-primary { background:#DFFF3F; color:#0D0D0D; }
.btn-primary:hover { background:#CFF02E; color:#0D0D0D; } /* >= 7:1 */
.btn-primary:disabled { background:#EEFFD4; color:#2A2F25; }`,
  },
  {
    slug: "missing-alt-text",
    title: "Images are missing alt text",
    description:
      "Informative images render without alternative text, leaving screen reader users without context.",
    severity: "Critical",
    wcag: "WCAG 1.1.1",
    impact: "High impact",
    icon: "▧",
    layoutClass: "card-tall",
    gradient: "blush",
    group: "screen-reader",
    questions: [
      "Which images are informative vs. decorative?",
      "What alt text accurately describes each image?",
    ],
    implementations: [
      "Add descriptive alt text for informative images.",
      "Use empty alt for purely decorative images.",
      "Avoid duplicating nearby visible text in alt attributes.",
    ],
    codeSnippet: `<img src="/team.jpg" alt="Three teammates reviewing a design at a whiteboard" />
<img src="/decoration.svg" alt="" aria-hidden="true" />`,
  },
  {
    slug: "skip-link",
    title: "Navigation has no skip link",
    description:
      "Keyboard users must tab through every nav item before reaching main content.",
    severity: "Medium",
    wcag: "WCAG 2.4.1",
    impact: "Medium impact",
    icon: "⤓",
    gradient: "sky",
    group: "keyboard",
    questions: [
      "Where does the tab order start on each page?",
      "Are landmarks present so users can jump quickly?",
    ],
    implementations: [
      "Add a visible skip-to-content link as the first focusable element.",
      "Wrap main content in a <main id=\"main\"> landmark.",
      "Use semantic nav, header, and footer landmarks.",
    ],
    codeSnippet: `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
<nav aria-label="Primary">…</nav>
<main id="main">…</main>`,
  },
  {
    slug: "missing-focus-states",
    title: "Focus states are missing",
    description: "Interactive elements do not show a visible focus indicator when tabbed.",
    severity: "High",
    wcag: "WCAG 2.4.7",
    impact: "High impact",
    icon: "□",
    layoutClass: "card-wide",
    gradient: "mint",
    group: "keyboard",
    questions: [
      "Which interactive elements lack focus states?",
      "Is the focus ring visible on every background?",
    ],
    implementations: [
      "Add :focus-visible styles to every interactive element.",
      "Ensure the focus ring has 3:1 contrast against the background.",
      "Never strip the outline without a visible replacement.",
    ],
    codeSnippet: `*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: 8px;
}`,
  },
  {
    slug: "form-labels",
    title: "Form inputs need accessible labels",
    description:
      "Several inputs rely on placeholder text instead of programmatically associated labels.",
    severity: "High",
    wcag: "WCAG 3.3.2",
    impact: "High impact",
    icon: "⌧",
    gradient: "lavender",
    group: "forms",
    questions: [
      "Which inputs are missing a <label for>?",
      "Are required fields announced to assistive tech?",
    ],
    implementations: [
      "Add a visible <label> linked via for/id for every input.",
      "Use aria-describedby for helper or error text.",
      "Mark required fields with aria-required and a visible cue.",
    ],
    codeSnippet: `<label for="email">Work email</label>
<input id="email" name="email" type="email" required aria-describedby="email-hint" />
<p id="email-hint">We'll never share your email.</p>`,
  },
  {
    slug: "heading-order",
    title: "Heading order is confusing",
    description:
      "Pages skip from h1 to h4 and reuse h2 for unrelated sections, hurting screen reader navigation.",
    severity: "Medium",
    wcag: "WCAG 1.3.1",
    impact: "Medium impact",
    icon: "☰",
    gradient: "sage",
    group: "semantic",
    questions: [
      "Does each page have exactly one h1?",
      "Are nested headings stepwise (h2, h3, h4)?",
    ],
    implementations: [
      "Use one h1 per page that names the page topic.",
      "Nest subsequent headings without skipping levels.",
      "Reserve heading tags for actual section titles, not styling.",
    ],
    codeSnippet: `<h1>Pricing</h1>
  <h2>Plans</h2>
    <h3>Starter</h3>
    <h3>Team</h3>
  <h2>Frequently asked questions</h2>`,
  },
  {
    slug: "clickable-cards",
    title: "Clickable cards are not keyboard accessible",
    description:
      "Cards use onClick handlers on plain divs with no role or keyboard support.",
    severity: "High",
    wcag: "WCAG 2.1.1",
    impact: "High impact",
    icon: "⊞",
    gradient: "peach",
    group: "keyboard",
    questions: [
      "Are clickable elements actual <a> or <button> tags?",
      "Do they receive focus and respond to Enter / Space?",
    ],
    implementations: [
      "Replace clickable <div> with <a> or <button>.",
      "If a wrapping link isn't possible, use role=\"button\", tabIndex=0 and key handlers.",
      "Show a visible focus ring when the card is tabbed to.",
    ],
    codeSnippet: `<a href="/posts/123" class="card">
  <h3>Post title</h3>
  <p>Summary…</p>
</a>`,
  },
  {
    slug: "aria-labels",
    title: "ARIA labels are unclear",
    description:
      "Icon-only buttons and toggles use generic or missing aria-labels.",
    severity: "Medium",
    wcag: "WCAG 4.1.2",
    impact: "Medium impact",
    icon: "ⓘ",
    gradient: "lemon",
    group: "screen-reader",
    questions: [
      "Which icon-only controls lack a clear name?",
      "Do toggle buttons announce their pressed state?",
    ],
    implementations: [
      "Give every icon-only button a descriptive aria-label.",
      "Use aria-pressed on toggle buttons.",
      "Hide purely decorative icons with aria-hidden.",
    ],
    codeSnippet: `<button aria-label="Close dialog" aria-pressed="false">
  <X aria-hidden="true" />
</button>`,
  },
  {
    slug: "live-errors",
    title: "Error messages are not announced",
    description:
      "Inline form errors render visually but assistive tech never hears them.",
    severity: "High",
    wcag: "WCAG 4.1.3",
    impact: "High impact",
    icon: "!",
    gradient: "blush",
    group: "forms",
    questions: [
      "Where are inline errors rendered?",
      "Do error containers use aria-live or role=\"alert\"?",
    ],
    implementations: [
      "Wrap error text in role=\"alert\" so it's announced.",
      "Reference the error from the input via aria-describedby.",
      "Set aria-invalid=\"true\" on the failing input.",
    ],
    codeSnippet: `<input id="email" aria-invalid="true" aria-describedby="email-err" />
<p id="email-err" role="alert">Enter a valid email address.</p>`,
  },
  {
    slug: "modal-focus",
    title: "Modal focus is not trapped",
    description:
      "Tab key escapes open dialogs and the page scrolls behind the modal.",
    severity: "High",
    wcag: "WCAG 2.4.3",
    impact: "Medium impact",
    icon: "▣",
    gradient: "sky",
    group: "keyboard",
    questions: [
      "Which dialogs allow focus to leak to the page behind?",
      "Does focus return to the trigger when the modal closes?",
    ],
    implementations: [
      "Use a Dialog primitive with built-in focus trap.",
      "Restore focus to the triggering element on close.",
      "Set aria-modal=\"true\" and label the dialog.",
    ],
    codeSnippet: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-labelledby="title">
    <h2 id="title">Confirm action</h2>
  </DialogContent>
</Dialog>`,
  },
  {
    slug: "document-language",
    title: "Document language is missing",
    description:
      "The <html> element has no lang attribute, so screen readers guess pronunciation.",
    severity: "Low",
    wcag: "WCAG 3.1.1",
    impact: "Low impact",
    icon: "🌐",
    gradient: "mint",
    group: "semantic",
    questions: [
      "Is lang declared on <html>?",
      "Are sections in a different language marked with their own lang?",
    ],
    implementations: [
      "Add lang=\"en\" (or your locale) to <html>.",
      "Use lang on inline content in another language.",
    ],
    codeSnippet: `<html lang="en">
  <body>
    <p>Welcome <span lang="fr">bonjour</span></p>
  </body>
</html>`,
  },
];

export const scanSummary = {
  score: 43,
  label: "Needs attention",
  summary:
    "Your site has issues affecting contrast, keyboard access, semantic clarity, and screen reader support.",
  metrics: {
    critical: 2,
    high: 6,
    medium: 3,
    low: 1,
    fixes: 12,
  },
};

export const fixGroups = [
  {
    id: "contrast",
    title: "Contrast fixes",
    gradient: "peach" as const,
    summary: "Bring text and interactive surfaces above WCAG 4.5:1.",
  },
  {
    id: "keyboard",
    title: "Keyboard navigation fixes",
    gradient: "sky" as const,
    summary: "Skip links, focus states, and keyboard-operable controls.",
  },
  {
    id: "screen-reader",
    title: "Screen reader fixes",
    gradient: "lavender" as const,
    summary: "Alt text, ARIA labels, and announcement of dynamic content.",
  },
  {
    id: "forms",
    title: "Form and error fixes",
    gradient: "blush" as const,
    summary: "Programmatic labels, helper text, and live error announcements.",
  },
  {
    id: "semantic",
    title: "Semantic structure fixes",
    gradient: "sage" as const,
    summary: "Heading order, landmarks, and document language.",
  },
];
