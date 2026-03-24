# Digisac Backup System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extrair 517k mensagens da API Digisac para SQLite e visualizá-las num app Next.js estilo WhatsApp Web.

**Architecture:** Script Python com checkpoint e paginação extrai services → departments → users → contacts → messages (5.173 páginas, ~27min) para `backup.db`. App Next.js lê o SQLite via `better-sqlite3` em API routes server-side e exibe conversas em layout de duas colunas.

**Tech Stack:** Python 3 + httpx + tqdm + sqlite3 | Next.js 15 App Router + TypeScript + Tailwind CSS + better-sqlite3

---

## PARTE 1 — EXTRATOR PYTHON

---

### Task 1: Criar estrutura do extrator e dependências

**Files:**
- Create: `extractor/requirements.txt`
- Create: `extractor/extractor.py`

**Step 1: Criar requirements.txt**

```
httpx==0.27.0
tqdm==4.66.4
```

**Step 2: Criar extractor.py com configurações e schema**

```python
#!/usr/bin/env python3
"""
Digisac Backup Extractor
Extrai services, departments, users, contacts e messages para SQLite.
Suporta retomada automática via checkpoint.
"""
import json
import sqlite3
import time
from datetime import datetime
from pathlib import Path

import httpx
from tqdm import tqdm

# ── Configuração ────────────────────────────────────────────────
BASE_URL = "https://auster.digisac.co/api/v1"
TOKEN    = "0e225a83ec3d5e0ed90a48b155743180cab84ba5"
HEADERS  = {"Authorization": f"Bearer {TOKEN}"}
PER_PAGE = 100
DELAY    = 0.3   # segundos entre requests
BATCH    = 500   # registros por INSERT
DB_PATH  = Path(__file__).parent.parent / "backup.db"

# ── Schema ──────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT,
    phone_number TEXT, account_id TEXT, default_department_id TEXT,
    archived_at TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT,
    raw_json TEXT
);

CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, account_id TEXT,
    archived_at TEXT, created_at TEXT, updated_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, status TEXT,
    archived_at TEXT, deleted_at TEXT, created_at TEXT, updated_at TEXT,
    raw_json TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY, name TEXT, internal_name TEXT, alternative_name TEXT,
    phone_number TEXT, service_id TEXT REFERENCES services(id),
    is_group INTEGER DEFAULT 0, is_broadcast INTEGER DEFAULT 0,
    last_message_at TEXT, archived_at TEXT, deleted_at TEXT,
    created_at TEXT, updated_at TEXT, raw_json TEXT
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY, contact_id TEXT REFERENCES contacts(id),
    service_id TEXT REFERENCES services(id), user_id TEXT,
    ticket_id TEXT, ticket_department_id TEXT, from_id TEXT,
    text TEXT, type TEXT, origin TEXT,
    is_from_me INTEGER DEFAULT 0, is_comment INTEGER DEFAULT 0,
    is_from_bot INTEGER DEFAULT 0, quoted_message_id TEXT,
    timestamp TEXT, created_at TEXT, updated_at TEXT, raw_json TEXT
);

CREATE TABLE IF NOT EXISTS extraction_state (
    entity TEXT PRIMARY KEY, last_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0, completed INTEGER DEFAULT 0,
    last_updated TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_id  ON messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp   ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_type        ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_text        ON messages(text);
CREATE INDEX IF NOT EXISTS idx_contacts_service_id  ON contacts(service_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name        ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_phone       ON contacts(phone_number);
"""


def init_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def get_state(conn: sqlite3.Connection, entity: str) -> dict:
    row = conn.execute(
        "SELECT last_page, total_pages, completed FROM extraction_state WHERE entity = ?",
        (entity,)
    ).fetchone()
    if row:
        return {"last_page": row[0], "total_pages": row[1], "completed": row[2]}
    return {"last_page": 0, "total_pages": 0, "completed": 0}


def save_state(conn: sqlite3.Connection, entity: str, last_page: int,
               total_pages: int, completed: int = 0):
    conn.execute("""
        INSERT INTO extraction_state (entity, last_page, total_pages, completed, last_updated)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(entity) DO UPDATE SET
            last_page = excluded.last_page,
            total_pages = excluded.total_pages,
            completed = excluded.completed,
            last_updated = excluded.last_updated
    """, (entity, last_page, total_pages, completed, datetime.utcnow().isoformat()))
    conn.commit()


# ── Mapeadores ──────────────────────────────────────────────────

def map_service(r: dict) -> tuple:
    d = r.get("data", {})
    phone = d.get("myId", "").replace("@c.us", "") or d.get("phone", "")
    return (
        r["id"], r.get("name"), r.get("type"), phone or None,
        r.get("accountId"), r.get("defaultDepartmentId"),
        r.get("archivedAt"), r.get("deletedAt"),
        r.get("createdAt"), r.get("updatedAt"), json.dumps(r)
    )


def map_department(r: dict) -> tuple:
    return (
        r["id"], r.get("name"), r.get("accountId"),
        r.get("archivedAt"), r.get("createdAt"), r.get("updatedAt")
    )


def map_user(r: dict) -> tuple:
    return (
        r["id"], r.get("name"), r.get("email"), r.get("status"),
        r.get("archivedAt"), r.get("deletedAt"),
        r.get("createdAt"), r.get("updatedAt"), json.dumps(r)
    )


def map_contact(r: dict) -> tuple:
    d = r.get("data", {})
    return (
        r["id"], r.get("name"), r.get("internalName"), r.get("alternativeName"),
        d.get("number"), r.get("serviceId"),
        int(r.get("isGroup", False)), int(r.get("isBroadcast", False)),
        r.get("lastMessageAt"), r.get("archivedAt"), r.get("deletedAt"),
        r.get("createdAt"), r.get("updatedAt"), json.dumps(r)
    )


def map_message(r: dict) -> tuple:
    return (
        r["id"], r.get("contactId"), r.get("serviceId"), r.get("userId"),
        r.get("ticketId"), r.get("ticketDepartmentId"), r.get("fromId"),
        r.get("text"), r.get("type"), r.get("origin"),
        int(r.get("isFromMe", False)), int(r.get("isComment", False)),
        int(r.get("isFromBot", False)), r.get("quotedMessageId"),
        r.get("timestamp"), r.get("createdAt"), r.get("updatedAt"),
        json.dumps(r)
    )


# ── Extrator genérico ────────────────────────────────────────────

def extract(conn: sqlite3.Connection, entity: str, endpoint: str,
            table: str, mapper, insert_sql: str):
    state = get_state(conn, entity)
    if state["completed"]:
        print(f"  ✓ {entity} já extraído ({state['total_pages']} páginas)")
        return

    start_page = state["last_page"] + 1
    client = httpx.Client(headers=HEADERS, timeout=30)

    # Descobre total de páginas na primeira chamada
    first = client.get(f"{BASE_URL}{endpoint}", params={"perPage": PER_PAGE, "page": 1}).json()
    total_pages = first.get("lastPage", 1)
    total_items = first.get("total", 0)

    print(f"\n→ {entity}: {total_items:,} registros, {total_pages:,} páginas "
          f"(retomando da pág. {start_page})")

    batch = []

    def flush(b):
        if b:
            conn.executemany(insert_sql, b)
            conn.commit()

    # Processa primeira página se ainda não foi processada
    if start_page == 1:
        batch.extend(mapper(r) for r in first.get("data", []))
        if len(batch) >= BATCH:
            flush(batch); batch = []
        save_state(conn, entity, 1, total_pages)
        time.sleep(DELAY)

    with tqdm(total=total_pages, initial=start_page - 1,
              desc=f"  {entity}", unit="pág") as pbar:
        for page in range(max(start_page, 2), total_pages + 1):
            try:
                resp = client.get(
                    f"{BASE_URL}{endpoint}",
                    params={"perPage": PER_PAGE, "page": page}
                )
                resp.raise_for_status()
                data = resp.json().get("data", [])
                batch.extend(mapper(r) for r in data)

                if len(batch) >= BATCH:
                    flush(batch); batch = []

                save_state(conn, entity, page, total_pages)
                pbar.update(1)
                time.sleep(DELAY)

            except httpx.HTTPStatusError as e:
                print(f"\n  ⚠ Erro HTTP {e.response.status_code} na pág {page}, tentando novamente...")
                time.sleep(2)
                continue
            except Exception as e:
                print(f"\n  ⚠ Erro na pág {page}: {e}. Progresso salvo, rode novamente para retomar.")
                flush(batch)
                client.close()
                return

    flush(batch)
    save_state(conn, entity, total_pages, total_pages, completed=1)
    client.close()
    print(f"  ✓ {entity} completo!")


# ── Main ─────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Digisac Backup Extractor")
    print(f"  Banco: {DB_PATH}")
    print("=" * 60)

    conn = init_db()

    extract(conn, "services", "/services", "services", map_service,
        """INSERT OR IGNORE INTO services VALUES (?,?,?,?,?,?,?,?,?,?,?)""")

    extract(conn, "departments", "/departments", "departments", map_department,
        """INSERT OR IGNORE INTO departments VALUES (?,?,?,?,?,?)""")

    extract(conn, "users", "/users", "users", map_user,
        """INSERT OR IGNORE INTO users VALUES (?,?,?,?,?,?,?,?,?)""")

    extract(conn, "contacts", "/contacts", "contacts", map_contact,
        """INSERT OR IGNORE INTO contacts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""")

    extract(conn, "messages", "/messages", "messages", map_message,
        """INSERT OR IGNORE INTO messages VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""")

    conn.close()

    print("\n" + "=" * 60)
    print("  ✅ Extração completa!")
    print(f"  Banco salvo em: {DB_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
```

