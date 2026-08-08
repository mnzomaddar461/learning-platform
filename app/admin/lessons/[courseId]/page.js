'use client'
import { use, useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Resource Uploader ───────────────────────────────────
function ResourceUploader({ lessonId, resources, onAdd, onRemove, inputStyle, labelStyle }) {
  const [uploading, setUploading] = useState(false)
  const [linkForm, setLinkForm] = useState({ name: '', url: '' })
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lessonId', lessonId)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { alert('Upload error: ' + data.error); return }
      onAdd({ name: data.name, url: data.url, type: data.type, size: data.size })
    } catch { alert('Upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  const addLink = () => {
    if (!linkForm.name || !linkForm.url) return
    onAdd({ name: linkForm.name, url: linkForm.url, type: 'link' })
    setLinkForm({ name: '', url: '' })
    setShowLinkForm(false)
  }

  const getIcon = (type) => {
    if (!type) return '📎'
    if (type === 'link') return '🔗'
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    return '📎'
  }

  return (
    <div>
      {resources.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {resources.map((r, i) => (
            <div key={i} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>{getIcon(r.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e6edf3', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                {r.size && <div style={{ color: '#484f58', fontSize: '11px' }}>{(r.size / 1024).toFixed(1)} KB</div>}
              </div>
              <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', fontSize: '12px', textDecoration: 'none' }}>দেখুন</a>
              <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: '#f78166', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <label style={{ background: '#0d2818', border: '1px solid #3fb95044', color: '#3fb950', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', opacity: uploading ? 0.5 : 1 }}>
          {uploading ? '⏳ Upload হচ্ছে...' : '📤 File Upload'}
          <input type="file" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg" style={{ display: 'none' }} />
        </label>
        <button onClick={() => setShowLinkForm(!showLinkForm)} style={{ background: '#0a1628', border: '1px solid #58a6ff44', color: '#58a6ff', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
          🔗 Link যোগ
        </button>
      </div>
      {showLinkForm && (
        <div style={{ marginTop: '10px', background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={linkForm.name} onChange={e => setLinkForm({ ...linkForm, name: e.target.value })} placeholder="Resource-এর নাম" style={inputStyle} />
          <input value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })} placeholder="URL" style={inputStyle} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={addLink} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>যোগ করুন</button>
            <button onClick={() => setShowLinkForm(false)} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>বাতিল</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function LessonManager({ params }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = {
    video_url: '',
    timestamp_quizzes: [],
    title: '',
    lesson_type: 'video',
    video_id: '', content: '', duration: '10 মিনিট',
    quiz_type: 'mcq', order_index: 0,
    quiz_data: [{ question: '', options: ['', '', '', ''], correct: 0, explanation: '', code: '' }],
    resources: [], homework: ''
  }
  const [form, setForm] = useState(emptyForm)
  const [videoUploading, setVideoUploading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/courses')
      .then(res => res.json())
      .then(data => setCourse((data.courses || []).find(c => c.id === courseId) || null))
    loadLessons()
  }, [courseId])

  const loadLessons = () => {
    fetch(`/api/admin/lessons?courseId=${courseId}`)
      .then(res => res.json())
      .then(data => { setLessons(data.lessons || []); setLoading(false) })
  }

  const openNewModal = () => {
    setEditingLesson(null)
    setForm({ ...emptyForm, order_index: lessons.length })
    setModalOpen(true)
  }

  const openEditModal = (lesson) => {
    setEditingLesson(lesson)
    setForm({
      video_url: lesson.video_url || '',
      timestamp_quizzes: lesson.timestamp_quizzes || [],
      title: lesson.title || '',
      lesson_type: lesson.lesson_type || 'video',
      video_id: lesson.video_id || '',
      content: lesson.content || '',
      duration: lesson.duration || '10 মিনিট',
      quiz_type: lesson.quiz_type || 'mcq',
      order_index: lesson.order_index || 0,
      resources: lesson.resources || [],
      homework: lesson.homework || '',
      quiz_data: lesson.quiz_data?.length > 0 ? lesson.quiz_data :
        lesson.lesson_type === 'coding'
          ? [{ language: 'c', header: '#include <stdio.h>\n\n', starter_code: 'int main() {\n    // এখানে লিখুন\n    \n    return 0;\n}', code_cards: [], expected_output: '', note: '' }]
          : [{ question: '', options: ['', '', '', ''], correct: 0, explanation: '', code: '' }]
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
        res = await fetch('/api/admin/lessons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingLesson.id, ...payload }) })
      } else {
        res = await fetch('/api/admin/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (!res.ok) { alert('সমস্যা: ' + (data.error || 'অজানা')); return }
      setModalOpen(false)
      loadLessons()
    } catch { alert('নেটওয়ার্ক সমস্যা') }
    finally { setSaving(false) }
  }

  // MCQ helpers
  const addMCQQuestion = () => setForm({ ...form, quiz_data: [...form.quiz_data, { question: '', options: ['', '', '', ''], correct: 0, explanation: '', code: '' }] })
  const removeMCQQuestion = (qi) => setForm({ ...form, quiz_data: form.quiz_data.filter((_, i) => i !== qi) })
  const updateMCQQuestion = (qi, field, value) => {
    const updated = [...form.quiz_data]
    updated[qi] = { ...updated[qi], [field]: value }
    setForm({ ...form, quiz_data: updated })
  }
  const updateMCQOption = (qi, oi, value) => {
    const updated = [...form.quiz_data]
    updated[qi].options[oi] = value
    setForm({ ...form, quiz_data: [...updated] })
  }

  // Dropdown helpers
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
    updated[di].steps[si].options[oi] = value
    setForm({ ...form, quiz_data: [...updated] })
  }

  // Coding helpers
  const updateCoding = (field, value) => {
    const updated = [...form.quiz_data]
    updated[0] = { ...updated[0], [field]: value }
    setForm({ ...form, quiz_data: updated })
  }
  const updateCard = (ci, field, value) => {
    const updated = [...form.quiz_data]
    const cards = [...(updated[0].code_cards || [])]
    cards[ci] = { ...cards[ci], [field]: value }
    updated[0] = { ...updated[0], code_cards: cards }
    setForm({ ...form, quiz_data: updated })
  }


  const addProblem = () => {
    const updated = [...form.quiz_data]
    updated[0] = {
      ...updated[0],
      problems: [...(updated[0].problems || []), {
        id: Date.now().toString(),
        title: '',
        description: '',
        sample_input: '',
        sample_output: '',
        expected_output: '',
        starter_code: updated[0].starter_code || 'int main() {\n    // এখানে লিখুন\n    \n    return 0;\n}',
        code_cards: []
      }]
    }
    setForm({ ...form, quiz_data: updated })
  }

  const updateProblem = (pi, field, value) => {
    const updated = [...form.quiz_data]
    const problems = [...(updated[0].problems || [])]
    problems[pi] = { ...problems[pi], [field]: value }
    updated[0] = { ...updated[0], problems }
    setForm({ ...form, quiz_data: updated })
  }

  const removeProblem = (pi) => {
    const updated = [...form.quiz_data]
    updated[0].problems = updated[0].problems.filter((_, i) => i !== pi)
    setForm({ ...form, quiz_data: updated })
  }

  const updateProblemCard = (pi, ci, field, value) => {
    const updated = [...form.quiz_data]
    const problems = [...(updated[0].problems || [])]
    const cards = [...(problems[pi].code_cards || [])]
    cards[ci] = { ...cards[ci], [field]: value }
    problems[pi] = { ...problems[pi], code_cards: cards }
    updated[0] = { ...updated[0], problems }
    setForm({ ...form, quiz_data: updated })
  }

  const card = { background: '#161b22', border: '1px solid #30363d', borderRadius: '12px' }
  const inputStyle = { width: '100%', background: '#0d1117', border: '1px solid #30363d', color: '#e6edf3', padding: '10px', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { color: '#8b949e', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }

  const cd = form.quiz_data?.[0] || {}

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
          <Link href="/admin" style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>← Admin</Link>
          <div>
            <h1 style={{ color: '#e6edf3', fontWeight: '800', fontSize: '22px', margin: '0 0 4px' }}>{course?.icon} {course?.title}</h1>
            <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>মোট {lessons.length} টি lesson</p>
          </div>
          <button onClick={openNewModal} style={{ marginLeft: 'auto', background: '#7c3aed', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
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
                <div style={{ width: '36px', height: '36px', background: lesson.lesson_type === 'coding' ? '#1e3a5f' : '#7c3aed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px', flexShrink: 0 }}>
                  {lesson.lesson_type === 'coding' ? '💻' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e6edf3', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{lesson.title}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#8b949e', fontSize: '12px' }}>⏱ {lesson.duration}</span>
                    {lesson.video_id && <span style={{ color: '#8b949e', fontSize: '12px' }}>▶ {lesson.video_id}</span>}
                    <span style={{
                      background: lesson.lesson_type === 'coding' ? '#0a162880' : lesson.quiz_type === 'mcq' ? '#1f103580' : lesson.quiz_type === 'dropdown' ? '#0d281880' : '#21262d',
                      color: lesson.lesson_type === 'coding' ? '#3b82f6' : lesson.quiz_type === 'mcq' ? '#a371f7' : lesson.quiz_type === 'dropdown' ? '#3fb950' : '#8b949e',
                      fontSize: '11px', padding: '1px 8px', borderRadius: '6px'
                    }}>
                      {lesson.lesson_type === 'coding' ? '💻 Coding' : lesson.quiz_type === 'mcq' ? 'MCQ' : lesson.quiz_type === 'dropdown' ? 'Dropdown' : 'Quiz নেই'}
                    </span>
                    {(lesson.resources || []).length > 0 && <span style={{ color: '#58a6ff', fontSize: '11px' }}>📎 {lesson.resources.length}</span>}
                    {lesson.homework && <span style={{ color: '#f0c000', fontSize: '11px' }}>📝 HW</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(lesson)} style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>এডিট</button>
                  <button onClick={() => deleteLesson(lesson)} style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '32px 16px' }}>
          <div style={{ ...card, padding: '24px', width: '620px', minWidth: '320px' }}>
            <h3 style={{ color: '#e6edf3', fontWeight: '700', margin: '0 0 20px', fontSize: '16px' }}>
              {editingLesson ? 'Lesson এডিট করুন' : 'নতুন Lesson যোগ করুন'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Title */}
              <div>
                <label style={labelStyle}>টাইটেল *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Lesson-এর নাম" />
              </div>

              {/* Lesson Type Selector */}
              <div>
                <label style={labelStyle}>Lesson Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button onClick={() => setForm({ ...form, lesson_type: 'video', quiz_type: 'mcq', quiz_data: [{ question: '', options: ['', '', '', ''], correct: 0, explanation: '', code: '' }] })}
                    style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${form.lesson_type === 'video' ? '#7c3aed' : '#30363d'}`, background: form.lesson_type === 'video' ? '#1f1035' : '#0d1117', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎬</div>
                    <div style={{ color: form.lesson_type === 'video' ? '#a371f7' : '#8b949e', fontWeight: '700', fontSize: '14px' }}>Video Lesson</div>
                    <div style={{ color: '#484f58', fontSize: '11px', marginTop: '2px' }}>Video + MCQ/Dropdown</div>
                  </button>
                  <button onClick={() => setForm({ ...form, lesson_type: 'coding', quiz_type: 'coding', quiz_data: [{ language: 'c', header: '#include <stdio.h>\n\n', starter_code: 'int main() {\n    // এখানে লিখুন\n    \n    return 0;\n}', code_cards: [], expected_output: '', note: '' }] })}
                    style={{ padding: '14px', borderRadius: '10px', border: `2px solid ${form.lesson_type === 'coding' ? '#3b82f6' : '#30363d'}`, background: form.lesson_type === 'coding' ? '#0a1628' : '#0d1117', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>💻</div>
                    <div style={{ color: form.lesson_type === 'coding' ? '#3b82f6' : '#8b949e', fontWeight: '700', fontSize: '14px' }}>Coding Lesson</div>
                    <div style={{ color: '#484f58', fontSize: '11px', marginTop: '2px' }}>শুধু Practice Problem</div>
                  </button>
                </div>
              </div>

              {/* ── VIDEO LESSON FIELDS ── */}
              {form.lesson_type === 'video' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>YouTube Video ID</label>
                      <input value={form.video_id} onChange={e => setForm({ ...form, video_id: e.target.value })} style={inputStyle} placeholder="zOjov-2OZl0" />
                    </div>
                    <div>
                      <label style={labelStyle}>সময়কাল</label>
                      <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={inputStyle} placeholder="10 মিনিট" />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>কন্টেন্ট (Markdown)</label>
                    <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="# শিরোনাম..." />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>ক্রম (Order)</label>
                      <input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Quiz টাইপ</label>
                      <select value={form.quiz_type} onChange={e => {
                        const t = e.target.value
                        setForm({
                          ...form, quiz_type: t,
                          quiz_data: t === 'mcq' ? [{ question: '', options: ['', '', '', ''], correct: 0, explanation: '', code: '' }]
                            : t === 'dropdown' ? [{ question: '', steps: [{ label: '', options: ['', ''], correct: 0 }] }]
                            : []
                        })
                      }} style={inputStyle}>
                        <option value="mcq">🧠 MCQ Quiz</option>
                        <option value="dropdown">📋 Dropdown</option>
                        <option value="none">Quiz নেই</option>
                      </select>
                    </div>
                  </div>

                  {/* MCQ Builder */}
                  {form.quiz_type === 'mcq' && (
                    <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <label style={{ ...labelStyle, margin: 0, color: '#a371f7' }}>🧠 MCQ প্রশ্নসমূহ</label>
                        <button onClick={addMCQQuestion} style={{ background: '#1f1035', border: '1px solid #7c3aed44', color: '#a371f7', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>+ প্রশ্ন যোগ</button>
                      </div>
                      {form.quiz_data.map((q, qi) => (
                        <div key={qi} style={{ background: '#161b22', borderRadius: '8px', padding: '14px', marginBottom: '10px', border: '1px solid #30363d' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600' }}>প্রশ্ন {qi + 1}</span>
                            {form.quiz_data.length > 1 && <button onClick={() => removeMCQQuestion(qi)} style={{ background: 'none', border: 'none', color: '#f78166', cursor: 'pointer', fontSize: '12px' }}>✕ সরান</button>}
                          </div>
                          <input value={q.question} onChange={e => updateMCQQuestion(qi, 'question', e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} placeholder="প্রশ্ন লিখুন..." />

                          {/* Code Block */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ ...labelStyle, margin: 0 }}>💻 Code Block (ঐচ্ছিক)</label>
                              <button onClick={() => updateMCQQuestion(qi, 'code', q.code ? '' : '// code এখানে লিখুন')}
                                style={{ background: q.code ? '#2a0a00' : '#0d2818', border: `1px solid ${q.code ? '#f7816644' : '#3fb95044'}`, color: q.code ? '#f78166' : '#3fb950', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                                {q.code ? '✕ সরান' : '+ যোগ করুন'}
                              </button>
                            </div>
                            {q.code !== undefined && q.code !== '' && (
                              <textarea value={q.code} onChange={e => updateMCQQuestion(qi, 'code', e.target.value)} rows={3}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical', color: '#58a6ff' }}
                                placeholder={'#include <stdio.h>\nint main() { ... }'} />
                            )}
                          </div>

                          {q.options.map((opt, oi) => (
                            <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <input type="radio" name={`correct-${qi}`} checked={q.correct === oi} onChange={() => updateMCQQuestion(qi, 'correct', oi)} style={{ cursor: 'pointer', accentColor: '#3fb950' }} />
                              <input value={opt} onChange={e => updateMCQOption(qi, oi, e.target.value)} style={{ ...inputStyle }} placeholder={`অপশন ${['A', 'B', 'C', 'D'][oi]}`} />
                            </div>
                          ))}
                          <p style={{ color: '#484f58', fontSize: '11px', margin: '8px 0 10px' }}>✓ চিহ্নিত অপশনটি সঠিক উত্তর</p>

                          {/* Explanation */}
                          <div>
                            <label style={{ ...labelStyle, color: '#58a6ff' }}>💡 Explanation (ঐচ্ছিক)</label>
                            <textarea value={q.explanation || ''} onChange={e => updateMCQQuestion(qi, 'explanation', e.target.value)} rows={2}
                              style={{ ...inputStyle, resize: 'vertical', fontSize: '12px' }} placeholder="সঠিক উত্তরের ব্যাখ্যা লিখুন..." />
                          </div>
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
                            <input value={dd.question} onChange={e => {
                              const updated = [...form.quiz_data]
                              updated[di] = { ...updated[di], question: e.target.value }
                              setForm({ ...form, quiz_data: updated })
                            }} style={inputStyle} placeholder="সমস্যার বর্ণনা..." />
                          </div>
                          <label style={{ ...labelStyle, marginBottom: '8px' }}>ধাপসমূহ:</label>
                          {(dd.steps || []).map((step, si) => (
                            <div key={si} style={{ background: '#0d1117', borderRadius: '6px', padding: '10px', marginBottom: '8px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                <div>
                                  <label style={labelStyle}>লেবেল</label>
                                  <input value={step.label} onChange={e => updateDropdownStep(di, si, 'label', e.target.value)} style={inputStyle} placeholder="ধাপের নাম" />
                                </div>
                                <div>
                                  <label style={labelStyle}>সঠিক (index)</label>
                                  <input type="number" min="0" value={step.correct} onChange={e => updateDropdownStep(di, si, 'correct', parseInt(e.target.value) || 0)} style={inputStyle} />
                                </div>
                              </div>
                              {(step.options || []).map((opt, oi) => (
                                <div key={oi} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                                  <span style={{ color: '#484f58', fontSize: '12px', width: '20px' }}>{oi}.</span>
                                  <input value={opt} onChange={e => updateDropdownStepOption(di, si, oi, e.target.value)} style={inputStyle} placeholder={`অপশন ${oi + 1}`} />
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
                          <button onClick={() => addDropdownStep(di)} style={{ background: '#0d2818', border: '1px solid #3fb95044', color: '#3fb950', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginTop: '8px' }}>
                            + নতুন ধাপ যোগ
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Homework */}
                  <div>
                    <label style={labelStyle}>📝 Homework (ঐচ্ছিক)</label>
                    <textarea value={form.homework} onChange={e => setForm({ ...form, homework: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Homework বা assignment..." />
                  </div>

                  {/* Resources */}
                  <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px' }}>
                    <label style={{ ...labelStyle, color: '#58a6ff', marginBottom: '10px' }}>📎 Resources</label>
                    <ResourceUploader
                      lessonId={editingLesson?.id || 'new'}
                      resources={form.resources}
                      onAdd={(r) => setForm({ ...form, resources: [...form.resources, r] })}
                      onRemove={(i) => setForm({ ...form, resources: form.resources.filter((_, idx) => idx !== i) })}
                      inputStyle={inputStyle}
                      labelStyle={labelStyle}
                    />
                  </div>
                </>
              )}

              {/* Video Upload */}
                  <div>
                    <label style={labelStyle}>🎬 Video Upload (Self-hosted)</label>
                    {form.video_url && (
                      <div style={{ background: '#0d2818', border: '1px solid #3fb95044', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#3fb950', fontSize: '13px' }}>✅ Video uploaded</span>
                        <a href={form.video_url} target="_blank" rel="noreferrer"
                          style={{ color: '#58a6ff', fontSize: '12px' }}>দেখুন →</a>
                        <button onClick={() => setForm({ ...form, video_url: '' })}
                          style={{ background: 'none', border: 'none', color: '#f78166', cursor: 'pointer', fontSize: '12px', marginLeft: 'auto' }}>
                          ✕ সরান
                        </button>
                      </div>
                    )}
                    <label style={{ background: '#0a1628', border: '1px solid #58a6ff44', color: '#58a6ff', padding: '10px 16px', borderRadius: '8px', cursor: videoUploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'inline-block', opacity: videoUploading ? 0.5 : 1 }}>
                      {videoUploading ? '⏳ Upload হচ্ছে...' : '📤 Video Upload করুন'}
                      <input type="file" accept="video/*" disabled={videoUploading}
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (!file) return
                          if (file.size > 500 * 1024 * 1024) {
                            alert('File size 500MB এর বেশি হতে পারবে না')
                            return
                          }
                          setVideoUploading(true)
                          try {
                            const fd = new FormData()
                            fd.append('file', file)
                            fd.append('lessonId', editingLesson?.id || 'new_' + Date.now())
                            const res = await fetch('/api/admin/upload-video', { method: 'POST', body: fd })
                            const data = await res.json()
                            if (!res.ok) { alert('Upload error: ' + data.error); return }
                            setForm(prev => ({ ...prev, video_url: data.url }))
                          } catch { alert('Upload failed') }
                          finally { setVideoUploading(false); e.target.value = '' }
                        }}
                        style={{ display: 'none' }} />
                    </label>
                    <p style={{ color: '#484f58', fontSize: '11px', marginTop: '6px' }}>Max 500MB. MP4, WebM, MOV সাপোর্টেড। YouTube ID দিলে সেটাই priority পাবে।</p>
                  </div>

                  {/* Timestamp Quizzes */}
                  <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ ...labelStyle, color: '#f0c000', margin: 0 }}>⏱ Timestamp MCQ ({form.timestamp_quizzes?.length || 0} টি)</label>
                      <button onClick={() => setForm(prev => ({
                        ...prev,
                        timestamp_quizzes: [...(prev.timestamp_quizzes || []), {
                          id: Date.now().toString(),
                          timestamp: '',
                          question: '',
                          options: ['', '', '', ''],
                          correct: 0
                        }]
                      }))} style={{ background: '#1a1000', border: '1px solid #f0c00044', color: '#f0c000', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        + MCQ যোগ করুন
                      </button>
                    </div>

                    {(form.timestamp_quizzes || []).map((tq, ti) => (
                      <div key={tq.id || ti} style={{ background: '#161b22', borderRadius: '8px', padding: '14px', marginBottom: '10px', border: '1px solid #f0c00020' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ ...labelStyle, margin: 0, color: '#f0c000' }}>MCQ {ti + 1}</label>
                          <button onClick={() => setForm(prev => ({
                            ...prev,
                            timestamp_quizzes: prev.timestamp_quizzes.filter((_, i) => i !== ti)
                          }))} style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                            ✕
                          </button>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <label style={labelStyle}>⏱ Timestamp (মিনিট:সেকেন্ড — যেমন: 5:30)</label>
                          <input value={tq.timestamp} onChange={e => {
                            const updated = [...form.timestamp_quizzes]
                            updated[ti] = { ...updated[ti], timestamp: e.target.value }
                            setForm({ ...form, timestamp_quizzes: updated })
                          }} style={inputStyle} placeholder="5:30" />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <label style={labelStyle}>প্রশ্ন</label>
                          <input value={tq.question} onChange={e => {
                            const updated = [...form.timestamp_quizzes]
                            updated[ti] = { ...updated[ti], question: e.target.value }
                            setForm({ ...form, timestamp_quizzes: updated })
                          }} style={inputStyle} placeholder="প্রশ্ন লিখুন..." />
                        </div>

                        {tq.options.map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <input type="radio" name={`tq-correct-${ti}`} checked={tq.correct === oi}
                              onChange={() => {
                                const updated = [...form.timestamp_quizzes]
                                updated[ti] = { ...updated[ti], correct: oi }
                                setForm({ ...form, timestamp_quizzes: updated })
                              }} style={{ cursor: 'pointer', accentColor: '#3fb950' }} />
                            <input value={opt} onChange={e => {
                              const updated = [...form.timestamp_quizzes]
                              const opts = [...updated[ti].options]
                              opts[oi] = e.target.value
                              updated[ti] = { ...updated[ti], options: opts }
                              setForm({ ...form, timestamp_quizzes: updated })
                            }} style={inputStyle} placeholder={`Option ${['A','B','C','D'][oi]}`} />
                          </div>
                        ))}
                        <p style={{ color: '#484f58', fontSize: '11px', marginTop: '6px' }}>✓ চিহ্নিত option সঠিক উত্তর</p>
                      </div>
                    ))}
                  </div>

              {/* ── CODING LESSON FIELDS ── */}
              {form.lesson_type === 'coding' && (
                <div style={{ background: '#0d1117', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ ...labelStyle, color: '#3b82f6', margin: 0 }}>💻 Coding Lesson Builder</label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Language</label>
                      <select value={cd.language || 'c'} onChange={e => updateCoding('language', e.target.value)} style={inputStyle}>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>সময়কাল</label>
                      <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} style={inputStyle} placeholder="15 মিনিট" />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>📦 Header (read-only — সব problem-এ একই)</label>
                    <textarea value={cd.header || ''} onChange={e => updateCoding('header', e.target.value)} rows={3}
                      style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', color: '#58a6ff', resize: 'vertical' }}
                      placeholder="#include <stdio.h>" />
                  </div>

                  <div>
                    <label style={labelStyle}>📝 Default Starter Code (প্রতিটা problem-এ ব্যবহার হবে যদি আলাদা না দাও)</label>
                    <textarea value={cd.starter_code || ''} onChange={e => updateCoding('starter_code', e.target.value)} rows={5}
                      style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                      placeholder={'int main() {\n    // এখানে লিখুন\n    \n    return 0;\n}'} />
                  </div>

                  <div>
                    <label style={labelStyle}>📝 Note / Hint (সব problem-এর জন্য)</label>
                    <textarea value={cd.note || ''} onChange={e => updateCoding('note', e.target.value)} rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }} placeholder="Hint লিখুন..." />
                  </div>

                  {/* Problems */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ ...labelStyle, margin: 0, color: '#f0c000' }}>🧩 Problems ({(cd.problems || []).length} টি)</label>
                      <button onClick={addProblem}
                        style={{ background: '#1a1000', border: '1px solid #f0c00044', color: '#f0c000', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        + Problem যোগ
                      </button>
                    </div>

                    {(cd.problems || []).map((prob, pi) => (
                      <div key={prob.id || pi} style={{ background: '#161b22', borderRadius: '10px', padding: '14px', marginBottom: '12px', border: '1px solid #f0c00030' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ color: '#f0c000', fontSize: '13px', fontWeight: '700' }}>Problem {pi + 1}</span>
                          {(cd.problems || []).length > 1 && (
                            <button onClick={() => removeProblem(pi)}
                              style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                              ✕ সরান
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label style={labelStyle}>Problem Title</label>
                            <input value={prob.title} onChange={e => updateProblem(pi, 'title', e.target.value)}
                              style={inputStyle} placeholder="যেমন: Hello World প্রিন্ট করুন" />
                          </div>

                          <div>
                            <label style={labelStyle}>Problem Description</label>
                            <textarea value={prob.description} onChange={e => updateProblem(pi, 'description', e.target.value)} rows={3}
                              style={{ ...inputStyle, resize: 'vertical' }} placeholder="সমস্যার বিস্তারিত বর্ণনা লিখুন..." />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={labelStyle}>Sample Input (দেখানোর জন্য)</label>
                              <textarea value={prob.sample_input} onChange={e => updateProblem(pi, 'sample_input', e.target.value)} rows={2}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }} placeholder="কোনো input না থাকলে খালি রাখুন" />
                            </div>
                            <div>
                              <label style={labelStyle}>Sample Output (দেখানোর জন্য)</label>
                              <textarea value={prob.sample_output} onChange={e => updateProblem(pi, 'sample_output', e.target.value)} rows={2}
                                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', color: '#3fb950', resize: 'vertical' }} placeholder="Hello World" />
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle}>✅ Expected Output (এর সাথে match হলে pass)</label>
                            <textarea value={prob.expected_output} onChange={e => updateProblem(pi, 'expected_output', e.target.value)} rows={2}
                              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', color: '#3fb950', resize: 'vertical' }} placeholder="Hello World" />
                          </div>

                          <div>
                            <label style={labelStyle}>✏️ Starter Code (খালি রাখলে default ব্যবহার হবে)</label>
                            <textarea value={prob.starter_code || ''} onChange={e => updateProblem(pi, 'starter_code', e.target.value)} rows={4}
                              style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                              placeholder="খালি রাখলে উপরের Default Starter Code ব্যবহার হবে" />
                          </div>

                          {/* Code Cards for this problem */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ ...labelStyle, margin: 0 }}>🃏 Code Cards</label>
                              <button onClick={() => {
                                const updated = [...form.quiz_data]
                                updated[0].problems[pi].code_cards = [...(updated[0].problems[pi].code_cards || []), { id: Date.now().toString(), label: '', code: '' }]
                                setForm({ ...form, quiz_data: updated })
                              }} style={{ background: '#1f1035', border: '1px solid #7c3aed44', color: '#a371f7', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                                + Card যোগ
                              </button>
                            </div>
                            {(prob.code_cards || []).map((c, ci) => (
                              <div key={c.id || ci} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                <input value={c.label} onChange={e => updateProblemCard(pi, ci, 'label', e.target.value)}
                                  style={{ ...inputStyle, width: '40%' }} placeholder="Card label" />
                                <input value={c.code} onChange={e => updateProblemCard(pi, ci, 'code', e.target.value)}
                                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', color: '#a371f7', flex: 1 }} placeholder='printf("Hello");' />
                                <button onClick={() => {
                                  const updated = [...form.quiz_data]
                                  updated[0].problems[pi].code_cards = updated[0].problems[pi].code_cards.filter((_, idx) => idx !== ci)
                                  setForm({ ...form, quiz_data: updated })
                                }} style={{ background: '#2a0a00', border: '1px solid #f7816644', color: '#f78166', padding: '0 8px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setModalOpen(false)} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>বাতিল</button>
              <button onClick={saveLesson} disabled={saving} style={{ flex: 1, background: '#238636', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}