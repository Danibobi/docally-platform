export type BarrierNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type BarrierSeverity = "critical" | "high" | "medium" | "low";

export type BarrierFixType = "css_global" | "css_element" | "html_attribute" | "js_pattern" | "ai_rewrite" | "suggestion";

export type FixOption = {
  option: "A" | "B" | "C";
  label: string;
  description: string;
  fix_after: string;
};

export type Issue = {
  id: string;
  barrier: BarrierNumber;
  severity: BarrierSeverity;
  type: string;
  element: string;
  description: string;
  plain_english: string;
  wcag_ref: string;
  fix_type: BarrierFixType;
  fix_before: string;
  fix_after: string;
  users_affected: string;
  affectedCount?: number;
  fixOptions?: FixOption[];
};
