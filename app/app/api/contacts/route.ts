import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search    = searchParams.get('search') || ''
  const serviceId = searchParams.get('serviceId') || ''
  const offset    = parseInt(searchParams.get('offset') || '0')
  const limit     = parseInt(searchParams.get('limit') || '50')

  const db = getDb()
  const like = `%${search}%`

  const contacts = db.prepare(`
    SELECT c.id, c.name, c.internal_name, c.alternative_name,
           c.phone_number, c.service_id, c.is_group, c.is_broadcast,
           c.last_message_at, s.name as service_name
    FROM contacts c
    LEFT JOIN services s ON c.service_id = s.id
    WHERE (c.name LIKE ? OR c.internal_name LIKE ? OR c.phone_number LIKE ?)
      AND (? = '' OR c.service_id = ?)
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT ? OFFSET ?
  `).all(like, like, like, serviceId, serviceId, limit, offset)

  const { total } = db.prepare(`
    SELECT COUNT(*) as total FROM contacts c
    WHERE (c.name LIKE ? OR c.internal_name LIKE ? OR c.phone_number LIKE ?)
      AND (? = '' OR c.service_id = ?)
  `).get(like, like, like, serviceId, serviceId) as { total: number }

  return NextResponse.json({ contacts, total, hasMore: offset + limit < total })
}
