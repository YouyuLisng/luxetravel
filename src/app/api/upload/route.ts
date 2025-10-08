import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'

export const runtime = 'edge'

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',7)

export async function POST(req: Request) {
  const file = req.body || ''
  const contentType = req.headers.get('content-type') || 'text/plain'
  const filename = `${nanoid()}.${contentType.split('/')[1]}`

  const blob = await put(filename, file, {
    contentType,
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  console.log('Using token:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Loaded' : '❌ Missing');
  // ✅ 這裡加入 log
  console.log('Blob uploaded:', blob)

  return NextResponse.json(blob)
}
