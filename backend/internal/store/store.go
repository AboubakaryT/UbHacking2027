package store

import (
	"fmt"
	"sort"
	"sync"
	"time"

	"codeanalysis-platform/internal/models"
)

type ProjectStore struct {
	mu       sync.RWMutex
	projects map[string]*models.Project
}

func NewProjectStore() *ProjectStore {
	return &ProjectStore{projects: map[string]*models.Project{}}
}

func (s *ProjectStore) GetOrCreateProject(projectID string) *models.Project {
	s.mu.Lock()
	defer s.mu.Unlock()
	if p, ok := s.projects[projectID]; ok {
		return p
	}
	p := models.NewProject(projectID)
	s.projects[projectID] = p
	return p
}

func (s *ProjectStore) GetProject(projectID string) (*models.Project, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	return p, ok
}

func (s *ProjectStore) ListProjects() []*models.Project {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*models.Project, 0, len(s.projects))
	for _, p := range s.projects {
		out = append(out, p)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

func (s *ProjectStore) UpsertDeveloper(projectID string, dev *models.Developer) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		p = models.NewProject(projectID)
		s.projects[projectID] = p
	}
	if p.Developers == nil {
		p.Developers = map[string]*models.Developer{}
	}
	p.Developers[dev.ID] = dev
	p.UpdatedAt = time.Now()
}

func (s *ProjectStore) UpsertFile(projectID, developerID string, record *models.FileRecord) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		return
	}
	if dev, exists := p.Developers[developerID]; exists {
		if dev.Files == nil {
			dev.Files = map[string]*models.FileRecord{}
		}
		dev.Files[record.Path] = record
		dev.LastSeen = time.Now()
	}
	p.UpdatedAt = time.Now()
}

func (s *ProjectStore) DeleteFile(projectID, developerID, path string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		return
	}
	if dev, exists := p.Developers[developerID]; exists {
		delete(dev.Files, path)
		dev.LastSeen = time.Now()
	}
	p.UpdatedAt = time.Now()
}

func (s *ProjectStore) AddIssue(projectID string, issue *models.Issue) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		return
	}
	p.Issues[issue.ID] = issue
	p.Activity = append(p.Activity, models.ActivityEvent{
		ID:        fmt.Sprintf("activity-%d", time.Now().UnixNano()),
		ProjectID: projectID,
		Type:      issue.Category,
		Message:   issue.Title,
		CreatedAt: time.Now(),
	})
	p.UpdatedAt = time.Now()
}

func (s *ProjectStore) DismissIssue(projectID, issueID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		return false
	}
	if issue, ok := p.Issues[issueID]; ok {
		issue.Status = models.IssueStatusDismissed
		issue.UpdatedAt = time.Now()
		return true
	}
	return false
}

func (s *ProjectStore) ResolveIssue(projectID, issueID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.projects[projectID]
	if !ok {
		return false
	}
	if issue, ok := p.Issues[issueID]; ok {
		issue.Status = models.IssueStatusResolved
		issue.UpdatedAt = time.Now()
		return true
	}
	return false
}

func (s *ProjectStore) ListDevelopers(projectID string) []*models.Developer {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	if !ok {
		return nil
	}
	out := make([]*models.Developer, 0, len(p.Developers))
	for _, d := range p.Developers {
		out = append(out, d)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

func (s *ProjectStore) ListFiles(projectID string) map[string]*models.FileRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	if !ok {
		return map[string]*models.FileRecord{}
	}
	files := map[string]*models.FileRecord{}
	for _, dev := range p.Developers {
		for path, rec := range dev.Files {
			files[path] = rec
		}
	}
	return files
}

func (s *ProjectStore) GetIssue(projectID, issueID string) (*models.Issue, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	if !ok {
		return nil, false
	}
	issue, exists := p.Issues[issueID]
	return issue, exists
}

func (s *ProjectStore) ListIssues(projectID string) []*models.Issue {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	if !ok {
		return nil
	}
	out := make([]*models.Issue, 0, len(p.Issues))
	for _, issue := range p.Issues {
		out = append(out, issue)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.Before(out[j].CreatedAt) })
	return out
}

func (s *ProjectStore) ListActivity(projectID string) []models.ActivityEvent {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.projects[projectID]
	if !ok {
		return nil
	}
	out := append([]models.ActivityEvent(nil), p.Activity...)
	return out
}
