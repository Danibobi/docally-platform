import * as cheerio from "cheerio";
import type {FixOption, Issue} from "./types";

type CssRule = {
  selector: string;
  body: string;
  raw: string;
  inReducedMotionMedia: boolean;
};

type KeyframesRule = {
  name: string;
  raw: string;
  inReducedMotionMedia: boolean;
};

let issueCounter = 0;

export function detectMotionBarriers(html: string, css: string): Issue[] {
  issueCounter = 0;
  return [
    ...detectCssAnimationIssues(css),
    ...detectVideoIssues(html),
    ...detectAudioIssues(html),
    ...detectTransitionIssues(css),
  ];
}

function detectCssAnimationIssues(css: string): Issue[] {
  const keyframes = extractKeyframes(css);
  const rules = extractCssRules(css).filter((rule) => !rule.inReducedMotionMedia);
  const safeAnimationNames = new Set(
    extractCssRules(css)
      .filter((rule) => rule.inReducedMotionMedia)
      .flatMap((rule) => animationNamesFromBody(rule.body)),
  );
  const keyframesByName = new Map(keyframes.map((rule) => [rule.name, rule]));
  const grouped = new Map<string, CssRule[]>();

  for (const rule of rules) {
    for (const name of animationNamesFromBody(rule.body)) {
      if (!name || safeAnimationNames.has(name)) continue;
      if (!keyframesByName.has(name)) continue;
      grouped.set(name, [...(grouped.get(name) || []), rule]);
    }
  }

  return [...grouped.entries()].map(([animationName, affectedRules]) => {
    const rawCss = uniqueCss([...affectedRules.map((rule) => rule.raw), keyframesByName.get(animationName)?.raw || ""]).join("\n\n");
    const selectorList = affectedRules.map((rule) => rule.selector).join(", ");
    return {
      id: nextIssueId(),
      barrier: 1,
      severity: "critical",
      type: "motion_css_animation_without_preference",
      element: selectorList,
      description: `CSS animation "${animationName}" runs without a prefers-reduced-motion media wrapper.`,
      plain_english: "The page moves automatically even when users have not chosen to allow motion.",
      wcag_ref: "2.3.3",
      fix_type: "css_global",
      fix_before: rawCss,
      fix_after: wrapNoPreference(rawCss),
      users_affected: "Autistic users with motion sensitivity and users who experience vestibular discomfort",
      affectedCount: affectedRules.length,
      fixOptions: createMotionFixOptions(rawCss),
    } satisfies Issue;
  });
}

function detectTransitionIssues(css: string): Issue[] {
  const rules = extractCssRules(css).filter((rule) => !rule.inReducedMotionMedia && hasTransition(rule.body));
  const grouped = new Map<string, CssRule[]>();

  for (const rule of rules) {
    const key = rule.selector;
    grouped.set(key, [...(grouped.get(key) || []), rule]);
  }

  return [...grouped.entries()].map(([selector, affectedRules]) => {
    const rawCss = uniqueCss(affectedRules.map((rule) => rule.raw)).join("\n\n");
    return {
      id: nextIssueId(),
      barrier: 1,
      severity: "medium",
      type: "motion_css_transition_without_preference",
      element: selector,
      description: "CSS transition runs without a prefers-reduced-motion media wrapper.",
      plain_english: "Animated changes can distract or disorient users who need still interfaces.",
      wcag_ref: "2.3.3",
      fix_type: "css_global",
      fix_before: rawCss,
      fix_after: wrapNoPreference(rawCss),
      users_affected: "Autistic users with motion sensitivity",
      affectedCount: affectedRules.length,
      fixOptions: createMotionFixOptions(rawCss),
    } satisfies Issue;
  });
}

