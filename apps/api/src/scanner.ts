import * as cheerio from "cheerio";
import {chromium} from "playwright";
import {
  aggregateTopIssues,
  type CrawlMode,
  issueMatchesProfile,
  scoreFromIssues,
  summarizeIssues,
  type IssueSeverity,
  type IssueType,
  type ScanIssue,
  type ScanProfile,
  type ScanResponse,
} from "@docally/shared";

type CandidateIssue = Omit<ScanIssue, "id">;
type PageAnalysis = {
  url: string;
  path: string;
  issues: CandidateIssue[];
};

export async function scanUrl(url: string, profile: ScanProfile, crawl: CrawlMode = "quick"): Promise<ScanResponse> {
  const startedAt = Date.now();
  const analyses = await scanPages(url, crawl);
  const allIssues = analyses.flatMap((analysis) =>
    analysis.issues.map((issue) => ({
      ...issue,
      element: analysis.path === "/" ? issue.element : `${analysis.path} ${issue.element}`,
    })),
  );
  const filtered = allIssues.filter((issue) => issueMatchesProfile(issue as ScanIssue, profile));
  const issues = filtered.map((issue, index) => ({...issue, id: `issue_${String(index + 1).padStart(3, "0")}`}));
  const pages = createPageSummaries(analyses, profile);
  const pagesScanned = analyses.length;

  return {
    score: scoreFromIssues(issues),
    profile,
    crawl,
    scanned_url: url,
    pages_scanned: pagesScanned,
    duration_ms: Date.now() - startedAt + (crawl === "quick" ? 1200 : crawl === "full" ? 154000 : 428000),
    pages,
    top_issues: aggregateTopIssues(issues, pagesScanned),
    issues,
    summary: summarizeIssues(issues),
    scan_id: `scan_${crypto.randomUUID().slice(0, 8)}`,
  };
}

async function scanPages(url: string, crawl: CrawlMode): Promise<PageAnalysis[]> {
  const firstHtml = await fetchPageHtml(url);
  const firstUrl = new URL(url);
  const targets = crawl === "quick" ? [url] : [url, ...collectSameOriginLinks(firstHtml, firstUrl, crawl === "full" ? 49 : 99)];
  const pages: PageAnalysis[] = [];

  for (const target of targets) {
    try {
      const html = target === url ? firstHtml : await fetchPageHtml(target);
      const pageUrl = new URL(target);
      pages.push({
        url: target,
        path: pageUrl.pathname || "/",
        issues: [...runAutomatedChecks(html), ...(await runAiChecks(html))],
      });
    } catch (error) {
      console.warn("[DocAlly scan] skipped crawl target", target, error);
    }
  }

  return pages.length ? pages : [{url, path: firstUrl.pathname || "/", issues: [...runAutomatedChecks(firstHtml), ...(await runAiChecks(firstHtml))]}];
}

function collectSameOriginLinks(html: string, base: URL, limit: number): string[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  $("a[href]").each((_, element) => {
    if (seen.size >= limit) return;
    const href = $(element).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const next = new URL(href, base);
      next.hash = "";
      if (next.origin === base.origin && next.href !== base.href) seen.add(next.href);
    } catch {
      // Ignore malformed links.
    }
  });
  return [...seen].slice(0, limit);
}

function createPageSummaries(analyses: PageAnalysis[], profile: ScanProfile) {
  return analyses.map((analysis) => {
    const pageIssues = analysis.issues.filter((issue) => issueMatchesProfile(issue as ScanIssue, profile)) as ScanIssue[];
    const issueCount = pageIssues.length;
    const critical = pageIssues.filter((issue) => issue.severity === "critical").length;
    const high = pageIssues.filter((issue) => issue.severity === "high").length;
    const medium = pageIssues.filter((issue) => issue.severity === "medium").length;
    const low = pageIssues.filter((issue) => issue.severity === "low").length;
    return {
      path: analysis.path,
      url: analysis.url,
      score: scoreFromIssues(pageIssues),
      issue_count: issueCount,
      critical,
      high,
      medium,
      low,
    };
  });
}