**Step 3: Verificar que os arquivos foram criados**

```bash
ls extractor/
```
Expected: `extractor.py  requirements.txt`

**Step 4: Instalar dependências**

```bash
cd extractor && pip install -r requirements.txt
```
Expected: `Successfully installed httpx-0.27.0 tqdm-4.66.4`

**Step 5: Testar que o script inicializa sem erros**

```bash
cd extractor && python extractor.py --help 2>&1 || python extractor.py 2>&1 | head -5
```
Expected: Cabeçalho "Digisac Backup Extractor" e começa extração

---

### Task 2: Rodar a extração completa

**Files:**
- Execute: `extractor/extractor.py`
- Generates: `backup.db`

**Step 1: Rodar o extrator**

```bash
cd extractor && python extractor.py
```

Expected output durante execução:
```
============================================================
  Digisac Backup Extractor
  Banco: ..\backup.db
============================================================

→ services: 8 registros, 1 páginas (retomando da pág. 1)
  services: 100%|████████████| 1/1 [00:00<00:00]
  ✓ services completo!

→ departments: 14 registros, 1 páginas
  ✓ departments completo!

→ users: 87 registros, 1 páginas
  ✓ users completo!

→ contacts: 12.984 registros, ~130 páginas
  contacts:  45%|████▌     | 58/130 [00:18<00:22]

→ messages: 517.280 registros, 5.173 páginas
  messages:  12%|█▏        | 623/5173 [03:08<22:51]
```