function detectVideoIssues(html: string): Issue[] {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  $("video[autoplay]").each((_, element) => {
    const node = $(element);
    const hasMuted = node.attr("muted") !== undefined;
    const hasControls = node.attr("controls") !== undefined;
    if (hasMuted && hasControls) return;

    const original = $.html(element);
    issues.push({
      id: nextIssueId(),
      barrier: 1,
      severity: "high",
      type: "motion_autoplay_video_without_controls",
      element: selectorFor(element),
      description: "Video autoplays without both muted and controls attributes.",
      plain_english: "A video starts by itself without giving the user enough control.",
      wcag_ref: "2.2.2",
      fix_type: "html_attribute",
      fix_before: original,
      fix_after: ensureAttributes(original, ["autoplay", "muted", "controls", "playsinline"]),
      users_affected: "Autistic users who need control over sound and movement",
      affectedCount: 1,
    });
  });

  return issues;
}

function detectAudioIssues(html: string): Issue[] {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];

  $("audio[autoplay]").each((_, element) => {
    const node = $(element);
    if (node.attr("controls") !== undefined) return;

    const original = $.html(element);
    issues.push({
      id: nextIssueId(),
      barrier: 1,
      severity: "critical",
      type: "motion_autoplay_audio_without_controls",
      element: selectorFor(element),
      description: "Audio autoplays without visible controls.",
      plain_english: "Sound starts unexpectedly and the user may not know how to stop it.",
      wcag_ref: "1.4.2",
      fix_type: "html_attribute",
      fix_before: original,
      fix_after: ensureAttributes(removeAttribute(original, "autoplay"), ["controls"]),
      users_affected: "Autistic users with auditory sensitivity",
      affectedCount: 1,
    });
  });

  return issues;
}

function extractKeyframes(css: string): KeyframesRule[] {
  const rules: KeyframesRule[] = [];
  const regex = /@(?:-\w+-)?keyframes\s+([A-Za-z_][\w-]*)\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(css))) {
    const start = match.index;
    const bodyStart = regex.lastIndex - 1;
    const end = findMatchingBrace(css, bodyStart);
    if (end === -1) continue;
    const raw = css.slice(start, end + 1).trim();
    rules.push({
      name: match[1],
      raw,
      inReducedMotionMedia: isInsideReducedMotionMedia(css, start),
    });
    regex.lastIndex = end + 1;
  }

  return rules;
}

function extractCssRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const sanitized = css.replace(/@(?:-\w+-)?keyframes\s+[A-Za-z_][\w-]*\s*\{[\s\S]*?\n?\}/g, "");
  const regex = /([^@{}][^{}]*)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sanitized))) {
    const selector = match[1].trim();
    const body = match[2].trim();
    if (!selector || selector.includes("@media")) continue;
    const start = css.indexOf(match[0]);
    rules.push({
      selector,
      body,
      raw: `${selector} { ${body} }`,
      inReducedMotionMedia: start >= 0 ? isInsideReducedMotionMedia(css, start) : /prefers-reduced-motion/i.test(match[0]),
    });
  }

  return rules;
}

