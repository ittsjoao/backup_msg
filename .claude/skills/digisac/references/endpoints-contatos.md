# Endpoints Contatos — Digisac API

## Contatos
Números dos clientes salvos na Digisac.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar todos os contatos | GET | `/api/v1/contacts?perPage=40` |
| Listar contatos da conexão | GET | `/api/v1/contacts?where[serviceId]={serviceId}` |
| Buscar contato por ID | GET | `/api/v1/contacts/{contactId}` |
| Buscar contato por número | GET | `/api/v1/contacts?where[data.number][$iLike]=%{numero}%&where[serviceId]={serviceId}` |
| Buscar com tags vinculadas | GET | `/api/v1/contacts/{contactId}?include[0]=tags` |
| Criar contato | POST | `/api/v1/contacts` |
| Criar múltiplos contatos | POST | `/api/v1/contacts/many` |
| Editar contato | PUT | `/api/v1/contacts/{contactId}` |
| Editar tags do contato | PUT | `/api/v1/contacts/{contactId}` |
| Editar campo personalizado | PUT | `/api/v1/contacts/{contactId}` |
| Exportar contatos (CSV) | POST | `/api/v1/contacts/export/csv` |
| Contar contatos com filtros | POST | `/api/v1/contacts/count` |
| Sincronizar contato | POST | `/api/v1/contacts/{contactId}/sync` |
| Bloquear contato | POST | `/api/v1/contacts/{contactId}/block` |
| Desbloquear contato | POST | `/api/v1/contacts/{contactId}/block` |
| Excluir contato | DELETE | `/api/v1/contacts/{contactId}` |
| Excluir múltiplos contatos | DELETE | `/api/v1/contacts/many` |

**Corpo criar contato:**
```json
{
  "internalName": "Nome Interno",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "defaultDepartmentId": "ID_DO_DEPARTAMENTO",
  "tagIds": ["tagId1"],
  "customFields": [{ "id": "fieldId", "value": "valor" }]
}
```

**Corpo editar tags:**
```json
{ "tagIds": ["tagId1", "tagId2"] }
```

**Corpo editar campo personalizado:**
```json
{ "customFields": [{ "id": "fieldId", "value": "novo valor" }] }
```

**Corpo bloquear:**
```json
{ "block": true, "description": "Motivo do bloqueio" }
```

**Corpo desbloquear:**
```json
{ "block": false, "description": "" }
```

**Corpo excluir múltiplos:**
```json
{ "where": { "id": ["contactId1", "contactId2"] } }
```

---

## Campos Personalizados
Campos extras nos registros de contatos (CPF, email, matrícula, etc.).

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar campos | GET | `/api/v1/custom-fields?perPage=40` |
| Buscar campo | GET | `/api/v1/custom-fields/{customFieldsId}` |
| Criar campo | POST | `/api/v1/custom-fields` |
| Editar campo | PUT | `/api/v1/custom-fields/{customFieldsId}` |
| Excluir campo | DELETE | `/api/v1/custom-fields/{customFieldsId}` |

**Corpo POST/PUT:**
```json
{
  "name": "CPF",
  "type": "text",
  "allowed": []
}
```
Tipos disponíveis: `text`, `number`, `date`, `select`

---

## Grupos WhatsApp

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar grupos por conexão | GET | `/api/v1/whatsapp/groups/service/{serviceId}` |
| Criar novo grupo | POST | `/api/v1/contacts` |
| Adicionar participante | POST | `/api/v1/contacts/{contactId}/add-members` |
| Promover a administrador | POST | `/api/v1/contacts/{contactId}/promote-members` |
| Remover permissão admin | POST | `/api/v1/contacts/{contactId}/demote-members` |

**Corpo criar grupo:**
```json
{
  "serviceId": "ID_DA_CONEXAO",
  "internalName": "Nome do Grupo",
  "isGroup": true
}
```

**Corpo add-members:** `[{ "number": "5511999999999" }]`

**Corpo promote/demote-members:** `["contactId1", "contactId2"]`

---

## Organizações
Agrupamento de Pessoas para controle de acesso a terceiros.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar organizações | GET | `/api/v1/organizations?perPage=40` |
| Buscar organização | GET | `/api/v1/organizations/{organizationId}` |
| Criar organização | POST | `/api/v1/organizations` |
| Editar organização | PUT | `/api/v1/organizations/{organizationId}` |
| Excluir organização | DELETE | `/api/v1/organizations/{organizationId}` |

**Corpo POST/PUT:** `{ "name": "Nome da organização" }`

---

## Pessoas
Agrupamento de contatos para facilitar organização.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar pessoas | GET | `/api/v1/people?perPage=40` |
| Buscar pessoa | GET | `/api/v1/people/{peopleId}` |
| Criar pessoa | POST | `/api/v1/people` |
| Editar pessoa | PUT | `/api/v1/people/{peopleId}` |
| Excluir pessoa | DELETE | `/api/v1/people/{peopleId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Nome da pessoa",
  "document": "12345678900",
  "organizationIds": ["orgId1"]
}
```

---

## Notificações de Contato

| Ação | Método | Endpoint |
|------|--------|----------|
| Marcar contato como não lido | PUT | `/api/v1/contacts/{contactId}` |
| Silenciar contato | PUT | `/api/v1/contacts/{contactId}` |

**Corpo marcar não lido:**
```json
{ "data": { "unread": true } }
```

**Corpo silenciar:**
```json
{ "isSilenced": true }
```
