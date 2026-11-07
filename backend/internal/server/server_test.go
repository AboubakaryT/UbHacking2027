package server

import (
	"testing"
	"time"

	"codeanalysis-platform/internal/config"
	"codeanalysis-platform/internal/models"
)

func TestMissingDependencyDetection(t *testing.T) {
	projectID := "proj-1"
	server := NewServer(config.Load())
	project := server.store.GetOrCreateProject(projectID)
	project.Developers["dev-1"] = &models.Developer{
		ID: "dev-1",
		ProjectID: projectID,
		Files: map[string]*models.FileRecord{
			"src/index.ts": {Path: "src/index.ts", Content: `import axios from 'axios';`, ModifiedAt: time.Now()},
			"package.json": {Path: "package.json", Content: `{"dependencies":{"react":"^18.0.0"}}`, ModifiedAt: time.Now()},
		},
	}
	server.recomputeIssues(projectID)
	if len(project.Issues) == 0 {
		t.Fatal("expected missing dependency issue")
	}
}

func TestMultipleDevelopersConnectedToOneProject(t *testing.T) {
	projectID := "proj-2"
	server := NewServer(config.Load())
	server.HandleAgentEvent(projectID, map[string]any{"type": "agent_hello", "developerId": "dev-a"})
	server.HandleAgentEvent(projectID, map[string]any{"type": "agent_hello", "developerId": "dev-b"})
	if len(server.store.GetOrCreateProject(projectID).Developers) != 2 {
		t.Fatalf("expected 2 developers connected, got %d", len(server.store.GetOrCreateProject(projectID).Developers))
	}
}
