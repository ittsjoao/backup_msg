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
        print(f"  [OK] {entity} ja extraido ({state['total_pages']} paginas)")
        return

    start_page = state["last_page"] + 1
    client = httpx.Client(headers=HEADERS, timeout=30)

    # Descobre total de páginas na primeira chamada
    first = client.get(f"{BASE_URL}{endpoint}", params={"perPage": PER_PAGE, "page": 1}).json()
    total_pages = first.get("lastPage", 1)
    total_items = first.get("total", 0)

    print(f"\n> {entity}: {total_items:,} registros, {total_pages:,} paginas "
          f"(retomando da pag. {start_page})")

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
              desc=f"  {entity}", unit="pag") as pbar:
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
                print(f"\n  [!] Erro HTTP {e.response.status_code} na pag {page}, tentando novamente...")
                time.sleep(2)
                continue
            except Exception as e:
                print(f"\n  [!] Erro na pag {page}: {e}. Progresso salvo, rode novamente para retomar.")
                flush(batch)
                client.close()
                return

    flush(batch)
    save_state(conn, entity, total_pages, total_pages, completed=1)
    client.close()
    print(f"  [OK] {entity} completo!")


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
    print("  [DONE] Extracao completa!")
    print(f"  Banco salvo em: {DB_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
