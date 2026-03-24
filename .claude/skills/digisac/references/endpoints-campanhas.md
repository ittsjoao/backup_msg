# Endpoints Campanhas — Digisac API

## Campanhas
Disparo de mensagens em massa para contatos.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar campanhas | GET | `/api/v1/campaigns?perPage=40` |
| Buscar campanha | GET | `/api/v1/campaigns/{campaignsId}` |
| Extrair status / stats | GET | `/api/v1/campaigns/{campaignId}/stats` |
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
Consulta de créditos disponíveis para envio de campanhas por SMS.

| Ação | Método | Endpoint |
|------|--------|----------|
| Listar movimentações | GET | `/api/v1/credit-movements?perPage=40` |
| Balanço atual | GET | `/api/v1/credit-movements/balances` |
| Buscar movimentação específica | GET | `/api/v1/credit-movements/{movementId}` |
