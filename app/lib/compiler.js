export const WANDBOX_URL = "https://wandbox.org/api/compile.json"

export async function runWithWandbox(code, lang, stdin = "") {
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
export async function runPython(code, stdin = "") {
  try {
    if (!pyodideInstance) {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script")
          s.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"
          s.onload = resolve; s.onerror = reject
          document.head.appendChild(s)
        })
      }
      pyodideInstance = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
      })
    }

    let output = ""
    if (stdin.trim()) {
      const lines = stdin.split("\n")
      pyodideInstance.globals.set("__input_lines__", pyodideInstance.toPy(lines))
      await pyodideInstance.runPythonAsync(`
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
    pyodideInstance.setStdout({ batched: (t) => { output += t + "\n" } })
    pyodideInstance.setStderr({ batched: (t) => { output += t + "\n" } })
    await pyodideInstance.runPythonAsync(code)
    return { stdout: output.trimEnd(), stderr: "", hasError: false }
  } catch (err) {
    return { stdout: "", stderr: err.message, hasError: true }
  }
}

export async function runCode(code, language, stdin = "") {
  if (language === "python") return runPython(code, stdin)
  return runWithWandbox(code, language, stdin)
}