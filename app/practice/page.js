'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, RotateCcw, Copy, Check, Terminal, Clock, AlertCircle, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, bracketMatching, foldGutter, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'

const WANDBOX_URL = "https://wandbox.org/api/compile.json"

async function runWithWandbox(code, lang, stdin = "") {
  const compiler = lang === "cpp" ? "gcc-head" : "gcc-head-c"
  const res = await fetch(WANDBOX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler,
      code,
      options: lang === "cpp" ? "warning,c++17" : "warning,c11",
      "compiler-option-raw": lang === "cpp" ? "-std=c++17" : "-std=c11",
      stdin,
    }),
  })
  const data = await res.json()
  const stderr = data?.compiler_error || data?.runtime_error || ""
  const stdout = data?.program_output || ""
  return { stdout, stderr, hasError: !!stderr && !stdout }
}

let pyodideInstance = null
async function getPyodide() {
  if (pyodideInstance) return pyodideInstance
  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script")
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }
  pyodideInstance = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" })
  return pyodideInstance
}

async function runPython(code, stdin = "") {
  try {
    const pyodide = await getPyodide()
    let output = ""
    if (stdin.trim()) {
      const lines = stdin.split("\n")
      pyodide.globals.set("__input_lines__", pyodide.toPy(lines))
      await pyodide.runPythonAsync(`
import builtins
_lines = __input_lines__.to_py()
_idx = [0]
def _input(prompt=''):
    import sys
    sys.stdout.write(str(prompt))
    if _idx[0] < len(_lines):
        val = _lines[_idx[0]]
        _idx[0] += 1
        return val
    return ''
builtins.input = _input
      `)
    }
    pyodide.setStdout({ batched: (t) => { output += t + "\n" } })
    pyodide.setStderr({ batched: (t) => { output += t + "\n" } })
    await pyodide.runPythonAsync(code)
    return { stdout: output.trimEnd(), stderr: "", hasError: false }
  } catch (err) {
    return { stdout: "", stderr: err.message, hasError: true }
  }
}

const LANGUAGES = {
  c: {
    label: "C", color: "#3b82f6",
    accentBg: "bg-blue-500/15", accentBorder: "border-blue-500/40",
    btnBg: "bg-blue-600 hover:bg-blue-500",
    defaultCode: `#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter a number: ");\n    scanf("%d", &n);\n    printf("You entered: %d\\n", n);\n    printf("Square: %d\\n", n * n);\n    return 0;\n}`,
  },
  cpp: {
    label: "C++", color: "#8b5cf6",
    accentBg: "bg-purple-500/15", accentBorder: "border-purple-500/40",
    btnBg: "bg-purple-600 hover:bg-purple-500",
    defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter a number: ";\n    cin >> n;\n    cout << "Square: " << n*n << endl;\n    return 0;\n}`,
  },
  python: {
    label: "Python", color: "#f59e0b",
    accentBg: "bg-amber-500/15", accentBorder: "border-amber-500/40",
    btnBg: "bg-amber-500 hover:bg-amber-400",
    defaultCode: `n = int(input("Enter a number: "))\nprint(f"You entered: {n}")\nprint(f"Square: {n * n}")`,
  },
}

const SAMPLES = {
  c: [
    { title: "Hello World", code: `#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}` },
    { title: "User Input", code: `#include <stdio.h>\nint main() {\n    int a, b;\n    printf("Enter two numbers: ");\n    scanf("%d %d", &a, &b);\n    printf("Sum: %d\\n", a+b);\n    return 0;\n}` },
    { title: "Binary Search", code: `#include <stdio.h>\nint bsearch(int arr[], int n, int t) {\n    int l=0, r=n-1;\n    while (l<=r) {\n        int m = l+(r-l)/2;\n        if (arr[m]==t) return m;\n        arr[m]<t ? (l=m+1) : (r=m-1);\n    }\n    return -1;\n}\nint main() {\n    int arr[] = {2,5,8,12,16,23,38,56,72,91};\n    int idx = bsearch(arr,10,23);\n    idx!=-1 ? printf("Found at %d\\n",idx) : printf("Not found\\n");\n}` },
  ],
  cpp: [
    { title: "Hello World", code: `#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}` },
    { title: "Sort Array", code: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> v(n);\n    for (auto& x : v) cin >> x;\n    sort(v.begin(), v.end());\n    for (auto x : v) cout << x << " ";\n    cout << endl;\n}` },
  ],
  python: [
    { title: "Hello World", code: `print("Hello, World!")` },
    { title: "User Input", code: `n = int(input("How many numbers? "))\nnums = [int(input(f"Number {i+1}: ")) for i in range(n)]\nprint(f"Sum: {sum(nums)}")\nprint(f"Max: {max(nums)}")` },
    { title: "Quick Sort", code: `def quick_sort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr)//2]\n    return quick_sort([x for x in arr if x<pivot]) + \\\n           [x for x in arr if x==pivot] + \\\n           quick_sort([x for x in arr if x>pivot])\nnums = [3,6,8,10,1,2,1,9,4,7]\nprint("Before:", nums)\nprint("After:", quick_sort(nums))` },
  ],
}