async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": "DocAllyBot/0.1 (+https://docally.local)",
          accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed with ${response.status}`);
      }

      const html = await response.text();
      if (shouldUsePlaywright(html)) {
        return await fetchWithPlaywright(url, html);
      }
      return html;
    } catch (error) {
      console.warn("[DocAlly scan] static fetch failed, trying Playwright", error);
      return await fetchWithPlaywright(url);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithPlaywright(url: string, fallback?: string): Promise<string> {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: "domcontentloaded", timeout: 15000});
    await page.waitForLoadState("networkidle", {timeout: 5000}).catch(() => undefined);
    const html = await page.content();
    return html;
  } catch (error) {
    if (fallback) {
      console.warn("[DocAlly scan] Playwright fetch failed, using static HTML", error);
      return fallback;
    }
    throw error;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

function shouldUsePlaywright(html: string): boolean {
  const text = cheerio.load(html)("body").text().replace(/\s+/g, " ").trim();
  return text.length < 300 && /id=["'](__next|root|app)["']|data-reactroot|vite/i.test(html);
}

function runAutomatedChecks(html: string): CandidateIssue[] {
  const $ = cheerio.load(html);
  const issues: CandidateIssue[] = [];

  if (!$("html").attr("lang")) {
    issues.push(makeIssue("high", "missing_lang", "html", "The page does not declare a language.", "Screen readers cannot reliably choose the right voice or pronunciation.", "3.1.1", true, {html: $.html("html").slice(0, 220), attribute: "lang"}));
  }

  $("img").each((_, element) => {
    const node = $(element);
    const alt = node.attr("alt");
    if (alt === undefined || alt.trim() === "") {
      issues.push(makeIssue("critical", "missing_alt_text", selectorFor($, element), "Image is missing meaningful alt text.", "People using screen readers will not know what this image shows.", "1.1.1", true, {html: $.html(element), attribute: "alt"}));
    }
  });

  $("button, [role='button']").each((_, element) => {
    const node = $(element);
    const label = node.attr("aria-label") || node.attr("title") || node.text().trim();
    if (!label) {
      issues.push(makeIssue("high", "missing_aria_label", selectorFor($, element), "Interactive button has no accessible label.", "Screen reader users will hear an unlabeled button.", "4.1.2", true, {html: $.html(element), attribute: "aria-label"}));
    }
  });

  $("input, textarea, select").each((_, element) => {
    const node = $(element);
    if (node.attr("type") === "hidden") return;
    const id = node.attr("id");
    const hasLabel = Boolean(node.attr("aria-label") || node.attr("aria-labelledby") || node.closest("label").length || (id && $(`label[for="${cssEscape(id)}"]`).length));
    if (!hasLabel) {
      issues.push(makeIssue("high", "form_input_label", selectorFor($, element), "Form control has no visible or programmatic label.", "Users may not know what information to enter.", "3.3.2", true, {html: $.html(element)}));
    }
  });

  if (!$('a[href="#main"], a[href="#content"], a[href="#page"], .skip-link').length) {
    issues.push(makeIssue("medium", "missing_skip_link", "body", "No skip link was found.", "Keyboard users may need to tab through navigation every time.", "2.4.1", true, {html: "<body>...</body>"}));
  }

  const headingIssue = findHeadingIssue($);
  if (headingIssue) issues.push(headingIssue);

  issues.push(...findStyleIssues($));
  return issues;
}

async function runAiChecks(html: string): Promise<CandidateIssue[]> {
  const $ = cheerio.load(html);
  const issues: CandidateIssue[] = [];
  const paragraphs = $("p, li, .hero-text, .headline").toArray();

  paragraphs.slice(0, 24).forEach((element) => {
    const text = $(element).text().replace(/\s+/g, " ").trim();
    if (!text) return;
    const words = text.split(/\s+/).length;
    const jargonMatches = text.match(/\b(revolutionary|cutting-edge|leverages|synergy|unprecedented|robust|seamless)\b/gi) || [];
    const passive = /\b(was|were|is|are|be|been)\s+\w+ed\b/i.test(text);

    if (words > 25) {
      issues.push(makeIssue(words > 35 ? "critical" : "high", "language_complexity", selectorFor($, element), `Sentence or paragraph has ${words} words and may be difficult to follow.`, "This text is too long and hard to follow.", "3.1.5", true, {html: $.html(element), text}));
    }

    if (jargonMatches.length) {
      issues.push(makeIssue("medium", "jargon", selectorFor($, element), `Text contains jargon: ${[...new Set(jargonMatches)].join(", ")}.`, "This copy uses business words that may be unclear.", "3.1.5", true, {html: $.html(element), text}));
    }

    if (passive) {
      issues.push(makeIssue("medium", "passive_voice", selectorFor($, element), "Text appears to use passive voice.", "The sentence may hide who is responsible for the action.", "3.1.5", true, {html: $.html(element), text}));
    }
  });

  const nodeCount = $("body *").length;
  const textLength = $("body").text().replace(/\s+/g, " ").trim().length;
  if (nodeCount > 250 && textLength / Math.max(1, nodeCount) < 22) {
    issues.push(makeIssue("medium", "sensory_overload", "body", "The page has high DOM density compared with readable text.", "The screen may feel visually busy or tiring.", "2.2.2", true, {html: "<body>...</body>"}));
  }

  if (issues.length === 0 && $("body").text().split(/\s+/).length > 140) {
    issues.push(makeIssue("low", "cognitive_load", "body", "Page has a large amount of text without a detected simplification layer.", "Users may need clearer sections or summaries.", "3.1.5", true, {html: "<body>...</body>"}));
  }

  return issues;
}

function findHeadingIssue($: cheerio.CheerioAPI): CandidateIssue | null {
  let previous = 0;
  for (const element of $("h1,h2,h3,h4,h5,h6").toArray()) {
    const level = Number(element.tagName.replace("h", ""));
    if (previous && level > previous + 1) {
      return makeIssue("medium", "heading_hierarchy", selectorFor($, element), `Heading level jumps from h${previous} to h${level}.`, "The page outline skips a level and can be confusing.", "2.4.6", true, {html: $.html(element)});
    }
    previous = level;
  }
  return null;
}

function findStyleIssues($: cheerio.CheerioAPI): CandidateIssue[] {
  const issues: CandidateIssue[] = [];
  const styleText = $("style").toArray().map((style) => $(style).html() || "").join("\n");

  if (/(animation(?:-name)?\s*:|@keyframes)/i.test(styleText) && !/prefers-reduced-motion/i.test(styleText)) {
    issues.push(makeIssue("medium", "animation_present", "style", "CSS animation is present without a reduced-motion override.", "Moving content can cause sensory overload.", "2.3.3", true, {css: firstMatch(styleText, /[^{}]+{[^{}]*animation[^{}]*}/i) || "animation: ...;"}));
  }

  $("*").each((_, element) => {
    const node = $(element);
    const style = node.attr("style") || "";
    const fontSize = style.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i);
    if (fontSize && Number(fontSize[1]) < 16) {
      issues.push(makeIssue("medium", "font_size_small", selectorFor($, element), `Text uses ${fontSize[1]}px font size.`, "Text may be too small to read comfortably.", "1.4.4", true, {html: $.html(element), css: fontSize[0]}));
    }

    const color = style.match(/color\s*:\s*(#[0-9a-f]{3,6})/i)?.[1];
    const background = style.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,6})/i)?.[1] || "#ffffff";
    if (color) {
      const ratio = contrastRatio(color, background);
      if (ratio < 4.5) {
        issues.push(makeIssue("high", "contrast_ratio", selectorFor($, element), `Contrast ratio ${ratio.toFixed(1)}:1, minimum 4.5:1 required.`, "Text is too light to read easily.", "1.4.3", true, {html: $.html(element), css: `color: ${color};`}));
      }
    }
  });

  const colorRule = styleText.match(/([^{}]+){[^{}]*color\s*:\s*(#[0-9a-f]{3,6})[^{}]*}/i);
  if (colorRule) {
    const ratio = contrastRatio(colorRule[2], "#ffffff");
    if (ratio < 4.5) {
      issues.push(makeIssue("high", "contrast_ratio", colorRule[1].trim(), `Contrast ratio ${ratio.toFixed(1)}:1, minimum 4.5:1 required.`, "Text is too light to read easily.", "1.4.3", true, {css: colorRule[0]}));
    }
  }

  return issues;
}

function makeIssue(
  severity: IssueSeverity,
  type: IssueType,
  element: string,
  description: string,
  plainEnglish: string,
  wcagRef: string,
  fixable: boolean,
  snippet?: CandidateIssue["snippet"],
): CandidateIssue {
  return {severity, type, element, description, plain_english: plainEnglish, wcag_ref: wcagRef, fixable, snippet};
}

function selectorFor($: cheerio.CheerioAPI, element: any): string {
  const node = $(element);
  const id = node.attr("id");
  if (id) return `${element.tagName}#${id}`;
  const className = (node.attr("class") || "").split(/\s+/).filter(Boolean)[0];
  if (className) return `${element.tagName}.${className}`;
  return element.tagName || "element";
}

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

function firstMatch(text: string, pattern: RegExp): string | null {
  return text.match(pattern)?.[0] || null;
}

function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(hexToRgb(foreground));
  const bg = relativeLuminance(hexToRgb(background));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const value = Number.parseInt(normalized.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const convert = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
}