**Se interrompido (Ctrl+C), basta rodar novamente** — o checkpoint retoma de onde parou.

**Step 2: Verificar banco após extração**

```bash
cd .. && sqlite3 backup.db "SELECT name, COUNT(*) FROM (SELECT 'services' name UNION ALL SELECT 'departments' UNION ALL SELECT 'users' UNION ALL SELECT 'contacts' UNION ALL SELECT 'messages') LEFT JOIN (SELECT 1) ON 1=1 GROUP BY name;" 2>/dev/null || sqlite3 backup.db ".tables"
```

Verificação simples:
```bash
sqlite3 backup.db "SELECT 'services', COUNT(*) FROM services UNION ALL SELECT 'contacts', COUNT(*) FROM contacts UNION ALL SELECT 'messages', COUNT(*) FROM messages;"
```

Expected:
```
services|8
contacts|12984
messages|517280
```

---

## PARTE 2 — APP NEXT.JS

---

### Task 3: Criar projeto Next.js

**Files:**
- Create: `app/` (via create-next-app)

**Step 1: Scaffoldar o projeto**

```bash
cd C:\Users\Auster\Documents\Projects\projetoBackupMsg
npx create-next-app@latest app --typescript --tailwind --app --no-src-dir --no-eslint --import-alias "@/*"
```