function isInsideReducedMotionMedia(css: string, index: number): boolean {
  const mediaRegex = /@media[^{]*prefers-reduced-motion[^{]*\{/gi;
  let match: RegExpExecArray | null;
  while ((match = mediaRegex.exec(css))) {
    const mediaStart = match.index;
    const braceStart = mediaRegex.lastIndex - 1;
    const mediaEnd = findMatchingBrace(css, braceStart);
    if (mediaEnd !== -1 && index > mediaStart && index < mediaEnd) return true;
  }
  return false;
}

function animationNamesFromBody(body: string): string[] {
  const names: string[] = [];
  const animationName = body.match(/animation-name\s*:\s*([^;]+)/i)?.[1];
  if (animationName) names.push(...animationName.split(",").map((name) => name.trim()).filter(Boolean));

  const shorthand = body.match(/(?:^|;)\s*animation\s*:\s*([^;]+)/i)?.[1];
  if (shorthand) {
    const candidates = shorthand.split(",").map((part) => part.trim().split(/\s+/).find(isLikelyAnimationName)).filter(Boolean) as string[];
    names.push(...candidates);
  }

  return [...new Set(names)];
}

function isLikelyAnimationName(token: string): boolean {
  if (!token) return false;
  if (/^\d/.test(token)) return false;
  if (/^(linear|ease|ease-in|ease-out|ease-in-out|infinite|alternate|forwards|backwards|both|normal|reverse|none|running|paused)$/i.test(token)) return false;
  if (/^\d+(\.\d+)?m?s$/i.test(token)) return false;
  if (/^cubic-bezier|^steps\(/i.test(token)) return false;
  return true;
}

function hasTransition(body: string): boolean {
  return /(?:^|;)\s*transition(?:-[\w-]+)?\s*:/i.test(body);
}

function createMotionFixOptions(css: string): FixOption[] {
  return [
    {
      option: "A",
      label: "Safest",
      description: "Run motion only when the OS has not requested reduced motion.",
      fix_after: wrapNoPreference(css),
    },
    {
      option: "B",
      label: "Moderate",
      description: "Keep motion, but reduce duration and stop looping.",
      fix_after: reduceMotion(css),
    },
    {
      option: "C",
      label: "Maximum",
      description: "Remove animation and transition properties entirely.",
      fix_after: removeMotion(css),
    },
  ];
}

function wrapNoPreference(css: string): string {
  return `@media (prefers-reduced-motion: no-preference) {\n${indent(css)}\n}`;
}

function reduceMotion(css: string): string {
  return css
    .replace(/animation-duration\s*:\s*[^;]+/gi, "animation-duration: 0.3s")
    .replace(/animation-iteration-count\s*:\s*[^;]+/gi, "animation-iteration-count: 1")
    .replace(/animation\s*:\s*([^;}]+)/gi, (full) =>
      full
        .replace(/\b\d+(\.\d+)?m?s\b/i, "0.3s")
        .replace(/\binfinite\b/i, "1"),
    )
    .replace(/transition\s*:\s*([^;}]+)/gi, (full) => full.replace(/\b\d+(\.\d+)?m?s\b/i, "0.3s"));
}

function removeMotion(css: string): string {
  return css
    .replace(/^\s*animation(?:-[\w-]+)?\s*:[^;]+;?\s*$/gim, "")
    .replace(/animation(?:-[\w-]+)?\s*:[^;}]+;?/gi, "")
    .replace(/transition(?:-[\w-]+)?\s*:[^;}]+;?/gi, "")
    .replace(/@(?:-\w+-)?keyframes\s+[A-Za-z_][\w-]*\s*\{[\s\S]*?\n?\}/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureAttributes(tagHtml: string, attrs: string[]): string {
  return tagHtml.replace(/^<([a-z0-9-]+)([^>]*)>/i, (match, tagName, rest) => {
    const missing = attrs.filter((attr) => !new RegExp(`\\s${attr}(\\s|=|>|$)`, "i").test(match));
    return `<${tagName}${rest}${missing.map((attr) => ` ${attr}`).join("")}>`;
  });
}

function removeAttribute(tagHtml: string, attr: string): string {
  return tagHtml.replace(new RegExp(`\\s${attr}(=(["']).*?\\2|=[^\\s>]+)?`, "i"), "");
}

function selectorFor(element: {tagName?: string; attribs?: Record<string, string>}): string {
  const attribs = element.attribs || {};
  if (attribs.id) return `${element.tagName}#${attribs.id}`;
  if (attribs.class) return `${element.tagName}.${attribs.class.split(/\s+/)[0]}`;
  return element.tagName || "element";
}

function uniqueCss(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function indent(value: string): string {
  return value
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function findMatchingBrace(source: string, openBraceIndex: number): number {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function nextIssueId(): string {
  issueCounter += 1;
  return `barrier_1_${String(issueCounter).padStart(3, "0")}`;
}
