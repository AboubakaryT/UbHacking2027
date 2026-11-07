import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Workspace from './pages/Workspace'
import Conflicts from './pages/Conflicts'
import GraphPage from './pages/GraphPage'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="conflicts" element={<Conflicts />} />
          <Route path="conflicts/:id" element={<Conflicts />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
