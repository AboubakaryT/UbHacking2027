package analyzers

import (
	"fmt"
	"path/filepath"
	"strings"

	"codeanalysis-platform/internal/models"
)

type DependencyGraphBuilder struct{}

func (b *DependencyGraphBuilder) Build(projectID string, developers map[string]*models.Developer) models.DependencyGraph {
	nodes := map[string]models.GraphNode{}
	edges := map[string]models.GraphEdge{}
	for _, dev := range developers {
		if dev == nil {
			continue
		}
		for path, file := range dev.Files {
			if file == nil {
				continue
			}
			nodeID := fmt.Sprintf("file-%s", path)
			nodes[nodeID] = models.GraphNode{ID: nodeID, NodeType: "file", Label: filepath.Base(path), Path: path}
			for _, imp := range findImports(file.Content) {
				if strings.HasPrefix(imp, ".") || strings.HasPrefix(imp, "/") {
					targetID := fmt.Sprintf("file-%s", filepath.Clean(filepath.Join(filepath.Dir(path), imp)))
					nodes[targetID] = models.GraphNode{ID: targetID, NodeType: "file", Label: filepath.Base(imp), Path: filepath.Clean(filepath.Join(filepath.Dir(path), imp))}
					edges[fmt.Sprintf("edge-%s-%s", nodeID, targetID)] = models.GraphEdge{ID: fmt.Sprintf("edge-%s-%s", nodeID, targetID), SourceNode: nodeID, TargetNode: targetID, Relationship: "imports"}
				} else if !isNodeBuiltin(imp) && !isURLImport(imp) {
					pkgID := fmt.Sprintf("package-%s", imp)
					nodes[pkgID] = models.GraphNode{ID: pkgID, NodeType: "package", Label: imp}
					edges[fmt.Sprintf("edge-%s-%s", nodeID, pkgID)] = models.GraphEdge{ID: fmt.Sprintf("edge-%s-%s", nodeID, pkgID), SourceNode: nodeID, TargetNode: pkgID, Relationship: "depends_on"}
				}
			}
		}
	}
	result := models.DependencyGraph{Nodes: make([]models.GraphNode, 0, len(nodes)), Edges: make([]models.GraphEdge, 0, len(edges))}
	for _, node := range nodes {
		result.Nodes = append(result.Nodes, node)
	}
	for _, edge := range edges {
		result.Edges = append(result.Edges, edge)
	}
	return result
}
