'use client'
import { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useToast } from '../../components/Toast'

export default function CourseDetail({ params }) {
  const { addToast } = useToast()
  const { id } = use(params)
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

  const playerRef = useRef(null)
  const playerContainerRef = useRef(null)
  const [speed, setSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        const found = (data.courses || []).find(c => c.id === id)
        setCourse(found || null)
      })

    fetch(`/api/lessons?courseId=${id}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })

    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const u = JSON.parse(savedUser)
      fetch(`/api/progress?userId=${u.id}&courseId=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.progress > 0) {
            const completed = []
            for (let i = 0; i < data.progress; i++) completed.push(i)
            setCompletedLessons(completed)
          }
        })
    }
  }, [id])

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
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }

      playerRef.current = new window.YT.Player('yt-player', {
        videoId: lesson.video_id,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            setPlayerReady(true)
            e.target.setPlaybackRate(speed)
          },
          onStateChange: (e) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
    }
  }, [activeLesson, lessons, activeTab])

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const changeSpeed = (s) => {
    setSpeed(s)
    if (playerRef.current && playerReady) {
      playerRef.current.setPlaybackRate(s)
    }
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

  const handleVideoEnd = () => setShowEndPopup(true)

  const startQuiz = () => {
    setShowEndPopup(false)
    setSelectedAnswers({})
    setDragAnswers({})
    setQuizResult(null)
    setQuizState('taking')
    setActiveTab('quiz')
  }

  const goToLesson = (i) => {
    if (isLocked(i)) return
    setActiveLesson(i)
    setQuizState('idle')
    setSelectedAnswers({})
    setDragAnswers({})
    setQuizResult(null)
    setActiveTab('video')
    setShowEndPopup(false)
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
      addToast(`✅ Lesson "${lesson.title}" সম্পন্ন!`, 'success')

      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        fetch(`/api/badges?userId=${u.id}`)
          .then(r => r.json())
          .then(data => {
            const newBadges = (data.badges || []).filter(b => b.earned)
            const prevCount = completedLessons.length === 0 ? 0 : undefined
            if (prevCount === 0 && newBadges.some(b => b.id === 'first_code')) {
              addToast('🔥 নতুন Badge অর্জন: First Code!', 'success', 5000)
            }
          })
      }

      if (score === 100) {
        addToast('🎯 Perfect Score! Badge অর্জন করেছেন!', 'success', 5000)
        const savedUser2 = localStorage.getItem('user')
        if (savedUser2) {
          const u = JSON.parse(savedUser2)
          fetch(`/api/badges?userId=${u.id}`)
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
      addToast(`✅ Lesson "${lesson.title}" সম্পন্ন!`, 'success')
    }
  }

  const goNext = () => {
    if (activeLesson < lessons.length - 1) {
      goToLesson(activeLesson + 1)
    }
  }

  const goPrev = () => {
    if (activeLesson > 0) {
      goToLesson(activeLesson - 1)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white">লোড হচ্ছে...</div>
    </div>
  )

  if (!course || lessons.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="text-white text-xl">কোর্সে এখনো কোনো lesson যোগ করা হয়নি</div>
      <Link href="/courses" className="text-purple-400 hover:text-purple-300">← কোর্স তালিকায় ফিরুন</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {showEndPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.75)' }}>
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-10 max-w-lg w-full mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-white font-black text-2xl mb-3">Lesson শেষ!</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">{lesson.title} সম্পর্কে শিখলেন।</p>
            <div className="bg-gray-800 rounded-2xl p-4 mb-8 text-left">
              <h4 className="text-purple-400 font-bold text-sm mb-2 uppercase tracking-wider">
                {lesson.quiz_type === 'mcq' ? '🧠 MCQ Quiz' : lesson.quiz_type === 'dropdown' ? '📋 Dropdown Problem' : '📝 Quiz নেই'}
              </h4>
              <p className="text-gray-300 text-sm">
                {lesson.quiz_type === 'mcq'
                  ? `${(lesson.quiz_data || []).length}টি MCQ প্রশ্নের উত্তর দিন। ৭০% পেলে পরের lesson unlock হবে।`
                  : lesson.quiz_type === 'dropdown'
                  ? `Dropdown সমস্যা সমাধান করুন। ৭০% পেলে পরের lesson unlock হবে।`
                  : `এই lesson-এ কোনো Quiz নেই, সরাসরি পরের ধাপে যেতে পারবেন।`}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowEndPopup(false)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-3 rounded-xl text-sm transition">
                পরে করব
              </button>
              <button onClick={startQuiz}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition">
                {lesson.quiz_type === 'mcq' ? '🧠 Quiz দিন' : lesson.quiz_type === 'dropdown' ? '📋 সমাধান করুন' : '➡️ পরবর্তী ধাপ'} →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        <div className="hidden md:flex flex-col w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0">
          <div className={`bg-gradient-to-br ${course.color || 'from-purple-600 to-purple-800'} p-5`}>
            <div className="text-3xl mb-2">{course.icon}</div>
            <h2 className="text-white font-bold">{course.title}</h2>
            <div className="text-white/70 text-sm mt-1">{course.level} · {course.duration}</div>
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
                <button key={l.id}
                  onClick={() => goToLesson(i)}
                  disabled={locked}
                  className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 mb-1 ${
                    activeLesson === i ? 'bg-purple-600/20 border border-purple-600/40' :
                    locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-800'
                  }`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                    completed ? 'bg-green-600 text-white' :
                    locked ? 'bg-gray-700 text-gray-600' :
                    activeLesson === i ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {completed ? '✓' : locked ? '🔒' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${activeLesson === i ? 'text-white' : locked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {l.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5 flex items-center gap-2">
                      <span>▶ {l.duration}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        l.quiz_type === 'mcq' ? 'bg-purple-900/40 text-purple-400' :
                        l.quiz_type === 'dropdown' ? 'bg-blue-900/40 text-blue-400' :
                        'bg-gray-800 text-gray-500'
                      }`}>
                        {l.quiz_type === 'mcq' ? 'MCQ' : l.quiz_type === 'dropdown' ? 'Dropdown' : 'Quiz নেই'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">

            <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
              {[
                { key: 'video', label: '▶ ভিডিও' },
                { key: 'notes', label: '📝 নোটস' },
                { key: 'quiz', label: lesson.quiz_type === 'mcq' ? '🧠 Quiz' : lesson.quiz_type === 'dropdown' ? '📋 সমস্যা' : '➡️ পরবর্তী' },
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

            {activeTab === 'video' && (
              <div>
                {lesson.video_id ? (
                  <div>
                    <div className="rounded-2xl overflow-hidden bg-black mb-4 aspect-video">
                      <div id="yt-player" className="w-full h-full" />
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">

                        <div className="flex items-center gap-2">
                          <button
                            onClick={goPrev}
                            disabled={activeLesson === 0}
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-2 rounded-lg text-sm transition">
                            ◀ আগের
                          </button>

                          <button
                            onClick={togglePlay}
                            disabled={!playerReady}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            {isPlaying ? '⏸ Pause' : '▶ Play'}
                          </button>

                          <button
                            onClick={() => { if (!isLocked(activeLesson + 1)) goToLesson(activeLesson + 1) }}
                            disabled={activeLesson === lessons.length - 1 || isLocked(activeLesson + 1)}
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 px-3 py-2 rounded-lg text-sm transition">
                            পরের ▶
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">Speed:</span>
                          <div className="flex gap-1">
                            {[0.75, 1, 1.25, 1.5, 2].map(s => (
                              <button
                                key={s}
                                onClick={() => changeSpeed(s)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                                  speed === s
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}>
                                {s}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <button onClick={handleVideoEnd}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                          ✅ ভিডিও শেষ
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="rounded-2xl bg-gray-900 border border-gray-800 mb-4 aspect-video flex items-center justify-center">
                      <div className="text-gray-500 text-center">
                        <div className="text-4xl mb-2">🎬</div>
                        <div>এই lesson-এ কোনো video নেই</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button onClick={goPrev} disabled={activeLesson === 0}
                          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-4 py-2 rounded-xl text-sm transition">
                          ◀ আগের
                        </button>
                        <button onClick={() => { if (!isLocked(activeLesson + 1)) goToLesson(activeLesson + 1) }}
                          disabled={activeLesson === lessons.length - 1 || isLocked(activeLesson + 1)}
                          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-4 py-2 rounded-xl text-sm transition">
                          পরের ▶
                        </button>
                      </div>
                      <button onClick={handleVideoEnd}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">
                        ✅ পরের ধাপ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
                {lesson.content ? (
                  <ReactMarkdown components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-6">{children}</h2>,
                    p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-1">{children}</ol>,
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
                <button onClick={handleVideoEnd} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition">
                  {lesson.quiz_type === 'mcq' ? '🧠 Quiz দিন' : lesson.quiz_type === 'dropdown' ? '📋 সমাধান করুন' : '➡️ পরবর্তী ধাপ'} →
                </button>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div>
                {quizState === 'idle' && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                    {(lesson.quiz_data || []).length === 0 ? (
                      <div>
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-white font-bold text-2xl mb-3">এই lesson-এ কোনো Quiz নেই</h2>
                        <p className="text-gray-400 mb-8">ভিডিও দেখুন এবং পরের lesson-এ যান।</p>
                        <div className="flex gap-3 justify-center">
                          <button onClick={() => setActiveTab('video')}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition">
                            ← ভিডিও দেখুন
                          </button>
                          {activeLesson < lessons.length - 1 && (
                            <button onClick={() => {
                              if (!completedLessons.includes(activeLesson)) {
                                setCompletedLessons([...completedLessons, activeLesson])
                                saveProgress(activeLesson)
                              }
                              goNext()
                            }}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition">
                              পরের lesson 🔓 →
                            </button>
                          )}
                          {activeLesson === lessons.length - 1 && (
                            <Link href={`/certificate?course=${course.title}&id=${id}`}
                              onClick={() => {
                                if (!completedLessons.includes(activeLesson)) {
                                  setCompletedLessons([...completedLessons, activeLesson])
                                  saveProgress(activeLesson)
                                }
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition">
                              🎓 Certificate নিন!
                            </Link>
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

                {quizState === 'taking' && lesson.quiz_type === 'mcq' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-white font-bold text-xl">MCQ Quiz</h2>
                      <span className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full">{Object.keys(selectedAnswers).length}/{(lesson.quiz_data || []).length} উত্তর</span>
                    </div>
                    {(lesson.quiz_data || []).map((q, qi) => (
                      <div key={qi} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <p className="text-white font-semibold text-lg mb-4">
                          <span className="text-purple-400 mr-2">{qi + 1}.</span>{q.question}
                        </p>

                        {/* Code Block */}
                        {q.code && (
                          <div className="mb-4 bg-gray-950 border border-gray-700 rounded-xl p-4 overflow-x-auto">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-500 text-xs">💻 Code</span>
                            </div>
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

                {(quizState === 'passed' || quizState === 'failed') && quizResult && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                    <div className="text-6xl mb-4">{quizResult.passed ? '🎉' : '😔'}</div>
                    <h2 className="text-white font-bold text-2xl mb-2">{quizResult.passed ? 'অভিনন্দন! পাস করেছেন!' : 'আবার চেষ্টা করুন'}</h2>
                    <div className={`text-5xl font-black mb-2 ${quizResult.passed ? 'text-green-400' : 'text-red-400'}`}>{quizResult.score}%</div>
                    <p className="text-gray-400 mb-8">{quizResult.total} এর মধ্যে {quizResult.correct}টি সঠিক</p>

                    {lesson.quiz_type === 'mcq' && (
                      <div className="text-left space-y-3 mb-8">
                        {(lesson.quiz_data || []).map((q, qi) => {
                          const isCorrect = selectedAnswers[qi] === q.correct
                          return (
                            <div key={qi} className={`p-4 rounded-xl border ${isCorrect ? 'bg-green-900/20 border-green-700/40' : 'bg-red-900/20 border-red-700/40'}`}>
                              <p className="text-white font-medium mb-2">{qi + 1}. {q.question}</p>
                              <p className={`text-sm mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {isCorrect ? '✓ সঠিক উত্তর দিয়েছেন' : `✗ আপনার উত্তর: ${q.options?.[selectedAnswers[qi]] || '-'}`}
                              </p>
                              {!isCorrect && (
                                <p className="text-green-400 text-sm mb-2">
                                  ✓ সঠিক উত্তর: {q.options?.[q.correct]}
                                </p>
                              )}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}