import type {FixResponse, FixSuggestion, ScanIssue, ScanProfile} from "@docally/shared";
import type {StoredScan} from "./repository";

export async function generateFixes(scan: StoredScan, issueIds: string[], _profile: ScanProfile): Promise<FixResponse> {
  const selected = scan.issues.filter((issue) => issueIds.includes(issue.id));
  return {fixes: selected.filter((issue) => issue.fixable).map(fixForIssue)};
}

function fixForIssue(issue: ScanIssue): FixSuggestion {
  const original = issue.snippet?.html || issue.snippet?.css || issue.snippet?.text || issue.element;

  if (issue.type === "contrast_ratio") {
    return {
      id: issue.id,
      type: "css_replacement",
      original: issue.snippet?.css || "color: #aaaaaa;",
      fixed: "color: #595959;",
      explanation: "Raised text contrast to meet WCAG AA on a white background.",
    };
  }

  if (issue.type === "animation_present") {
    const css = issue.snippet?.css || ".animated { animation: slide 3s infinite; }";
    return {
      id: issue.id,
      type: "css_addition",
      original: css,
      fixed: `${css}\n\n@media (prefers-reduced-motion: reduce) {\n  ${issue.element} { animation: none !important; transition: none !important; }\n}`,
      explanation: "Added a reduced-motion override so users can disable movement.",
    };
  }

  if (issue.type === "missing_alt_text") {
    return {
      id: issue.id,
      type: "attribute_addition",
      original,
      fixed: addAttribute(original, "alt", "Describe the image for screen reader users"),
      explanation: "Added an alt attribute placeholder that developers should replace with accurate image meaning.",
    };
  }

  if (issue.type === "missing_aria_label") {
    return {
      id: issue.id,
      type: "attribute_addition",
      original,
      fixed: addAttribute(original, "aria-label", "Describe this action"),
      explanation: "Added an accessible name so assistive technologies can announce the control.",
    };
  }

  if (issue.type === "missing_lang") {
    return {
      id: issue.id,
      type: "attribute_addition",
      original: "<html>",
      fixed: '<html lang="en">',
      explanation: "Declared the page language so screen readers use the correct pronunciation rules.",
    };
  }

  if (issue.type === "missing_skip_link") {
    return {
      id: issue.id,
      type: "html_replacement",
      original: "<body>",
      fixed: '<body>\n  <a class="skip-link" href="#main">Skip to main content</a>',
      explanation: "Added a keyboard shortcut past repeated navigation.",
    };
  }

  if (issue.type === "font_size_small") {
    return {
      id: issue.id,
      type: "css_replacement",
      original: issue.snippet?.css || "font-size: 14px;",
      fixed: "font-size: 16px;",
      explanation: "Raised text to the minimum comfortable body size for the dashboard standard.",
    };
  }

  if (issue.type === "heading_hierarchy") {
    return {
      id: issue.id,
      type: "html_replacement",
      original,
      fixed: original.replace(/<h([3-6])\b/i, (_match, level) => `<h${Math.max(2, Number(level) - 1)}`),
      explanation: "Adjusted the heading level to avoid skipping outline levels.",
    };
  }

  if (issue.type === "form_input_label") {
    return {
      id: issue.id,
      type: "html_replacement",
      original,
      fixed: `<label>\n  Field label\n  ${original}\n</label>`,
      explanation: "Wrapped the form control in a visible label.",
    };
  }

  const rewritten = rewritePlainLanguage(issue.snippet?.text || original);
  return {
    id: issue.id,
    type: "html_replacement",
    original,
    fixed: original.startsWith("<") ? original.replace(stripTags(issue.snippet?.text || ""), rewritten) : rewritten,
    explanation: "Shortened the copy, removed jargon, and made the action easier to understand.",
  };
}

function addAttribute(html: string, name: string, value: string): string {
  if (!html.startsWith("<")) return `${html} ${name}="${value}"`;
  return html.replace(/^<([a-z0-9-]+)(\s|>)/i, `<$1 ${name}="${value}"$2`);
}

function rewritePlainLanguage(text: string): string {
  const cleaned = stripTags(text)
    .replace(/\brevolutionary\b/gi, "")
    .replace(/\bcutting-edge\b/gi, "")
    .replace(/\bleverages\b/gi, "uses")
    .replace(/\bunprecedented value\b/gi, "clear value")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.length > 16 ? `${words.slice(0, 16).join(" ")}.` : cleaned || "Use clear, direct language.";
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}
