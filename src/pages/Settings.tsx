import { useState, type ReactNode } from 'react'
import { Bell, Bot, Eye, Server } from 'lucide-react'
import { Button, PanelHeader } from '../components/ui'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center">
      <span className="text-sm text-slate-300">
        {label}
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const input =
  'w-full rounded-lg border border-nebula-500/30 bg-space-850 px-3 py-2 text-sm text-white outline-none focus:border-nebula-400'

function Toggle({
  label,
  defaultOn = true,
}: {
  label: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className="flex w-full items-center justify-between py-1.5 text-sm text-slate-300"
    >
      {label}
      <span
        className={`relative h-5 w-9 rounded-full transition ${on ? 'bg-nebula-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${on ? 'left-4.5' : 'left-0.5'}`}
        />
      </span>
    </button>
  )
}

export default function Settings() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <section className="panel">
        <PanelHeader
          icon={<Server className="size-4" />}
          title="Server connection"
        />
        <div className="flex flex-col gap-4 p-4">
          <Field label="WebSocket URL">
            <input className={input} defaultValue="ws://localhost:8080/ws" />
          </Field>
          <Field label="Project ID">
            <input className={input} defaultValue="team/hackathon-project" />
          </Field>
          <Field label="Your developer ID">
            <input className={input} defaultValue="bob" />
          </Field>
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={<Eye className="size-4" />} title="File watcher" />
        <div className="flex flex-col gap-4 p-4">
          <Field label="Watched paths" hint="Comma separated globs">
            <input
              className={input}
              defaultValue="src/**, server/**, shared/**"
            />
          </Field>
          <Field label="Ignored paths">
            <input
              className={input}
              defaultValue="node_modules/**, dist/**, .git/**"
            />
          </Field>
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={<Bot className="size-4" />} title="AI analysis" />
        <div className="flex flex-col gap-4 p-4">
          <Field label="Model">
            <select className={input} defaultValue="claude-sonnet-5-5">
              <option value="claude-opus-5-5">Claude Opus 5.5</option>
              <option value="claude-sonnet-5-5">Claude Sonnet 5.5</option>
              <option value="claude-haiku-5-5">Claude Haiku 5.5</option>
            </select>
          </Field>
          <Field
            label="Min. confidence to alert"
            hint="Hide low-confidence predictions"
          >
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={60}
              className="accent-nebula-500"
            />
          </Field>
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={<Bell className="size-4" />} title="Notifications" />
        <div className="divide-nebula-500/10 divide-y px-4 py-2">
          <Toggle label="Critical and high conflicts" />
          <Toggle label="Medium conflicts" />
          <Toggle label="Low conflicts" defaultOn={false} />
          <Toggle
            label="Developer connected / disconnected"
            defaultOn={false}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button>Save settings</Button>
      </div>
    </div>
  )
}
