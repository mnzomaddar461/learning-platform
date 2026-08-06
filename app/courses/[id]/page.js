'use client'
import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useToast } from '../../components/Toast'

// ─── Compiler ────────────────────────────────────────────
async function runWithWandbox(code, lang, stdin = '') {
  const compiler = lang === 'cpp' ? 'gcc-head' : 'gcc-head-c'
  const res = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler, code, stdin,
      options: lang === 'cpp' ? 'warning,c++17' : 'warning,c11',
      'compiler-option-raw': lang === 'cpp' ? '-std=c++17' : '-std=c11',
    }),
  })
  const data = await res.json()
  const stderr = data?.compiler_error || data?.runtime_error || ''
  const stdout = data?.program_output || ''
  return { stdout, stderr, hasError: !!stderr && !stdout }
}

let pyodideInstance = null
async function runPython(code, stdin = '') {
  try {
    if (!pyodideInstance) {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js'
          s.onload = resolve; s.onerror = reject
          document.head.appendChild(s)
        })
      }
      pyodideInstance = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' })
    }
    let output = ''
    pyodideInstance.setStdout({ batched: t => { output += t + '\n' } })
    pyodideInstance.setStderr({ batched: t => { output += t + '\n' } })
    await pyodideInstance.runPythonAsync(code)
    return { stdout: output.trimEnd(), stderr: '', hasError: false }
  } catch (err) {
    return { stdout: '', stderr: err.message, hasError: true }
  }
}

