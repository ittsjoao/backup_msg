# Digisac Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar um skill Claude Code especialista na API Digisac que executa chamadas reais com comportamento híbrido (leitura direta, escrita com confirmação).

**Architecture:** Skill com SKILL.md leve + 6 arquivos references/ por domínio (progressive disclosure). O skill usa WebFetch para chamadas HTTP com Bearer token fixo. Comportamento híbrido: GET executa direto, POST/PUT pede confirmação, DELETE alerta antes de agir.

**Tech Stack:** Claude Code Skills, WebFetch nativo, Markdown, API REST Digisac (Bearer Auth)

---

### Task 1: Criar estrutura de diretórios do skill

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\SKILL.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-gerais.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-contatos.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-mensagens.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-chamados.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-plataforma.md`
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-campanhas.md`

**Step 1: Criar o diretório principal e references/**

```bash
mkdir -p "C:\Users\Auster\.claude\skills\digisac\references"
```

**Step 2: Verificar criação**

```bash
ls "C:\Users\Auster\.claude\skills\digisac\"
```
Expected: diretório `references/` visível

---

### Task 2: Criar SKILL.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\SKILL.md`

**Step 1: Escrever SKILL.md com frontmatter e comportamento central**

Conteúdo completo:

```markdown
---
name: digisac
description: >
  This skill should be used when the user mentions "Digisac", invokes "/digisac",
  or asks to perform tasks such as "enviar mensagem", "buscar contato", "criar contato",
  "listar chamados", "fechar chamado", "transferir chamado", "abrir chamado",
  "criar agendamento", "listar departamentos", "buscar usuário", "disparar campanha",
  "listar templates", "enviar template", "criar tag", "buscar conexões", "ver estatísticas",
  "configurar webhook", "bloquear contato", "validar número WhatsApp", ou qualquer outra
  operação relacionada à plataforma Digisac via API.
version: 0.1.0
---

# Especialista Digisac API

Atuar como especialista na API Digisac, executando operações reais na plataforma via chamadas HTTP autenticadas. Responder sempre em português.

## Configuração

- **URL base:** `https://auster.digisac.co/api/v1`
- **Token:** `0e225a83ec3d5e0ed90a48b155743180cab84ba5`
- **Autenticação:** Bearer Token (header: `Authorization: Bearer <token>`)

## Comportamento Híbrido

### Leitura (GET) — Executar diretamente
Ao receber pedido de consulta, busca ou listagem:
1. Identificar o endpoint correto no reference adequado
2. Executar a chamada via WebFetch imediatamente
3. Exibir resultado em formato resumido (tabela ou lista)

### Escrita (POST/PUT) — Confirmar antes de executar
Ao receber pedido de criação, edição ou ação:
1. Identificar o endpoint e montar o payload
2. Exibir ao usuário: endpoint + método + payload formatado
3. Perguntar: "Posso executar esta chamada?"
4. Só executar após confirmação explícita

### Exclusão (DELETE) — Alertar com destaque
Ao receber pedido de exclusão:
1. Exibir aviso destacado: "⚠️ AÇÃO IRREVERSÍVEL"
2. Mostrar exatamente o que será deletado
3. Exigir confirmação explícita antes de prosseguir

## Descoberta Automática de IDs

Quando o usuário fornece nome ou número em vez de ID:

| O usuário diz | Ação de descoberta |
|---|---|
| Número de telefone do contato | `GET /contacts?where[data.number][$iLike]=%<numero>%&where[serviceId]=<serviceId>` |
| Nome do contato | `GET /contacts?where[internalName][$iLike]=%<nome>%` |
| Nome do departamento | `GET /departments` → filtrar por nome localmente |
| Nome do usuário | `GET /users` → filtrar por nome localmente |
| Nome da conexão | `GET /services` → filtrar por nome localmente |
| Nome da tag | `GET /tags` → filtrar por label localmente |

Se não for possível inferir automaticamente → perguntar o ID ao usuário.
IDs descobertos ficam disponíveis para as etapas seguintes da conversa.

## Formato de Saída

### Listas
Exibir como tabela Markdown com colunas relevantes:
```
| ID | Nome | Status | Criado em |
|----|------|--------|-----------|
| abc123 | João Silva | aberto | 2026-03-20 |
```
Sempre informar: "Exibindo X de Y registros" quando houver paginação.

### Item único
Exibir campos-chave em lista vertical:
```
- **ID:** abc123
- **Nome:** João Silva
- **Status:** aberto
- **Criado em:** 2026-03-20
```

### Erros de API
```
❌ Erro <STATUS_HTTP>: <mensagem da API>
Causa provável: <explicação>
Sugestão: <próximo passo>
```

## Mapeamento de References

Carregar o arquivo de referência adequado conforme o tema da tarefa:

| Tema | Arquivo |
|------|---------|
| Contatos, campos personalizados, grupos WhatsApp, organizações, pessoas | `references/endpoints-contatos.md` |
| Mensagens, mensagens interativas, templates WhatsApp | `references/endpoints-mensagens.md` |
| Chamados, transferência, histórico, estatísticas, avaliações, distribuição | `references/endpoints-chamados.md` |
| Usuários, departamentos, conexões, cargos, webhooks, planos, ausências | `references/endpoints-plataforma.md` |
| Campanhas, créditos SMS | `references/endpoints-campanhas.md` |
| Agendamentos, tags, feriados, assuntos, tokens, meus dados, notificações, auditoria, texto mágico | `references/endpoints-gerais.md` |

## Limitações

- **Arquivos (base64):** montar o payload, mas o usuário deve fornecer o arquivo ou caminho
- **Paginação:** buscar primeira página por padrão (perPage=40), avisar se houver mais
- **Token:** fixo no SKILL.md — atualizar manualmente se expirar
- **Sem eventos push:** apenas consulta estado atual via GET
```

---

### Task 3: Criar references/endpoints-gerais.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-gerais.md`

**Step 1: Escrever o arquivo com todos os endpoints gerais**

Conteúdo:

```markdown
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
Visualizar atendimentos em andamento na plataforma.

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
Gerar token de acesso.

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
```

---

### Task 4: Criar references/endpoints-contatos.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-contatos.md`

Conteúdo:

```markdown
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
Agrupamento de Pessoas para controle de acesso.

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
Agrupamento de contatos.

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
```

---

### Task 5: Criar references/endpoints-mensagens.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-mensagens.md`

Conteúdo:

```markdown
# Endpoints Mensagens — Digisac API

## Mensagens
Envio e consulta de mensagens nos chats.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar mensagens | GET | `/api/v1/messages?perPage=40` |
| Total de mensagens do contato | GET | `/api/v1/messages?where[contactId]={contactId}` |
| Buscar mensagem com arquivo | GET | `/api/v1/messages/{messageId}?include[0]=file` |
| Enviar para contato cadastrado | POST | `/api/v1/messages` |
| Enviar para número não cadastrado | POST | `/api/v1/messages` |
| Enviar SEM abrir chamado | POST | `/api/v1/messages` |
| Enviar comentário interno | POST | `/api/v1/messages` |
| Enviar via bot sem abrir chamado | POST | `/api/v1/messages` |
| Enviar imagem | POST | `/api/v1/messages` |
| Enviar PDF | POST | `/api/v1/messages` |
| Enviar áudio | POST | `/api/v1/messages` |
| Reagir a uma mensagem | POST | `/api/v1/messages/{messageId}/send-reaction` |
| Editar mensagem | PATCH | `/api/v1/messages/{messageId}` |

**Corpo — Enviar para contato cadastrado:**
```json
{
  "text": "Olá, como posso ajudar?",
  "type": "chat",
  "contactId": "ID_DO_CONTATO",
  "userId": "ID_DO_USUARIO",
  "origin": "api"
}
```

**Corpo — Enviar para número não cadastrado:**
```json
{
  "text": "Olá!",
  "type": "chat",
  "serviceId": "ID_DA_CONEXAO",
  "number": "5511999999999",
  "userId": "ID_DO_USUARIO",
  "origin": "api"
}
```

**Corpo — Enviar SEM abrir chamado:**
```json
{
  "text": "Mensagem informativa",
  "type": "chat",
  "contactId": "ID_DO_CONTATO",
  "userId": "ID_DO_USUARIO",
  "dontOpenTicket": true,
  "origin": "api"
}
```

**Corpo — Comentário interno:**
```json
{
  "text": "Nota para o atendente",
  "type": "comment",
  "contactId": "ID_DO_CONTATO",
  "userId": "ID_DO_USUARIO",
  "origin": "api"
}
```

**Corpo — Enviar imagem:**
```json
{
  "text": "Legenda opcional",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "file": {
    "base64": "BASE64_DA_IMAGEM",
    "mimetype": "image/jpeg",
    "name": "foto.jpg"
  }
}
```

**Corpo — Enviar PDF:**
```json
{
  "text": "Documento em anexo",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "file": {
    "base64": "BASE64_DO_PDF",
    "mimetype": "application/pdf",
    "name": "documento.pdf"
  }
}
```

**Corpo — Enviar áudio:**
```json
{
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "file": {
    "base64": "BASE64_DO_AUDIO",
    "mimetype": "audio/ogg"
  }
}
```

**Corpo — Reação:**
```json
{ "reactionEmojiRendered": "👍" }
```

---

## Mensagens Interativas
Mensagens com botões, listas e links — sem custo adicional.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar mensagens interativas | GET | `/api/v1/interactive-messages?perPage=40` |
| Buscar mensagem interativa | GET | `/api/v1/interactive-messages/{interactiveMessagesId}` |
| Criar mensagem interativa (lista) | POST | `/api/v1/interactive-messages` |
| Criar mensagem interativa (botão) | POST | `/api/v1/interactive-messages` |
| Enviar mensagem interativa | POST | `/api/v1/messages` |
| Excluir mensagem interativa | DELETE | `/api/v1/interactive-messages/{interactiveMessagesId}` |

**Corpo — Criar lista interativa:**
```json
{
  "name": "Menu de Opções",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Título" },
    "body": { "text": "Escolha uma opção:" },
    "footer": { "text": "Rodapé opcional" },
    "action": {
      "button": "Ver opções",
      "sections": [{
        "title": "Seção 1",
        "rows": [
          { "id": "op1", "title": "Opção 1", "description": "Descrição" }
        ]
      }]
    }
  },
  "departments": ["deptId1"]
}
```

**Corpo — Enviar mensagem interativa:**
```json
{
  "contactId": "ID_DO_CONTATO",
  "interactiveMessage": {
    "name": "Menu de Opções",
    "interactive": { "..." : "..." },
    "departments": ["deptId1"]
  }
}
```

---

## Templates WhatsApp (HSM/WABA)
Textos aprovados pelo WhatsApp para iniciar atendimento ativo.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar templates | GET | `/api/v1/whatsapp-business-templates?perPage=40` |
| Buscar template | GET | `/api/v1/whatsapp-business-templates/{templateId}` |
| Contar templates | GET | `/api/v1/whatsapp-business-templates/count` |
| Criar template (só texto) | POST | `/api/v1/whatsapp-business-templates` |
| Editar template | PUT | `/api/v1/whatsapp-business-templates/{templateId}` |
| Enviar para aprovação | POST | `/api/v1/whatsapp-business-templates/{hsmId}/send-to-review` |
| Sincronizar com provedor | POST | `/api/v1/whatsapp-business-templates/refresh-templates` |
| Enviar template (com botão) | POST | `/api/v1/messages` |
| Enviar template (URL no botão) | POST | `/api/v1/messages` |
| Excluir template | DELETE | `/api/v1/whatsapp-business-templates/{templateId}` |

**Corpo — Criar template de texto:**
```json
{
  "name": "nome_do_template",
  "internalName": "Nome Interno",
  "serviceId": "ID_DA_CONEXAO",
  "language": "pt_BR",
  "category": "MARKETING",
  "messageType": "text",
  "components": [{
    "type": "BODY",
    "text": "Olá {{1}}, sua mensagem aqui."
  }]
}
```

**Corpo — Enviar template:**
```json
{
  "type": "hsm",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "hsmId": "ID_DO_TEMPLATE",
  "files": [],
  "parameters": {
    "body": [{ "type": "text", "text": "valor do parametro 1" }]
  }
}
```

**Corpo — Enviar template com URL dinâmica:**
```json
{
  "type": "hsm",
  "contactId": "ID_DO_CONTATO",
  "hsmId": "ID_DO_TEMPLATE",
  "parameters": {
    "body": [{ "type": "text", "text": "valor" }],
    "button": [{ "type": "text", "text": "https://exemplo.com/pagina" }]
  }
}
```
```

---

### Task 6: Criar references/endpoints-chamados.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-chamados.md`

Conteúdo:

```markdown
# Endpoints Chamados — Digisac API

## Chamados (Tickets)
Gerenciamento de atendimentos entre atendente e contato.

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar chamados do contato | GET | `/api/v1/tickets?where[contactId]={contactId}` |
| Buscar chamado específico | GET | `/api/v1/tickets/{ticketId}` |
| Buscar chamados por período | GET | `/api/v1/tickets?startPeriod={data}&endPeriod={data}` |
| Transferir chamado | POST | `/api/v1/contacts/{contactId}/ticket/transfer` |
| Transferência em massa | POST | `/api/v1/contacts/ticket/bulk-transfer` |
| Abrir chamado | POST | `/api/v1/contacts/{contactId}/ticket/transfer` |
| Fechar chamado | POST | `/api/v1/contacts/{contactId}/ticket/close` |
| Fechar com assunto | POST | `/api/v1/contacts/{contactId}/ticket/close` |

**Corpo — Transferir chamado:**
```json
{
  "departmentId": "ID_DO_DEPARTAMENTO",
  "userId": "ID_DO_USUARIO",
  "comments": "Comentário sobre a transferência"
}
```

**Corpo — Transferência em massa:**
```json
{
  "departmentId": "ID_DO_DEPARTAMENTO",
  "userId": "ID_DO_USUARIO",
  "comments": "Motivo",
  "ticketsSelectedId": ["ticketId1", "ticketId2"]
}
```

**Corpo — Fechar com assunto:**
```json
{ "ticketTopicIds": ["topicId1"] }
```

---

## Histórico de Chamados
Relatório completo de atendimentos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar abertos por contato | GET | `/api/v1/tickets?query={"where":{"contactId":"ID","isOpen":true}}` |
| Buscar todos da plataforma | GET | `/api/v1/tickets?perPage=40` |
| Exportar em TXT | POST | `/api/v1/tickets/export` |
| Exportar em CSV | POST | `/api/v1/tickets/export-history` |

**Corpo — Exportar TXT:** `{ "protocol": "PROTOCOLO_DO_CHAMADO" }`

---

## Distribuição de Chamados
Ramificação automática de atendimentos para usuários de departamentos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar distribuições | GET | `/api/v1/distribution?perPage=40` |
| Buscar distribuição | GET | `/api/v1/distribution/{distributionId}` |
| Criar distribuição (fila) | POST | `/api/v1/distribution` |
| Criar distribuição (padrão) | POST | `/api/v1/distribution` |
| Editar distribuição | PUT | `/api/v1/distribution/{distributionId}` |
| Excluir distribuição | DELETE | `/api/v1/distribution/{distributionId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Nome da distribuição",
  "maxNum": 10,
  "timeToRedistribute": 300,
  "departments": ["deptId1"],
  "roles": ["roleId1"],
  "redistributeAll": false,
  "redistributeAssignedTickets": true,
  "distributeQueue": false
}
```
Para fila: `"distributeQueue": true`

---

## Estatísticas de Atendimento
Dashboard de análise de atendimentos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Por período | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}` |
| Por conexão | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&serviceId={id}` |
| Por departamento | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&departmentId={id}` |
| Por usuário | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&userId={id}` |
| Chamados abertos | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&status=open` |
| Chamados fechados | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&status=close` |
| Por data de abertura | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&periodType=open` |
| Por data de fechamento | GET | `/api/v1/dashboard/general?startPeriod={data}&endPeriod={data}&periodType=close` |

Formato de data: `YYYY-MM-DD`

---

## Avaliações (NPS/CSAT)
Medir desempenho dos atendimentos ao final de cada chamado.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar avaliações | GET | `/api/v1/questions?perPage=40` |
| Buscar avaliação | GET | `/api/v1/questions/{questionId}` |
| Criar avaliação | POST | `/api/v1/questions` |
| Editar avaliação | PUT | `/api/v1/questions/{questionId}` |
| Excluir avaliação | DELETE | `/api/v1/questions/{questionId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Nome da avaliação",
  "duration": 60,
  "type": "nps",
  "questionMessage": "Como você avalia nosso atendimento?",
  "tries": 3,
  "successMessage": "Obrigado pela avaliação!",
  "invalidMessage": "Opção inválida, tente novamente."
}
```

---

## Estatísticas de Avaliações

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar avaliações | GET | `/api/v1/answers` |
| Por período | GET | `/api/v1/answers/overview?startPeriod={data}&endPeriod={data}` |
| Por conexão | GET | `/api/v1/answers/overview?serviceId={id}&from={data}&to={data}&type={tipo}` |
| Por departamento | GET | `/api/v1/answers/overview?departmentId={id}&from={data}&to={data}` |
| Por usuário | GET | `/api/v1/answers/overview?userId={id}&from={data}&to={data}` |

---

## Termos de Aceite

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar termos | GET | `/api/v1/acceptance-terms?perPage=40` |
| Buscar termo | GET | `/api/v1/acceptance-terms/{termsId}` |
| Criar termo | POST | `/api/v1/acceptance-terms` |
| Editar termo | PUT | `/api/v1/acceptance-terms/{termsId}` |
| Excluir termo | DELETE | `/api/v1/acceptance-terms/{termsId}` |

**Corpo POST/PUT:**
```json
{
  "name": "Termo de uso",
  "textField": "Texto completo do termo...",
  "file": "base64_opcional"
}
```
```

---

### Task 7: Criar references/endpoints-plataforma.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-plataforma.md`

Conteúdo:

```markdown
# Endpoints Plataforma — Digisac API

## Usuários
Usuários responsáveis pelos atendimentos.

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

**Corpo arquivar:** `{ "archive": true }`

---

## Departamentos
Áreas da empresa (Suporte, Comercial, etc.).

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
Integrações com WhatsApp, Email, Telegram e outras plataformas.

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

---

## Cargos
Hierarquia de acesso e permissões.

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
Notificações de eventos da plataforma para URLs externas.

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

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar ausências | GET | `/api/v1/absence?include=user&page=1&perPage=40` |

Filtros disponíveis: `filters[createdAt]`, `filters[endedAt]`

---

## Funil de Vendas

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

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar integrações | GET | `/api/v1/integrations?perPage=40` |
| Buscar integração | GET | `/api/v1/integrations/{integrationId}` |

---

## Planos

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar planos | GET | `/api/v1/plans` |
| Buscar plano | GET | `/api/v1/plans/{planId}` |

---

## Notificação de Mensagens

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
```

---

### Task 8: Criar references/endpoints-campanhas.md

**Files:**
- Create: `C:\Users\Auster\.claude\skills\digisac\references\endpoints-campanhas.md`

Conteúdo:

```markdown
# Endpoints Campanhas — Digisac API

## Campanhas
Disparo de mensagens em massa para contatos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar campanhas | GET | `/api/v1/campaigns?perPage=40` |
| Buscar campanha | GET | `/api/v1/campaigns/{campaignsId}` |
| Extrair status/stats | GET | `/api/v1/campaigns/{campaignId}/stats` |
| Editar campanha | PUT | `/api/v1/campaigns/{campaignsId}` |
| Exportar resultados (CSV) | POST | `/api/v1/campaigns/export/csv` |
| Excluir campanha | DELETE | `/api/v1/campaigns/{campaignsId}` |

**Corpo exportar CSV:**
```json
{
  "where": { "id": "ID_DA_CAMPANHA" },
  "type": "csv"
}
```

---

## Créditos SMS
Consulta de créditos para envio de campanhas por SMS.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar movimentações | GET | `/api/v1/credit-movements?perPage=40` |
| Balanço atual | GET | `/api/v1/credit-movements/balances` |
| Buscar movimentação | GET | `/api/v1/credit-movements/{movementId}` |
```

---

### Task 9: Validar estrutura criada

**Step 1: Verificar todos os arquivos**

```bash
find "C:\Users\Auster\.claude\skills\digisac" -type f
```

Expected: 7 arquivos (SKILL.md + 6 references)

**Step 2: Verificar conteúdo do SKILL.md**

Confirmar que:
- [ ] Frontmatter tem `name` e `description` com trigger phrases
- [ ] URL base e token configurados
- [ ] Regras GET/POST/DELETE definidas
- [ ] Tabela de descoberta de IDs presente
- [ ] Mapeamento de references presente

---

### Task 10: Salvar memória do projeto

**Step 1: Salvar no sistema de memória do Claude Code**

Criar arquivo de memória em `C:\Users\Auster\.claude\projects\C--Users-Auster-Documents-Projects-projetoBackupMsg\memory\` documentando:
- Skill digisac criado e localização
- Token e URL da API
- Estrutura de arquivos

---

**Plan complete and saved to `docs/plans/2026-03-23-digisac-skill.md`. Two execution options:**

**1. Subagent-Driven (this session)** — Dispatcho subagent por tarefa, revisão entre tarefas, iteração rápida

**2. Parallel Session (separate)** — Abrir nova sessão com executing-plans, execução em batch com checkpoints

**Which approach?**
