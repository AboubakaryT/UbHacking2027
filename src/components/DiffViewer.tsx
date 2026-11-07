import { DiffEditor, Editor, type Monaco } from '@monaco-editor/react'

const THEME = 'codebase-space'

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c084fc' },
      { token: 'string', foreground: 'fbbf24' },
      { token: 'comment', foreground: '6b6893', fontStyle: 'italic' },
      { token: 'number', foreground: 'f472b6' },
      { token: 'type', foreground: '67e8f9' },
    ],
    colors: {
      'editor.background': '#0d0a26',
      'editor.lineHighlightBackground': '#1a154088',
      'editorLineNumber.foreground': '#4b4680',
      'editorLineNumber.activeForeground': '#c4b5fd',
      'editorGutter.background': '#0d0a26',
      'diffEditor.insertedTextBackground': '#10b98126',
      'diffEditor.removedTextBackground': '#f43f5e2e',
      'diffEditor.insertedLineBackground': '#10b98114',
      'diffEditor.removedLineBackground': '#f43f5e18',
      'scrollbarSlider.background': '#3b318566',
    },
  })
}

const baseOptions = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  readOnly: true,
  automaticLayout: true,
  padding: { top: 12 },
  renderLineHighlight: 'none' as const,
}

/** Side-by-side Monaco diff of a developer's local, uncommitted change. */
export function DiffViewer({
  original,
  modified,
  language,
  height = '100%',
  inline = false,
}: {
  original: string
  modified: string
  language: string
  height?: string | number
  inline?: boolean
}) {
  return (
    <DiffEditor
      height={height}
      original={original}
      modified={modified}
      language={language}
      theme={THEME}
      beforeMount={defineTheme}
      options={{
        ...baseOptions,
        renderSideBySide: !inline,
        originalEditable: false,
      }}
    />
  )
}

/** Read-only single-file Monaco view. */
export function CodeView({
  value,
  language,
  height = '100%',
}: {
  value: string
  language: string
  height?: string | number
}) {
  return (
    <Editor
      height={height}
      value={value}
      language={language}
      theme={THEME}
      beforeMount={defineTheme}
      options={baseOptions}
    />
  )
}
