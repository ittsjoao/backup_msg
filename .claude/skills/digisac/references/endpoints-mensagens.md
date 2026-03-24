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

**Corpo — Comentário interno (visível só para atendentes):**
```json
{
  "text": "Nota para o atendente",
  "type": "comment",
  "contactId": "ID_DO_CONTATO",
  "userId": "ID_DO_USUARIO",
  "origin": "api"
}
```

**Corpo — Enviar via bot sem abrir chamado:**
```json
{
  "text": "Mensagem do bot",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "origin": "api",
  "dontOpenticket": true
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

**Corpo — Editar mensagem:**
```json
{
  "text": "Texto corrigido",
  "contactId": "ID_DO_CONTATO",
  "mentionedList": []
}
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
    "header": { "type": "text", "text": "Título do menu" },
    "body": { "text": "Escolha uma opção:" },
    "footer": { "text": "Rodapé opcional" },
    "action": {
      "button": "Ver opções",
      "sections": [{
        "title": "Seção 1",
        "rows": [
          { "id": "op1", "title": "Opção 1", "description": "Descrição da opção" }
        ]
      }]
    }
  },
  "departments": ["deptId1"]
}
```

**Corpo — Criar botão interativo com imagem:**
```json
{
  "name": "Botão com Imagem",
  "interactive": {
    "type": "button",
    "header": {
      "type": "image",
      "image": { "link": "https://url-da-imagem.jpg" }
    },
    "body": { "text": "Texto da mensagem" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "btn1", "title": "Sim" } },
        { "type": "reply", "reply": { "id": "btn2", "title": "Não" } }
      ]
    }
  },
  "departments": ["deptId1"]
}
```

**Corpo — Enviar mensagem interativa existente:**
```json
{
  "contactId": "ID_DO_CONTATO",
  "interactiveMessage": {
    "name": "Menu de Opções",
    "interactive": { "type": "list", "...": "..." },
    "departments": ["deptId1"]
  }
}
```

---

## Templates WhatsApp (HSM/WABA)
Textos aprovados pelo WhatsApp para iniciar atendimento ativo.
Necessário para enviar mensagem a contatos que não iniciaram conversa nas últimas 24h.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar templates | GET | `/api/v1/whatsapp-business-templates?perPage=40` |
| Buscar template | GET | `/api/v1/whatsapp-business-templates/{templateId}` |
| Contar templates | GET | `/api/v1/whatsapp-business-templates/count` |
| Criar template (só texto) | POST | `/api/v1/whatsapp-business-templates` |
| Editar template | PUT | `/api/v1/whatsapp-business-templates/{templateId}` |
| Enviar para aprovação | POST | `/api/v1/whatsapp-business-templates/{hsmId}/send-to-review` |
| Sincronizar com provedor | POST | `/api/v1/whatsapp-business-templates/refresh-templates` |
| Enviar template (com parâmetros) | POST | `/api/v1/messages` |
| Enviar template (URL dinâmica no botão) | POST | `/api/v1/messages` |
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

**Corpo — Enviar template com parâmetros:**
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

**Corpo — Enviar template com dois parâmetros no body:**
```json
{
  "type": "hsm",
  "number": "5511999999999",
  "serviceId": "ID_DA_CONEXAO",
  "hsmId": "ID_DO_TEMPLATE",
  "parameters": {
    "body": [
      { "type": "text", "text": "primeiro valor" },
      { "type": "text", "text": "segundo valor" }
    ]
  }
}
```
