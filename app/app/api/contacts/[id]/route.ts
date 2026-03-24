import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()

  const contact = db.prepare(`
    SELECT c.id, c.name, c.internal_name, c.alternative_name,
           c.phone_number, c.service_id, c.is_group, c.is_broadcast,
           c.last_message_at, s.name as service_name
    FROM contacts c
    LEFT JOIN services s ON c.service_id = s.id
    WHERE c.id = ?
  `).get(id)

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ contact })
}
