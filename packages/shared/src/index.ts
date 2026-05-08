import {z} from "zod";

export const scanProfiles = ["autism", "dyslexia", "sensory", "wcag", "all"] as const;
export const scanProfileSchema = z.enum(scanProfiles);
export type ScanProfile = z.infer<typeof scanProfileSchema>;

export const crawlModes = ["quick", "full", "deep"] as const;
export const crawlModeSchema = z.enum(crawlModes);
export type CrawlMode = z.infer<typeof crawlModeSchema>;

export const issueSeverities = ["critical", "high", "medium", "low"] as const;
export const issueSeveritySchema = z.enum(issueSeverities);
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;

export const issueTypes = [
  "contrast_ratio",
  "missing_alt_text",
  "animation_present",
  "font_size_small",
  "missing_skip_link",
  "missing_aria_label",
  "missing_lang",
  "heading_hierarchy",
  "form_input_label",
  "language_complexity",
  "jargon",
  "passive_voice",
  "cognitive_load",
  "sensory_overload",
] as const;
export const issueTypeSchema = z.enum(issueTypes);
export type IssueType = z.infer<typeof issueTypeSchema>;

export const fixTypes = ["html_replacement", "css_replacement", "css_addition", "attribute_addition"] as const;
export const fixTypeSchema = z.enum(fixTypes);
export type FixType = z.infer<typeof fixTypeSchema>;

export const scanRequestSchema = z.object({
  url: z.string().url(),
  profile: scanProfileSchema.default("all"),
  crawl: crawlModeSchema.default("quick"),
});
export type ScanRequest = z.infer<typeof scanRequestSchema>;

export const sourceSnippetSchema = z.object({
  html: z.string().optional(),
  css: z.string().optional(),
  text: z.string().optional(),
  selector: z.string().optional(),
  attribute: z.string().optional(),
});
export type SourceSnippet = z.infer<typeof sourceSnippetSchema>;

export const scanIssueSchema = z.object({
  id: z.string(),
  severity: issueSeveritySchema,
  type: issueTypeSchema,
  element: z.string(),
  description: z.string(),
  plain_english: z.string(),
  wcag_ref: z.string(),
  fixable: z.boolean(),
  snippet: sourceSnippetSchema.optional(),
});
export type ScanIssue = z.infer<typeof scanIssueSchema>;

export const scanSummarySchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  fixable: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type ScanSummary = z.infer<typeof scanSummarySchema>;

export const scanPageSchema = z.object({
  path: z.string(),
  url: z.string().url(),
  score: z.number().int().min(0).max(100),
  issue_count: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
});
export type ScanPage = z.infer<typeof scanPageSchema>;

export const topIssueSchema = z.object({
  type: issueTypeSchema,
  label: z.string(),
  pages_affected: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});
export type TopIssue = z.infer<typeof topIssueSchema>;

export const scanResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  profile: scanProfileSchema,
  crawl: crawlModeSchema.default("quick"),
  scanned_url: z.string().url().optional(),
  pages_scanned: z.number().int().nonnegative().default(1),
  duration_ms: z.number().int().nonnegative().default(0),
  pages: z.array(scanPageSchema).default([]),
  top_issues: z.array(topIssueSchema).default([]),
  issues: z.array(scanIssueSchema),
  summary: scanSummarySchema,
  scan_id: z.string(),
});
export type ScanResponse = z.infer<typeof scanResponseSchema>;

export const fixRequestSchema = z.object({
  scan_id: z.string().min(1),
  issue_ids: z.array(z.string()).min(1),
  profile: scanProfileSchema.default("all"),
});
export type FixRequest = z.infer<typeof fixRequestSchema>;

export const fixSuggestionSchema = z.object({
  id: z.string(),
  type: fixTypeSchema,
  original: z.string(),
  fixed: z.string(),
  explanation: z.string(),
});
export type FixSuggestion = z.infer<typeof fixSuggestionSchema>;

export const fixResponseSchema = z.object({
  fixes: z.array(fixSuggestionSchema),
});
export type FixResponse = z.infer<typeof fixResponseSchema>;

