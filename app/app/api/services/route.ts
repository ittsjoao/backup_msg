import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getDb()
  const services = db.prepare(
    'SELECT id, name, type, phone_number FROM services ORDER BY name'
  ).all()
  return NextResponse.json({ services })
}
