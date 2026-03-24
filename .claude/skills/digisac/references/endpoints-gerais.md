# Endpoints Gerais — Digisac API

## Agendamentos
Programar ações automáticas em data e hora específicas (abrir chamado, notificar atendente).

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar agendamentos | GET | `/api/v1/schedule?perPage=40` |
| Buscar agendamento | GET | `/api/v1/schedule/{scheduleId}` |
| Criar agendamento | POST | `/api/v1/schedule` |
| Editar agendamento | PUT | `/api/v1/schedule/{scheduleId}` |
| Excluir agendamento | DELETE | `/api/v1/schedule/{scheduleId}` |

**Corpo POST/PUT:**
```json
{
  "contactId": "ID_DO_CONTATO",
  "departmentId": "ID_DO_DEPARTAMENTO",
  "files": [],
  "message": "Texto da mensagem",
  "notes": "Notas internas",
  "notificateUser": true,
  "openTicket": true,
  "scheduledAt": "2026-03-23 10:30:00",
  "userId": "ID_DO_USUARIO"
}
```

---

## Agora (Tempo Real)
Visualizar atendimentos em andamento na plataforma em tempo real.

| Ação | Método | Endpoint |
|------|--------|----------|
| Todos os dados em tempo real | GET | `/api/v1/now/resume` |
| Departamentos em tempo real | GET | `/api/v1/now/departments-resume` |
| Atendentes em tempo real | GET | `/api/v1/now/attendance-resume` |

---

## Assuntos de Chamado
Classificar atendimentos com tópicos de fechamento.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar assuntos | GET | `/api/v1/ticket-topics?perPage=40` |
| Buscar assunto | GET | `/api/v1/ticket-topics/{ticketTopicId}` |
| Criar assunto | POST | `/api/v1/ticket-topics` |
| Editar assunto | PUT | `/api/v1/ticket-topics/{ticketTopicId}` |
| Excluir assunto | DELETE | `/api/v1/ticket-topics/{ticketTopicId}` |

**Corpo POST/PUT:** `{ "name": "Nome do assunto" }`

---

## Auditoria de Autenticação
Registros de criação, alteração e exclusão no sistema.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar auditorias | GET | `/api/v1/auth-history?perPage=40` |
| Buscar auditoria | GET | `/api/v1/auth-history/{authId}` |

---

## Autorização
Gerar token de acesso via credenciais.

| Ação | Método | Endpoint |
|------|--------|----------|
| Gerar token | POST | `/api/v1/oauth/token` |

**Corpo:**
```json
{
  "grant_type": "password",
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET",
  "username": "email@exemplo.com",
  "password": "senha"
}
```

---

## Feriados
Configurar datas de feriado para o robô enviar mensagem de ausência.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar feriados | GET | `/api/v1/holiday?perPage=40` |
| Buscar feriado | GET | `/api/v1/holiday/{holidayId}` |
| Criar feriado | POST | `/api/v1/holiday` |
| Editar feriado | PUT | `/api/v1/holiday/{holidayId}` |
| Excluir feriado | DELETE | `/api/v1/holiday/{holidayId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Nome do feriado",
  "from": "2026-12-25",
  "to": "2026-12-25",
  "message": "Estamos de folga! Retornamos em breve."
}
```

---

## Tags
Etiquetas para classificar contatos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar tags | GET | `/api/v1/tags?perPage=40` |
| Buscar tag | GET | `/api/v1/tags/{tagId}` |
| Criar tag | POST | `/api/v1/tags` |
| Editar tag | PUT | `/api/v1/tags/{tagId}` |
| Excluir tag | DELETE | `/api/v1/tags/{tagId}` |
| Adicionar tag a múltiplos contatos | POST | `/api/v1/tags/{tagId}/contacts` |
| Remover tag de múltiplos contatos | DELETE | `/api/v1/tags/{tagId}/contacts` |

**Corpo criar/editar:** `{ "label": "Nome da tag" }`

**Corpo bulk (add/remove):**
```json
{ "where": { "id": ["contactId1", "contactId2"] } }
```

---

## Texto Mágico
Corrigir ou ajustar o tom de uma mensagem.

| Ação | Método | Endpoint |
|------|--------|----------|
| Corrigir mensagem | POST | `/api/v1/messages/magic-text` |

**Corpo:** `{ "message": "texto aqui", "tone": "correct" }`

---

## Meus Dados
Informações do usuário autenticado.

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar meus dados | GET | `/api/v1/me` |
| Editar idioma | PUT | `/api/v1/me` |

**Corpo editar idioma:** `{ "language": "pt-BR" }` (opções: `pt-BR`, `en-US`, `es`)

---

## Tokens Pessoais

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar tokens | GET | `/api/v1/me/tokens?perPage=30` |
| Buscar token | GET | `/api/v1/me/tokens/{tokenId}` |
| Criar token | POST | `/api/v1/me/tokens` |
| Editar token | PUT | `/api/v1/me/tokens/{tokenId}` |
| Excluir token | DELETE | `/api/v1/me/tokens/{tokenId}` |

**Corpo POST/PUT:** `{ "name": "Nome do token" }`

---

## Central de Notificações

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar notificações | GET | `/api/v1/notifications?perPage=40` |
| Marcar todas como lidas | GET | `/api/v1/notifications/read-all` |

---

## Redefinir Senha

| Ação | Método | Endpoint |
|------|--------|----------|
| Solicitar nova senha | POST | `/api/v1/reset-password/request` |

**Corpo:** `{ "email": "email@exemplo.com" }`

---

## Versões

| Ação | Método | Endpoint |
|------|--------|----------|
| Versão da plataforma | GET | `/api/v1/versions` |

---

## Acionamento de Flag no Robô

| Ação | Método | Endpoint |
|------|--------|----------|
| Acionar flag | POST | `/api/v1/bots/{botId}/trigger-signal/{contactId}?flag=nomeDaFlag` |
