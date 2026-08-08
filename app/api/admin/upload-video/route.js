import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const lessonId = formData.get('lessonId')

    if (!file) return NextResponse.json({ error: 'File আবশ্যক' }, { status: 400 })

    const fileExt = file.name.split('.').pop()
    const fileName = `${lessonId}_${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error } = await supabase.storage
      .from('lesson-videos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('lesson-videos')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}