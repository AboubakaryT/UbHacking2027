package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"codeanalysis-platform/internal/analyzers"
	"codeanalysis-platform/internal/config"
	"codeanalysis-platform/internal/models"
	"codeanalysis-platform/internal/store"
	"codeanalysis-platform/internal/ws"

	"github.com/gorilla/websocket"
)

type Server struct {
	cfg    config.Config
	store  *store.ProjectStore
	ws     *ws.Handler
	mu     sync.RWMutex
	clients map[string]*websocket.Conn
}

func NewServer(cfg config.Config) *Server {
	server := &Server{
		cfg:     cfg,
		store:   store.NewProjectStore(),
		clients: map[string]*websocket.Conn{},
	}
	server.ws = ws.NewHandler(server.HandleAgentEvent)
	return server
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, http.StatusOK, map[string]any{"status": "ok"})
	})
	mux.HandleFunc("/ws/agent", s.ws.ServeAgent)
	mux.HandleFunc("/ws/client", s.ws.ServeClient)
	mux.HandleFunc("/api/projects/", s.handleProjectRequests)
}

func (s *Server) handleProjectRequests(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 {
		respondJSON(w, http.StatusBadRequest, errorResponse("invalid project path"))
		return
	}
	projectID := parts[0]
	project, ok := s.store.GetProject(projectID)
	if !ok {
		project = s.store.GetOrCreateProject(projectID)
	}
	if len(parts) == 1 {
		switch r.Method {
		case http.MethodGet:
			respondJSON(w, http.StatusOK, project)
		default:
			respondJSON(w, http.StatusMethodNotAllowed, errorResponse("method not allowed"))
		}
		return
	}
	switch parts[1] {
	case "developers":
		if r.Method == http.MethodGet {
			respondJSON(w, http.StatusOK, s.store.ListDevelopers(projectID))
		}
	case "files":
		if r.Method == http.MethodGet {
			if len(parts) >= 4 && parts[2] == "content" {
				developerID := r.URL.Query().Get("developerId")
				filePath := r.URL.Query().Get("path")
				if developerID == "" || filePath == "" {
					respondJSON(w, http.StatusBadRequest, errorResponse("developerId and path are required"))
					return
				}
				if dev, ok := project.Developers[developerID]; ok {
					if f, exists := dev.Files[filePath]; exists {
						respondJSON(w, http.StatusOK, f)
						return
					}
				}
				respondJSON(w, http.StatusNotFound, errorResponse("file not found"))
				return
			}
			respondJSON(w, http.StatusOK, s.store.ListFiles(projectID))
		}
	case "issues":
		s.handleIssues(w, r, projectID, parts)
	case "graph":
		if r.Method == http.MethodGet {
			respondJSON(w, http.StatusOK, project.Graph)
		}
	case "activity":
		if r.Method == http.MethodGet {
			respondJSON(w, http.StatusOK, s.store.ListActivity(projectID))
		}
	default:
		respondJSON(w, http.StatusNotFound, errorResponse("route not found"))
	}
}

func (s *Server) handleIssues(w http.ResponseWriter, r *http.Request, projectID string, parts []string) {
	if len(parts) < 3 {
		respondJSON(w, http.StatusOK, s.store.ListIssues(projectID))
		return
	}
	issueID := parts[2]
	if r.Method == http.MethodGet {
		issue, ok := s.store.GetIssue(projectID, issueID)
		if !ok {
			respondJSON(w, http.StatusNotFound, errorResponse("issue not found"))
			return
		}
		respondJSON(w, http.StatusOK, issue)
		return
	}
	if len(parts) >= 4 {
		switch parts[3] {
		case "dismiss":
			if r.Method == http.MethodPost && s.store.DismissIssue(projectID, issueID) {
				respondJSON(w, http.StatusOK, map[string]any{"status": "dismissed"})
				return
			}
		case "resolve":
			if r.Method == http.MethodPost && s.store.ResolveIssue(projectID, issueID) {
				respondJSON(w, http.StatusOK, map[string]any{"status": "resolved"})
				return
			}
		}
	}
	respondJSON(w, http.StatusMethodNotAllowed, errorResponse("unsupported issue operation"))
}

