package agent

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"codeanalysis-platform/internal/config"
	"codeanalysis-platform/internal/models"

	"github.com/fsnotify/fsnotify"
	"github.com/gorilla/websocket"
)

type WorkspaceAgent struct {
	ProjectID    string
	DeveloperID  string
	RepoID       string
	Branch       string
	BaseCommit   string
	RootPath     string
	Conn         *websocket.Conn
	Cfg          config.Config
	watcher      *fsnotify.Watcher
	lastSeen     map[string]time.Time
	files        map[string]*models.FileRecord
}

func NewWorkspaceAgent(cfg config.Config, projectID, developerID, repoID, rootPath string) (*WorkspaceAgent, error) {
	w, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	return &WorkspaceAgent{
		ProjectID:   projectID,
		DeveloperID: developerID,
		RepoID:     repoID,
		Branch:     "main",
		BaseCommit: "HEAD",
		RootPath:    rootPath,
		Cfg:        cfg,
		watcher:    w,
		lastSeen:   map[string]time.Time{},
		files:      map[string]*models.FileRecord{},
	}, nil
}

func (a *WorkspaceAgent) ListenAndSend(serverURL string) error {
	wsURL := strings.Replace(serverURL, "http://", "ws://", 1)
	conn, _, err := websocket.DefaultDialer.Dial(wsURL+"/ws/agent", nil)
	if err != nil {
		return err
	}
	a.Conn = conn
	defer conn.Close()
	if err := a.sendEvent(models.EventAgentHello, map[string]any{
		"projectId": a.ProjectID,
		"developerId": a.DeveloperID,
		"repoId": a.RepoID,
		"branch": a.Branch,
		"baseCommit": a.BaseCommit,
	}); err != nil {
		return err
	}
	if err := a.syncSnapshot(); err != nil {
		return err
	}
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return err
		}
	}
}

func (a *WorkspaceAgent) syncSnapshot() error {
	files, err := a.walkFiles(a.RootPath)
	if err != nil {
		return err
	}
	payload := map[string]any{
		"projectId": a.ProjectID,
		"developerId": a.DeveloperID,
		"repoId": a.RepoID,
		"branch": a.Branch,
		"baseCommit": a.BaseCommit,
		"files": files,
	}
	return a.sendEvent(models.EventWorkspaceSnapshot, payload)
}

func (a *WorkspaceAgent) sendEvent(eventType models.EventType, data map[string]any) error {
	if a.Conn == nil {
		return fmt.Errorf("agent websocket not connected")
	}
	msg, err := json.Marshal(models.Envelope{Type: eventType, ProjectID: a.ProjectID, Timestamp: time.Now(), Data: data})
	if err != nil {
		return err
	}
	return a.Conn.WriteMessage(websocket.TextMessage, msg)
}

func (a *WorkspaceAgent) walkFiles(root string) (map[string]*models.FileRecord, error) {
	out := map[string]*models.FileRecord{}
	err := filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if shouldIgnoreDir(info.Name()) {
				return filepath.SkipDir
			}
			return nil
		}
		if shouldIgnoreFile(path) {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		if len(content) > a.Cfg.MaxFileSize {
			return nil
		}
		hash := sha256.Sum256(content)
		out[filepath.ToSlash(rel)] = &models.FileRecord{
			Path:       filepath.ToSlash(rel),
			Hash:       hex.EncodeToString(hash[:]),
			Content:    string(content),
			Size:       int64(len(content)),
			ModifiedAt: time.Now(),
		}
		return nil
	})
	return out, err
}

func shouldIgnoreDir(name string) bool {
	ignores := map[string]bool{".git": true, "node_modules": true, "dist": true, "build": true, ".next": true}
	return ignores[name]
}

func shouldIgnoreFile(path string) bool {
	lower := strings.ToLower(path)
	if strings.Contains(lower, ".env") || strings.Contains(lower, ".pem") || strings.Contains(lower, ".key") {
		return true
	}
	for _, ext := range []string{".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".pdf", ".zip", ".exe", ".dll"} {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}

func (a *WorkspaceAgent) StartWatching() error {
	if err := a.watcher.Add(a.RootPath); err != nil {
		return err
	}
	for event := range a.watcher.Events {
		if event.Op&(fsnotify.Create|fsnotify.Write|fsnotify.Rename|fsnotify.Remove) != 0 {
			if shouldIgnoreFile(event.Name) {
				continue
			}
			rel, err := filepath.Rel(a.RootPath, event.Name)
			if err != nil {
				continue
			}
			path := filepath.ToSlash(rel)
			time.Sleep(200 * time.Millisecond)
			if event.Op&fsnotify.Remove != 0 {
				if err := a.sendEvent(models.EventFileDeleted, map[string]any{"path": path}); err != nil {
					log.Println("delete event failed:", err)
				}
				continue
			}
			data, err := os.ReadFile(event.Name)
			if err != nil {
				continue
			}
			if len(data) > a.Cfg.MaxFileSize {
				continue
			}
			hash := sha256.Sum256(data)
			payload := map[string]any{
				"path": path,
				"hash": hex.EncodeToString(hash[:]),
				"content": string(data),
				"size": len(data),
			}
			if err := a.sendEvent(models.EventFileChanged, payload); err != nil {
				log.Println("file changed event failed:", err)
			}
		}
	}
	return nil
}

func (a *WorkspaceAgent) hashContent(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}

func normalizeContent(content []byte) string {
	return string(bytes.TrimSpace(content))
}
