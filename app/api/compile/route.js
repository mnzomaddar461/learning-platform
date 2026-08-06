import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code, language, stdin } = await request.json()

    const langId = { c: 50, cpp: 54, python: 71 }
    const id = langId[language]
    if (!id) return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })

    const res = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      body: JSON.stringify({
        source_code: code,
        language_id: id,
        stdin: stdin || ''
      })
    })

    if (!res.ok) throw new Error('Judge0 error: ' + res.status)

    const data = await res.json()
    const stdout = data?.stdout || ''
    const stderr = data?.stderr || data?.compile_output || ''
    const hasError = !!stderr && !stdout

    return NextResponse.json({ stdout, stderr, hasError })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}