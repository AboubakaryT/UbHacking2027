package analyzers

import (
	"testing"
	"time"

	"codeanalysis-platform/internal/models"
)

func TestScopedPackageImport(t *testing.T) {
	test := map[string]*models.Developer{
		"dev": {
			ID: "dev",
			Files: map[string]*models.FileRecord{
				"src/index.ts": {Path: "src/index.ts", Content: `import { foo } from '@acme/ui';`, ModifiedAt: time.Now()},
				"package.json": {Path: "package.json", Content: `{"dependencies":{"@acme/ui":"1.0.0"}}`, ModifiedAt: time.Now()},
			},
		},
	}
	issues := (&MissingDependenciesAnalyzer{}).Analyze("proj", test)
	if len(issues) != 0 {
		t.Fatalf("unexpected issues for scoped package import: %+v", issues)
	}
}

func TestNodeBuiltinImport(t *testing.T) {
	issues := (&MissingDependenciesAnalyzer{}).Analyze("proj", map[string]*models.Developer{
		"dev": {
			ID: "dev",
			Files: map[string]*models.FileRecord{
				"src/index.js": {Path: "src/index.js", Content: `const fs = require('fs');`, ModifiedAt: time.Now()},
				"package.json": {Path: "package.json", Content: `{"dependencies":{}}`, ModifiedAt: time.Now()},
			},
		},
	})
	if len(issues) != 0 {
		t.Fatalf("builtin Node modules should not be reported as missing: %+v", issues)
	}
}

func TestRelativeImportResolution(t *testing.T) {
	issues := (&MissingDependenciesAnalyzer{}).Analyze("proj", map[string]*models.Developer{
		"dev": {
			ID: "dev",
			Files: map[string]*models.FileRecord{
				"src/index.ts": {Path: "src/index.ts", Content: `import util from './util';`, ModifiedAt: time.Now()},
				"src/util.ts": {Path: "src/util.ts", Content: `export default 42;`, ModifiedAt: time.Now()},
				"package.json": {Path: "package.json", Content: `{"dependencies":{}}`, ModifiedAt: time.Now()},
			},
		},
	})
	if len(issues) != 0 {
		t.Fatalf("relative import should resolve without issue: %+v", issues)
	}
}

func TestAPIContractBreakingDetection(t *testing.T) {
	issues := (&APIContractAnalyzer{}).Analyze("proj", map[string]*models.Developer{
		"dev": {
			ID: "dev",
			Files: map[string]*models.FileRecord{
				"src/api.ts": {Path: "src/api.ts", Content: `return response.user.email;`, ModifiedAt: time.Now()},
			},
		},
	})
	if len(issues) == 0 {
		t.Fatal("expected API contract check to return at least a potential issue")
	}
}

func TestDependencyGraphBuild(t *testing.T) {
	graph := (&DependencyGraphBuilder{}).Build("proj", map[string]*models.Developer{
		"dev": {
			ID: "dev",
			Files: map[string]*models.FileRecord{
				"src/index.ts": {Path: "src/index.ts", Content: `import { foo } from '@acme/ui'; import util from './util';`, ModifiedAt: time.Now()},
				"src/util.ts": {Path: "src/util.ts", Content: `export default 'x';`, ModifiedAt: time.Now()},
			},
		},
	})
	if len(graph.Nodes) == 0 {
		t.Fatal("expected graph nodes to be generated")
	}
}