Responder às perguntas:
- Would you like to use `src/` directory? → **No**
- Would you like to customize the import alias? → **No**

**Step 2: Instalar better-sqlite3**

```bash
cd app && npm install better-sqlite3 && npm install -D @types/better-sqlite3
```

**Step 3: Verificar instalação**

```bash
cd app && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

---

### Task 4: Configurar banco de dados e tipos

**Files:**
- Create: `app/lib/db.ts`
- Create: `app/lib/types.ts`
- Modify: `app/next.config.ts`

**Step 1: Criar lib/db.ts**

```typescript
// app/lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), '..', 'backup.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true })
    _db.pragma('journal_mode = WAL')
  }
  return _db
}
```

**Step 2: Criar lib/types.ts**

```typescript
// app/lib/types.ts
export interface Service {
  id: string
  name: string
  type: string | null
  phone_number: string | null
}

export interface Contact {
  id: string
  name: string | null
  internal_name: string | null
  alternative_name: string | null
  phone_number: string | null
  service_id: string | null
  service_name: string | null
  is_group: number
  is_broadcast: number
  last_message_at: string | null
}

export interface Message {
  id: string
  contact_id: string | null
  service_id: string | null
  user_id: string | null
  user_name: string | null
  ticket_id: string | null
  ticket_department_id: string | null
  department_name: string | null
  from_id: string | null
  text: string | null
  type: string | null
  origin: string | null
  is_from_me: number
  is_comment: number
  is_from_bot: number
  quoted_message_id: string | null
  timestamp: string | null
  created_at: string | null
}

export interface Stats {
  total_contacts: number
  total_messages: number
  total_services: number
  oldest_message: string | null
  newest_message: string | null
}
```

**Step 3: Configurar next.config.ts para webpack (necessário para better-sqlite3)**

```typescript
// app/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3']
    }
    return config
  },
}

export default nextConfig
```

**Step 4: Verificar que o build ainda funciona**

```bash
cd app && npm run build 2>&1 | tail -5
```
Expected: sem erros de módulo

---

### Task 5: Criar API routes

**Files:**
- Create: `app/app/api/contacts/route.ts`
- Create: `app/app/api/contacts/[id]/messages/route.ts`
- Create: `app/app/api/services/route.ts`
- Create: `app/app/api/stats/route.ts`

**Step 1: GET /api/contacts**

```typescript
// app/app/api/contacts/route.ts
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
```

**Step 2: GET /api/contacts/[id]/messages**

```typescript
// app/app/api/contacts/[id]/messages/route.ts
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
           m.timestamp, m.created_at,
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
```

**Step 3: GET /api/services**

```typescript
// app/app/api/services/route.ts
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
```

**Step 4: GET /api/stats**

```typescript
// app/app/api/stats/route.ts
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
```

**Step 5: Verificar build**

```bash
cd app && npm run build 2>&1 | grep -E "(error|Error|✓)"
```
Expected: `✓ Compiled successfully` sem erros

---

### Task 6: Criar componentes de UI

**Files:**
- Create: `app/components/SearchBar.tsx`
- Create: `app/components/ServiceFilter.tsx`
- Create: `app/components/ContactItem.tsx`
- Create: `app/components/MessageBubble.tsx`
- Create: `app/components/SystemMessage.tsx`

**Step 1: SearchBar com debounce**

```typescript
// app/components/SearchBar.tsx
'use client'
import { useEffect, useState } from 'react'

