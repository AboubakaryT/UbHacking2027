package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"codeanalysis-platform/internal/agent"
	"codeanalysis-platform/internal/config"
)

func main() {
	cfg := config.Load()
	projectID := flag.String("project-id", "demo-project", "shared project identifier")
	developerID := flag.String("developer-id", "developer-a", "local developer identifier")
	repoID := flag.String("repo-id", "demo-repo", "repository identifier")
	root := flag.String("root", ".", "repository root path")
	serverURL := flag.String("server", "http://localhost:8080", "central analysis server URL")
	flag.Parse()

	workspace, err := agent.NewWorkspaceAgent(cfg, *projectID, *developerID, *repoID, *root)
	if err != nil {
		log.Fatalf("failed to create workspace agent: %v", err)
	}
	if err := workspace.ListenAndSend(*serverURL); err != nil {
		log.Printf("agent connection failed: %v", err)
		fmt.Println("If the server is not running, start it with: go run ./cmd/server")
		os.Exit(1)
	}
}
