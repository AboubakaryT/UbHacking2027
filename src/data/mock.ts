import type {
  ActivityEvent,
  Conflict,
  DependencyGraph,
  Developer,
  Issue,
} from './types'

// Dummy data for the UI. Replace with the WebSocket feed from the Go server.

const now = Date.now()
const ago = (sec: number) => new Date(now - sec * 1000).toISOString()

export const PROJECT_ID = 'team/hackathon-project'

export const developers: Developer[] = [
  {
    id: 'alice',
    projectId: PROJECT_ID,
    repoId: 'hackathon-project',
    branch: 'feature/user-api',
    baseCommit: '67abe09',
    connected: true,
    lastSeen: ago(4),
    files: {
      'server/routes/users.ts': {
        path: 'server/routes/users.ts',
        hash: 'a91f3c',
        size: 2140,
        modifiedAt: ago(42),
      },
      'server/services/userService.ts': {
        path: 'server/services/userService.ts',
        hash: '7be210',
        size: 3310,
        modifiedAt: ago(130),
      },
      'shared/auth.ts': {
        path: 'shared/auth.ts',
        hash: 'c03d9e',
        size: 1580,
        modifiedAt: ago(300),
      },
    },
  },
  {
    id: 'bob',
    projectId: PROJECT_ID,
    repoId: 'hackathon-project',
    branch: 'feature/profile-page',
    baseCommit: '67abe09',
    connected: true,
    lastSeen: ago(2),
    files: {
      'web/src/components/ProfileCard.tsx': {
        path: 'web/src/components/ProfileCard.tsx',
        hash: 'f4410a',
        size: 1920,
        modifiedAt: ago(18),
      },
      'web/src/pages/Login.tsx': {
        path: 'web/src/pages/Login.tsx',
        hash: '12ab77',
        size: 2600,
        modifiedAt: ago(220),
      },
    },
  },
  {
    id: 'carol',
    projectId: PROJECT_ID,
    repoId: 'hackathon-project',
    branch: 'feature/dashboard-ui',
    baseCommit: '7ede436',
    connected: true,
    lastSeen: ago(9),
    files: {
      'web/src/pages/Dashboard.tsx': {
        path: 'web/src/pages/Dashboard.tsx',
        hash: '88d0e1',
        size: 4100,
        modifiedAt: ago(75),
      },
      'web/src/utils/format.ts': {
        path: 'web/src/utils/format.ts',
        hash: '5531fa',
        size: 640,
        modifiedAt: ago(95),
      },
    },
  },
  {
    id: 'dan',
    projectId: PROJECT_ID,
    repoId: 'hackathon-project',
    branch: 'main',
    baseCommit: 'fb84c46',
    connected: false,
    lastSeen: ago(3600),
    files: {},
  },
]

export const issues: Issue[] = [
  {
    id: 'issue-001',
    projectId: PROJECT_ID,
    category: 'api_contract',
    severity: 'critical',
    status: 'active',
    verified: true,
    developerId: 'alice',
    affectedFiles: [
      'server/routes/users.ts',
      'web/src/components/ProfileCard.tsx',
    ],
    title: 'GET /api/users/:id response shape changed',
    description:
      "alice nested the response under `user` and renamed `name` → `fullName`. bob's ProfileCard still reads `data.name`.",
    details: { endpoint: 'GET /api/users/:id', confidence: 0.94 },
    createdAt: ago(40),
    updatedAt: ago(15),
  },
  {
    id: 'issue-002',
    projectId: PROJECT_ID,
    category: 'signature_change',
    severity: 'high',
    status: 'active',
    verified: true,
    developerId: 'alice',
    affectedFiles: ['shared/auth.ts', 'web/src/pages/Login.tsx'],
    title: 'verifyUser() now throws on inactive users',
    description:
      'verifyUser no longer returns null for unknown users and throws instead. Login.tsx still checks for a null return.',
    details: { symbol: 'verifyUser', confidence: 0.81 },
    createdAt: ago(290),
    updatedAt: ago(200),
  },
  {
    id: 'issue-003',
    projectId: PROJECT_ID,
    category: 'missing_dependency',
    severity: 'medium',
    status: 'active',
    verified: false,
    developerId: 'carol',
    affectedFiles: ['web/src/utils/format.ts', 'package.json'],
    title: "'date-fns' imported but not in package.json",
    description:
      "carol's format.ts imports date-fns, which is installed on her machine but isn't declared as a dependency.",
    details: { package: 'date-fns', confidence: 0.67 },
    createdAt: ago(90),
    updatedAt: ago(90),
  },
  {
    id: 'issue-004',
    projectId: PROJECT_ID,
    category: 'api_contract',
    severity: 'low',
    status: 'resolved',
    verified: true,
    developerId: 'bob',
    affectedFiles: ['web/src/api/client.ts'],
    title: 'Base URL constant renamed',
    description: 'API_URL → API_BASE_URL. All call sites updated.',
    createdAt: ago(5400),
    updatedAt: ago(4800),
  },
]

