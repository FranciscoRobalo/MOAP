// Shared types for the Análise de Orçamentos workspace.
// Keep this file in sync with the BudgetItem / AnalysisResult shapes
// defined in app/dashboard/analise/analise-content.tsx.

export type Rating = "below" | "average" | "above" | "critical" | "unknown"

export interface BudgetItem {
  id: string
  originalName: string
  matchedName: string | null
  unit: string
  quantity: number
  budgetPrice: number
  referenceMinPrice: number | null
  referenceMaxPrice: number | null
  referenceAvgPrice: number | null
  variance: number | null
  rating: Rating
  category: string
  matchConfidence: number
  type: "material" | "work"
  matchDetails?: string
}

export interface AnalysisStats {
  totalItems: number
  matchedItems: number
  belowAverage: number
  average: number
  aboveAverage: number
  critical: number
  unknown: number
  matchRate: number
  avgConfidence: number
  potentialSavings: number
  riskItems: number
}

export interface AnalysisResult {
  id: string
  fileName: string
  uploadDate: string
  region: string
  totalBudget: number
  totalReference: number
  overallVariance: number
  overallRating: Exclude<Rating, "unknown">
  items: BudgetItem[]
  stats: AnalysisStats
  categoryBreakdown: { category: string; total: number; count: number; variance: number }[]
  recommendations: string[]
  qualityScore?: number
}

export type DecisionValue = "pending" | "accepted" | "negotiate" | "rejected"

export interface DecisionRecord {
  decision: DecisionValue
  targetPrice: number | null
  updatedAt: string
}

export interface AnaliseNote {
  id: string
  item_id: string
  body: string
  created_at: string
}

export interface SavedAnalysisSummary {
  id: string
  obra_id: string | null
  file_name: string
  region: string | null
  total_budget: number | null
  total_reference: number | null
  overall_variance: number | null
  overall_rating: string | null
  quality_score: number | null
  match_rate: number | null
  potential_savings: number | null
  risk_items: number | null
  created_at: string
  updated_at: string
}

export interface SavedAnalysisFull extends SavedAnalysisSummary {
  stats: AnalysisStats | null
  category_breakdown: AnalysisResult["categoryBreakdown"] | null
  recommendations: string[] | null
  items: BudgetItem[]
}
