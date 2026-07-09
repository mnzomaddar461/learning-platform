export async function POST(request) {
  const { code, language } = await request.json()

  const langMap = { c: 'c', cpp: 'cpp', python: 'python' }
  const lang = langMap[language] || 'c'

  try {
    const res = await fetch('https://onecompiler-apis.p.rapidapi.com/api/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'onecompiler-apis.p.rapidapi.com',
        'x-rapidapi-key': 'free'
      },
      body: JSON.stringify({
        language: lang,
        stdin: '',
        files: [{ name: lang === 'python' ? 'main.py' : lang === 'cpp' ? 'main.cpp' : 'main.c', content: code }]
      })
    })

    const data = await res.json()
    const output = data.stdout || data.stderr || data.exception || 'কোনো output নেই'
    return Response.json({ output })
  } catch (err) {
    return Response.json({ output: '❌ Error: ' + err.message }, { status: 500 })
  }
}