export const conflicts: Record<string, Conflict> = {
  'issue-001': {
    issueId: 'issue-001',
    source: {
      developerId: 'alice',
      path: 'server/routes/users.ts',
      language: 'typescript',
      original: `router.get('/api/users/:id', async (req, res) => {
  const user = await userService.find(req.params.id)
  if (!user) return res.status(404).end()

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
  })
})`,
      modified: `router.get('/api/users/:id', async (req, res) => {
  const user = await userService.find(req.params.id)
  if (!user) return res.status(404).end()

  res.json({
    user: {
      id: user.id,
      fullName: \`\${user.first} \${user.last}\`,
      email: user.email,
    },
    meta: { fetchedAt: Date.now() },
  })
})`,
    },
    impacted: {
      developerId: 'bob',
      path: 'web/src/components/ProfileCard.tsx',
      language: 'typescript',
      original: `export function ProfileCard({ id }: { id: string }) {
  const { data } = useFetch(\`/api/users/\${id}\`)
  if (!data) return <Spinner />

  return (
    <Card>
      <Avatar name={data.name} />
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </Card>
  )
}`,
      modified: `export function ProfileCard({ id }: { id: string }) {
  const { data } = useFetch(\`/api/users/\${id}\`)
  if (!data) return <Spinner />

  return (
    <Card>
      <Avatar name={data.name} />
      <h2>{data.name}</h2>
      <p>{data.email}</p>
      <EditProfileButton userId={data.id} />
    </Card>
  )
}`,
    },
    ai: {
      confidence: 0.94,
      why: [
        'alice wrapped the response body in a `user` object.',
        '`name` was renamed to `fullName`.',
        'ProfileCard reads `data.name`, `data.email` and `data.id` at the top level, so all three will be undefined.',
      ],
      suggestedFix: `const { data } = useFetch(\`/api/users/\${id}\`)
const user = data?.user
if (!user) return <Spinner />

return (
  <Card>
    <Avatar name={user.fullName} />
    <h2>{user.fullName}</h2>
    <p>{user.email}</p>
    <EditProfileButton userId={user.id} />
  </Card>
)`,
      suggestedFixLanguage: 'typescript',
      steps: [
        'bob: read fields from `data.user` in ProfileCard.',
        'Use `fullName` instead of `name`.',
        'alice: consider a `/v2` route if other clients use this endpoint.',
      ],
    },
  },
  'issue-002': {
    issueId: 'issue-002',
    source: {
      developerId: 'alice',
      path: 'shared/auth.ts',
      language: 'typescript',
      original: `export async function verifyUser(user: User) {
  const res = await api.post('/auth/verify', user)
  if (!res.ok) return null
  return res.json()
}`,
      modified: `export async function verifyUser(user: User) {
  const res = await api.post('/auth/verify', user)
  if (!res.ok || !user.isActive) {
    throw new AuthError('Invalid user')
  }
  return res.json()
}`,
    },
    impacted: {
      developerId: 'bob',
      path: 'web/src/pages/Login.tsx',
      language: 'typescript',
      original: `async function onSubmit(user: User) {
  const session = await verifyUser(user)
  if (!session) {
    setError('User not found')
    return
  }
  navigate('/home')
}`,
      modified: `async function onSubmit(user: User) {
  setLoading(true)
  const session = await verifyUser(user)
  if (!session) {
    setError('User not found')
    return
  }
  navigate('/home')
}`,
    },
    ai: {
      confidence: 0.81,
      why: [
        'verifyUser used to return `null` on failure. It now throws `AuthError`.',
        "Login.tsx checks `if (!session)`, a branch that won't run anymore.",
        'The exception is uncaught, so `setLoading(true)` never gets reset.',
      ],
      suggestedFix: `async function onSubmit(user: User) {
  setLoading(true)
  try {
    await verifyUser(user)
    navigate('/home')
  } catch (err) {
    setError(err instanceof AuthError ? err.message : 'Login failed')
  } finally {
    setLoading(false)
  }
}`,
      suggestedFixLanguage: 'typescript',
      steps: [
        'Wrap the verifyUser call in try/catch.',
        'Reset loading state in `finally`.',
        'Update other callers of verifyUser (2 more found).',
      ],
    },
  },
  'issue-003': {
    issueId: 'issue-003',
    source: {
      developerId: 'carol',
      path: 'web/src/utils/format.ts',
      language: 'typescript',
      original: `export function formatDate(d: Date) {
  return d.toLocaleDateString()
}`,
      modified: `import { format } from 'date-fns'

export function formatDate(d: Date) {
  return format(d, 'MMM d, yyyy')
}`,
    },
    impacted: {
      developerId: 'carol',
      path: 'package.json',
      language: 'json',
      original: `{
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  }
}`,
      modified: `{
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  }
}`,
    },
    ai: {
      confidence: 0.67,
      why: [
        "format.ts imports 'date-fns'.",
        "package.json doesn't list it, so a clean install or CI build will fail.",
      ],
      suggestedFix: `npm install date-fns`,
      suggestedFixLanguage: 'shell',
      steps: ['Add date-fns to dependencies.', 'Commit the updated lockfile.'],
    },
  },
}

