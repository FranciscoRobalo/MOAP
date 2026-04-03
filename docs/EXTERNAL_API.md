# MOAP External API Documentation

## Overview

The MOAP External API allows other websites and applications to securely access budget data, obras information, and materials from the MOAP platform.

## Authentication

All API requests require an API key in the request header:

```bash
curl -X POST https://moap.example.com/api/external \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json"
```

Or using Bearer token format:

```bash
curl -X POST https://moap.example.com/api/external \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json"
```

## Request Format

All requests use the POST method with JSON payload:

```json
{
  "method": "GET|POST|PUT|DELETE",
  "table": "budgets|budget_items|obras|materials",
  "id": "optional-record-id",
  "data": { "field": "value" },
  "filters": { "field": "value" }
}
```

## Tables and Operations

### Budgets

Get all budgets for the authenticated user:
```json
{
  "method": "GET",
  "table": "budgets"
}
```

Get a specific budget:
```json
{
  "method": "GET",
  "table": "budgets",
  "id": "budget-uuid"
}
```

Create a budget:
```json
{
  "method": "POST",
  "table": "budgets",
  "data": {
    "name": "Orçamento Q1 2025",
    "obra_id": "obra-uuid",
    "status": "rascunho",
    "total_value": 15000.00
  }
}
```

Update a budget:
```json
{
  "method": "PUT",
  "table": "budgets",
  "id": "budget-uuid",
  "data": {
    "status": "aprovado",
    "notes": "Aprovado pelo cliente"
  }
}
```

Delete a budget:
```json
{
  "method": "DELETE",
  "table": "budgets",
  "id": "budget-uuid"
}
```

### Budget Items

Get budget items:
```json
{
  "method": "GET",
  "table": "budget_items",
  "filters": {
    "budget_id": "budget-uuid"
  }
}
```

Create budget item:
```json
{
  "method": "POST",
  "table": "budget_items",
  "data": {
    "budget_id": "budget-uuid",
    "original_name": "Cimento Portland",
    "quantity": 1000,
    "unit": "kg",
    "unit_price": 0.15,
    "category": "Estrutura"
  }
}
```

### Obras

Get obras:
```json
{
  "method": "GET",
  "table": "obras"
}
```

Get specific obra:
```json
{
  "method": "GET",
  "table": "obras",
  "id": "obra-uuid"
}
```

Create obra:
```json
{
  "method": "POST",
  "table": "obras",
  "data": {
    "title": "Reabilitação Prédio Lisboa",
    "client_name": "João Silva",
    "location": "Lisboa",
    "budget": 50000.00,
    "status": "pending",
    "category": "Residencial"
  }
}
```

Update obra:
```json
{
  "method": "PUT",
  "table": "obras",
  "id": "obra-uuid",
  "data": {
    "status": "approved",
    "progress": 30
  }
}
```

### Materials

Get materials (reference database):
```json
{
  "method": "GET",
  "table": "materials"
}
```

Filter materials by category:
```json
{
  "method": "GET",
  "table": "materials",
  "filters": {
    "category": "Revestimentos"
  }
}
```

## Response Format

Success response:
```json
{
  "data": [...],
  "count": 10
}
```

Error response:
```json
{
  "error": "Error message"
}
```

## Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Missing or invalid API key
- `404 Not Found` - Record not found
- `500 Internal Server Error` - Server error

## Security

- All requests are authenticated using API keys
- Each API key is associated with a specific user
- Users can only access their own data (budgets, obras)
- API keys can be managed in the admin panel
- API keys support expiration dates
- All data transmitted over HTTPS

## Rate Limiting

No rate limiting is currently implemented, but may be added in future versions.

## Examples

### JavaScript/Node.js

```javascript
const apiKey = "your_api_key_here"
const apiUrl = "https://moap.example.com/api/external"

// Get budgets
const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    method: "GET",
    table: "budgets",
  }),
})

const result = await response.json()
console.log(result.data)
```

### Python

```python
import requests
import json

api_key = "your_api_key_here"
api_url = "https://moap.example.com/api/external"

headers = {
    "x-api-key": api_key,
    "Content-Type": "application/json",
}

payload = {
    "method": "GET",
    "table": "budgets",
}

response = requests.post(api_url, headers=headers, json=payload)
data = response.json()
print(data)
```

### cURL

```bash
curl -X POST https://moap.example.com/api/external \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "table": "budgets"
  }'
```

## Support

For API support, contact: api-support@moap.pt