const getLang = (id) => id === 'python' ? python() : cpp()

function useCodeMirror({ value, onChange, langId, color }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const langComp = useRef(new Compartment())
  const isUpdating = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const projectTheme = EditorView.theme({
    "&": { backgroundColor: "#080c14", color: "#e2e8f0", fontSize: "13px", height: "100%", fontFamily: "'JetBrains Mono','Fira Code',monospace" },
    ".cm-content": { padding: "14px 14px 14px 0", lineHeight: "1.65rem", caretColor: color, minHeight: "360px" },
    ".cm-gutters": { backgroundColor: "#080c14", borderRight: "1px solid #1e293b", color: "#334155", minWidth: "44px" },
    ".cm-activeLine": { backgroundColor: "#0f172a" },
    ".cm-activeLineGutter": { backgroundColor: "#0f172a" },
    ".cm-cursor": { borderLeftColor: color, borderLeftWidth: "2px" },
    ".cm-scroller": { overflowX: "auto" },
  }, { dark: true })

  useEffect(() => {
    if (!editorRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [
        history(), lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(),
        drawSelection(), indentOnInput(), bracketMatching(), closeBrackets(),
        foldGutter(), autocompletion(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        oneDark, projectTheme,
        langComp.current.of(getLang(langId)),
        keymap.of([indentWithTab, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdating.current)
            onChangeRef.current(update.state.doc.toString())
        }),
      ],
    })
    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const cur = view.state.doc.toString()
    if (cur !== value) {
      isUpdating.current = true
      view.dispatch({ changes: { from: 0, to: cur.length, insert: value } })
      isUpdating.current = false
    }
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: langComp.current.reconfigure(getLang(langId)) })
  }, [langId])

  return editorRef
}

