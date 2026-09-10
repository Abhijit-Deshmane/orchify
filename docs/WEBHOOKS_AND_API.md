# Orchify Webhook Ingress & tRPC API Reference

This document provides a comprehensive guide to Orchify's external webhook ingress endpoints, Inngest dispatch models, and the tRPC v11 API contract.

---

## 1. Webhook Ingress Overview

Orchify exposes dedicated HTTP POST endpoints for external services to trigger automated workflows. Incoming payloads are normalized, validated, and pushed directly into the Inngest event bus (`workflows/execute.workflow`) alongside initial contextual metadata.

All webhook endpoints require a `workflowId` query parameter:
```text
https://your-domain.com/api/webhooks/<provider>?workflowId=<WORKFLOW_ID>
```

---

## 2. Google Form Webhook

### Endpoint Specification
- **Method**: `POST`
- **Path**: `/api/webhooks/google-form?workflowId={workflowId}`
- **Content-Type**: `application/json`

### Payload Schema
```json
{
  "formId": "1FAIpQLSc_ExampleFormId",
  "formTitle": "Customer Feedback Survey",
  "responseId": "2_ABaOnu_ExampleResponseId",
  "timestamp": "2026-09-10T05:30:00.000Z",
  "respondentEmail": "user@example.com",
  "responses": {
    "What is your name?": "Jane Doe",
    "Rate our service (1-10)": "10",
    "Additional comments": "Orchify is extremely fast and intuitive!"
  }
}
```

### Context Injected into Workflow
The data is made accessible to all downstream nodes under the `googleForm` context key:
```handlebars
Respondent Email: {{googleForm.respondentEmail}}
Form Title: {{googleForm.formTitle}}
Feedback: {{googleForm.responses.[Additional comments]}}
```

### Setup via Google Apps Script
To automatically stream Google Form responses to Orchify:
1. Open your Google Form.
2. Click the three-dots menu (top right) > **Script editor**.
3. Replace the script with the following snippet:

```javascript
function onFormSubmit(e) {
  var webhookUrl = "https://<YOUR_DOMAIN_OR_NGROK_URL>/api/webhooks/google-form?workflowId=<YOUR_WORKFLOW_ID>";
  
  var form = FormApp.getActiveForm();
  var itemResponses = e.response.getItemResponses();
  var responses = {};
  
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    responses[item.getItem().getTitle()] = item.getResponse();
  }
  
  var payload = {
    formId: form.getId(),
    formTitle: form.getTitle(),
    responseId: e.response.getId(),
    timestamp: e.response.getTimestamp().toISOString(),
    respondentEmail: e.response.getRespondentEmail() || "",
    responses: responses
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(webhookUrl, options);
}
```
4. Click **Triggers** (clock icon in left sidebar) > **Add Trigger**.
5. Choose `onFormSubmit`, event source `From form`, event type `On form submit`, and save.

---

## 3. Stripe Event Webhook

### Endpoint Specification
- **Method**: `POST`
- **Path**: `/api/webhooks/stripe?workflowId={workflowId}`
- **Content-Type**: `application/json`

### Payload Schema
Any standard Stripe Event payload is supported (e.g. `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.created`):

```json
{
  "id": "evt_1NxDef2eZvKYlo2C...",
  "object": "event",
  "api_version": "2024-06-20",
  "created": 1725945600,
  "type": "checkout.session.completed",
  "livemode": false,
  "data": {
    "object": {
      "id": "cs_test_a1b2c3d4",
      "customer_email": "jane@example.com",
      "amount_total": 4900,
      "currency": "usd",
      "payment_status": "paid"
    }
  }
}
```

### Context Injected into Workflow
The normalized Stripe event is available under the `stripe` context variable:
```handlebars
Event ID: {{stripe.eventId}}
Event Type: {{stripe.eventType}}
Customer Email: {{stripe.raw.customer_email}}
Amount Paid: {{stripe.raw.amount_total}} {{stripe.raw.currency}}
```

### Local Testing with Stripe CLI
During local development, forward events directly to your local server or ngrok tunnel:

