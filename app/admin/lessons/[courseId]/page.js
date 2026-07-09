'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'

export default function LessonManager({ params }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    title: '', video_id: '', content: '', duration: '10 মিনিট',
    quiz_type: 'mcq', order_index: 0,
    quiz_data: [{ question: '', options: ['', '', '', ''], correct: 0 }]
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    // course info আনো
    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => {
        const found = (data.courses || []).find(c => c.id === courseId)
        setCourse(found || null)
      })

    loadLessons()
  }, [courseId])

  const loadLessons = () => {
    fetch(`/api/admin/lessons?courseId=${courseId}`)
      .then(res => res.json())
      .then(data => {
        setLessons(data.lessons || [])
        setLoading(false)
      })
  }

  const openNewModal = () => {
    setEditingLesson(null)
    setForm({ ...emptyForm, order_index: lessons.length })
    setModalOpen(true)
  }

  const openEditModal = (lesson) => {
    setEditingLesson(lesson)
    setForm({
      title: lesson.title || '',
      video_id: lesson.video_id || '',
      content: lesson.content || '',
      duration: lesson.duration || '10 মিনিট',
      quiz_type: lesson.quiz_type || 'mcq',
      order_index: lesson.order_index || 0,
      quiz_data: lesson.quiz_data?.length > 0 ? lesson.quiz_data :
        [{ question: '', options: ['', '', '', ''], correct: 0 }]
    })
    setModalOpen(true)
  }

  const deleteLesson = async (lesson) => {
    if (!confirm(`"${lesson.title}" ডিলিট করতে চান?`)) return
    await fetch(`/api/admin/lessons?id=${lesson.id}`, { method: 'DELETE' })
    loadLessons()
  }

  const saveLesson = async () => {
    if (!form.title) { alert('টাইটেল আবশ্যক'); return }
    setSaving(true)
    try {
      const payload = { ...form, course_id: courseId }
      let res
      if (editingLesson) {
        res = await fetch('/api/admin/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLesson.id, ...payload })
        })
      } else {
        res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      const data = await res.json()
      if (!res.ok) { alert('সমস্যা: ' + (data.error || 'অজানা')); return }
      setModalOpen(false)
      loadLessons()
    } catch (err) {
      alert('নেটওয়ার্ক সমস্যা')
    } finally {
      setSaving(false)
    }
  }

  // MCQ Quiz Builder helpers
  const addMCQQuestion = () => {
    setForm({ ...form, quiz_data: [...form.quiz_data, { question: '', options: ['', '', '', ''], correct: 0 }] })
  }

  const removeMCQQuestion = (qi) => {
    setForm({ ...form, quiz_data: form.quiz_data.filter((_, i) => i !== qi) })
  }

  const updateMCQQuestion = (qi, field, value) => {
    const updated = [...form.quiz_data]
    updated[qi] = { ...updated[qi], [field]: value }
    setForm({ ...form, quiz_data: updated })
  }

  const updateMCQOption = (qi, oi, value) => {
    const updated = [...form.quiz_data]
    const options = [...updated[qi].options]
    options[oi] = value
    updated[qi] = { ...updated[qi], options }
    setForm({ ...form, quiz_data: updated })
  }

  // Dropdown Quiz Builder helpers
  const addDropdownStep = (di) => {
    const updated = [...form.quiz_data]
    updated[di].steps = [...(updated[di].steps || []), { label: '', options: ['', ''], correct: 0 }]
    setForm({ ...form, quiz_data: updated })
  }

  const updateDropdownStep = (di, si, field, value) => {
    const updated = [...form.quiz_data]
    updated[di].steps[si] = { ...updated[di].steps[si], [field]: value }
    setForm({ ...form, quiz_data: updated })
  }

  const updateDropdownStepOption = (di, si, oi, value) => {
    const updated = [...form.quiz_data]
    const options = [...updated[di].steps[si].options]
    options[oi] = value
    updated[di].steps[si] = { ...updated[di].steps[si], options }
    setForm({ ...form, quiz_data: updated })
  }

  const card = { background: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }
  const inputStyle = { width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: '#8b949e', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white' }}>লোড হচ্ছে...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', marginTop: '-64px', paddingTop: '64px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/admin" style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>
            ← Admin
          </Link>
          <div>
            <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '22px', margin: '0 0 4px' }}>
              {course?.icon} {course?.title}
            </h1>
            <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>মোট {lessons.length} টি lesson</p>
          </div>
          <button onClick={openNewModal}
            style={{ marginLeft: 'auto', background: '#7c3aed', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
            + নতুন Lesson
          </button>
        </div>

        {/* Lesson List */}
        {lessons.length === 0 ? (
          <div style={{ ...card, padding: '40px', textAlign: 'center', color: '#484f58' }}>
            এখনো কোনো lesson যোগ করা হয়নি। উপরে "+ নতুন Lesson" চাপুন।
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lessons.map((lesson, i) => (
              <div key={lesson.id} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e6edf3', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{lesson.title}</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#8b949e', fontSize: '12px' }}>⏱ {lesson.duration}</span>
                    {lesson.video_id && <span style={{ color: '#8b949e', fontSize: '12px' }}>▶ Video: {lesson.video_id}</span>}
                    <span style={{ background: lesson.quiz_type === 'mcq' ? '#1f103580' : '#0d281880', color: lesson.quiz_type === 'mcq' ? '#a371f7' : '#3fb950', fontSize: '11px', padding: '1px 8px', borderRadius: '6px' }}>
                      {lesson.quiz_type === 'mcq' ? 'MCQ' : 'Dropdown'}
                    </span>
                    <span style={{ color: '#484f58', fontSize: '12px' }}>{(lesson.quiz_data || []).length} প্রশ্ন</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(lesson)}
                    style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    এডিট
                  </button>
                  <button onClick={() => deleteLesson(lesson)}
                    style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '32px 16px' }}>
          <div style={{ ...card, padding: '24px', width: '600px', minWidth: '320px' }}>
            <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 20px', fontSize: '16px' }}>
              {editingLesson ? 'Lesson এডিট করুন' : 'নতুন Lesson যোগ করুন'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Basic Info */}
              <div>
                <label style={labelStyle}>টাইটেল *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="যেমন: প্রোগ্রামিং কী?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>YouTube Video ID</label>
                  <input value={form.video_id} onChange={e => setForm({ ...form, video_id: e.target.value })} style={inputStyle} placeholder="যেমন: zOjov-2OZl0" />
                </div>
                <div>
                  <label style={labelStyle}>সময়কাল</label>
                  <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={inputStyle} placeholder="যেমন: 10 মিনিট" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>কন্টেন্ট (Markdown)</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={5} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="# শিরোনাম&#10;&#10;এখানে lesson-এর নোট লিখুন..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Quiz টাইপ</label>
                  <select value={form.quiz_type} onChange={e => {
                    const newType = e.target.value
                    setForm({
                      ...form, quiz_type: newType,
                      quiz_data: newType === 'mcq'
                        ? [{ question: '', options: ['', '', '', ''], correct: 0 }]
                        : [{ question: '', steps: [{ label: '', options: ['', ''], correct: 0 }] }]
                    })
                  }} style={inputStyle}>
                    <option value="mcq">MCQ Quiz</option>
                    <option value="dropdown">Dropdown Problem</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ক্রম (Order)</label>
                  <input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </div>
              </div>

              {/* MCQ Builder */}
              {form.quiz_type === 'mcq' && (
                <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <label style={{ ...labelStyle, margin: 0, color: '#a371f7' }}>🧠 MCQ প্রশ্নসমূহ</label>
                    <button onClick={addMCQQuestion}
                      style={{ background: '#1f1035', border: '1px solid #7c3aed44', color: '#a371f7', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      + প্রশ্ন যোগ
                    </button>
                  </div>

                  {form.quiz_data.map((q, qi) => (
                    <div key={qi} style={{ background: '#161b22', borderRadius: '8px', padding: '14px', marginBottom: '10px', border: '1px solid #30363d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600' }}>প্রশ্ন {qi + 1}</span>
                        {form.quiz_data.length > 1 && (
                          <button onClick={() => removeMCQQuestion(qi)}
                            style={{ background: 'none', border: 'none', color: '#f78166', cursor: 'pointer', fontSize: '12px' }}>
                            ✕ সরান
                          </button>
                        )}
                      </div>
                      <input value={q.question} onChange={e => updateMCQQuestion(qi, 'question', e.target.value)}
                        style={{ ...inputStyle, marginBottom: '10px' }} placeholder="প্রশ্ন লিখুন..." />
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <input type="radio" name={`correct-${qi}`} checked={q.correct === oi}
                            onChange={() => updateMCQQuestion(qi, 'correct', oi)}
                            style={{ cursor: 'pointer', accentColor: '#3fb950' }} />
                          <input value={opt} onChange={e => updateMCQOption(qi, oi, e.target.value)}
                            style={{ ...inputStyle }} placeholder={`অপশন ${['A', 'B', 'C', 'D'][oi]}`} />
                        </div>
                      ))}
                      <p style={{ color: '#484f58', fontSize: '11px', margin: '8px 0 0' }}>✓ চিহ্নিত অপশনটি সঠিক উত্তর</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown Builder */}
              {form.quiz_type === 'dropdown' && (
                <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px' }}>
                  <label style={{ ...labelStyle, color: '#58a6ff', marginBottom: '12px' }}>📋 Dropdown সমস্যা</label>

                  {form.quiz_data.map((dd, di) => (
                    <div key={di} style={{ background: '#161b22', borderRadius: '8px', padding: '14px', border: '1px solid #30363d' }}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={labelStyle}>মূল প্রশ্ন</label>
                        <input value={dd.question}
                          onChange={e => {
                            const updated = [...form.quiz_data]
                            updated[di] = { ...updated[di], question: e.target.value }
                            setForm({ ...form, quiz_data: updated })
                          }}
                          style={inputStyle} placeholder="সমস্যার বর্ণনা লিখুন..." />
                      </div>

                      <label style={{ ...labelStyle, marginBottom: '8px' }}>ধাপসমূহ:</label>
                      {(dd.steps || []).map((step, si) => (
                        <div key={si} style={{ background: '#0d1117', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={labelStyle}>ধাপের লেবেল</label>
                              <input value={step.label} onChange={e => updateDropdownStep(di, si, 'label', e.target.value)}
                                style={inputStyle} placeholder="যেমন: প্রথম ধাপ" />
                            </div>
                            <div>
                              <label style={labelStyle}>সঠিক উত্তর (index)</label>
                              <input type="number" min="0" value={step.correct}
                                onChange={e => updateDropdownStep(di, si, 'correct', parseInt(e.target.value) || 0)}
                                style={inputStyle} />
                            </div>
                          </div>
                          {(step.options || []).map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                              <span style={{ color: '#484f58', fontSize: '12px', width: '20px' }}>{oi}.</span>
                              <input value={opt} onChange={e => updateDropdownStepOption(di, si, oi, e.target.value)}
                                style={inputStyle} placeholder={`অপশন ${oi + 1}`} />
                            </div>
                          ))}
                          <button onClick={() => {
                            const updated = [...form.quiz_data]
                            updated[di].steps[si].options = [...updated[di].steps[si].options, '']
                            setForm({ ...form, quiz_data: updated })
                          }} style={{ background: 'none', border: '1px dashed #30363d', color: '#484f58', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', marginTop: '4px' }}>
                            + অপশন যোগ
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addDropdownStep(di)}
                        style={{ background: '#0d2818', border: '1px solid #3fb95044', color: '#3fb950', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}>
                        + নতুন ধাপ যোগ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setModalOpen(false)}
                style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                বাতিল
              </button>
              <button onClick={saveLesson} disabled={saving}
                style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}