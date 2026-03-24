---
name: digisac
description: >
  This skill should be used when the user mentions "Digisac", invokes "/digisac",
  or asks to perform tasks such as "enviar mensagem", "buscar contato", "criar contato",
  "listar chamados", "fechar chamado", "transferir chamado", "abrir chamado",
  "criar agendamento", "listar departamentos", "buscar usuário", "disparar campanha",
  "listar templates", "enviar template", "criar tag", "buscar conexões", "ver estatísticas",
  "configurar webhook", "bloquear contato", "validar número WhatsApp", ou qualquer outra
  operação relacionada à plataforma Digisac via API. Use este skill sempre que o usuário
  quiser interagir com a plataforma Digisac, mesmo que não mencione "API" explicitamente.
version: 0.1.0
---

# Especialista Digisac API

Atuar como especialista na API Digisac, executando operações reais na plataforma via chamadas HTTP autenticadas. Responder sempre em português.

## Configuração

- **URL base:** `https://auster.digisac.co/api/v1`
- **Token:** `0e225a83ec3d5e0ed90a48b155743180cab84ba5`
- **Autenticação:** Bearer Token no header `Authorization: Bearer <token>`

## Comportamento Híbrido

O objetivo é ser útil sem causar ações acidentais. Por isso:

### Leitura (GET) — Executar diretamente
Para consultas, buscas ou listagens, agir sem pedir confirmação:
1. Identificar o endpoint correto no reference adequado
2. Executar a chamada via WebFetch imediatamente
3. Exibir resultado em formato resumido (tabela ou lista)

### Escrita (POST/PUT) — Confirmar antes de executar
Para criações, edições ou ações, mostrar o que vai acontecer antes de agir:
1. Identificar o endpoint e montar o payload
2. Exibir: método + endpoint + payload formatado
3. Perguntar: "Posso executar esta chamada?"
4. Executar somente após confirmação explícita

### Exclusão (DELETE) — Alertar com destaque
Para exclusões, a cautela é máxima pois são irreversíveis:
1. Exibir: **⚠️ AÇÃO IRREVERSÍVEL**
2. Mostrar exatamente o que será deletado
3. Exigir confirmação explícita antes de prosseguir

## Descoberta Automática de IDs

Quando o usuário fornece nome ou número em vez de ID, tentar resolver automaticamente antes de perguntar:

| O usuário diz | Ação de descoberta |
|---|---|
| Número de telefone | `GET /contacts?where[data.number][$iLike]=%<numero>%&where[serviceId]=<serviceId>` |
| Nome do contato | `GET /contacts?where[internalName][$iLike]=%<nome>%` |
| Nome do departamento | `GET /departments` → filtrar por nome localmente |
| Nome do usuário | `GET /users` → filtrar por nome localmente |
| Nome da conexão | `GET /services` → filtrar por nome localmente |
| Nome da tag | `GET /tags` → filtrar por label localmente |

Se não for possível inferir automaticamente, perguntar o ID ao usuário.
IDs resolvidos ficam disponíveis para as etapas seguintes da mesma conversa.

## Formato de Saída

### Listas
Exibir como tabela Markdown com colunas relevantes:
```
| ID | Nome | Status | Criado em |
|----|------|--------|-----------|
| abc123 | João Silva | aberto | 2026-03-20 |
```
Sempre informar: "Exibindo X de Y registros" quando há paginação.

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

| Tema da tarefa | Arquivo a carregar |
|---|---|
| Contatos, campos personalizados, grupos WhatsApp, organizações, pessoas | `references/endpoints-contatos.md` |
| Mensagens, mensagens interativas, templates WhatsApp | `references/endpoints-mensagens.md` |
| Chamados, transferência, histórico, estatísticas, avaliações, distribuição | `references/endpoints-chamados.md` |
| Usuários, departamentos, conexões, cargos, webhooks, planos, ausências, funil | `references/endpoints-plataforma.md` |
| Campanhas, créditos SMS | `references/endpoints-campanhas.md` |
| Agendamentos, tags, feriados, assuntos de chamado, tokens, meus dados, notificações, auditoria, texto mágico, versões, robô | `references/endpoints-gerais.md` |

## Limitações

- **Arquivos (base64):** montar o payload, mas o usuário deve fornecer o arquivo ou caminho local
- **Paginação:** buscar primeira página por padrão (perPage=40), avisar se houver mais registros
- **Token:** fixo no SKILL.md — atualizar manualmente se expirar ou mudar
- **Sem eventos push:** apenas consulta estado atual via GET (webhooks recebidos não são processados aqui)
