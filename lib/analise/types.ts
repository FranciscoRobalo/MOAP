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

/**
 * Submission lifecycle for an analysis:
 *   draft             — created by the client, not yet sent
 *   submitted         — client pushed it to the admin queue
 *   in_review         — an admin picked it up (self-assigned)
 *   approved          — admin signed off (with optional revisions + feedback)
 *   changes_requested — admin sent it back for the client to fix
 *   rejected          — admin rejected it entirely
 */
export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "changes_requested"
  | "rejected"

export interface AdminRevisedItem {
  id: string
  quantity?: number
  unitPrice?: number
  note?: string
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
  // Submission workflow
  submission_status: SubmissionStatus
  submitted_at: string | null
  reviewer_id: string | null
  reviewer_name: string | null
  reviewed_at: string | null
  admin_summary: string | null
  admin_feedback: string | null
  admin_revised_total: number | null
  client_seen_at: string | null
}

export interface SavedAnalysisFull extends SavedAnalysisSummary {
  stats: AnalysisStats | null
  category_breakdown: AnalysisResult["categoryBreakdown"] | null
  recommendations: string[] | null
  items: BudgetItem[]
  admin_revised_items: AdminRevisedItem[] | null
  admin_ai_notes: {
    summary?: string
    feedback?: string
    keyFindings?: string[]
    suggestedRevisions?: AdminRevisedItem[]
    modelUsed?: string
    generatedAt?: string
  } | null
}

export interface AdminQueueEntry extends SavedAnalysisSummary {
  owner_name: string | null
  owner_email: string | null
}

export interface AdminAuditEvent {
  id: string
  analysis_id: string
  actor_id: string | null
  actor_name: string | null
  action: string
  old_status: string | null
  new_status: string | null
  note: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}
