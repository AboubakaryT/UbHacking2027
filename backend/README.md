# Code Analysis Platform Backend

This backend provides the central server and local workspace agent for a real-time collaborative code analysis platform.

## Features

- Real-time agent and client WebSocket channels
- Project and developer tracking in memory
- Dependency and workspace issue analysis
- API contract compatibility checks
- Dependency graph generation
- HTTP endpoints for project state and issues

## Run the server

```bash
cd backend
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
go run ./cmd/server
```

## Run an agent

```bash
go run ./cmd/agent --project-id demo-project --developer-id developer-a --root /path/to/repo --server http://localhost:8080
```

## HTTP endpoints

- `GET /health`
- `GET /api/projects/{projectId}/developers`
- `GET /api/projects/{projectId}/files`
- `GET /api/projects/{projectId}/files/content?developerId=...&path=...`
- `GET /api/projects/{projectId}/issues`
- `GET /api/projects/{projectId}/issues/{issueId}`
- `GET /api/projects/{projectId}/graph`
- `GET /api/projects/{projectId}/activity`
- `POST /api/projects/{projectId}/issues/{issueId}/dismiss`
- `POST /api/projects/{projectId}/issues/{issueId}/resolve`

## WebSocket channels

- `/ws/agent` for workspace agents
- `/ws/client` for frontend clients

The server broadcasts issue and dependency graph updates using envelope payloads.
