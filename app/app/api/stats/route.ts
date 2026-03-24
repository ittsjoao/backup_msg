import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM contacts) as total_contacts,
      (SELECT COUNT(*) FROM messages WHERE type = 'chat' OR type IS NULL) as total_messages,
      (SELECT COUNT(*) FROM services) as total_services,
      (SELECT MIN(timestamp) FROM messages) as oldest_message,
      (SELECT MAX(timestamp) FROM messages) as newest_message
  `).get()
  return NextResponse.json(stats)
}
