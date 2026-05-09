export type CodeFix = {
  id: string;
  title: string;
  problem: string;
  fix: string;
  snippet: string;
  language: string;
  gradient: "mint" | "peach" | "lavender" | "lemon" | "sky" | "blush" | "sage";
};

export const codeFixes: CodeFix[] = [
  {
    id: "contrast-tokens",
    title: "Update contrast tokens",
    problem:
      "Muted text and disabled buttons sit below the WCAG 4.5:1 contrast ratio.",
    fix: "Replace muted color tokens with values that pass on every surface.",
    language: "css",
    gradient: "peach",
    snippet: `:root {
  --text-muted: oklch(0.40 0.012 120);
  --text-disabled: oklch(0.45 0.01 120);
}
.btn:disabled {
  opacity: 1;
  color: var(--text-disabled);
}`,
  },
  {
    id: "skip-link",
    title: "Add a skip link",
    problem: "Keyboard users must tab through the entire nav before reaching content.",
    fix: "Add a visually hidden skip link that becomes visible on focus.",
    language: "tsx",
    gradient: "sky",
    snippet: `<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
>
  Skip to content
</a>
<main id="main">{children}</main>`,
  },
  {
    id: "focus-visible",
    title: "Add focus-visible styles",
    problem: "Custom controls have no visible focus indicator when tabbed.",
    fix: "Apply a global :focus-visible ring with sufficient contrast.",
    language: "css",
    gradient: "mint",
    snippet: `*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
  border-radius: 8px;
}`,
  },
  {
    id: "icon-button-labels",
    title: "Add aria-labels to icon buttons",
    problem: "Icon-only buttons announce as \"button\" with no purpose.",
    fix: "Give every icon button a descriptive aria-label and hide the icon.",
    language: "tsx",
    gradient: "lemon",
    snippet: `<button aria-label="Close dialog" onClick={onClose}>
  <X aria-hidden="true" className="size-4" />
</button>`,
  },
  {
    id: "input-labels",
    title: "Add input labels",
    problem: "Inputs rely on placeholder text instead of real labels.",
    fix: "Pair every input with a <label htmlFor> and link helper text via aria-describedby.",
    language: "tsx",
    gradient: "lavender",
    snippet: `<label htmlFor="email">Work email</label>
<input
  id="email"
  type="email"
  required
  aria-describedby="email-hint"
/>
<p id="email-hint">We'll never share your email.</p>`,
  },
  {
    id: "modal-focus-trap",
    title: "Trap modal focus",
    problem: "Tab key escapes open dialogs into the page behind them.",
    fix: "Use Radix Dialog (or similar) which traps focus and restores it on close.",
    language: "tsx",
    gradient: "blush",
    snippet: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-labelledby="title">
    <DialogTitle id="title">Confirm action</DialogTitle>
    <p>Are you sure you want to continue?</p>
  </DialogContent>
</Dialog>`,
  },
];