export const developerApiErrorSchema = z.object({
  code: z.enum(["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "FETCH_FAILED", "SCAN_FAILED", "RATE_LIMITED", "TIMEOUT"]),
  message: z.string(),
  retryable: z.boolean().default(false),
});
export type DeveloperApiError = z.infer<typeof developerApiErrorSchema>;

export const preferenceKeys = [
  "communication_depth",
  "language_literalness",
  "motion_level",
  "visual_structure",
  "alert_frequency",
  "audio_support",
] as const;
export const preferenceKeySchema = z.enum(preferenceKeys);
export type PreferenceKey = z.infer<typeof preferenceKeySchema>;

export const preferenceSignalTypes = ["explicit", "weak"] as const;
export const preferenceSignalTypeSchema = z.enum(preferenceSignalTypes);
export type PreferenceSignalType = z.infer<typeof preferenceSignalTypeSchema>;

export const weakSignalEvents = [
  "fix_explanation_collapsed",
  "fix_explanation_expanded",
  "fix_skipped",
  "fix_rewritten",
  "flow_abandoned",
  "simpler_option_chosen",
  "adaptation_undone",
  "same_issue_type_skipped_3x",
] as const;
export const weakSignalEventSchema = z.enum(weakSignalEvents);
export type WeakSignalEvent = z.infer<typeof weakSignalEventSchema>;

export const preferenceContextSchema = z
  .object({
    surface: z.enum(["dashboard", "api", "extension", "vscode", "unknown"]).default("unknown"),
    workflow: z.string().max(80).optional(),
    profile: scanProfileSchema.optional(),
  })
  .passthrough();
export type PreferenceContext = z.infer<typeof preferenceContextSchema>;

export const weakSignalRequestSchema = z.object({
  event: weakSignalEventSchema,
  context: z.object({
    surface: z.enum(["dashboard"]),
    issueType: issueTypeSchema.optional(),
    sessionDepth: z.number().int().nonnegative(),
    timeOnStep: z.number().nonnegative(),
  }),
});
export type WeakSignalRequest = z.infer<typeof weakSignalRequestSchema>;

export const preferenceEventRequestSchema = z.object({
  preference_key: preferenceKeySchema,
  value: z.string().min(1).max(120),
  signal: preferenceSignalTypeSchema,
  context: preferenceContextSchema.default({surface: "unknown"}),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().max(240).optional(),
});
export type PreferenceEventRequest = z.infer<typeof preferenceEventRequestSchema>;

export const preferenceRecordSchema = z.object({
  preference_key: preferenceKeySchema,
  value: z.string(),
  confidence: z.number().min(0).max(1),
  source_signal: preferenceSignalTypeSchema,
  context: preferenceContextSchema,
  created_at: z.string(),
  updated_at: z.string(),
  decay_after_days: z.number().int().positive(),
  last_confirmed_at: z.string().nullable(),
  enabled: z.boolean().default(true),
  contradiction_history: z
    .array(
      z.object({
        previous_value: z.string(),
        next_value: z.string(),
        signal: preferenceSignalTypeSchema,
        observed_at: z.string(),
        reason: z.string().optional(),
      }),
    )
    .default([]),
});
export type PreferenceRecord = z.infer<typeof preferenceRecordSchema>;

export const preferenceStateResponseSchema = z.object({
  preferences: z.array(preferenceRecordSchema),
  adaptation_allowed: z.boolean(),
  safety_policy: z.object({
    opt_in_required: z.literal(true),
    no_diagnosis_inference: z.literal(true),
    no_hidden_emotional_state_labels: z.literal(true),
    engagement_only_optimization_blocked: z.literal(true),
    reversible: z.literal(true),
    minimum_confidence: z.number().min(0).max(1),
  }),
  explanations: z.array(z.string()),
});
export type PreferenceStateResponse = z.infer<typeof preferenceStateResponseSchema>;

export const preferenceEventResponseSchema = z.object({
  event_id: z.string(),
  preference: preferenceRecordSchema,
  state: preferenceStateResponseSchema,
});
export type PreferenceEventResponse = z.infer<typeof preferenceEventResponseSchema>;

export const scanPresentationMetadataSchema = z.object({
  adapted: z.boolean(),
  explanation: z.string(),
  preference_key: preferenceKeySchema.optional(),
});
export type ScanPresentationMetadata = z.infer<typeof scanPresentationMetadataSchema>;

export const preferencePatchRequestSchema = z.object({
  preferences: z
    .array(
      z.object({
        preference_key: preferenceKeySchema,
        value: z.string().min(1).max(120),
        confidence: z.number().min(0).max(1).optional(),
        context: preferenceContextSchema.default({surface: "dashboard", workflow: "preference_inspector"}),
        reason: z.string().max(240).optional(),
      }),
    )
    .default([]),
  undo_preference_keys: z.array(preferenceKeySchema).default([]),
});
export type PreferencePatchRequest = z.infer<typeof preferencePatchRequestSchema>;

export function summarizeIssues(issues: ScanIssue[]): ScanSummary {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
    fixable: issues.filter((issue) => issue.fixable).length,
    total: issues.length,
  };
}

export function scoreFromIssues(issues: ScanIssue[]): number {
  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === "critical") return total + 13;
    if (issue.severity === "high") return total + 7;
    if (issue.severity === "medium") return total + 4;
    return total + 2;
  }, 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

