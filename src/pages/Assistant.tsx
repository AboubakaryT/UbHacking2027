import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Sparkles } from 'lucide-react'
import { issues } from '../data/mock'
import { DevAvatar } from '../components/ui'

interface Msg {
  role: 'user' | 'ai'
  text: string
}

const suggestions = [
  'Why will ProfileCard break?',
  'Who is affected by the verifyUser change?',
  'Summarize all active conflicts',
]

// Canned replies until the AI API is connected.
function fakeReply(q: string): string {
  const s = q.toLowerCase()
  if (s.includes('profile'))
    return 'alice changed GET /api/users/:id to return { user: { fullName, … } }. ProfileCard still reads data.name and data.email at the top level, so it will render empty fields. The fix is to read from data.user and use fullName.'
  if (s.includes('verify'))
    return "verifyUser() in shared/auth.ts now throws AuthError instead of returning null. bob's Login.tsx and 2 other callers still check for null, so they need a try/catch."
  if (s.includes('summar') || s.includes('all'))
    return issues
      .filter((i) => i.status === 'active')
      .map((i) => `• [${i.severity}] ${i.title}`)
      .join('\n')
  return "I'm a placeholder for now. Once the AI API is wired up I'll answer using the live dependency graph and everyone's uncommitted diffs."
}

export default function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: "Hi! I watch every developer's local changes. Ask me why two changes conflict, who is affected, or how to fix it.",
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(
    () => end.current?.scrollIntoView({ behavior: 'smooth' }),
    [msgs, thinking],
  )

  const send = (text: string) => {
    if (!text.trim() || thinking) return
    setMsgs((m) => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', text: fakeReply(text) }])
      setThinking(false)
    }, 800)
  }

  return (
    <div className="panel mx-auto flex h-full max-w-3xl flex-col overflow-hidden">
      <div className="border-nebula-500/15 flex items-center gap-2 border-b px-5 py-3">
        <Sparkles className="text-nebula-400 size-5" />
        <h1 className="font-semibold text-white">AI Co-Pilot</h1>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/40 px-2 py-0.5 text-xs text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400" /> Online
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-5">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {m.role === 'ai' ? (
              <span className="bg-nebula-600/40 flex size-8 shrink-0 items-center justify-center rounded-full">
                <Sparkles className="text-nebula-300 size-4" />
              </span>
            ) : (
              <DevAvatar id="bob" size={32} />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'user'
                  ? 'bg-nebula-600/60 text-white'
                  : 'border-nebula-500/20 bg-space-850 border text-slate-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="text-nebula-300/80 flex items-center gap-2 pl-11 text-sm">
            <span className="animate-pulse">Thinking…</span>
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="border-nebula-500/15 border-t p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="border-nebula-500/30 text-nebula-200 hover:bg-nebula-500/10 rounded-full border px-3 py-1 text-xs"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="border-nebula-500/30 bg-space-850 flex items-center gap-2 rounded-xl border px-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your code…"
            className="flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button type="submit" className="text-nebula-300 hover:text-white">
            <SendHorizontal className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
