# Endpoints Plataforma — Digisac API

## Usuários
Usuários responsáveis pelos atendimentos na plataforma.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar usuários | GET | `/api/v1/users?perPage=40` |
| Buscar usuário | GET | `/api/v1/users/{userId}` |
| Criar usuário | POST | `/api/v1/users` |
| Editar usuário | PUT | `/api/v1/users/{userId}` |
| Arquivar usuário | POST | `/api/v1/users/{userId}/archive` |

**Corpo criar usuário:**
```json
{
  "accountId": "ID_DA_CONTA",
  "email": "usuario@empresa.com",
  "password": "senha123",
  "name": "Nome do Usuário",
  "rolesId": ["roleId1"],
  "organizationIds": [],
  "departmentsId": ["deptId1"]
}
```

**Corpo editar usuário:**
```json
{
  "accountId": "ID_DA_CONTA",
  "email": "novo@email.com",
  "name": "Novo Nome",
  "isAdmin": false
}
```

**Corpo arquivar:** `{ "archive": true }`

---

## Departamentos
Áreas da empresa que realizam os atendimentos (Suporte, Comercial, etc.).

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar departamentos | GET | `/api/v1/departments?perPage=40` |
| Buscar departamento | GET | `/api/v1/departments/{departmentId}` |
| Criar departamento | POST | `/api/v1/departments` |
| Editar departamento | PUT | `/api/v1/departments/{departmentId}` |
| Arquivar departamento | POST | `/api/v1/departments/{departmentId}/archive` |
| Excluir departamento | DELETE | `/api/v1/departments/{departmentId}` |

**Corpo POST/PUT:** `{ "name": "Nome do departamento" }`

**Corpo arquivar:** `{ "archive": true }`

---

## Conexões
Integrações com WhatsApp, Email, Telegram e outras plataformas de mensageria.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar conexões | GET | `/api/v1/services?perPage=35` |
| Buscar conexão | GET | `/api/v1/services/{serviceId}` |
| Criar conexão | POST | `/api/v1/services` |
| Editar conexão | PUT | `/api/v1/services/{serviceId}` |
| Arquivar conexão | POST | `/api/v1/services/{serviceId}/archive` |
| Desligar conexão | POST | `/api/v1/services/{serviceId}/shutdown` |
| Iniciar conexão | POST | `/api/v1/services/{serviceId}/start` |
| Reiniciar conexão | POST | `/api/v1/services/{serviceId}/restart` |
| Gerar QR Code (logout) | POST | `/api/v1/services/{serviceId}/logout` |
| Excluir conexão | DELETE | `/api/v1/services/{serviceId}` |
| Validar número WhatsApp | GET | `/api/v1/contacts/exists?numbers[]={numero}&serviceId={serviceId}` |

**Corpo criar conexão:**
```json
{
  "name": "Nome da conexão",
  "type": "whatsapp",
  "botId": "ID_DO_BOT",
  "defaultDepartmentId": "ID_DO_DEPARTAMENTO"
}
```

**Corpo arquivar:** `{ "archive": true, "type": "whatsapp" }`

---

## Cargos
Hierarquia de acesso e permissões dos usuários na plataforma.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar cargos | GET | `/api/v1/roles?perPage=40` |
| Buscar cargo | GET | `/api/v1/roles/{roleId}` |
| Buscar permissões do cargo | GET | `/api/v1/roles/{roleId}?include=permissions` |
| Criar cargo | POST | `/api/v1/roles` |
| Editar cargo | PUT | `/api/v1/roles/{roleId}` |
| Excluir cargo | DELETE | `/api/v1/roles/{roleId}` |

**Corpo POST/PUT:**
```json
{
  "displayName": "Nome do Cargo",
  "isAdmin": false,
  "permissions": ["permission1", "permission2"]
}
```

---

## Webhooks
Configurar notificações de eventos da plataforma para URLs externas.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar webhooks | GET | `/api/v1/me/webhooks?perPage=40` |
| Buscar webhook | GET | `/api/v1/me/webhooks/{webhookId}` |
| Criar webhook | POST | `/api/v1/me/webhooks` |
| Editar webhook | PUT | `/api/v1/me/webhooks/{webhookId}` |

**Corpo POST/PUT:**
```json
{
  "active": true,
  "name": "Nome do webhook",
  "url": "https://meu-servidor.com/webhook",
  "events": ["message.created", "ticket.closed"],
  "type": "http",
  "userId": "ID_DO_USUARIO",
  "accountId": "ID_DA_CONTA"
}
```

---

## Controle de Ausência
Registro de ausências dos usuários.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar ausências | GET | `/api/v1/absence?include=user&page=1&perPage=40` |

Filtros disponíveis: `filters[createdAt]`, `filters[endedAt]`

---

## Funil de Vendas
Gerenciamento de pipelines de vendas.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar funis | GET | `/api/v1/pipelines?perPage=30` |
| Buscar funil | GET | `/api/v1/pipelines/{pipelineId}` |
| Criar funil | POST | `/api/v1/pipelines` |
| Editar funil | PUT | `/api/v1/pipelines/{pipelineId}` |
| Excluir funil | DELETE | `/api/v1/pipelines/{pipelineId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Nome do funil",
  "type": "sales",
  "goBack": false
}
```

---

## Integrações
Sites ou plataformas incorporadas dentro da Digisac.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar integrações | GET | `/api/v1/integrations?perPage=40` |
| Buscar integração | GET | `/api/v1/integrations/{integrationId}` |

---

## Planos
Informações sobre o plano contratado.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar planos | GET | `/api/v1/plans` |
| Buscar plano | GET | `/api/v1/plans/{planId}` |
