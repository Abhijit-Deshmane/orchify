<div align="center">

# ⚡ Orchify

**The Cloud-Native, Type-Safe Visual Workflow Automation Platform**

*Build, orchestrate, and observe event-driven AI workflows with a modern React Flow canvas, Inngest durable execution, and end-to-end TypeScript.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Inngest](https://img.shields.io/badge/Inngest-3.54-5A67D8?style=for-the-badge&logo=inngest)](https://www.inngest.com/)
[![tRPC](https://img.shields.io/badge/tRPC-v11-2596be?style=for-the-badge&logo=trpc)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Polar](https://img.shields.io/badge/Polar.sh-Billing-0052FF?style=for-the-badge)](https://polar.sh/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitored-362D59?style=for-the-badge&logo=sentry)](https://sentry.io/)

<br/>

[Architecture](docs/ARCHITECTURE.md) • [Node Development Guide](docs/NODE_DEVELOPMENT_GUIDE.md) • [Webhooks & API Reference](docs/WEBHOOKS_AND_API.md) • [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)

</div>

---

## 📖 Executive Summary

**Orchify** is an enterprise-grade workflow automation platform inspired by tools like **n8n**, **Zapier**, and **Make**, engineered from the ground up for the modern TypeScript ecosystem. 

Designed for developers and automation engineers, Orchify enables users to construct complex Directed Acyclic Graphs (DAGs) visually, dispatch resilient background executions through **Inngest**, orchestrate state-of-the-art **AI Large Language Models (Gemini, OpenAI, Anthropic)**, and stream live execution telemetry directly to browser tabs via Server-Sent Events (SSE).

### 🌟 Why Orchify?

- **Zero-Drop Durable Execution**: Workflows run as isolated, step-by-step durable functions powered by Inngest. If an external API encounters a rate limit or network blip, executions automatically pause and retry without state loss.
- **Real-Time Visual Observability**: Node states (`loading`, `success`, `error`) stream in real time to the React Flow canvas through `@inngest/realtime`, giving users immediate visual validation of running automations.
- **Topological DAG Ordering & Cycle Detection**: Workflows authored visually are resolved using topological sorting algorithms to guarantee linear execution order and prevent infinite cyclic loops.
- **Zero-Trust Encrypted Credential Vault**: Third-party API keys (OpenAI, Gemini, Anthropic) are symmetrically encrypted at rest using AES-256-GCM via Cryptr and only decrypted within ephemeral step closures.
- **Built-in Monetization & Billing**: Native subscription gating powered by **Polar.sh** and **Better-Auth**, allowing organizations to monetize advanced features effortlessly.

---

## 🏛️ System Architecture

Orchify decouples visual authoring from background execution, allowing workflows to scale independently from user sessions:

```mermaid
graph TD
    subgraph Client ["Client Layer (Next.js 15 App Router + React 19)"]
        Canvas["React Flow Editor (@xyflow/react)"]
        LivePulse["useNodeStatus (Real-Time SSE Listener)"]
        Dashboard["Workflows, Credentials & Run Logs"]
    end

    subgraph API ["API & Routing Layer"]
        tRPC["tRPC v11 API Routers (/api/trpc)"]
        AuthService["Better-Auth Engine (/api/auth)"]
        WebhookIngress["Webhook Endpoints (/api/webhooks/*)"]
        PolarGuard["Polar Subscription Gate (premiumProcedure)"]
    end

    subgraph DurableEngine ["Orchestration Engine (Inngest)"]
        EventBus["Inngest Event Bus (workflows/execute.workflow)"]
        WorkflowFn["executeWorkflow (Durable Function)"]
        TopoEngine["Topological Sorter (Cycle Detection)"]
        RealtimePub["Realtime Channel Broadcaster"]
    end

    subgraph ExecutionNodeVault ["Execution Nodes & Integrations"]
        LLM["AI Engine (Gemini 2.0 Flash, OpenAI, Anthropic)"]
        HTTP["HTTP Request Engine (ky + Handlebars)"]
        Notif["Notifications (Slack, Discord)"]
        Triggers["Triggers (Google Forms, Stripe, Manual)"]
    end

    subgraph StorageVault ["Storage & Security"]
        Postgres[(PostgreSQL / Neon Database)]
        PrismaORM[Prisma Client ORM]
        AESVault["Cryptr AES-256 Credential Vault"]
    end

    Canvas -->|Save Graph| tRPC
    Canvas -->|Trigger Run| tRPC
    tRPC -->|Check Session| AuthService
    tRPC -->|Verify Pro Plan| PolarGuard
    tRPC -->|Persist Graph| PrismaORM
    WebhookIngress -->|Google Forms / Stripe| EventBus
    tRPC -->|Dispatch Job| EventBus

    EventBus --> WorkflowFn
    WorkflowFn --> TopoEngine
    TopoEngine -->|Ordered Sequence| WorkflowFn
    WorkflowFn --> ExecutionNodeVault
    ExecutionNodeVault -->|Decrypt API Keys| AESVault
    WorkflowFn -->|Stream Loading/Success/Error| RealtimePub
    RealtimePub -.->|SSE Channel Broadcast| LivePulse
    LivePulse -.->|Animate Nodes & Badges| Canvas

    WorkflowFn -->|Log Status & Output JSON| PrismaORM
    PrismaORM --> Postgres
```

> 📘 **Deep Dive**: For full sequence diagrams, database relations, and execution lifecycles, see the [Architecture & System Design Documentation](docs/ARCHITECTURE.md).

---

## 🧩 Supported Nodes & Integrations

Orchify comes preloaded with production-ready triggers, AI models, and action nodes:

| Node | Category | Icon | Context Key | Description |
| :--- | :--- | :---: | :--- | :--- |
| **Manual Trigger** | Trigger | 🖱️ | `manualTrigger` | Initiates workflow immediately upon clicking the "Execute Workflow" button. |
| **Google Form** | Trigger | 📋 | `googleForm` | Ingress webhook triggered on form submission via Google Apps Script. |
| **Stripe Event** | Trigger | 💳 | `stripe` | Ingress webhook capturing Stripe billing events (checkout, invoices, subscriptions). |
| **Google Gemini** | AI / LLM | ♊ | `{{variableName}}` | High-throughput AI text generation using `gemini-2.0-flash` with Inngest AI tracing. |
| **OpenAI** | AI / LLM | 🤖 | `{{variableName}}` | GPT model text generation with customizable system prompts and context injection. |
| **Anthropic** | AI / LLM | 🧠 | `{{variableName}}` | Claude model reasoning and synthesis with encrypted API key management. |
| **HTTP Request** | Action | 🌐 | `{{variableName}}` | Full HTTP client supporting `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` with JSON payloads. |
| **Slack** | Action | 💬 | `{{variableName}}` | Dispatches formatted markdown messages to Slack incoming webhooks. |
| **Discord** | Action | 🎮 | `{{variableName}}` | Dispatches rich notifications to Discord channel webhooks. |

---

## 🧬 Dynamic Templating & Context Passing

Orchify utilizes **Handlebars** syntax to enable seamless data piping between upstream triggers/actions and downstream nodes.

### Handlebars Variable Syntax
Any upstream data stored in the shared `context` dictionary can be referenced using double-curly braces:

```handlebars
# Accessing Google Form Data:
Hello {{googleForm.responses.[What is your name?]}}, thank you for submitting!

# Accessing Stripe Webhook Data:
Customer {{stripe.raw.customer_email}} paid {{stripe.raw.amount_total}} {{stripe.raw.currency}}.

# Accessing AI Generation Output:
Summary: {{geminiSummary.text}}
```

### JSON Helper
To dump entire context trees or format nested JSON payloads cleanly:
```handlebars
{{json stripe.raw}}
```

---

## 💻 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Visual Workflow Canvas**: [@xyflow/react](https://reactflow.dev/) (React Flow v12)
- **Durable Execution Engine**: [Inngest](https://www.inngest.com/) & [@inngest/realtime](https://www.inngest.com/docs/features/realtime)
- **API & RPC Layer**: [tRPC v11](https://trpc.io/) & [TanStack Query v5](https://tanstack.com/query)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) (Neon Serverless) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better-Auth](https://www.better-auth.com/) (Email/Password, GitHub & Google OAuth)
- **Monetization & Billing**: [Polar.sh](https://polar.sh/) (Subscription tiers & Customer State)
- **AI Ecosystem**: [Vercel AI SDK](https://sdk.vercel.ai/) (`@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Security**: [Cryptr](https://github.com/Daplie/cryptr) (AES-256-GCM symmetric encryption)
- **Monitoring & Telemetry**: [Sentry for Next.js](https://sentry.io/)

---

## 🚀 Quickstart & Local Setup

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.18.0` or higher (Node 20+ recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: A local instance or a free cloud database on [Neon](https://neon.tech/)
- **Inngest CLI**: Optional global install, or run via `npx inngest-cli@latest dev`
- **ngrok**: For receiving external webhooks locally (Google Forms, Stripe)

---

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Abhijit-Deshmane/orchify.git

# Enter project directory
cd orchify

# Install dependencies
npm install
```

---

### 2. Configure Environment Variables

Duplicate the template configuration file:

```bash
cp .env.example .env
```

Open `.env` and configure your credentials. At minimum, ensure the following are populated:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
BETTER_AUTH_SECRET="your-32-char-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENCRYPTION_KEY="your-32-char-encryption-passphrase"
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"
POLAR_ACCESS_TOKEN="polar_oat_your_token"
POLAR_SUCCESS_URL="http://localhost:3000"
```

> 📖 **Configuration Guide**: For detailed explanations of every variable and instructions on obtaining API keys, refer to the [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md).

---

### 3. Initialize the Database

Generate the Prisma Client and synchronize schema migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Apply database migrations
npx prisma db push
```

---

### 4. Start the Multi-Process Development Environment

Orchify utilizes **mprocs** to concurrently launch Next.js, the Inngest local development server, and the ngrok tunnel in a single terminal session:

```bash
npm run dev:all
```

Alternatively, you can run each service in separate terminal tabs:

```bash
# Terminal 1: Next.js with Turbopack
npm run dev

# Terminal 2: Inngest Dev Server & Visual Dashboard
npm run inngest:dev

# Terminal 3: ngrok Webhook Tunnel
npm run ngrok:dev
```

Once running:
- **Orchify Web Application**: [http://localhost:3000](http://localhost:3000)
- **Inngest Local Dashboard**: [http://localhost:8288](http://localhost:8288)

---

## 🧪 Testing External Webhooks Locally

### Stripe Webhook Forwarding
You can stream real Stripe test events directly to your local Orchify server using the Stripe CLI:

```bash
stripe listen --forward-to "http://localhost:3000/api/webhooks/stripe?workflowId=<YOUR_WORKFLOW_ID>"
stripe trigger checkout.session.completed
```

### Google Form Webhook Forwarding
Set up the Google Apps Script trigger using your ngrok public URL:
```text
https://your-subdomain.ngrok-free.app/api/webhooks/google-form?workflowId=<YOUR_WORKFLOW_ID>
```

> 📘 Detailed setup scripts are documented in [Webhooks & API Reference](docs/WEBHOOKS_AND_API.md).

---

## 📁 Repository Structure

```text
orchify/
├── docs/                           # Comprehensive Engineering Documentation
│   ├── ARCHITECTURE.md             # System design, DAG engine & real-time telemetry
│   ├── NODE_DEVELOPMENT_GUIDE.md   # Step-by-step tutorial for building custom nodes
│   ├── WEBHOOKS_AND_API.md         # Ingress payloads, Apps Script & tRPC contracts
│   └── ENVIRONMENT_VARIABLES.md    # Exhaustive environment variable specification
├── prisma/
│   └── schema.prisma               # PostgreSQL relational schema & enums
├── public/
│   └── logos/                      # SVG brand assets (Gemini, OpenAI, Slack, etc.)
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── (auth)/                 # Login & Sign-up authentication pages
│   │   ├── (dashboard)/            # Application shell & sidebar layouts
│   │   │   ├── (editor)/           # Fullscreen React Flow workflow editor
│   │   │   └── (rest)/             # Workflows, Credentials & Executions views
│   │   └── api/                    # Route handlers (tRPC, Auth, Inngest, Webhooks)
│   ├── components/                 # Shared UI components & React Flow custom nodes
│   ├── config/                     # Node component mappings & constants
│   ├── features/                   # Feature-sliced modular architecture
│   │   ├── auth/                   # Authentication forms & hooks
│   │   ├── credentials/            # Encrypted credential vault CRUD & modals
│   │   ├── editor/                 # React Flow canvas, headers & controls
│   │   ├── executions/             # Execution log tables, executors & status views
│   │   ├── subscriptions/          # Polar subscription hooks & checkout triggers
│   │   ├── triggers/               # Trigger nodes (Manual, Forms, Stripe)
│   │   └── workflows/              # Workflow list, actions & tRPC routers
│   ├── inngest/                    # Inngest durable workflow functions & channels
│   │   ├── channels/               # Realtime status topic definitions
│   │   ├── client.ts               # Inngest SDK client initialization
│   │   ├── functions.ts            # executeWorkflow durable DAG runner
│   │   └── utils.ts                # Topological sort algorithm & event dispatcher
│   ├── lib/                        # Singletons (Prisma db, Better-Auth, Polar, Cryptr)
│   └── trpc/                       # tRPC v11 server setup, context & client providers
├── .env.example                    # Documented environment variable template
├── mprocs.yaml                     # Multi-process orchestrator configuration
├── next.config.ts                  # Next.js & Sentry build configuration
└── package.json                    # Project dependencies & automation scripts
```

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack at `http://localhost:3000`. |
| `npm run dev:all` | Launches Next.js, Inngest dev server, and ngrok tunnel concurrently via `mprocs`. |
| `npm run inngest:dev` | Starts the local Inngest Dev Server & execution visualizer at `http://localhost:8288`. |
| `npm run ngrok:dev` | Opens an ngrok tunnel forwarding to port 3000 for webhook testing. |
| `npm run build` | Compiles the production Next.js bundle with Turbopack and Sentry sourcemaps. |
| `npm run start` | Boots the compiled production application server. |
| `npm run lint` | Runs ESLint to check for code quality and linting errors. |

---

## 🛡️ Security & Privacy Architecture

- **Symmetric Key Isolation**: User credentials for LLMs (OpenAI, Gemini, Anthropic) are encrypted using AES-256-GCM before database insertion.
- **Tenant Isolation**: Every database operation enforces strict user tenancy checks:
  ```typescript
  prisma.workflow.findUniqueOrThrow({
    where: { id, userId: ctx.auth.user.id },
  });
  ```
- **Execution Sandboxing**: Workflows execute in isolated step boundaries, preventing corrupted context from leaking across runs.
- **Protected Webhook Endpoints**: Ingress webhook endpoints validate input payloads and reject malformed or unauthorized events early.

---

## 🗺️ Product Roadmap

- [ ] **Conditional Branching (`IF / ELSE` & `Switch`)**: Route workflow execution paths dynamically based on expression evaluations.
- [ ] **Looping & Batch Array Processing**: Iterate over lists of items (e.g. bulk CSV rows, Google Form arrays).
- [ ] **Cron / Scheduled Triggers**: Execute workflows on recurrent intervals (e.g., daily digests, hourly syncs).
- [ ] **Additional Integrations**:
  - Resend & SendGrid (Transactional email)
  - GitHub & GitLab (PR & Issue automations)
  - Notion & Airtable (Database sync)
  - Telegram & WhatsApp (Chatbot workflows)
- [ ] **Team Workspaces & RBAC**: Collaborative multi-user workspaces with role-based permissions.
- [ ] **Template Marketplace**: Pre-built workflow templates for rapid onboarding.

---

## 🤝 Contributing

Contributions to Orchify are warmly welcomed! To get started:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** with a detailed summary of your changes.

Before submitting a PR, ensure your code compiles cleanly and adheres to project styling standards:
```bash
npm run lint
```

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

---

## 👨‍💻 Author & Acknowledgements

Built with ❤️ by **[Abhijit Deshmane](https://github.com/Abhijit-Deshmane)**.

Special thanks to the open-source communities behind [xyflow / React Flow](https://reactflow.dev/), [Inngest](https://www.inngest.com/), [tRPC](https://trpc.io/), [Better-Auth](https://better-auth.com/), and [Polar](https://polar.sh/).
