# Endpoints Chamados — Digisac API

## Chamados (Tickets)
Gerenciamento de atendimentos entre atendente e contato.

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar chamados do contato | GET | `/api/v1/tickets?where[contactId]={contactId}` |
| Buscar chamado específico | GET | `/api/v1/tickets/{ticketId}` |
| Buscar chamados por período | GET | `/api/v1/tickets?startPeriod={data}&endPeriod={data}` |
| Buscar todos os chamados | GET | `/api/v1/tickets?perPage=40` |
| Transferir chamado | POST | `/api/v1/contacts/{contactId}/ticket/transfer` |
| Transferência em massa | POST | `/api/v1/contacts/ticket/bulk-transfer` |
| Abrir chamado | POST | `/api/v1/contacts/{contactId}/ticket/transfer` |
| Fechar chamado | POST | `/api/v1/contacts/{contactId}/ticket/close` |
| Fechar com assunto | POST | `/api/v1/contacts/{contactId}/ticket/close` |

**Corpo — Transferir / Abrir chamado:**
```json
{
  "departmentId": "ID_DO_DEPARTAMENTO",
  "userId": "ID_DO_USUARIO",
  "comments": "Comentário sobre a transferência"
}
```
Para abrir chamado sem transferir, pode omitir `userId`.

**Corpo — Transferência em massa:**
```json
{
  "departmentId": "ID_DO_DEPARTAMENTO",
  "userId": "ID_DO_USUARIO",
  "comments": "Motivo da transferência",
  "ticketsSelectedId": ["ticketId1", "ticketId2"]
}
```

**Corpo — Fechar chamado simples:** Vazio `{}`

**Corpo — Fechar com assunto:**
```json
{ "ticketTopicIds": ["topicId1"] }
```

**Buscar chamados abertos de um contato:**
```
GET /api/v1/tickets?query={"where":{"contactId":"ID_CONTATO","isOpen":true}}
```

**Buscar chamados abertos por conexão:**
```
GET /api/v1/tickets?query={"where":{"isOpen":true,"serviceId":"ID_SERVICO"}}
```

---

## Histórico de Chamados
Relatório completo de atendimentos com filtros avançados.

| Ação | Método | Endpoint |
|------|--------|----------|
| Buscar por protocolo | GET | `/api/v1/tickets?query={"where":{"protocol":"PROTOCOLO"}}` |
| Exportar em TXT | POST | `/api/v1/tickets/export` |
| Exportar em CSV | POST | `/api/v1/tickets/export-history` |
| Exportar em PDF | GET | `/pdf/tickets/{ticketId}/pt-BR?pdf=1&lng=pt-BR` |

**Corpo — Exportar TXT:** `{ "protocol": "PROTOCOLO_DO_CHAMADO" }`

**Corpo — Exportar CSV:**
```json
{
  "query": {
    "where": {
      "serviceId": "ID_DA_CONEXAO"
    }
  }
}
```

---

## Distribuição de Chamados
Ramificação automática de atendimentos para usuários de departamentos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar distribuições | GET | `/api/v1/distribution?perPage=40` |
| Buscar distribuição | GET | `/api/v1/distribution/{distributionId}` |
| Criar distribuição (padrão) | POST | `/api/v1/distribution` |
| Criar distribuição (fila) | POST | `/api/v1/distribution` |
| Editar distribuição | PUT | `/api/v1/distribution/{distributionId}` |
| Excluir distribuição | DELETE | `/api/v1/distribution/{distributionId}` |

**Corpo POST/PUT (padrão):**
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

Para distribuição em **fila**: usar `"distributeQueue": true`

---

## Estatísticas de Atendimento
Dashboard de análise de atendimentos. Formato de data: `YYYY-MM-DD`.

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

---

## Avaliações (NPS/CSAT)
Medir desempenho dos atendimentos solicitando avaliação ao final do chamado.

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
| Buscar todas as avaliações | GET | `/api/v1/answers` |
| Por período | GET | `/api/v1/answers/overview?startPeriod={data}&endPeriod={data}` |
| Por conexão | GET | `/api/v1/answers/overview?serviceId={id}&from={data}&to={data}&type={tipo}` |
| Por departamento | GET | `/api/v1/answers/overview?departmentId={id}&from={data}&to={data}` |
| Por usuário | GET | `/api/v1/answers/overview?userId={id}&from={data}&to={data}` |
| Com todos os filtros | GET | `/api/v1/answers/overview?userId={id}&departmentId={id}&serviceId={id}&from={data}&to={data}&type={tipo}` |

---

## Termos de Aceite
Solicitar ao cliente aceite de termos antes do atendimento.

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
  "textField": "Texto completo do termo aqui...",
  "file": "base64_opcional"
}
```