export function issueMatchesProfile(issue: ScanIssue, profile: ScanProfile): boolean {
  if (profile === "all") return true;
  if (profile === "wcag") {
    return [
      "contrast_ratio",
      "missing_alt_text",
      "missing_skip_link",
      "missing_aria_label",
      "missing_lang",
      "heading_hierarchy",
      "form_input_label",
    ].includes(issue.type);
  }
  if (profile === "autism") {
    return ["language_complexity", "jargon", "passive_voice", "cognitive_load", "heading_hierarchy"].includes(issue.type);
  }
  if (profile === "dyslexia") {
    return ["font_size_small", "language_complexity", "contrast_ratio", "cognitive_load"].includes(issue.type);
  }
  return ["animation_present", "sensory_overload", "contrast_ratio", "font_size_small"].includes(issue.type);
}

export function aggregateTopIssues(issues: ScanIssue[], pagesScanned: number): TopIssue[] {
  const labels: Record<IssueType, string> = {
    contrast_ratio: "Low contrast",
    missing_alt_text: "Missing alt text",
    animation_present: "No reduced-motion",
    font_size_small: "Small font size",
    missing_skip_link: "Missing skip links",
    missing_aria_label: "Missing ARIA labels",
    missing_lang: "Missing language",
    heading_hierarchy: "Broken heading hierarchy",
    form_input_label: "Missing form labels",
    language_complexity: "Language complexity",
    jargon: "Jargon",
    passive_voice: "Passive voice",
    cognitive_load: "Cognitive load",
    sensory_overload: "Sensory overload",
  };
  const counts = issues.reduce((map, issue) => {
    map.set(issue.type, (map.get(issue.type) || 0) + 1);
    return map;
  }, new Map<IssueType, number>());

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count]) => ({
      type,
      label: labels[type],
      count,
      pages_affected: Math.max(1, Math.min(pagesScanned, Math.round(count * 0.72) || 1)),
    }));
}

// Deprecated extension compatibility exports. The Chrome extension is preserved but no longer the active product surface.
export const accessibilityModes = [
  "autism-adhd",
  "dyslexia",
  "sensory",
  "screen-reader",
  "plain-language",
  "custom",
] as const;

export const accessibilityModeSchema = z.enum(accessibilityModes);
export type AccessibilityMode = z.infer<typeof accessibilityModeSchema>;

export const modeLabels: Record<AccessibilityMode, string> = {
  "autism-adhd": "Autism / ADHD",
  dyslexia: "Dyslexia",
  sensory: "Sensory Overload",
  "screen-reader": "Screen Reader",
  "plain-language": "Plain Language",
  custom: "Custom",
};

export const profilePreferenceSchema = z.object({
  summaryDepth: z.enum(["action-first", "balanced", "detailed"]).default("action-first"),
  paragraphStyle: z.enum(["bullets", "short-paragraphs", "original-flow"]).default("bullets"),
  motionSensitivity: z.enum(["high", "medium", "low"]).default("medium"),
  jargonTolerance: z.enum(["low", "medium", "high"]).default("low"),
  audioPreferred: z.boolean().default(false),
});

export type ProfilePreference = z.infer<typeof profilePreferenceSchema>;

export const accessibilityProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  displayName: z.string().min(1),
  mode: accessibilityModeSchema,
  preferences: profilePreferenceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AccessibilityProfile = z.infer<typeof accessibilityProfileSchema>;

export const extractedDocumentSchema = z.object({
  title: z.string().default("Untitled document"),
  url: z.string().url().optional(),
  sourceType: z.enum(["webpage", "pdf", "spa", "email", "document", "unknown"]).default("unknown"),
  text: z.string().min(80),
  html: z.string().optional(),
  language: z.string().default("en"),
});

export type ExtractedDocument = z.infer<typeof extractedDocumentSchema>;

export const threeLayerSummarySchema = z.object({
  whatIsThis: z.string(),
  needToKnow: z.array(z.string()).min(1).max(7),
  needToDo: z.array(z.string()).default([]),
});

