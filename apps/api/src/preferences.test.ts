import {describe, expect, it} from "vitest";
import {
  buildPreferenceState,
  confidenceDeltaForWeakSignal,
  createPreferenceRecord,
  decayPreference,
  eventToPreferenceKey,
  updatePreferenceRecord,
  updatePreferenceFromWeakSignal,
} from "./preferences";

describe("adaptive preference modeling", () => {
  it("keeps weak signals below the adaptation threshold", () => {
    const record = createPreferenceRecord({
      preference_key: "communication_depth",
      value: "concise",
      signal: "weak",
      context: {surface: "dashboard", workflow: "skipped_long_explanation"},
    });

    expect(record.confidence).toBeLessThan(0.7);
    expect(buildPreferenceState([record]).adaptation_allowed).toBe(false);
  });

  it("prevents weak signals from overriding confirmed explicit preferences", () => {
    const explicit = createPreferenceRecord(
      {
        preference_key: "communication_depth",
        value: "detailed",
        signal: "explicit",
        context: {surface: "dashboard", workflow: "preference_inspector"},
      },
      "2026-05-08T10:00:00.000Z",
    );

    const updated = updatePreferenceRecord(
      explicit,
      {
        preference_key: "communication_depth",
        value: "concise",
        signal: "weak",
        context: {surface: "dashboard", workflow: "abandoned_detail_panel"},
      },
      "2026-05-08T11:00:00.000Z",
    );

    expect(updated.value).toBe("detailed");
    expect(updated.source_signal).toBe("explicit");
    expect(updated.contradiction_history).toHaveLength(1);
    expect(updated.contradiction_history[0].next_value).toBe("concise");
  });

  it("lets explicit user edits replace earlier inferred preferences", () => {
    const weak = createPreferenceRecord({
      preference_key: "motion_level",
      value: "standard",
      signal: "weak",
      context: {surface: "dashboard", workflow: "ignored_reduce_motion_fix"},
    });

    const updated = updatePreferenceRecord(weak, {
      preference_key: "motion_level",
      value: "reduced",
      signal: "explicit",
      context: {surface: "dashboard", workflow: "preference_inspector"},
    });

    expect(updated.value).toBe("reduced");
    expect(updated.confidence).toBeGreaterThanOrEqual(0.95);
    expect(updated.last_confirmed_at).not.toBeNull();
  });

  it("decays stale preference confidence without deleting the user's record", () => {
    const record = createPreferenceRecord(
      {
        preference_key: "visual_structure",
        value: "high_structure",
        signal: "explicit",
        context: {surface: "dashboard", workflow: "onboarding"},
      },
      "2025-05-08T10:00:00.000Z",
    );

    const decayed = decayPreference(record, "2026-05-08T10:00:00.000Z");
    expect(decayed.value).toBe("high_structure");
    expect(decayed.confidence).toBeLessThan(record.confidence);
  });

  it("maps only approved weak events to preference keys", () => {
    expect(eventToPreferenceKey("fix_explanation_collapsed")).toBe("communication_depth");
    expect(eventToPreferenceKey("fix_rewritten")).toBe("language_literalness");
    expect(eventToPreferenceKey("same_issue_type_skipped_3x")).toBe("alert_frequency");
  });

  it("uses bounded confidence deltas for weak signals", () => {
    expect(
      confidenceDeltaForWeakSignal({
        event: "fix_skipped",
        context: {surface: "dashboard", issueType: "contrast_ratio", sessionDepth: 1, timeOnStep: 2},
      }),
    ).toBe(0.05);
    expect(
      confidenceDeltaForWeakSignal({
        event: "fix_skipped",
        context: {surface: "dashboard", issueType: "contrast_ratio", sessionDepth: 6, timeOnStep: 12},
      }),
    ).toBe(0.12);
    expect(
      confidenceDeltaForWeakSignal({
        event: "fix_skipped",
        context: {surface: "dashboard", issueType: "contrast_ratio", sessionDepth: 2, timeOnStep: 12},
      }),
    ).toBe(0.08);
  });

  it("nudges weak preference confidence without flipping values", () => {
    const weak = createPreferenceRecord({
      preference_key: "communication_depth",
      value: "detailed",
      signal: "weak",
      context: {surface: "dashboard", workflow: "fix_explanation_expanded"},
      confidence: 0.35,
    });

    const updated = updatePreferenceFromWeakSignal(weak, {
      event: "fix_explanation_collapsed",
      context: {surface: "dashboard", issueType: "language_complexity", sessionDepth: 3, timeOnStep: 10},
    });

    expect(updated.value).toBe("detailed");
    expect(updated.confidence).toBeGreaterThan(weak.confidence);
    expect(updated.confidence).toBeLessThan(0.7);
    expect(updated.contradiction_history[0].next_value).toBe("concise");
  });
});