```bash
# Direct local forwarding:
stripe listen --forward-to "http://localhost:3000/api/webhooks/stripe?workflowId=<YOUR_WORKFLOW_ID>"

# Trigger a sample test event:
stripe trigger checkout.session.completed
```

---

## 4. Inngest Event Model

Whenever a manual trigger runs or an external webhook fires, Orchify dispatches an event to Inngest via [`src/inngest/utils.ts`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/inngest/utils.ts):

```typescript
await inngest.send({
  name: "workflows/execute.workflow",
  data: {
    workflowId: "cuid2_workflow_id",
    initialData: {
      stripe: { ... },
      // or googleForm: { ... }
    },
  },
  id: createId(), // Unique idempotency CUID
});
```

The `executeWorkflow` function consumes this event and initializes the execution run in the database with status `RUNNING`.

---

## 5. tRPC v11 API Procedure Contracts

All internal frontend-backend communication uses end-to-end type-safe tRPC routers mounted at `/api/trpc`.

### Authentication Middlewares
- **`protectedProcedure`**: Validates the Better-Auth session cookie. Rejects unauthenticated requests with `UNAUTHORIZED` (401).
- **`premiumProcedure`**: Inherits `protectedProcedure` and verifies an active subscription in Polar using `polarClient.customers.getStateExternal(...)`. Rejects unsubscribed users with `FORBIDDEN` (403).

---

### Workflows Router (`workflows.*`)

| Procedure | Type | Access Level | Input Schema | Description |
| :--- | :--- | :--- | :--- | :--- |
| `workflows.getMany` | Query | Protected | `{ page?: number, pageSize?: number, search?: string }` | Paginated search of user-owned workflows. |
| `workflows.getOne` | Query | Protected | `{ id: string }` | Retrieves workflow, converting relational nodes & edges into React Flow format. |
| `workflows.create` | Mutation | **Premium** | `void` | Generates a 3-word slug name and initializes a canvas with an `INITIAL` node. |
| `workflows.update` | Mutation | Protected | `{ id: string, nodes: Array<Node>, edges: Array<Edge> }` | Atomic transaction replacing nodes & connections, updating coordinates & data payloads. |
| `workflows.updateName` | Mutation | Protected | `{ id: string, name: string }` | Renames a workflow. |
| `workflows.remove` | Mutation | Protected | `{ id: string }` | Cascading delete of workflow, its nodes, edges, and execution logs. |
| `workflows.execute` | Mutation | Protected | `{ id: string }` | Dispatches manual workflow execution event to Inngest. |

---

### Credentials Router (`credentials.*`)

| Procedure | Type | Access Level | Input Schema | Description |
| :--- | :--- | :--- | :--- | :--- |
| `credentials.getMany` | Query | Protected | `{ page?: number, pageSize?: number, search?: string }` | Paginated listing of user credentials. |
| `credentials.getOne` | Query | Protected | `{ id: string }` | Fetches a single credential metadata record (value remains encrypted). |
| `credentials.getByType` | Query | Protected | `{ type: CredentialType }` | Lists credentials matching an AI provider (`OPENAI`, `ANTHROPIC`, `GEMINI`). |
| `credentials.create` | Mutation | **Premium** | `{ name: string, type: CredentialType, value: string }` | Symmetrically encrypts API key using Cryptr (AES-256) and stores it in vault. |
| `credentials.update` | Mutation | Protected | `{ id: string, name: string, type: CredentialType, value: string }` | Re-encrypts and updates existing credential. |
| `credentials.remove` | Mutation | Protected | `{ id: string }` | Deletes a stored credential. |

---

### Executions Router (`executions.*`)

| Procedure | Type | Access Level | Input Schema | Description |
| :--- | :--- | :--- | :--- | :--- |
| `executions.getMany` | Query | Protected | `{ page?: number, pageSize?: number }` | Paginated execution logs sorted chronologically descending. |
| `executions.getOne` | Query | Protected | `{ id: string }` | Detailed execution view including execution status, duration, error stack traces, and complete JSON output. |
