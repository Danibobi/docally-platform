# DocAlly VS Code Extension Spec

## Concept

DocAlly for VS Code is the accessibility equivalent of ESLint. It scans HTML, JSX, TSX, CSS, and MDX while developers write code, underlines accessibility violations inline, and offers fixes from the DocAlly API.

## Core Loop

1. Developer installs extension and adds a DocAlly API key.
2. Extension scans open files and changed ranges.
3. Violations appear as VS Code diagnostics.
4. Hover shows plain-English explanation, WCAG reference, and suggested replacement.
5. Code actions offer `Apply fix`, `Ignore`, and `Learn more`.

## Example Diagnostic

```tsx
<p className="hero-text">
  Leverage our cutting-edge platform...
  // DocAlly: Language complexity (WCAG 3.1.5)
  // Suggestion: "Our platform makes websites accessible."
</p>
```

## MVP Features

- Diagnostics for language complexity, low contrast, missing alt text, missing labels, missing ARIA labels, and missing reduced-motion handling.
- Code actions backed by `/v1/fix`.
- Workspace setting for API key.
- Per-rule ignores through comments.
- Status bar showing current file score.

## Distribution Value

The extension gives DocAlly a developer distribution loop: every installed editor becomes a constant scan surface, and every warning points back to the API product.
