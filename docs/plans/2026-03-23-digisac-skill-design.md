# Design: Skill Especialista Digisac API

**Data:** 2026-03-23
**Status:** Aprovado

---

## Objetivo

Criar um skill Claude Code chamado `digisac` que age como especialista na API Digisac, capaz de consultar e executar operações reais na plataforma via chamadas HTTP autenticadas, em português.

---

## Contexto

- **URL base:** `https://auster.digisac.co/api/v1`
- **Token:** `0e225a83ec3d5e0ed90a48b155743180cab84ba5` (Bearer)
- **Documentação fonte:** `digisac_collection.json` (43 categorias, ~200 endpoints)
- **Plataforma:** Claude Code (Windows 10, bash)

---

## Abordagem Escolhida: Skill com References por Categoria (Opção B)

`SKILL.md` leve com comportamento central + arquivos `references/` separados por domínio, carregados conforme a necessidade da tarefa (progressive disclosure).

---

## Estrutura de Arquivos

```
digisac/
├── SKILL.md                          ← Comportamento central, regras, config
└── references/
    ├── endpoints-gerais.md           ← Agendamentos, Agora, Assuntos, Feriados, Tags
    ├── endpoints-contatos.md         ← Contatos, Campos personalizados, Grupos WA, Pessoas, Org
    ├── endpoints-mensagens.md        ← Mensagens, Mensagens interativas, Templates WA
    ├── endpoints-chamados.md         ← Chamados, Distribuição, Histórico, Estatísticas
    ├── endpoints-plataforma.md       ← Usuários, Departamentos, Conexões, Cargos, Webhooks
    └── endpoints-campanhas.md        ← Campanhas, Créditos SMS, Avaliações
```

---

## Comportamento do Skill

### Gatilhos de Ativação
- `/digisac` ou menção explícita à Digisac
- Pedidos: "enviar mensagem", "buscar contato", "listar chamados", "criar agendamento", "fechar chamado", "disparar campanha", "ver departamentos", "transferir chamado", etc.

### Fluxo Híbrido
| Método HTTP | Comportamento |
|-------------|---------------|
| GET | Executa direto, exibe resultado resumido |
| POST / PUT | Mostra payload, pede confirmação antes de executar |
| DELETE | Alerta irreversibilidade, pede confirmação explícita |

### Descoberta Automática de IDs
- Número de contato → `GET /contacts?where[data.number][$iLike]=...`
- Nome de departamento → `GET /departments` + filtro local
- Impossível inferir → pergunta diretamente ao usuário
- IDs resolvidos ficam disponíveis no contexto da conversa

### Formato de Saída
- **Listas** → tabela com colunas relevantes (id, nome, status, data)
- **Item único** → campos-chave em lista vertical
- **Erro de API** → status HTTP + mensagem + causa provável sugerida

---

## Mapeamento References → Domínios

| Arquivo reference | Categorias cobertas |
|---|---|
| `endpoints-gerais.md` | Agendamentos, Agora, Assuntos de chamado, Auditoria, Autorização, Feriados, Tags, Texto mágico, Versões, Idioma, Meus dados, Tokens, Redefinir senha, Central de notificações, Notificação |
| `endpoints-contatos.md` | Contatos, Campos personalizados, Grupos WhatsApp, Organizações, Pessoas |
| `endpoints-mensagens.md` | Mensagens, Mensagens interativas, Templates WhatsApp |
| `endpoints-chamados.md` | Chamados, Distribuição de chamados, Histórico de chamados, Estatísticas de atendimento, Estatísticas de avaliações, Avaliações |
| `endpoints-plataforma.md` | Usuários, Departamentos, Conexões, Cargos, Webhooks, Controle de ausência, Integrações, Planos |
| `endpoints-campanhas.md` | Campanhas, Créditos SMS |

---

## Limitações Conhecidas

- **Arquivos (base64):** o skill monta o payload, mas o usuário deve fornecer o arquivo/caminho
- **Paginação:** busca primeira página por padrão, avisa se houver mais registros
- **Token fixo:** embutido no SKILL.md — requer atualização manual se mudar
- **Sem eventos push:** apenas consulta estado atual via GET (sem webhooks recebidos)

## Fora do Escopo
- Configuração interna de robôs/bots
- Geração de QR Code interativo (sem interface visual)

---

## Critérios de Sucesso

1. Qualquer pedido em português sobre a Digisac resulta na ação correta sem consultar docs externos
2. IDs resolvidos automaticamente na maioria dos casos
3. Ações destrutivas nunca executam sem confirmação explícita
4. Resultados sempre exibidos em formato legível (tabela/lista)