interface Props {
  onSearch: (value: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = 'Buscar...' }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(t)
  }, [value, onSearch])

  return (
    <div className="px-3 py-2 border-b bg-gray-50">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-full outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />
    </div>
  )
}
```

**Step 2: ServiceFilter**

```typescript
// app/components/ServiceFilter.tsx
'use client'
import { Service } from '@/lib/types'

interface Props {
  services: Service[]
  selected: string
  onChange: (id: string) => void
}

export function ServiceFilter({ services, selected, onChange }: Props) {
  return (
    <select
      value={selected}
      onChange={e => onChange(e.target.value)}
      className="w-full mx-3 mb-2 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full outline-none focus:border-green-500"
    >
      <option value="">Todas as conexões</option>
      {services.map(s => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  )
}
```

**Step 3: ContactItem**

```typescript
// app/components/ContactItem.tsx
'use client'
import { Contact } from '@/lib/types'

interface Props {
  contact: Contact
  isActive: boolean
  onClick: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function ContactItem({ contact, isActive, onClick }: Props) {
  const displayName = contact.internal_name || contact.name || contact.phone_number || 'Sem nome'

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''}`}
    >
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
        {contact.is_group ? '👥' : displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {formatDate(contact.last_message_at)}
          </span>
        </div>
        {contact.service_name && (
          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            {contact.service_name}
          </span>
        )}
      </div>
    </div>
  )
}
```

**Step 4: MessageBubble**

```typescript
// app/components/MessageBubble.tsx
import { Message } from '@/lib/types'

const TYPE_ICONS: Record<string, string> = {
  image: '🖼️', document: '📄', audio: '🎵',
  video: '🎬', ptt: '🎤', sticker: '🎭',
}

interface Props { message: Message }

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }: Props) {
  const isSent = message.is_from_me === 1
  const icon = message.type ? TYPE_ICONS[message.type] : null
  const hasText = message.text && message.text.trim()

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl shadow-sm ${
          isSent
            ? 'bg-[#dcf8c6] rounded-tr-sm'
            : 'bg-white rounded-tl-sm'
        }`}
      >
        {!isSent && message.user_name && (
          <p className="text-xs font-semibold text-green-700 mb-1">{message.user_name}</p>
        )}
        {icon && !hasText && (
          <p className="text-2xl">{icon}</p>
        )}
        {icon && hasText && (
          <p className="text-xs text-gray-500 mb-1">{icon} {message.type}</p>
        )}
        {hasText && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        <p className={`text-xs mt-1 ${isSent ? 'text-right text-green-700' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
          {isSent && message.user_name && (
            <span className="ml-1 text-gray-400">· {message.user_name}</span>
          )}
        </p>
      </div>
    </div>
  )
}
```

**Step 5: SystemMessage**

```typescript
// app/components/SystemMessage.tsx
import { Message } from '@/lib/types'

interface Props { message: Message }

function getSystemText(message: Message): string {
  const data = message as any
  const dept = message.department_name ? ` · ${message.department_name}` : ''
  const user = message.user_name ? ` · ${message.user_name}` : ''

  if (message.type === 'ticket') {
    const isOpen = data?.data?.ticketOpen
    return isOpen ? `📋 Chamado aberto${user}${dept}` : `✅ Chamado encerrado${user}${dept}`
  }
  return message.text || `[${message.type}]`
}

export function SystemMessage({ message }: Props) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
        {getSystemText(message)}
      </span>
    </div>
  )
}
```

---

### Task 7: Criar páginas principais

**Files:**
- Modify: `app/app/page.tsx`
- Create: `app/app/conversations/layout.tsx`
- Create: `app/app/conversations/page.tsx`
- Create: `app/app/conversations/[contactId]/page.tsx`

**Step 1: Redirect em app/page.tsx**

```typescript
// app/app/page.tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/conversations') }
```

**Step 2: Layout de duas colunas**

```typescript
// app/app/conversations/layout.tsx
export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {children}
    </div>
  )
}
```

**Step 3: Página principal com sidebar**

```typescript
// app/app/conversations/page.tsx
import { ConversationsSidebar } from './ConversationsSidebar'

export default function ConversationsPage() {
  return (
    <>
      <ConversationsSidebar />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm">para ver as mensagens</p>
        </div>
      </div>
    </>
  )
}
```

**Step 4: Criar ConversationsSidebar (Client Component)**

```typescript
// app/app/conversations/ConversationsSidebar.tsx
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Contact, Service } from '@/lib/types'
import { SearchBar } from '@/components/SearchBar'
import { ServiceFilter } from '@/components/ServiceFilter'
import { ContactItem } from '@/components/ContactItem'

export function ConversationsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [search, setSearch] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const activeId = pathname.split('/conversations/')[1] || ''

  const loadContacts = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)
    const off = reset ? 0 : offset
    const res = await fetch(
      `/api/contacts?search=${encodeURIComponent(search)}&serviceId=${serviceId}&offset=${off}&limit=50`
    )
    const data = await res.json()
    setContacts(prev => reset ? data.contacts : [...prev, ...data.contacts])
    setHasMore(data.hasMore)
    setOffset(off + 50)
    setLoading(false)
  }, [search, serviceId, offset, loading])

  // Load services once
  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => setServices(d.services))
  }, [])

  // Reset and reload on filter change
  useEffect(() => {
    setOffset(0)
    setContacts([])
    setHasMore(true)
    loadContacts(true)
  }, [search, serviceId]) // eslint-disable-line

  // Intersection observer para scroll infinito
  useEffect(() => {
    if (!loaderRef.current) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) loadContacts()
    }, { threshold: 0.5 })
    obs.observe(loaderRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadContacts])

  return (
    <div className="w-[350px] flex-shrink-0 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[#075E54] text-white">
        <h1 className="font-semibold text-lg">Backup Digisac</h1>
        <p className="text-xs text-green-100">Histórico de mensagens</p>
      </div>

      <SearchBar onSearch={setSearch} placeholder="Buscar contato ou número..." />

      <div className="px-3 pt-2">
        <ServiceFilter services={services} selected={serviceId} onChange={setServiceId} />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map(c => (
          <ContactItem
            key={c.id}
            contact={c}
            isActive={c.id === activeId}
            onClick={() => router.push(`/conversations/${c.id}`)}
          />
        ))}
        <div ref={loaderRef} className="py-2 text-center text-xs text-gray-400">
          {loading ? 'Carregando...' : hasMore ? '' : `${contacts.length} contatos`}
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Página de conversa**

```typescript
// app/app/conversations/[contactId]/page.tsx
import { ConversationsSidebar } from '../ConversationsSidebar'
import { ConversationView } from './ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ contactId: string }>
}) {
  const { contactId } = await params
  return (
    <>
      <ConversationsSidebar />
      <ConversationView contactId={contactId} />
    </>
  )
}
```

**Step 6: Criar ConversationView (Client Component)**

```typescript
// app/app/conversations/[contactId]/ConversationView.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { Message } from '@/lib/types'
import { MessageBubble } from '@/components/MessageBubble'
import { SystemMessage } from '@/components/SystemMessage'

const SYSTEM_TYPES = new Set(['ticket', 'transfer', 'close', 'open'])

interface Props { contactId: string }

export function ConversationView({ contactId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  const LIMIT = 100

  const loadMessages = async (off: number, prepend = false) => {
    if (loading) return
    setLoading(true)
    const res = await fetch(`/api/contacts/${contactId}/messages?offset=${off}&limit=${LIMIT}`)
    const data = await res.json()
    setMessages(prev => prepend ? [...data.messages, ...prev] : [...prev, ...data.messages])
    setTotal(data.total)
    setHasMore(data.hasMore)
    setOffset(off + LIMIT)
    setLoading(false)
  }

  // Reset ao trocar de contato
  useEffect(() => {
    setMessages([])
    setOffset(0)
    setHasMore(true)
    isFirstLoad.current = true
    loadMessages(0)
  }, [contactId]) // eslint-disable-line

  // Scroll para baixo no primeiro carregamento
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    }
  }, [messages])

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#075E54] text-white flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-300 flex items-center justify-center text-green-900 font-bold">
          💬
        </div>
        <div>
          <p className="font-medium text-sm">Conversa</p>
          <p className="text-xs text-green-100">{total.toLocaleString('pt-BR')} mensagens</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Load more (topo) */}
        {hasMore && !loading && (
          <button
            onClick={() => loadMessages(offset, true)}
            className="w-full text-xs text-gray-500 py-2 hover:text-gray-700"
          >
            ↑ Carregar mensagens anteriores
          </button>
        )}
        {loading && <p className="text-center text-xs text-gray-400 py-2">Carregando...</p>}

        <div ref={topRef} />

        {messages.map(m =>
          SYSTEM_TYPES.has(m.type || '') || m.type === 'ticket'
            ? <SystemMessage key={m.id} message={m} />
            : <MessageBubble key={m.id} message={m} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
```

---

### Task 8: Limpar layout padrão e ajustar globals

**Files:**
- Modify: `app/app/layout.tsx`
- Modify: `app/app/globals.css`

**Step 1: Simplificar layout.tsx**

```typescript
// app/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Backup Digisac',
  description: 'Visualizador de histórico de mensagens Digisac',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

**Step 2: Globals.css mínimo**

```css
/* app/app/globals.css */
@import "tailwindcss";

* { box-sizing: border-box; }
body { margin: 0; }
```

---

### Task 9: Testar e rodar o app

**Step 1: Build final**

```bash
cd app && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` com todas as rotas listadas

**Step 2: Iniciar servidor de desenvolvimento**

```bash
cd app && npm run dev
```
Expected:
```
▲ Next.js 15.x
- Local: http://localhost:3000
✓ Ready in 2.3s
```

**Step 3: Verificar no browser**

Abrir `http://localhost:3000`:
- Deve redirecionar para `/conversations`
- Sidebar deve mostrar lista de contatos
- Clicar num contato deve abrir a conversa
- Busca deve filtrar em tempo real

**Step 4: Verificar performance**

No browser, abrir DevTools → Network:
- `/api/contacts` deve responder em < 100ms
- `/api/contacts/[id]/messages` deve responder em < 200ms

---

### Task 10: Adicionar página de stats no header

**Files:**
- Modify: `app/app/conversations/ConversationsSidebar.tsx`

**Step 1: Adicionar stats ao header da sidebar**

Adicionar fetch de stats no `ConversationsSidebar.tsx` e exibir no header:

```typescript
// Adicionar ao ConversationsSidebar — dentro do useEffect de services:
const [stats, setStats] = useState<{total_messages: number, total_contacts: number} | null>(null)

useEffect(() => {
  fetch('/api/services').then(r => r.json()).then(d => setServices(d.services))
  fetch('/api/stats').then(r => r.json()).then(d => setStats(d))
}, [])
```

E no header do componente:
```tsx
<div className="px-4 py-3 bg-[#075E54] text-white">
  <h1 className="font-semibold text-lg">Backup Digisac</h1>
  {stats && (
    <p className="text-xs text-green-100">
      {stats.total_contacts.toLocaleString('pt-BR')} contatos ·{' '}
      {stats.total_messages.toLocaleString('pt-BR')} mensagens
    </p>
  )}
</div>
```

---

## Resumo de comandos

```bash
# 1. Instalar dependências Python
cd extractor && pip install -r requirements.txt

# 2. Rodar extração (~27 min, resumível)
python extractor.py

# 3. Instalar dependências Node
cd ../app && npm install

# 4. Iniciar app
npm run dev
# Abrir: http://localhost:3000
```