export default function Practice() {
  const [activeLang, setActiveLang] = useState("c")
  const [codes, setCodes] = useState({
    c: LANGUAGES.c.defaultCode,
    cpp: LANGUAGES.cpp.defaultCode,
    python: LANGUAGES.python.defaultCode,
  })
  const [stdin, setStdin] = useState("")
  const [showStdin, setShowStdin] = useState(false)
  const [output, setOutput] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [runTime, setRunTime] = useState(null)
  const [hasError, setHasError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pyLoading, setPyLoading] = useState(false)

  const lang = LANGUAGES[activeLang]

  const handleCodeChange = useCallback((val) => {
    setCodes(p => ({ ...p, [activeLang]: val }))
  }, [activeLang])

  const editorRef = useCodeMirror({
    value: codes[activeLang],
    onChange: handleCodeChange,
    langId: activeLang,
    color: lang.color,
  })

  const switchLang = (l) => { setActiveLang(l); setOutput(""); setRunTime(null); setHasError(false) }
  const loadSample = (code) => { setCodes(p => ({ ...p, [activeLang]: code })); setOutput(""); setRunTime(null); setHasError(false) }
  const resetCode = () => { setCodes(p => ({ ...p, [activeLang]: lang.defaultCode })); setStdin(""); setOutput(""); setRunTime(null); setHasError(false) }
  const copyCode = () => { navigator.clipboard.writeText(codes[activeLang]); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const runCode = async () => {
    setIsRunning(true); setOutput(""); setHasError(false); setRunTime(null)
    const t0 = Date.now()
    if (activeLang === "python" && !pyodideInstance) setPyLoading(true)
    try {
      let result
      if (activeLang === "python") {
        result = await runPython(codes.python, stdin)
        setPyLoading(false)
      } else {
        result = await runWithWandbox(codes[activeLang], activeLang, stdin)
      }
      setRunTime(((Date.now() - t0) / 1000).toFixed(2))
      setHasError(result.hasError)
      setOutput(result.stderr || result.stdout || "(No output)")
    } catch (err) {
      setHasError(true)
      setOutput("❌ Network error: " + err.message)
    } finally {
      setIsRunning(false); setPyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-200 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 pt-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
              <Terminal size={22} className="text-slate-300" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Online <span className="text-blue-400">Compiler</span>
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Write, run and test C / C++ / Python — no setup needed</p>
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            {Object.entries(LANGUAGES).map(([key, l]) => (
              <button key={key} onClick={() => switchLang(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all duration-200 ${
                  activeLang === key
                    ? `${l.accentBg} ${l.accentBorder} text-white`
                    : "bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}>
                ● {l.label}
              </button>
            ))}
            <div className="flex gap-2 ml-auto flex-wrap">
              {(SAMPLES[activeLang] || []).map((s, i) => (
                <button key={i} onClick={() => loadSample(s.code)}
                  className="px-3 py-2 text-xs font-bold bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-500 transition whitespace-nowrap">
                  📄 {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* EDITOR */}
          <div className="flex flex-col rounded-2xl border border-slate-800/60 overflow-hidden bg-[#0b0e17]">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-[#0f1320] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs font-bold font-mono text-slate-500">{lang.label} Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-mono">{codes[activeLang].split("\n").length} lines</span>
                <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700/50 bg-slate-800/50 text-slate-400 hover:text-slate-200 transition">
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={resetCode} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700/50 bg-slate-800/50 text-slate-400 hover:text-slate-200 transition">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* CodeMirror Editor */}
            <div ref={editorRef} className="flex-1 overflow-auto" style={{ minHeight: "360px", maxHeight: "560px" }} />

            {/* STDIN */}
            <div className="border-t border-slate-800/60 bg-[#0b1220]">
              <button onClick={() => setShowStdin(p => !p)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Standard Input</h3>
                    <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-400 uppercase rounded">STDIN</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">input() / cin / scanf values এখানে দাও</p>
                </div>
                <div className="flex items-center gap-3">
                  {stdin.trim() && (
                    <span className="text-emerald-400 text-xs font-semibold">✓ Input Ready</span>
                  )}
                  <ChevronDown size={18} className={`transition-transform duration-300 ${showStdin ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} />
                </div>
              </button>

              {showStdin && (
                <div className="px-6 pb-5">
                  <textarea
                    value={stdin}
                    onChange={e => setStdin(e.target.value)}
                    rows={4}
                    placeholder="প্রতি লাইনে একটি value লিখো..."
                    className="w-full rounded-lg border border-slate-700/60 bg-[#0b1120]/90 px-4 py-3 text-sm font-mono text-slate-200 outline-none resize-none focus:border-emerald-500/40 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Run Button */}
            <div className="px-4 py-3 border-t border-slate-800/60 bg-[#0f1320] flex-shrink-0">
              <button onClick={runCode} disabled={isRunning}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 shadow-lg transition active:scale-[0.98] disabled:opacity-60 ${lang.btnBg}`}>
                {isRunning
                  ? <><Loader2 size={16} className="animate-spin" />{pyLoading ? "Loading Python…" : "Compiling & Running…"}</>
                  : <><Play size={16} fill="currentColor" /> Run {lang.label}</>
                }
              </button>
            </div>
          </div>

          {/* OUTPUT */}
          <div className="flex flex-col rounded-2xl border border-slate-800/60 overflow-hidden bg-[#0b0e17]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-[#0f1320] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 text-sm">▶</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output</span>
              </div>
              <div className="flex items-center gap-3">
                {runTime && (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                    <Clock size={11} /> {runTime}s
                  </span>
                )}
                {output && !isRunning && (
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    hasError ? "bg-red-900/30 border-red-500/30 text-red-400" : "bg-green-900/30 border-green-500/30 text-green-400"
                  }`}>
                    {hasError ? <><AlertCircle size={11} /> Error</> : <><CheckCircle2 size={11} /> Success</>}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto" style={{ minHeight: "440px", maxHeight: "640px", fontFamily: "'JetBrains Mono',monospace" }}>
              {isRunning ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
                  <Loader2 size={32} className="animate-spin" style={{ color: lang.color }} />
                  <p className="text-sm">{pyLoading ? "Loading Python runtime (first run)…" : "Compiling and running…"}</p>
                </div>
              ) : output ? (
                <pre className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${hasError ? "text-red-400" : "text-green-300"}`}>
                  {output}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-700">
                  <Terminal size={40} strokeWidth={1} />
                  <p className="text-sm text-center">Click <span className="text-slate-500 font-bold">Run</span> to execute your code</p>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-800/60 bg-[#0f1320] flex-shrink-0">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-mono">
                  {activeLang === "python" ? "🐍 Pyodide (Python 3 · browser)" : "🔧 Wandbox (GCC latest)"}
                </span>
                <span>Free · No login · Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: "⌨️", title: "Tab to indent", desc: "Tab key indents code automatically" },
            { icon: "📥", title: "Stdin Support", desc: "cin/scanf/input() এর জন্য stdin box ব্যবহার করো" },
            { icon: "🔧", title: "Auto bracket close", desc: "Type ( [ { — closing bracket automatic আসে" },
            { icon: "⚡", title: "No setup needed", desc: "C/C++ via Wandbox · Python via Pyodide" },
          ].map((tip, i) => (
            <div key={i} className="bg-[#0b0e17] border border-slate-800/60 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl">{tip.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-300">{tip.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}