import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { customAlphabet } from 'nanoid'

export const runtime = 'edge'

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7)

export async function POST(req: Request) {
  const file = req.body || ''
  const contentType = req.headers.get('content-type') || 'application/octet-stream'
  const filename = `${nanoid()}.${contentType.split('/')[1] || 'bin'}`

  const blob = await put(filename, file, {
    contentType,
    access: 'public',
    token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
  })

  return NextResponse.json(blob)
}