export type ThreeLayerSummary = z.infer<typeof threeLayerSummarySchema>;

export const transformRequestSchema = z.object({
  document: extractedDocumentSchema,
  mode: accessibilityModeSchema.default("autism-adhd"),
  profileId: z.string().optional(),
  simplify: z.boolean().default(true),
  includeReadingView: z.boolean().default(true),
});

export type TransformRequest = z.infer<typeof transformRequestSchema>;

export const transformResponseSchema = z.object({
  id: z.string(),
  summary: threeLayerSummarySchema,
  readingView: z.string(),
  mode: accessibilityModeSchema,
  status: z.enum(["completed", "demo", "queued"]),
  audit: z.object({
    readabilityScore: z.number().min(0).max(100),
    sensoryLoadScore: z.number().min(0).max(100),
    cognitiveComplexityScore: z.number().min(0).max(100),
  }),
  warnings: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export type TransformResponse = z.infer<typeof transformResponseSchema>;

export const apiErrorSchema = z.object({
  code: z.enum([
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "TEXT_TOO_SHORT",
    "UNSUPPORTED_DOCUMENT",
    "AI_PROVIDER_FAILED",
    "RATE_LIMITED",
    "TIMEOUT",
  ]),
  message: z.string(),
  retryable: z.boolean().default(false),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export function buildSystemPrompt(mode: AccessibilityMode, simplify: boolean): string {
  const modeInstruction: Record<AccessibilityMode, string> = {
    "autism-adhd":
      "Use short concrete sentences. Put conclusions first. Use bullets. Remove ambiguity and mark critical obligations with IMPORTANT.",
    dyslexia:
      "Use common short words. Keep paragraphs to one or two sentences. Preserve numbers, names, dates, and obligations.",
    sensory:
      "Reduce visual and cognitive noise. Use calm structure, clear spacing, and only the information needed to understand and act.",
    "screen-reader":
      "Use descriptive section headings, linear reading order, and explicit labels for implied visual structure.",
    "plain-language":
      "Rewrite jargon in plain professional language. Keep legal and compliance meaning intact.",
    custom:
      "Adapt to the user's saved preferences. Prefer clear structure, literal language, and action-first summaries.",
  };

  return [
    "You are DocAlly, an enterprise document accessibility assistant.",
    "Return valid JSON only. Do not include markdown fences.",
    "Always preserve legal meaning, dates, numbers, names, obligations, and deadlines.",
    "Generate a three-layer summary and an accessible reading view.",
    simplify
      ? "Rewrite in plain language with strong readability improvements."
      : "Preserve most terminology while improving structure and reading flow.",
    `Selected mode: ${modeLabels[mode]}.`,
    `Mode instruction: ${modeInstruction[mode]}`,
  ].join("\n");
}

export function createDemoTransform(request: TransformRequest): TransformResponse {
  const title = request.document.title || "this document";
  const mode = request.mode;

  return {
    id: `demo_${Date.now()}`,
    mode,
    status: "demo",
    summary: {
      whatIsThis: `This is an accessible summary of ${title}.`,
      needToKnow: [
        "DocAlly detected dense document text and converted it into a clearer structure.",
        "Important facts, dates, amounts, and obligations should remain visible in the reading view.",
        "Live Claude processing can replace this demo response when the backend provider key is configured.",
      ],
      needToDo: [
        "Review the highlighted obligations.",
        "Check deadlines before signing or forwarding the document.",
        "Ask the document owner for clarification if any action is unclear.",
      ],
    },
    readingView: [
      "ACCESSIBLE READING VIEW",
      "",
      "WHAT THIS IS",
      `This document is called ${title}. DocAlly has prepared a calmer reading layer for it.`,
      "",
      "KEY POINTS",
      "- The original text may contain long paragraphs, jargon, or unclear action items.",
      "- This view keeps the meaning while making the structure easier to scan.",
      "- Use the action list first if you need the conclusion before the detail.",
      "",
      "NEXT ACTIONS",
      "- Review any deadline or signature requirement.",
      "- Save this transformation if it is useful.",
      "- Re-run with a different profile if the structure does not fit your reading preference.",
    ].join("\n"),
    audit: {
      readabilityScore: 72,
      sensoryLoadScore: 84,
      cognitiveComplexityScore: 68,
    },
    warnings: ["Demo response: configure ANTHROPIC_API_KEY on the API server for live transformations."],
    createdAt: new Date().toISOString(),
  };
}
