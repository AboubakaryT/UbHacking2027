// Frontend mirrors of backend/internal/models/models.go.
// Keep field names in sync with the Go JSON tags so the mock data can be
// swapped for real WebSocket payloads later.

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'active' | 'dismissed' | 'resolved'

export interface FileRecord {
  path: string
  hash: string
  content?: string
  size: number
  modifiedAt: string
}

export interface Developer {
  id: string
  projectId: string
  repoId: string
  branch: string
  baseCommit: string
  connected: boolean
  lastSeen: string
  files: Record<string, FileRecord>
}

export interface Issue {
  id: string
  projectId: string
  category: string
  severity: Severity
  status: IssueStatus
  verified: boolean
  developerId?: string
  affectedFiles: string[]
  title: string
  description: string
  details?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ActivityEvent {
  id: string
  projectId: string
  type: string
  message: string
  createdAt: string
}

export interface GraphNode {
  id: string
  nodeType: string
  label: string
  path?: string
  issueStatus?: string
}

export interface GraphEdge {
  id: string
  sourceNode: string
  targetNode: string
  relationship: string
}

export interface DependencyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// Frontend-only shapes (not yet produced by the backend).

/** A file one developer changed that may break code another developer is editing. */
export interface ConflictSide {
  developerId: string
  path: string
  language: string
  original: string
  modified: string
}

export interface AiAnalysis {
  confidence: number
  why: string[]
  suggestedFix: string
  suggestedFixLanguage: string
  steps: string[]
}

export interface Conflict {
  issueId: string
  /** The change that introduced the break (e.g. backend API change). */
  source: ConflictSide
  /** The code that depends on the old behavior (e.g. frontend component). */
  impacted: ConflictSide
  ai: AiAnalysis
}
