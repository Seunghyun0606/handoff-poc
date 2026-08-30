export const CATEGORY_IDS = [
  "purpose",
  "procedure",
  "systems_tools",
  "access_permissions",
  "contacts",
  "schedule_deadline",
  "input_data",
  "output_results",
  "exception_handling",
  "incident_response",
  "validation",
  "follow_up",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];
export type CategoryStatus = "CLEAR" | "PARTIAL" | "MISSING";
export type GapSeverity = "CRITICAL" | "WARNING";

export interface CategoryResult {
  id: CategoryId;
  name: string;
  status: CategoryStatus;
  score: number;
  reason: string;
}

export interface Gap {
  severity: GapSeverity;
  category_id: CategoryId;
  title: string;
  reason: string;
  suggestion: string;
}

export interface AnalysisResult {
  overall_score: number;
  summary: string;
  categories: CategoryResult[];
  gaps: Gap[];
  questions: string[];
  improved_document: string;
  source?: "openai" | "fallback";
  notice?: string;
}
