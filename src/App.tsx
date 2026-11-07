function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-sm">
        <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] uppercase text-cyan-300">
          Tailwind Ready
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Vite + React + Tailwind
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-300">
          Your app is now configured with Tailwind CSS and Prettier for clean,
          consistent styling and formatting.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
            Primary Action
          </button>
          <button className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-700">
            Secondary
          </button>
        </div>
      </div>
    </main>
  )
}

export default App
