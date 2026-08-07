import { NextResponse } from 'next/server'

// Judge0 / RapidAPI বাদ দিয়ে Wandbox ব্যবহার করা হচ্ছে — ঠিক Practice.jsx এ যেভাবে
// কাজ করছে সেভাবেই। কোনো API key লাগবে না, তাই RAPIDAPI_KEY ইস্যু / rate-limit
// error গুলো আর হবে না।
//
// Request/response shape আগের মতোই রাখা হয়েছে, তাই lesson page-এর fetch('/api/...')
// কল-এ কোনো পরিবর্তন লাগবে না।

const WANDBOX_URL = 'https://wandbox.org/api/compile.json'

// language থেকে Wandbox compiler নাম বের করার ম্যাপ
function getCompilerConfig(language) {
  switch (language) {
    case 'c':
      return { compiler: 'gcc-head-c', options: 'warning,c11', raw: '-std=c11' }
    case 'cpp':
      return { compiler: 'gcc-head', options: 'warning,c++17', raw: '-std=c++17' }
    case 'python':
      // cpython-head পাওয়া না গেলে wandbox.org/api/list.json থেকে সঠিক
      // cpython ভার্সন (যেমন cpython-3.12.1) বসিয়ে নাও
      return { compiler: 'cpython-head', options: '', raw: '' }
    default:
      return null
  }
}

export async function POST(request) {
  try {
    const { code, language, stdin } = await request.json()

    const config = getCompilerConfig(language)
    if (!config) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
    }

    const res = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: config.compiler,
        code,
        options: config.options,
        'compiler-option-raw': config.raw,
        stdin: stdin || '',
      }),
    })

    if (!res.ok) throw new Error('Wandbox error: ' + res.status)

    const data = await res.json()
    const stderr = data?.compiler_error || data?.runtime_error || ''
    const stdout = data?.program_output || ''
    const hasError = !!stderr && !stdout

    return NextResponse.json({ stdout, stderr, hasError })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}