// ─── CodingLesson Component ───────────────────────────────
function CodingLesson({ lesson, onComplete, onGoNext, onCertificate, addToast }) {
  const cd = lesson.quiz_data?.[0] || {}
  const { language = 'c', header = '', starter_code = '', note = '' } = cd
  const problems = cd.problems || []

  const [activeProblem, setActiveProblem] = useState(0)
  const [solvedProblems, setSolvedProblems] = useState(new Set())
  const [codes, setCodes] = useState(() => {
    const init = {}
    problems.forEach((p, i) => { init[i] = p.starter_code || starter_code })
    return init
  })
  const [stdin, setStdin] = useState('')
  const [outputs, setOutputs] = useState({})
  const [errors, setErrors] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [lessonPassed, setLessonPassed] = useState(false)

  const prob = problems[activeProblem]
  const langLabel = { c: 'C', cpp: 'C++', python: 'Python' }
  const langColor = { c: '#3b82f6', cpp: '#8b5cf6', python: '#f59e0b' }
  const color = langColor[language] || '#3b82f6'

  const passPercent = problems.length > 0
    ? Math.round((solvedProblems.size / problems.length) * 100)
    : 0

  const insertCard = (card) => {
    setCodes(prev => {
      const current = prev[activeProblem] || ''
      const updated = current.includes('    return 0;')
        ? current.replace('    return 0;', `    ${card.code}\n    return 0;`)
        : current + '\n    ' + card.code
      return { ...prev, [activeProblem]: updated }
    })
    addToast(`📎 "${card.label || card.code.slice(0, 20)}" যোগ হয়েছে`, 'info', 2000)
  }

  const handleRun = async () => {
    if (!prob) return
    setIsRunning(true)

    try {
      const fullCode = (header || '') + (codes[activeProblem] || '')
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, language, stdin })
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setErrors(prev => ({ ...prev, [activeProblem]: data.error || 'Compilation failed' }))
        setOutputs(prev => ({ ...prev, [activeProblem]: '' }))
        addToast('❌ ' + (data.error || 'Compilation failed'), 'error', 3000)
        return
      }

      const stdout = data.stdout || ''
      const stderr = data.stderr || ''
      const hasError = !!stderr && !stdout

      setErrors(prev => ({ ...prev, [activeProblem]: hasError ? stderr : '' }))
      setOutputs(prev => ({ ...prev, [activeProblem]: hasError ? stderr : stdout }))

      if (!hasError && stdout) {
        const clean = s => s.trim().replace(/\r\n/g, '\n')
        const expected = prob.expected_output || ''
        const isMatch = expected ? clean(stdout) === clean(expected) : true

        if (isMatch && !solvedProblems.has(activeProblem)) {
          const newSolved = new Set(solvedProblems)
          newSolved.add(activeProblem)
          setSolvedProblems(newSolved)

          const newPercent = Math.round((newSolved.size / problems.length) * 100)
          addToast(`✅ Problem ${activeProblem + 1} সমাধান হয়েছে! (${newSolved.size}/${problems.length})`, 'success', 3000)

          if (newPercent >= 70 && !lessonPassed) {
            setLessonPassed(true)
            onComplete()
            addToast(`🎉 ${newPercent}% সম্পন্ন! Lesson unlock হয়েছে!`, 'success', 5000)
          }
        } else if (expected && !isMatch) {
          addToast('❌ Output মিলেনি। আবার চেষ্টা করুন।', 'error', 3000)
        }
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [activeProblem]: err.message }))
      addToast('❌ Error: ' + err.message, 'error', 3000)
    } finally {
      setIsRunning(false)
    }
  }

  if (problems.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-gray-400">এই lesson-এ কোনো problem নেই।</p>
      </div>
    )
  }

  const currentOutput = outputs[activeProblem] || ''
  const currentError = errors[activeProblem] || ''
  const hasError = !!currentError
  const isSolved = solvedProblems.has(activeProblem)

  return (
    <div className="space-y-4">

      {/* Progress Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Progress: {solvedProblems.size}/{problems.length} solved</span>
          <span className={`text-sm font-bold ${passPercent >= 70 ? 'text-green-400' : 'text-gray-400'}`}>
            {passPercent}% {passPercent >= 70 && '✅'}
          </span>
        </div>
        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${passPercent}%`, background: passPercent >= 70 ? '#22c55e' : color }} />
        </div>
        <p className="text-gray-500 text-xs mt-2">৭০% solve করলে lesson সম্পন্ন হবে</p>
      </div>

      {/* Problem Tabs */}
      <div className="flex gap-2 flex-wrap">
        {problems.map((p, i) => (
          <button key={i} onClick={() => setActiveProblem(i)}
            style={{
              border: `2px solid ${activeProblem === i ? color : solvedProblems.has(i) ? '#22c55e' : '#374151'}`,
              background: activeProblem === i ? color + '20' : solvedProblems.has(i) ? '#14532d' : '#1f2937',
              color: activeProblem === i ? color : solvedProblems.has(i) ? '#22c55e' : '#9ca3af'
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all">
            {solvedProblems.has(i) ? '✓ ' : ''}{p.title || `Problem ${i + 1}`}
          </button>
        ))}
      </div>

      {/* Problem Description Box */}
      {prob && (
        <div style={{ border: `2px solid ${color}50`, background: color + '08' }} className="rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧩</span>
            <h3 style={{ color }} className="font-bold text-base">{prob.title || `Problem ${activeProblem + 1}`}</h3>
            {isSolved && <span className="text-green-400 text-sm font-bold ml-auto">✅ Solved!</span>}
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{prob.description}</p>

          {(prob.sample_input || prob.sample_output) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prob.sample_input && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-500 text-xs font-semibold mb-2 uppercase">📥 Sample Input:</p>
                  <pre className="text-blue-300 text-sm font-mono">{prob.sample_input}</pre>
                </div>
              )}
              {prob.sample_output && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-gray-500 text-xs font-semibold mb-2 uppercase">📤 Sample Output:</p>
                  <pre className="text-green-300 text-sm font-mono">{prob.sample_output}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left - Editor */}
        <div className="space-y-4">

          {/* Code Cards */}
          {(prob?.code_cards || []).filter(c => c.label || c.code).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">
                🃏 Code Cards
              </p>
              <div className="flex flex-wrap gap-2">
                {(prob?.code_cards || []).filter(c => c.label || c.code).map((card, i) => (
                  <div key={i} className="relative group">
                    <button onClick={() => insertCard(card)}
                      style={{ borderColor: color + '60', color }}
                      className="bg-gray-800 border hover:scale-105 active:scale-95 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer">
                      {card.label || card.code.slice(0, 20)}
                    </button>
                    {card.code && (
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 min-w-48 max-w-64">
                        <div className="bg-gray-950 border border-gray-600 rounded-lg p-3 shadow-xl">
                          <p className="text-gray-500 text-xs mb-1">💻 Code:</p>
                          <pre style={{ color }} className="text-xs font-mono whitespace-pre-wrap">{card.code}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="text-gray-500 text-xs font-semibold font-mono">
                  💻 {langLabel[language]} Editor — Problem {activeProblem + 1}
                </span>
              </div>
              <button onClick={() => {
                const reset = prob?.starter_code || starter_code
                setCodes(prev => ({ ...prev, [activeProblem]: reset }))
                setOutputs(prev => ({ ...prev, [activeProblem]: '' }))
                setErrors(prev => ({ ...prev, [activeProblem]: '' }))
              }} className="text-gray-500 hover:text-gray-300 text-xs transition">
                🔄 Reset
              </button>
            </div>
            {header && (
              <div className="px-4 pt-3 pb-1 bg-gray-950 border-b border-gray-800/50 select-none">
                <pre className="text-blue-400/70 text-xs font-mono leading-relaxed">{header}</pre>
              </div>
            )}
            <textarea
              value={codes[activeProblem] || ''}
              onChange={e => setCodes(prev => ({ ...prev, [activeProblem]: e.target.value }))}
              spellCheck={false}
              className="w-full bg-[#080c14] text-gray-200 font-mono text-sm px-4 py-3 outline-none resize-none border-none"
              style={{ minHeight: '220px', lineHeight: '1.6' }}
              placeholder="এখানে code লিখুন..."
            />
          </div>

          {/* Note */}
          {note && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
              <p className="text-yellow-400 text-xs font-semibold mb-2">📝 Note:</p>
              <p className="text-gray-300 text-sm leading-relaxed">{note}</p>
            </div>
          )}
        </div>

        {/* Right - Input/Output */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs font-semibold mb-2">📥 Standard Input (stdin)</p>
            <textarea value={stdin} onChange={e => setStdin(e.target.value)} rows={3}
              className="w-full bg-gray-950 text-gray-300 font-mono text-sm px-3 py-2 rounded-lg border border-gray-700 outline-none resize-none focus:border-blue-500 transition"
              placeholder="প্রতি লাইনে একটি value..." />
          </div>

          <button onClick={handleRun} disabled={isRunning}
            style={{ background: isRunning ? '#374151' : isSolved ? '#15803d' : color }}
            className="w-full py-3.5 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm">
            {isRunning ? '⏳ Compiling...' : isSolved ? `✅ Solved — আবার Run করুন` : `▶ Run ${langLabel[language]}`}
          </button>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden" style={{ minHeight: '200px' }}>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">📤 Output</span>
              {(currentOutput || currentError) && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${hasError ? 'bg-red-900/30 text-red-400' : isSolved ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  {hasError ? '❌ Error' : isSolved ? '✅ Correct!' : '▶ Output'}
                </span>
              )}
            </div>
            <div className="p-4" style={{ minHeight: '160px' }}>
              {currentOutput || currentError
                ? <pre className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${hasError ? 'text-red-400' : isSolved ? 'text-green-300' : 'text-gray-300'}`}>
                    {currentError || currentOutput}
                  </pre>
                : <p className="text-gray-600 text-sm text-center pt-12">Run করলে output দেখাবে</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Passed Banner */}
      {lessonPassed && (
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-green-400 font-bold text-lg mb-2">
            {passPercent}% Problems সমাধান! Lesson সম্পন্ন।
          </p>
          <p className="text-gray-400 text-sm mb-5">
            {solvedProblems.size}/{problems.length} টি problem solve করেছেন।
            {solvedProblems.size < problems.length && ' বাকিগুলোও চেষ্টা করুন!'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {onGoNext && (
              <button onClick={onGoNext}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition">
                পরের Lesson 🔓 →
              </button>
            )}
            {onCertificate && (
              <button onClick={onCertificate}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition">
                🎓 Certificate নিন!
              </button>
            )}
            {!onGoNext && !onCertificate && (
              <p className="text-green-300 text-sm">✓ সব lesson সম্পন্ন!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
export default function CourseDetail({ params }) {
  const { id } = use(params)
  const { addToast } = useToast()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState(0)
  const [completedLessons, setCompletedLessons] = useState([])
  const [activeTab, setActiveTab] = useState('video')
  const [showEndPopup, setShowEndPopup] = useState(false)
  const [quizState, setQuizState] = useState('idle')
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [quizResult, setQuizResult] = useState(null)
  const [dragAnswers, setDragAnswers] = useState({})

  // Video controls
  const playerRef = useRef(null)
  const [speed, setSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(data => {
      setCourse((data.courses || []).find(c => c.id === id) || null)
    })
    fetch(`/api/lessons?courseId=${id}`).then(r => r.json()).then(data => {
      setLessons(data.lessons || [])
      setLoading(false)
    })
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      fetch(`/api/progress?userId=${u.id}&courseId=${id}`).then(r => r.json()).then(data => {
        if (data.progress > 0) {
          setCompletedLessons(Array.from({ length: data.progress }, (_, i) => i))
        }
      })
    }
  }, [id])

  // Tab reset when lesson changes
  useEffect(() => {
    if (lessons.length === 0) return
    const cur = lessons[activeLesson]
    setActiveTab(cur?.lesson_type === 'coding' ? 'quiz' : 'video')
    setQuizState('idle')
    setSelectedAnswers({})
    setDragAnswers({})
    setQuizResult(null)
    setShowEndPopup(false)
  }, [activeLesson, lessons.length])

  // YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  }, [])

  useEffect(() => {
    if (lessons.length === 0 || activeTab !== 'video') return
    const lesson = lessons[activeLesson]
    if (!lesson?.video_id) return
    setPlayerReady(false)
    setIsPlaying(false)

    const initPlayer = () => {
      if (playerRef.current) { try { playerRef.current.destroy() } catch {} playerRef.current = null }
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: lesson.video_id,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: e => { setPlayerReady(true); e.target.setPlaybackRate(speed) },
          onStateChange: e => setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
        }
      })
    }

    if (window.YT?.Player) initPlayer()
    else window.onYouTubeIframeAPIReady = initPlayer
    return () => { if (playerRef.current) { try { playerRef.current.destroy() } catch {} playerRef.current = null } }
  }, [activeLesson, lessons, activeTab])

  const togglePlay = () => {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  const changeSpeed = (s) => {
    setSpeed(s)
    if (playerRef.current && playerReady) playerRef.current.setPlaybackRate(s)
  }

  const lesson = lessons[activeLesson]
  const progress = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0
  const isLocked = (i) => i > 0 && !completedLessons.includes(i - 1)

  const saveProgress = (lessonIndex) => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) return
    const u = JSON.parse(savedUser)
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id, courseId: id, lessonIndex })
    })
  }

  const goToLesson = (i) => {
    if (isLocked(i)) return
    setActiveLesson(i)
  }

  const goNext = () => {
    if (activeLesson < lessons.length - 1) goToLesson(activeLesson + 1)
  }

  const goPrev = () => {
    if (activeLesson > 0) goToLesson(activeLesson - 1)
  }

  const handleVideoEnd = () => {
    if (!lesson.quiz_data?.length || lesson.quiz_type === 'none') {
      if (!completedLessons.includes(activeLesson)) {
        setCompletedLessons([...completedLessons, activeLesson])
        saveProgress(activeLesson)
      }
    } else {
      setShowEndPopup(true)
    }
  }

  const startQuiz = () => {
    setShowEndPopup(false)
    setSelectedAnswers({})
    setDragAnswers({})
    setQuizResult(null)
    setQuizState('taking')
    setActiveTab('quiz')
  }

  const submitMCQ = () => {
    const quiz = lesson.quiz_data || []
    let correct = 0
    quiz.forEach((q, i) => { if (selectedAnswers[i] === q.correct) correct++ })
    const score = quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 100
    const passed = score >= 70
    setQuizResult({ score, correct, total: quiz.length, passed })
    setQuizState(passed ? 'passed' : 'failed')

    if (passed && !completedLessons.includes(activeLesson)) {
      setCompletedLessons([...completedLessons, activeLesson])
      saveProgress(activeLesson)
      addToast(`✅ Lesson সম্পন্ন!`, 'success')
    }

    if (score === 100) addToast('🎯 Perfect Score!', 'success', 5000)

    if (passed && activeLesson === lessons.length - 1 && course) {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        if ((course.coin_reward || 0) > 0) {
          fetch('/api/coins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, amount: course.coin_reward, type: 'course_complete', description: `course_${id}_completed` }) })
          addToast(`🎓 কোর্স সম্পন্ন! +${course.coin_reward} 🪙`, 'coin', 5000)
        }
        if ((course.diamond_reward || 0) > 0) {
          fetch('/api/coins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, amount: course.diamond_reward, type: 'mission_complete', description: `course_${id}_diamond` }) })
          addToast(`💎 +${course.diamond_reward} ডায়মন্ড!`, 'diamond', 5000)
        }
      }
    }
  }

  const submitDropdown = () => {
    const dropdowns = lesson.quiz_data || []
    let total = 0, correct = 0
    dropdowns.forEach((dd, di) => {
      (dd.steps || []).forEach((step, si) => {
        total++
        if (dragAnswers[`${di}-${si}`] === step.correct) correct++
      })
    })
    const score = total > 0 ? Math.round((correct / total) * 100) : 100
    const passed = score >= 70
    setQuizResult({ score, correct, total, passed })
    setQuizState(passed ? 'passed' : 'failed')
    if (passed && !completedLessons.includes(activeLesson)) {
      setCompletedLessons([...completedLessons, activeLesson])
      saveProgress(activeLesson)
      addToast(`✅ Lesson সম্পন্ন!`, 'success')
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-white">লোড হচ্ছে...</div></div>

  if (!course || lessons.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="text-white text-xl">কোর্সে এখনো কোনো lesson নেই</div>
      <Link href="/courses" className="text-purple-400">← কোর্স তালিকায় ফিরুন</Link>
    </div>
  )

  const isCodingLesson = lesson.lesson_type === 'coding'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* End Popup */}
      {showEndPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-10 max-w-lg w-full mx-4 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-white font-black text-2xl mb-3">Lesson শেষ!</h2>
            <p className="text-gray-400 mb-6">{lesson.title}</p>
            <div className="bg-gray-800 rounded-2xl p-4 mb-8 text-left">
              <h4 className="text-purple-400 font-bold text-sm mb-2 uppercase tracking-wider">
                {lesson.quiz_type === 'mcq' ? '🧠 MCQ Quiz' : '📋 Dropdown Problem'}
              </h4>
              <p className="text-gray-300 text-sm">৭০% পেলে পরের lesson unlock হবে।</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowEndPopup(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-3 rounded-xl text-sm transition">পরে করব</button>
              <button onClick={startQuiz} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition">
                {lesson.quiz_type === 'mcq' ? '🧠 Quiz দিন' : '📋 সমাধান করুন'} →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0">
          <div className={`bg-gradient-to-br ${course.color || 'from-purple-600 to-purple-800'} p-5`}>
            <div className="text-3xl mb-2">{course.icon}</div>
            <h2 className="text-white font-bold">{course.title}</h2>
            <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-white/70 text-xs mt-1">{completedLessons.length}/{lessons.length} সম্পন্ন</div>
          </div>
          <div className="p-3">
            {lessons.map((l, i) => {
              const locked = isLocked(i)
              const completed = completedLessons.includes(i)
              return (
                <button key={l.id} onClick={() => goToLesson(i)} disabled={locked}
                  className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 mb-1 ${activeLesson === i ? 'bg-purple-600/20 border border-purple-600/40' : locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-800'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${completed ? 'bg-green-600 text-white' : locked ? 'bg-gray-700 text-gray-600' : activeLesson === i ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                    {completed ? '✓' : locked ? '🔒' : l.lesson_type === 'coding' ? '💻' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${activeLesson === i ? 'text-white' : locked ? 'text-gray-600' : 'text-gray-400'}`}>{l.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                      <span>{l.lesson_type === 'coding' ? '💻' : '▶'} {l.duration}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${l.lesson_type === 'coding' ? 'bg-blue-900/40 text-blue-400' : l.quiz_type === 'mcq' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                        {l.lesson_type === 'coding' ? 'Coding' : l.quiz_type === 'mcq' ? 'MCQ' : l.quiz_type === 'dropdown' ? 'Dropdown' : 'Video'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
              {[
                ...(!isCodingLesson ? [{ key: 'video', label: '▶ ভিডিও' }] : []),
                ...(!isCodingLesson ? [{ key: 'notes', label: '📝 নোটস' }] : []),
                { key: 'quiz', label: isCodingLesson ? '💻 Practice' : lesson.quiz_type === 'mcq' ? '🧠 Quiz' : '📋 সমস্যা' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="text-gray-500 text-sm mb-1">Lesson {activeLesson + 1} of {lessons.length}</div>
              <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
            </div>

            {/* Video Tab */}
            {activeTab === 'video' && !isCodingLesson && (
              <div>
                {lesson.video_id ? (
                  <div>
                    <div className="rounded-2xl overflow-hidden bg-black mb-4 aspect-video">
                      <div id="yt-player" className="w-full h-full" />
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <button onClick={goPrev} disabled={activeLesson === 0} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-2 rounded-lg text-sm transition">◀ আগের</button>
                          <button onClick={togglePlay} disabled={!playerReady} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            {isPlaying ? '⏸ Pause' : '▶ Play'}
                          </button>
                          <button onClick={() => { if (!isLocked(activeLesson + 1)) goToLesson(activeLesson + 1) }}
                            disabled={activeLesson === lessons.length - 1 || isLocked(activeLesson + 1)}
                            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-2 rounded-lg text-sm transition">পরের ▶</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">Speed:</span>
                          <div className="flex gap-1">
                            {[0.75, 1, 1.25, 1.5, 2].map(s => (
                              <button key={s} onClick={() => changeSpeed(s)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${speed === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={handleVideoEnd} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">✅ ভিডিও শেষ</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-2xl bg-gray-900 border border-gray-800 mb-4 aspect-video flex items-center justify-center">
                      <div className="text-gray-500 text-center"><div className="text-4xl mb-2">🎬</div><div>এই lesson-এ কোনো video নেই</div></div>
                    </div>
                    <button onClick={handleVideoEnd} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">✅ পরের ধাপ</button>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && !isCodingLesson && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
                {lesson.content ? (
                  <ReactMarkdown components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                    p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-1">{children}</ul>,
                    li: ({children}) => <li className="text-gray-300">{children}</li>,
                    strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                    code: ({children}) => <code className="bg-gray-800 text-purple-300 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                    pre: ({children}) => <pre className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4 overflow-x-auto">{children}</pre>,
                  }}>
                    {lesson.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-gray-500 text-center py-8">এই lesson-এর কোনো নোট নেই</div>
                )}

                {lesson.homework && (
                  <div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-5">
                    <h3 className="text-yellow-400 font-bold text-sm mb-3 uppercase tracking-wider">📝 Homework</h3>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{lesson.homework}</p>
                  </div>
                )}

                {lesson.resources?.length > 0 && (
                  <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                    <h3 className="text-blue-400 font-bold text-sm mb-3 uppercase tracking-wider">📎 Resources</h3>
                    <div className="space-y-2">
                      {lesson.resources.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-600 rounded-lg transition">
                          <span className="text-xl">{r.type === 'link' ? '🔗' : r.type?.includes('pdf') ? '📄' : '📎'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm truncate">{r.name}</div>
                            {r.size && <div className="text-gray-500 text-xs">{(r.size / 1024).toFixed(1)} KB</div>}
                          </div>
                          <span className="text-blue-400 text-xs flex-shrink-0">Download →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleVideoEnd} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">
                  {lesson.quiz_type === 'mcq' ? '🧠 Quiz দিন' : '📋 সমাধান করুন'} →
                </button>
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
              <div>
                {/* Coding Lesson */}
                {isCodingLesson ? (
                  <CodingLesson
                    lesson={lesson}
                    addToast={addToast}
                    onComplete={() => {
                      if (!completedLessons.includes(activeLesson)) {
                        const updated = [...completedLessons, activeLesson]
                        setCompletedLessons(updated)
                        saveProgress(activeLesson)
                        if (activeLesson === lessons.length - 1 && course) {
                          const savedUser = localStorage.getItem('user')
                          if (savedUser) {
                            const u = JSON.parse(savedUser)
                            if ((course.coin_reward || 0) > 0) {
                              fetch('/api/coins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, amount: course.coin_reward, type: 'course_complete', description: `course_${id}_completed` }) })
                              addToast(`🎓 কোর্স সম্পন্ন! +${course.coin_reward} 🪙`, 'coin', 5000)
                            }
                            if ((course.diamond_reward || 0) > 0) {
                              fetch('/api/coins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, amount: course.diamond_reward, type: 'mission_complete', description: `course_${id}_diamond` }) })
                              addToast(`💎 +${course.diamond_reward} ডায়মন্ড!`, 'diamond', 5000)
                            }
                          }
                        }
                      }
                    }}
                    onGoNext={activeLesson < lessons.length - 1 ? goNext : null}
                    onCertificate={activeLesson === lessons.length - 1
                      ? () => window.location.href = `/certificate?course=${encodeURIComponent(course.title)}&id=${id}`
                      : null}
                  />
                ) : (
                  <>
                    {/* Idle */}
                    {quizState === 'idle' && (
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                        {!(lesson.quiz_data?.length) || lesson.quiz_type === 'none' ? (
                          <div>
                            <div className="text-6xl mb-4">📝</div>
                            <h2 className="text-white font-bold text-2xl mb-3">এই lesson-এ কোনো Quiz নেই</h2>
                            <div className="flex gap-3 justify-center mt-6">
                              <button onClick={() => setActiveTab('video')} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition">← ভিডিও দেখুন</button>
                              {activeLesson < lessons.length - 1 && (
                                <button onClick={() => {
                                  if (!completedLessons.includes(activeLesson)) {
                                    setCompletedLessons([...completedLessons, activeLesson])
                                    saveProgress(activeLesson)
                                  }
                                  goNext()
                                }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition">পরের lesson 🔓 →</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-6xl mb-4">{lesson.quiz_type === 'mcq' ? '🧠' : '📋'}</div>
                            <h2 className="text-white font-bold text-2xl mb-3">{lesson.quiz_type === 'mcq' ? 'MCQ Quiz' : 'Dropdown Problem'}</h2>
                            <p className="text-gray-400 mb-8">আগে ভিডিও দেখুন, তারপর quiz দিন।</p>
                            <button onClick={() => setActiveTab('video')} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition mr-3">← ভিডিও দেখুন</button>
                            <button onClick={startQuiz} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition">শুরু করুন →</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MCQ Taking */}
                    {quizState === 'taking' && lesson.quiz_type === 'mcq' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-white font-bold text-xl">MCQ Quiz</h2>
                          <span className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">{Object.keys(selectedAnswers).length}/{(lesson.quiz_data || []).length} উত্তর</span>
                        </div>
                        {(lesson.quiz_data || []).map((q, qi) => (
                          <div key={qi} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <p className="text-white font-semibold text-lg mb-3"><span className="text-purple-400 mr-2">{qi + 1}.</span>{q.question}</p>
                            {q.code && (
                              <div className="mb-4 bg-gray-950 border border-gray-700 rounded-xl p-4 overflow-x-auto">
                                <p className="text-gray-500 text-xs mb-2">💻 Code:</p>
                                <pre className="text-blue-300 text-sm font-mono whitespace-pre-wrap">{q.code}</pre>
                              </div>
                            )}
                            <div className="space-y-3">
                              {(q.options || []).map((opt, oi) => (
                                <button key={oi} onClick={() => setSelectedAnswers({ ...selectedAnswers, [qi]: oi })}
                                  className={`w-full text-left px-5 py-3 rounded-xl border transition ${selectedAnswers[qi] === oi ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                                  <span className="text-gray-500 mr-3">{['A', 'B', 'C', 'D'][oi]}.</span>{opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={submitMCQ} disabled={Object.keys(selectedAnswers).length < (lesson.quiz_data || []).length}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition">
                          {Object.keys(selectedAnswers).length < (lesson.quiz_data || []).length ? `${(lesson.quiz_data || []).length - Object.keys(selectedAnswers).length}টি প্রশ্ন বাকি` : '✓ Submit করুন'}
                        </button>
                      </div>
                    )}

                    {/* Dropdown Taking */}
                    {quizState === 'taking' && lesson.quiz_type === 'dropdown' && (
                      <div className="space-y-6">
                        <h2 className="text-white font-bold text-xl">📋 Dropdown Problem</h2>
                        {(lesson.quiz_data || []).map((dd, di) => (
                          <div key={di} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                            <p className="text-white font-semibold text-lg mb-6"><span className="text-blue-400 mr-2">{di + 1}.</span>{dd.question}</p>
                            <div className="space-y-4">
                              {(dd.steps || []).map((step, si) => (
                                <div key={si} className="flex items-center gap-4">
                                  <span className="text-gray-400 text-sm w-32 flex-shrink-0">{step.label}:</span>
                                  <select value={dragAnswers[`${di}-${si}`] ?? ''} onChange={e => setDragAnswers({ ...dragAnswers, [`${di}-${si}`]: parseInt(e.target.value) })}
                                    className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 transition">
                                    <option value="">-- বেছে নিন --</option>
                                    {(step.options || []).map((opt, oi) => <option key={oi} value={oi}>{opt}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button onClick={submitDropdown} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition">✓ Submit করুন</button>
                      </div>
                    )}

                    {/* Result */}
                    {(quizState === 'passed' || quizState === 'failed') && quizResult && (
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                        <div className="text-6xl mb-4">{quizResult.passed ? '🎉' : '😔'}</div>
                        <h2 className="text-white font-bold text-2xl mb-2">{quizResult.passed ? 'পাস করেছেন!' : 'আবার চেষ্টা করুন'}</h2>
                        <div className={`text-5xl font-black mb-2 ${quizResult.passed ? 'text-green-400' : 'text-red-400'}`}>{quizResult.score}%</div>
                        <p className="text-gray-400 mb-8">{quizResult.total} এর মধ্যে {quizResult.correct}টি সঠিক</p>

                        {lesson.quiz_type === 'mcq' && (
                          <div className="text-left space-y-3 mb-8">
                            {(lesson.quiz_data || []).map((q, qi) => {
                              const isCorrect = selectedAnswers[qi] === q.correct
                              return (
                                <div key={qi} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
                                  <p className="text-white font-medium mb-2">{qi + 1}. {q.question}</p>
                                  {q.code && <pre className="text-blue-300 text-xs font-mono bg-gray-950 p-2 rounded mb-2">{q.code}</pre>}
                                  <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {isCorrect ? '✓ সঠিক' : `✗ আপনার: ${q.options?.[selectedAnswers[qi]] || '-'}`}
                                    {!isCorrect && <span className="text-green-400 ml-3">✓ সঠিক: {q.options?.[q.correct]}</span>}
                                  </p>
                                  {q.explanation && (
                                    <div className="mt-2 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                                      <p className="text-blue-400 text-xs font-semibold mb-1">💡 ব্যাখ্যা:</p>
                                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="flex gap-4 justify-center">
                          <button onClick={() => { setQuizState('taking'); setSelectedAnswers({}); setDragAnswers({}) }}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition">🔄 আবার চেষ্টা</button>
                          {quizResult.passed && activeLesson < lessons.length - 1 && (
                            <button onClick={goNext} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition">পরের lesson 🔓 →</button>
                          )}
                          {quizResult.passed && activeLesson === lessons.length - 1 && (
                            <Link href={`/certificate?course=${course.title}&id=${id}`} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">🎓 Certificate নিন!</Link>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}