package analyzers

import (
	"encoding/json"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"codeanalysis-platform/internal/models"
)

type MissingDependenciesAnalyzer struct{}

func (a *MissingDependenciesAnalyzer) Analyze(projectID string, developers map[string]*models.Developer) []*models.Issue {
	issues := []*models.Issue{}
	for _, dev := range developers {
		if dev == nil || len(dev.Files) == 0 {
			continue
		}
		pkgJSON, ok := dev.Files["package.json"]
		if !ok || pkgJSON == nil {
			continue
		}
		deps, devDeps := parsePackageJSON(pkgJSON.Content)
		for path, rec := range dev.Files {
			if !strings.HasSuffix(path, ".ts") && !strings.HasSuffix(path, ".tsx") && !strings.HasSuffix(path, ".js") && !strings.HasSuffix(path, ".jsx") {
				continue
			}
			content := rec.Content
			for _, imp := range findImports(content) {
				if imp == "" {
					continue
				}
				if isNodeBuiltin(imp) || isRelativeImport(imp) || isURLImport(imp) {
					if isRelativeImport(imp) && !pathExists(dev.Files, filepath.Dir(path), imp) {
						issues = append(issues, &models.Issue{
							ID:            "issue-" + path + "-missing-local",
							ProjectID:     projectID,
							Category:      "missing_dependency",
							Severity:      models.SeverityHigh,
							Status:        models.IssueStatusActive,
							Verified:      true,
							DeveloperID:   dev.ID,
							AffectedFiles: []string{path},
							Title:         "Missing local module",
							Description:   "Relative import could not be resolved: " + imp,
							Details:       map[string]any{"import": imp},
						})
					}
					continue
				}
				if !hasDependency(imp, deps, devDeps) {
					issues = append(issues, &models.Issue{
						ID:            "issue-" + path + "-undeclared-import",
						ProjectID:     projectID,
						Category:      "missing_dependency",
						Severity:      models.SeverityHigh,
						Status:        models.IssueStatusActive,
						Verified:      true,
						DeveloperID:   dev.ID,
						AffectedFiles: []string{path},
						Title:         "Undeclared dependency",
						Description:   "Import is not declared in package.json: " + imp,
						Details:       map[string]any{"import": imp},
					})
				}
			}
		}
	}
	return issues
}

func findImports(content string) []string {
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`from ['"]([^'"]+)['"]`),
		regexp.MustCompile(`import\s*['"]([^'"]+)['"]`),
		regexp.MustCompile(`require\(['"]([^'"]+)['"]\)`),
	}
	seen := map[string]bool{}
	res := []string{}
	for _, re := range patterns {
		for _, match := range re.FindAllStringSubmatch(content, -1) {
			if len(match) < 2 {
				continue
			}
			imp := match[1]
			if !seen[imp] {
				seen[imp] = true
				res = append(res, imp)
			}
		}
	}
	return res
}

func parsePackageJSON(content string) (map[string]string, map[string]string) {
	var pkg map[string]any
	if err := json.Unmarshal([]byte(content), &pkg); err != nil {
		return map[string]string{}, map[string]string{}
	}
	deps := map[string]string{}
	devDeps := map[string]string{}
	for _, key := range []string{"dependencies", "devDependencies"} {
		section, _ := pkg[key].(map[string]any)
		for k, v := range section {
			if s, ok := v.(string); ok {
				if key == "dependencies" {
					deps[k] = s
				} else {
					devDeps[k] = s
				}
			}
		}
	}
	return deps, devDeps
}

func hasDependency(imp string, deps, devDeps map[string]string) bool {
	if strings.HasPrefix(imp, "@") {
		parts := strings.Split(imp, "/")
		if len(parts) >= 2 {
			imp = parts[0] + "/" + parts[1]
		}
	} else {
		parts := strings.Split(imp, "/")
		if len(parts) >= 2 && !strings.HasPrefix(imp, ".") && !strings.HasPrefix(imp, "/") {
			imp = parts[0]
		}
	}
	_, ok := deps[imp]
	if ok {
		return true
	}
	_, ok = devDeps[imp]
	return ok
}

func isNodeBuiltin(imp string) bool {
	builtins := map[string]bool{
		"assert": true, "buffer": true, "child_process": true, "cluster": true, "console": true,
		"crypto": true, "dgram": true, "dns": true, "domain": true, "events": true, "fs": true,
		"http": true, "https": true, "net": true, "os": true, "path": true, "punycode": true,
		"querystring": true, "readline": true, "repl": true, "stream": true, "string_decoder": true,
		"tls": true, "tty": true, "url": true, "util": true, "v8": true, "vm": true, "zlib": true,
	}
	return builtins[imp]
}

func isRelativeImport(imp string) bool {
	return strings.HasPrefix(imp, "./") || strings.HasPrefix(imp, "../") || strings.HasPrefix(imp, "/")
}

func isURLImport(imp string) bool {
	return strings.HasPrefix(imp, "http://") || strings.HasPrefix(imp, "https://") || strings.HasPrefix(imp, "data:")
}

func pathExists(files map[string]*models.FileRecord, baseDir, importPath string) bool {
	if !filepath.IsAbs(importPath) {
		resolved := filepath.Clean(filepath.Join(baseDir, importPath))
		if _, ok := files[resolved]; ok {
			return true
		}
		candidates := []string{
			resolved + ".ts", resolved + ".tsx", resolved + ".js", resolved + ".jsx", resolved + ".mjs", resolved + ".cjs",
			filepath.Join(resolved, "index.ts"), filepath.Join(resolved, "index.tsx"), filepath.Join(resolved, "index.js"), filepath.Join(resolved, "index.jsx"),
		}
		for _, candidate := range candidates {
			if _, ok := files[candidate]; ok {
				return true
			}
		}
	}
	return false
}

func init() {
	_ = os.Getenv
}
