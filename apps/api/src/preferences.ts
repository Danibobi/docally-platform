import type {
  PreferenceEventRequest,
  PreferenceKey,
  PreferenceRecord,
  PreferenceStateResponse,
  WeakSignalEvent,
  WeakSignalRequest,
} from "@docally/shared";

export const minimumAdaptationConfidence = 0.7;

export type StoredPreferenceEvent = PreferenceEventRequest & {
  id: string;
  apiKeyId: string;
  createdAt: string;
};

export type WeakSignalPreferenceUpdate = {
  event: PreferenceEventRequest;
  confidenceDelta: number;
};

export const preferenceSafetyPolicy = {
  opt_in_required: true,
  no_diagnosis_inference: true,
  no_hidden_emotional_state_labels: true,
  engagement_only_optimization_blocked: true,
  reversible: true,
  minimum_confidence: minimumAdaptationConfidence,
} as const;

export function createPreferenceRecord(
  event: PreferenceEventRequest,
  now: string = new Date().toISOString(),
): PreferenceRecord {
  const confidence = boundedConfidence(event.confidence ?? defaultConfidenceForSignal(event.signal), event.signal);
  return {
    preference_key: event.preference_key,
    value: event.value,
    confidence,
    source_signal: event.signal,
    context: event.context,
    created_at: now,
    updated_at: now,
    decay_after_days: event.signal === "explicit" ? 180 : 30,
    last_confirmed_at: event.signal === "explicit" ? now : null,
    enabled: true,
    contradiction_history: [],
  };
}

export function updatePreferenceRecord(
  current: PreferenceRecord | undefined,
  event: PreferenceEventRequest,
  now: string = new Date().toISOString(),
): PreferenceRecord {
  if (!current) return createPreferenceRecord(event, now);

  const decayed = decayPreference(current, now);
  const nextConfidence = boundedConfidence(event.confidence ?? defaultConfidenceForSignal(event.signal), event.signal);
  const isContradiction = decayed.value !== event.value;
  const weakWouldOverrideExplicit =
    event.signal === "weak" &&
    decayed.source_signal === "explicit" &&
    decayed.enabled &&
    decayed.confidence >= minimumAdaptationConfidence;

  if (weakWouldOverrideExplicit) {
    return {
      ...decayed,
      updated_at: now,
      contradiction_history: isContradiction
        ? [
            ...decayed.contradiction_history,
            {
              previous_value: decayed.value,
              next_value: event.value,
              signal: event.signal,
              observed_at: now,
              reason: event.reason,
            },
          ]
        : decayed.contradiction_history,
    };
  }

  return {
    ...decayed,
    value: event.value,
    confidence:
      event.signal === "explicit"
        ? Math.max(decayed.confidence, nextConfidence)
        : Math.min(minimumAdaptationConfidence - 0.01, Math.max(decayed.confidence * 0.85, nextConfidence)),
    source_signal: event.signal,
    context: event.context,
    updated_at: now,
    decay_after_days: event.signal === "explicit" ? 180 : 30,
    last_confirmed_at: event.signal === "explicit" ? now : decayed.last_confirmed_at,
    enabled: true,
    contradiction_history: isContradiction
      ? [
          ...decayed.contradiction_history,
          {
            previous_value: decayed.value,
            next_value: event.value,
            signal: event.signal,
            observed_at: now,
            reason: event.reason,
          },
        ]
      : decayed.contradiction_history,
  };
}

export function updatePreferenceFromWeakSignal(
  current: PreferenceRecord | undefined,
  signal: WeakSignalRequest,
  now: string = new Date().toISOString(),
): PreferenceRecord {
  const weakUpdate = weakSignalToPreferenceUpdate(signal);
  if (!current) return createPreferenceRecord(weakUpdate.event, now);

  const decayed = decayPreference(current, now);
  const isContradiction = decayed.value !== weakUpdate.event.value;

  if (decayed.source_signal === "explicit") {
    return {
      ...decayed,
      updated_at: now,
      contradiction_history: isContradiction
        ? [
            ...decayed.contradiction_history,
            {
              previous_value: decayed.value,
              next_value: weakUpdate.event.value,
              signal: "weak",
              observed_at: now,
              reason: weakUpdate.event.reason,
            },
          ]
        : decayed.contradiction_history,
    };
  }

  return {
    ...decayed,
    value: decayed.value,
    confidence: roundConfidence(Math.min(minimumAdaptationConfidence - 0.01, decayed.confidence + weakUpdate.confidenceDelta)),
    source_signal: "weak",
    context: weakUpdate.event.context,
    updated_at: now,
    decay_after_days: 30,
    enabled: true,
    contradiction_history: isContradiction
      ? [
          ...decayed.contradiction_history,
          {
            previous_value: decayed.value,
            next_value: weakUpdate.event.value,
            signal: "weak",
            observed_at: now,
            reason: weakUpdate.event.reason,
          },
        ]
      : decayed.contradiction_history,
  };
}

