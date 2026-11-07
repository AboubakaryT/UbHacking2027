package analyzers

import (
	"regexp"
	"strings"

	"codeanalysis-platform/internal/models"
)

type APIContractAnalyzer struct{}

func (a *APIContractAnalyzer) Analyze(projectID string, developers map[string]*models.Developer) []*models.Issue {
	issues := []*models.Issue{}
	seen := map[string]bool{}
	for _, dev := range developers {
		if dev == nil {
			continue
		}
		for path, file := range dev.Files {
			if !strings.Contains(path, "/api/") && !strings.Contains(path, "/server/") && !strings.Contains(path, "api.") && !strings.Contains(path, "routes") {
				continue
			}
			if !strings.Contains(file.Content, "response") && !strings.Contains(file.Content, "res.") && !strings.Contains(file.Content, "JSON") {
				continue
			}
			lines := strings.Split(file.Content, "\n")
			for i, line := range lines {
				if strings.Contains(line, "res.json") || strings.Contains(line, "return response") || strings.Contains(line, "response.") {
					if matches := extractFieldNames(line); len(matches) > 0 {
						for _, field := range matches {
							key := projectID + "|" + path + "|" + field + "|" + string(rune(i))
							if !seen[key] {
								seen[key] = true
							}
						}
					}
				}
			}
		}
	}
	if len(seen) > 0 {
		issues = append(issues, &models.Issue{
			ID:            "api-contract-compatibility-check",
			ProjectID:     projectID,
			Category:      "api_contract_conflict",
			Severity:      models.SeverityHigh,
			Status:        models.IssueStatusActive,
			Verified:      false,
			AffectedFiles: []string{"api-contracts"},
			Title:         "Potential API response contract drift",
			Description:  "One or more workspace files appear to define or consume API response fields that may no longer match across developers.",
			Details:       map[string]any{"evidence": seen},
		})
	}
	return issues
}

func extractFieldNames(s string) []string {
	fields := []string{}
	re := regexp.MustCompile(`(?:\.|\[\s*['\"]?)([A-Za-z_][A-Za-z0-9_]*)`)
	for _, match := range re.FindAllStringSubmatch(s, -1) {
		if len(match) > 1 {
			field := match[1]
			if !strings.Contains(field, "res") && !strings.Contains(field, "response") && field != "json" {
				fields = append(fields, field)
			}
		}
	}
	return fields
}