func (s *Server) HandleAgentEvent(projectID string, payload map[string]any) {
	if eventType, ok := payload["type"].(string); ok {
		switch eventType {
		case "agent_hello":
			if devID, ok := payload["developerId"].(string); ok {
				p := s.store.GetOrCreateProject(projectID)
				if p.Developers == nil {
					p.Developers = map[string]*models.Developer{}
				}
				p.Developers[devID] = &models.Developer{ID: devID, ProjectID: projectID, Connected: true, LastSeen: time.Now(), Files: map[string]*models.FileRecord{}}
				s.broadcastEvent(projectID, models.EventDeveloperConnected, map[string]any{"developerId": devID})
			}
		case "workspace_snapshot":
			if developerID, ok := payload["developerId"].(string); ok {
				if dev, ok := s.store.GetOrCreateProject(projectID).Developers[developerID]; ok {
					dev.Connected = true
					dev.LastSeen = time.Now()
				}
				if filesRaw, ok := payload["files"].(map[string]any); ok {
					for path, recRaw := range filesRaw {
						if rec, ok := recRaw.(map[string]any); ok {
							if content, ok := rec["content"].(string); ok {
								if filePath := filepath.Clean(path); filePath != "." {
									fileRecord := &models.FileRecord{Path: filepath.ToSlash(filePath), Hash: fmt.Sprintf("hash-%s", filePath), Content: content, Size: int64(len(content)), ModifiedAt: time.Now()}
									s.store.UpsertFile(projectID, developerID, fileRecord)
								}
							}
					}
				}
				}
				if err := s.recomputeIssues(projectID); err != nil {
					log.Printf("recompute issues error: %v", err)
				}
			}
		case "file_changed":
			if developerID, ok := payload["developerId"].(string); ok {
				if path, ok := payload["path"].(string); ok {
					p := s.store.GetOrCreateProject(projectID)
					if dev, ok := p.Developers[developerID]; ok {
						content, _ := payload["content"].(string)
						dev.Files[path] = &models.FileRecord{Path: path, Hash: fmt.Sprintf("hash-%s", path), Content: content, Size: int64(len(content)), ModifiedAt: time.Now()}
					}
				}
				s.broadcastEvent(projectID, models.EventFileChangedNotice, map[string]any{"developerId": developerID, "path": payload["path"]})
				if err := s.recomputeIssues(projectID); err != nil {
					log.Printf("recompute issues error: %v", err)
				}
			}
		case "file_deleted":
			if developerID, ok := payload["developerId"].(string); ok {
				if path, ok := payload["path"].(string); ok {
					s.store.DeleteFile(projectID, developerID, path)
				}
			}
		case "heartbeat":
			if developerID, ok := payload["developerId"].(string); ok {
				if dev, ok := s.store.GetOrCreateProject(projectID).Developers[developerID]; ok {
					dev.LastSeen = time.Now()
				}
			}
		}
	}
}

func (s *Server) recomputeIssues(projectID string) error {
	project, ok := s.store.GetProject(projectID)
	if !ok {
		return fmt.Errorf("project not found")
	}
	graphBuilder := analyzers.DependencyGraphBuilder{}
	project.Graph = graphBuilder.Build(projectID, project.Developers)
	missingAnalyzer := analyzers.MissingDependenciesAnalyzer{}
	contractAnalyzer := analyzers.APIContractAnalyzer{}
	missing := missingAnalyzer.Analyze(projectID, project.Developers)
	contract := contractAnalyzer.Analyze(projectID, project.Developers)
	for _, issue := range append(missing, contract...) {
		if _, ok := project.Issues[issue.ID]; !ok {
			project.Issues[issue.ID] = issue
			s.broadcastEvent(projectID, models.EventIssueDetected, issue)
		} else {
			project.Issues[issue.ID] = issue
			s.broadcastEvent(projectID, models.EventIssueUpdated, issue)
		}
	}
	for _, issue := range project.Issues {
		if issue.Status == models.IssueStatusResolved {
			continue
		}
		if !containsIssue(append(missing, contract...), issue.ID) {
			s.broadcastEvent(projectID, models.EventIssueResolved, issue)
			issue.Status = models.IssueStatusResolved
		}
	}
	project.UpdatedAt = time.Now()
	return nil
}

func containsIssue(issues []*models.Issue, id string) bool {
	for _, issue := range issues {
		if issue.ID == id {
			return true
		}
	}
	return false
}

func (s *Server) broadcastEvent(projectID string, eventType models.EventType, data any) {
	payload := map[string]any{
		"type":      string(eventType),
		"projectId": projectID,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"data":      data,
	}
	msg, err := json.Marshal(payload)
	if err != nil {
		return
	}
	s.ws.BroadcastToRole(projectID, "client", payload)
	_ = msg
}

func errorResponse(msg string) map[string]any {
	return map[string]any{"error": msg}
}

func respondJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
