package models

import (
	"sync"
	"time"
)

type Severity string

const (
	SeverityLow      Severity = "low"
	SeverityMedium   Severity = "medium"
	SeverityHigh     Severity = "high"
	SeverityCritical Severity = "critical"
)

type IssueStatus string

const (
	IssueStatusActive    IssueStatus = "active"
	IssueStatusDismissed IssueStatus = "dismissed"
	IssueStatusResolved  IssueStatus = "resolved"
)

type EventType string

const (
	EventAgentHello            EventType = "agent_hello"
	EventWorkspaceSnapshot     EventType = "workspace_snapshot"
	EventFileChanged           EventType = "file_changed"
	EventFileDeleted           EventType = "file_deleted"
	EventHeartbeat             EventType = "heartbeat"
	EventDeveloperConnected    EventType = "developer_connected"
	EventDeveloperDisconnected EventType = "developer_disconnected"
	EventFileChangedNotice     EventType = "file_changed"
	EventIssueDetected        EventType = "issue_detected"
	EventIssueUpdated         EventType = "issue_updated"
	EventIssueResolved        EventType = "issue_resolved"
	EventGraphUpdated         EventType = "dependency_graph_updated"
	EventWorkspaceSynced      EventType = "workspace_synced"
)

type Envelope struct {
	Type      EventType     `json:"type"`
	ProjectID string        `json:"projectId"`
	Timestamp time.Time     `json:"timestamp"`
	Data      map[string]any `json:"data"`
}

type Project struct {
	ID        string              `json:"id"`
	Developers map[string]*Developer `json:"developers"`
	Issues    map[string]*Issue     `json:"issues"`
	Graph     DependencyGraph       `json:"graph"`
	Activity  []ActivityEvent       `json:"activity"`
	UpdatedAt time.Time             `json:"updatedAt"`
	mu        sync.RWMutex
}

type Developer struct {
	ID         string                 `json:"id"`
	ProjectID  string                 `json:"projectId"`
	RepoID     string                 `json:"repoId"`
	Branch     string                 `json:"branch"`
	BaseCommit string                 `json:"baseCommit"`
	Connected  bool                   `json:"connected"`
	LastSeen   time.Time              `json:"lastSeen"`
	Files      map[string]*FileRecord `json:"files"`
}

type FileRecord struct {
	Path       string    `json:"path"`
	Hash       string    `json:"hash"`
	Content    string    `json:"content,omitempty"`
	Size       int64     `json:"size"`
	ModifiedAt time.Time `json:"modifiedAt"`
}

type Issue struct {
	ID            string         `json:"id"`
	ProjectID     string         `json:"projectId"`
	Category      string         `json:"category"`
	Severity      Severity       `json:"severity"`
	Status        IssueStatus    `json:"status"`
	Verified      bool           `json:"verified"`
	DeveloperID   string         `json:"developerId,omitempty"`
	AffectedFiles []string       `json:"affectedFiles"`
	Title         string         `json:"title"`
	Description   string         `json:"description"`
	Details       map[string]any `json:"details,omitempty"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

type ActivityEvent struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"projectId"`
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
}

type GraphNode struct {
	ID         string `json:"id"`
	NodeType   string `json:"nodeType"`
	Label      string `json:"label"`
	Path       string `json:"path,omitempty"`
	IssueState string `json:"issueStatus,omitempty"`
}

type GraphEdge struct {
	ID           string `json:"id"`
	SourceNode   string `json:"sourceNode"`
	TargetNode   string `json:"targetNode"`
	Relationship string `json:"relationship"`
}

type DependencyGraph struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

func NewProject(id string) *Project {
	return &Project{
		ID:        id,
		Developers: map[string]*Developer{},
		Issues:    map[string]*Issue{},
		Activity:  []ActivityEvent{},
		UpdatedAt: time.Now(),
	}
}

func NewIssue(projectID, category, title, description string) *Issue {
	now := time.Now()
	return &Issue{
		ID:            "issue-" + now.Format("20060102150405") + "-" + randomSuffix(5),
		ProjectID:     projectID,
		Category:      category,
		Severity:      SeverityMedium,
		Status:        IssueStatusActive,
		Verified:      true,
		AffectedFiles: []string{},
		Title:         title,
		Description:   description,
		Details:       map[string]any{},
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

func randomSuffix(n int) string {
	chars := "abcdefghijklmnopqrstuvwxyz0123456789"
	result := make([]byte, n)
	for i := range result {
		result[i] = chars[(i*7+len(chars))%len(chars)]
	}
	return string(result)
}