export function weakSignalToPreferenceUpdate(signal: WeakSignalRequest): WeakSignalPreferenceUpdate {
  const preferenceKey = eventToPreferenceKey(signal.event);
  const value = eventToPreferenceValue(signal.event);
  const confidenceDelta = confidenceDeltaForWeakSignal(signal);
  return {
    confidenceDelta,
    event: {
      preference_key: preferenceKey,
      value,
      signal: "weak",
      confidence: Math.min(minimumAdaptationConfidence - 0.01, confidenceDelta),
      context: {
        surface: "dashboard",
        workflow: signal.event,
        issueType: signal.context.issueType,
        sessionDepth: signal.context.sessionDepth,
        timeOnStep: signal.context.timeOnStep,
      },
      reason: `Weak signal: ${signal.event}`,
    },
  };
}

export function eventToPreferenceKey(event: WeakSignalEvent): PreferenceKey {
  const map: Record<WeakSignalEvent, PreferenceKey> = {
    fix_explanation_collapsed: "communication_depth",
    fix_explanation_expanded: "communication_depth",
    fix_skipped: "visual_structure",
    fix_rewritten: "language_literalness",
    flow_abandoned: "visual_structure",
    simpler_option_chosen: "language_literalness",
    adaptation_undone: "visual_structure",
    same_issue_type_skipped_3x: "alert_frequency",
  };
  return map[event];
}

export function confidenceDeltaForWeakSignal(signal: WeakSignalRequest): number {
  if (signal.context.timeOnStep < 3) return 0.05;
  if (signal.context.sessionDepth > 5) return 0.12;
  return 0.08;
}

export function patchPreferenceRecord(
  current: PreferenceRecord | undefined,
  event: Omit<PreferenceEventRequest, "signal">,
  now: string = new Date().toISOString(),
): PreferenceRecord {
  return updatePreferenceRecord(current, {...event, signal: "explicit"}, now);
}

export function decayPreference(record: PreferenceRecord, now: string = new Date().toISOString()): PreferenceRecord {
  const elapsedMs = Date.parse(now) - Date.parse(record.updated_at);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return record;

  const elapsedDays = elapsedMs / 86_400_000;
  const decayRatio = Math.min(1, elapsedDays / record.decay_after_days);
  const decayedConfidence = Math.max(0, record.confidence * (1 - decayRatio * 0.5));
  return {...record, confidence: roundConfidence(decayedConfidence)};
}

export function buildPreferenceState(preferences: PreferenceRecord[]): PreferenceStateResponse {
  const activePreferences = preferences.filter((preference) => preference.enabled).map((preference) => decayPreference(preference));
  const adaptationAllowed = activePreferences.some((preference) => preference.confidence >= minimumAdaptationConfidence);
  const explanations = activePreferences.map((preference) => {
    const source = preference.source_signal === "explicit" ? "You chose this directly" : "DocAlly inferred this from low-confidence behavior";
    const allowed =
      preference.confidence >= minimumAdaptationConfidence
        ? "It can be used for bounded suggestions."
        : "It is not strong enough to change product behavior.";
    return `${preference.preference_key}: ${source}. Confidence ${preference.confidence.toFixed(2)}. ${allowed}`;
  });

  return {
    preferences: activePreferences,
    adaptation_allowed: adaptationAllowed,
    safety_policy: preferenceSafetyPolicy,
    explanations,
  };
}

export function disablePreference(record: PreferenceRecord, now: string = new Date().toISOString()): PreferenceRecord {
  return {
    ...record,
    enabled: false,
    confidence: 0,
    updated_at: now,
  };
}

function defaultConfidenceForSignal(signal: PreferenceEventRequest["signal"]): number {
  return signal === "explicit" ? 0.95 : 0.35;
}

function boundedConfidence(confidence: number, signal: PreferenceEventRequest["signal"]): number {
  const upperBound = signal === "explicit" ? 1 : minimumAdaptationConfidence - 0.01;
  return roundConfidence(Math.max(0, Math.min(upperBound, confidence)));
}

function roundConfidence(confidence: number): number {
  return Math.round(confidence * 100) / 100;
}

function eventToPreferenceValue(event: WeakSignalEvent): string {
  const map: Record<WeakSignalEvent, string> = {
    fix_explanation_collapsed: "concise",
    fix_explanation_expanded: "detailed",
    fix_skipped: "less_interruptive",
    fix_rewritten: "literal",
    flow_abandoned: "more_guided",
    simpler_option_chosen: "plain_language",
    adaptation_undone: "manual_control",
    same_issue_type_skipped_3x: "fewer_repeated_alerts",
  };
  return map[event];
}
