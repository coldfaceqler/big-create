export type RiskLevel = "高" | "中" | "低" | "未知";

// 与整合方案第 11 节保持一致；仅作为前端演示的数据契约。
export interface Annotation {
  clauseId: string;
  quote: string;
  plain: string;
  riskLevel: RiskLevel;
  riskReason: string;
  visibility: string;
  benchmark: "spec_2020" | "spec_2007" | "contract_own" | "not_compared";
  layer: 1 | 2 | 3;
  confidence: "高" | "需复核";
  needsReview: boolean;
}

export interface Clause {
  id: string;
  title: string;
  section: string;
  page: number;
  paragraphs: string[];
}

export interface AnnotationPresentation {
  title: string;
  category: string;
}

export interface Verification {
  clauseId: string;
  question: string;
  reason: string;
  contact: string;
}