export const graph: DependencyGraph = {
  nodes: [
    {
      id: 'ep-users',
      nodeType: 'endpoint',
      label: 'GET /api/users/:id',
      issueStatus: 'critical',
    },
    { id: 'ep-verify', nodeType: 'endpoint', label: 'POST /auth/verify' },
    {
      id: 'f-users-route',
      nodeType: 'file',
      label: 'routes/users.ts',
      path: 'server/routes/users.ts',
      issueStatus: 'critical',
    },
    {
      id: 'f-user-svc',
      nodeType: 'file',
      label: 'userService.ts',
      path: 'server/services/userService.ts',
    },
    {
      id: 'f-auth',
      nodeType: 'file',
      label: 'shared/auth.ts',
      path: 'shared/auth.ts',
      issueStatus: 'high',
    },
    {
      id: 'fn-verify',
      nodeType: 'function',
      label: 'verifyUser()',
      issueStatus: 'high',
    },
    {
      id: 'c-profile',
      nodeType: 'component',
      label: 'ProfileCard.tsx',
      path: 'web/src/components/ProfileCard.tsx',
      issueStatus: 'critical',
    },
    {
      id: 'c-login',
      nodeType: 'component',
      label: 'Login.tsx',
      path: 'web/src/pages/Login.tsx',
      issueStatus: 'high',
    },
    {
      id: 'c-dashboard',
      nodeType: 'component',
      label: 'Dashboard.tsx',
      path: 'web/src/pages/Dashboard.tsx',
    },
    {
      id: 'f-format',
      nodeType: 'file',
      label: 'utils/format.ts',
      path: 'web/src/utils/format.ts',
      issueStatus: 'medium',
    },
    {
      id: 'pkg-datefns',
      nodeType: 'package',
      label: 'date-fns',
      issueStatus: 'medium',
    },
  ],
  edges: [
    {
      id: 'e1',
      sourceNode: 'f-users-route',
      targetNode: 'ep-users',
      relationship: 'defines',
    },
    {
      id: 'e2',
      sourceNode: 'f-users-route',
      targetNode: 'f-user-svc',
      relationship: 'imports',
    },
    {
      id: 'e3',
      sourceNode: 'c-profile',
      targetNode: 'ep-users',
      relationship: 'calls',
    },
    {
      id: 'e4',
      sourceNode: 'f-auth',
      targetNode: 'fn-verify',
      relationship: 'defines',
    },
    {
      id: 'e5',
      sourceNode: 'fn-verify',
      targetNode: 'ep-verify',
      relationship: 'calls',
    },
    {
      id: 'e6',
      sourceNode: 'c-login',
      targetNode: 'fn-verify',
      relationship: 'calls',
    },
    {
      id: 'e7',
      sourceNode: 'c-dashboard',
      targetNode: 'c-profile',
      relationship: 'renders',
    },
    {
      id: 'e8',
      sourceNode: 'c-dashboard',
      targetNode: 'f-format',
      relationship: 'imports',
    },
    {
      id: 'e9',
      sourceNode: 'f-format',
      targetNode: 'pkg-datefns',
      relationship: 'imports',
    },
  ],
}

export const activity: ActivityEvent[] = [
  {
    id: 'a1',
    projectId: PROJECT_ID,
    type: 'file_changed',
    message: 'bob edited web/src/components/ProfileCard.tsx',
    createdAt: ago(18),
  },
  {
    id: 'a2',
    projectId: PROJECT_ID,
    type: 'issue_detected',
    message: 'Critical: GET /api/users/:id response shape changed',
    createdAt: ago(40),
  },
  {
    id: 'a3',
    projectId: PROJECT_ID,
    type: 'file_changed',
    message: 'alice edited server/routes/users.ts',
    createdAt: ago(42),
  },
  {
    id: 'a4',
    projectId: PROJECT_ID,
    type: 'file_changed',
    message: 'carol edited web/src/pages/Dashboard.tsx',
    createdAt: ago(75),
  },
  {
    id: 'a5',
    projectId: PROJECT_ID,
    type: 'issue_detected',
    message: "Medium: 'date-fns' not in package.json",
    createdAt: ago(90),
  },
  {
    id: 'a6',
    projectId: PROJECT_ID,
    type: 'developer_connected',
    message: 'carol connected (feature/dashboard-ui)',
    createdAt: ago(600),
  },
  {
    id: 'a7',
    projectId: PROJECT_ID,
    type: 'issue_resolved',
    message: 'Resolved: Base URL constant renamed',
    createdAt: ago(4800),
  },
  {
    id: 'a8',
    projectId: PROJECT_ID,
    type: 'developer_disconnected',
    message: 'dan disconnected',
    createdAt: ago(3600),
  },
]

export const devColors: Record<string, string> = {
  alice: '#f472b6',
  bob: '#38bdf8',
  carol: '#facc15',
  dan: '#94a3b8',
}

export function timeAgo(iso: string) {
  const s = Math.max(
    1,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  )
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  return `${Math.round(s / 3600)}h ago`
}
