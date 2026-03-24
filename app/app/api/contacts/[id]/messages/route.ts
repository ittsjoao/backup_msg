import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = req.nextUrl
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit  = parseInt(searchParams.get('limit') || '100')

  const db = getDb()

  const messages = db.prepare(`
    SELECT m.id, m.contact_id, m.service_id, m.user_id, m.ticket_id,
           m.ticket_department_id, m.from_id, m.text, m.type, m.origin,
           m.is_from_me, m.is_comment, m.is_from_bot, m.quoted_message_id,
           m.timestamp, m.created_at, m.raw_json,
           u.name as user_name, d.name as department_name
    FROM messages m
    LEFT JOIN users u ON m.user_id = u.id OR m.from_id = u.id
    LEFT JOIN departments d ON m.ticket_department_id = d.id
    WHERE m.contact_id = ?
    ORDER BY m.timestamp ASC
    LIMIT ? OFFSET ?
  `).all(id, limit, offset)

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM messages WHERE contact_id = ?
  `).get(id) as { total: number }

  return NextResponse.json({ messages, total, hasMore: offset + limit < total })
}
