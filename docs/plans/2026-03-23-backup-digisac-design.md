# Design: Sistema de Backup de Mensagens Digisac

**Data:** 2026-03-23
**Status:** Aprovado

---

## Objetivo

Extrair e preservar todas as mensagens, contatos, usuários e conexões da plataforma Digisac em um banco SQLite local, com um app Next.js para visualização no estilo WhatsApp Web.

---

## Contexto e Motivação

Mensagens do WhatsApp foram perdidas. O histórico que resta está na plataforma Digisac (atendimento via WhatsApp/API). Este sistema extrai tudo via API REST e persiste localmente para acesso permanente, mesmo sem internet.

---

## Dados Reais Confirmados (via API)

| Entidade | Total | Páginas (perPage=100) |
|---|---|---|
| Conexões (services) | 8 | 1 |
| Usuários | 87 | 1 |
| Departamentos | 14 | 1 |
| Contatos | 12.984 | ~130 |
| Mensagens | 517.280 | ~5.173 |

**Estimativa de extração:** ~27 minutos com 0.3s entre requests.

---

## Abordagem Escolhida

**Python + SQLite + Next.js**

- Python para extração (robusto para scripts longos, checkpoint nativo)
- SQLite como banco (portátil, sem servidor, suporta 500k+ linhas com índices)
- Next.js (App Router) para o app de visualização
- `better-sqlite3` nas API routes (leitura síncrona, zero latência)

---

## Estrutura do Projeto

```
projetoBackupMsg/
├── extractor/
│   ├── extractor.py          ← Script principal de extração
│   ├── requirements.txt      ← httpx, tqdm
│   └── checkpoint.json       ← Controle de progresso (auto-gerado)
├── backup.db                 ← SQLite com todos os dados
├── app/                      ← Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                          ← redirect → /conversations
│   │   │   ├── conversations/
│   │   │   │   ├── page.tsx                      ← layout com sidebar
│   │   │   │   └── [contactId]/page.tsx          ← conversa
│   │   │   └── api/
│   │   │       ├── contacts/route.ts             ← GET lista paginada
│   │   │       ├── contacts/[id]/messages/route.ts ← GET mensagens
│   │   │       └── stats/route.ts                ← GET totais
│   │   └── lib/
│   │       └── db.ts                             ← singleton better-sqlite3
│   ├── package.json
│   └── next.config.ts
└── docs/plans/
```

---

## Schema SQLite

```sql
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  phone_number TEXT,
  account_id TEXT,
  default_department_id TEXT,
  archived_at TEXT,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  status TEXT,
  archived_at TEXT,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT
);

CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_id TEXT,
  archived_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT,
  internal_name TEXT,
  alternative_name TEXT,
  phone_number TEXT,
  service_id TEXT REFERENCES services(id),
  is_group INTEGER DEFAULT 0,
  is_broadcast INTEGER DEFAULT 0,
  last_message_at TEXT,
  archived_at TEXT,
  deleted_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT
);
CREATE INDEX idx_contacts_service_id ON contacts(service_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id),
  service_id TEXT REFERENCES services(id),
  user_id TEXT,
  ticket_id TEXT,
  ticket_department_id TEXT,
  from_id TEXT,
  text TEXT,
  type TEXT,
  origin TEXT,
  is_from_me INTEGER DEFAULT 0,
  is_comment INTEGER DEFAULT 0,
  is_from_bot INTEGER DEFAULT 0,
  quoted_message_id TEXT,
  timestamp TEXT,
  created_at TEXT,
  updated_at TEXT,
  raw_json TEXT
);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_service_id ON messages(service_id);
CREATE INDEX idx_messages_text ON messages(text);

CREATE TABLE extraction_state (
  entity TEXT PRIMARY KEY,
  last_page INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  last_updated TEXT
);
```

---

## Extrator Python

**Fluxo:**
1. Cria banco SQLite e tabelas se não existirem
2. Extrai sequencialmente: services → departments → users → contacts → messages
3. Para cada entidade, verifica checkpoint (resume de onde parou)
4. Insere em batch de 500 registros no SQLite
5. Salva checkpoint a cada página

**Configuração:**
```python
BASE_URL = "https://auster.digisac.co/api/v1"
TOKEN = "0e225a83ec3d5e0ed90a48b155743180cab84ba5"
PER_PAGE = 100
RATE_LIMIT_DELAY = 0.3  # segundos entre requests
BATCH_SIZE = 500
DB_PATH = "../backup.db"
```

**Campos mapeados por entidade:**
- `services.phone_number` ← `data.myId` (whatsapp) ou `data.phone` (waba)
- `contacts.phone_number` ← `data.number`
- `messages.type` ← chat | image | audio | video | document | ticket | sticker

---

## App Next.js

**Layout:** Duas colunas — sidebar de contatos + área de conversa

**Sidebar:**
- Busca por nome ou número de telefone
- Filtro por conexão (Geral, IR, Financeiro, etc.)
- Lista com: nome do contato, prévia da última mensagem, data, conexão
- Scroll infinito (cursor-based, 50 itens por vez)

**Conversa:**
- Bolhas estilo WhatsApp: esquerda = cliente, direita = atendente
- Cabeçalho: nome do contato, número, conexão
- Timestamp em cada mensagem
- Nome do atendente nas mensagens enviadas
- Ícones por tipo: 🖼️ imagem, 📄 documento, 🎵 áudio, 🎬 vídeo
- Mensagens `type=ticket` como separadores de sistema (cinza): *"Chamado aberto · Sara Vinhais · Financeiro"*
- Carrega mais ao scrollar para cima (paginação por cursor)

**Rotas de API:**
```
GET /api/contacts?search=&serviceId=&cursor=&limit=50
GET /api/contacts/[id]/messages?cursor=&limit=100
GET /api/stats
```

---

## Critérios de Sucesso

1. Extração roda sem intervenção manual, com barra de progresso e retomada automática
2. Após extração, `backup.db` contém todos os 517k+ mensagens
3. App abre no browser e carrega conversa de um contato em < 200ms
4. Busca por nome/número funciona em tempo real
5. Funciona offline após a extração inicial
