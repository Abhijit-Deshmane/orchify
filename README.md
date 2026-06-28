# Orchify

Orchify is a modern workflow automation platform inspired by n8n that enables users to build, automate, and execute workflows through a powerful visual drag-and-drop editor.

Create workflows, connect nodes, integrate AI services, manage credentials securely, and automate repetitive tasks without writing complex backend logic.

---

## Features

### Visual Workflow Builder

* Drag-and-drop workflow editor powered by React Flow
* Create and connect workflow nodes visually
* Interactive node and edge management
* Real-time workflow updates
* Automatic dependency resolution using topological sorting

### Workflow Execution

* Event-driven workflow execution with Inngest
* Sequential node processing
* Workflow execution history
* Real-time execution status tracking
* Failure handling and execution monitoring

### AI Integrations

* Multiple AI provider support
* Model selection for AI-powered workflows
* Secure credential management
* Extensible architecture for adding new providers

### Trigger System

* Manual workflow execution
* Event-driven triggers
* Extensible trigger architecture
* Custom workflow entry points

### Authentication & Authorization

* Email and password authentication
* GitHub OAuth authentication
* Secure session management
* Protected routes and APIs

### Credential Management

* API keys encrypted before storage
* Secure credential retrieval during execution
* User-specific credential isolation
* Reusable credentials across workflows

### Subscription Management

* Polar integration
* Premium feature access
* Subscription-based plans
* Billing management

---

## Tech Stack

### Frontend

- **Next.js 15**: App Router with Turbopack for fast development
- **React 19**: Latest React features with React Compiler
- **TypeScript**: Full type safety across the application
- **React Flow (@xyflow/react)**: Node-based workflow editor
- **Tailwind CSS v4**: Utility-first styling
- **shadcn/ui**: Pre-built accessible components (new-york style)

### State Management

- **TanStack Query**: Efficient data fetching and caching
- **Jotai**: Atomic state management for client-side state

### Backend

* **Next.js Server Actions**
* **tRPC**: End-to-end typesafe APIs
* **Inngest**: Background job orchestration and execution

### Database

* **PostgreSQL**: Primary database
* **Prisma ORM**: Type-safe database access

### Authentication

* **better-auth**: Authentication with Polar subscriptions
* **GitHub OAuth**

### Payments

* **Polar**

### AI/LLM

- **Vercel AI SDK**: Unified interface for multiple AI providers
- **Anthropic SDK**: Claude model integration
- **Google AI SDK**: Gemini model integration
- **OpenAI SDK**: GPT model integration

### Security

* Cryptr Encryption
* Secure Credential Storage

---

## Architecture

```text
┌──────────────────┐
│     Frontend     │
│  Next.js + React │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  API / Actions   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Inngest      │
│ Workflow Engine  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ PostgreSQL       │
│ Prisma ORM       │
└──────────────────┘
```

---

## 📦 Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── workflows/      # Workflow CRUD operations
│   ├── editor/         # React Flow editor components
│   ├── triggers/       # Trigger node implementations
│   ├── execution/      # Execution node implementations
│   ├── credentials/    # API credential management
│   └── auth/           # Authentication components
├── components/         # Shared UI components
├── trpc/              # tRPC routers and procedures
├── inngest/           # Background job definitions
├── lib/               # Shared utilities and configurations
└── config/            # Application configuration
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* PostgreSQL
* GitHub OAuth Application
* Polar Account (Optional)

---

### Clone Repository

```bash
git clone https://github.com/Abhijit-Deshmane/orchify.git

cd orchify
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
INNGEST_BASE_URL=
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

### Start Inngest Dev Server

```bash
npx inngest-cli@latest dev
```

---

## Workflow Execution Flow

```text
User Creates Workflow
          │
          ▼
Workflow Saved
          │
          ▼
Trigger Fired
          │
          ▼
Inngest Event Created
          │
          ▼
Topological Sorting
          │
          ▼
Node Execution
          │
          ▼
Execution Results Stored
          │
          ▼
Status Updated In UI
```

---

## Available Scripts

- `npm run dev` - Start Next.js development server (Turbopack)
- `npm run dev:all` - Start both Next.js and Inngest dev servers (via mprocs)
- `npm run inngest:dev` - Start Inngest development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

---

## Security

* Credential encryption using Cryptr
* Protected API routes
* Secure OAuth authentication
* Session-based authorization
* Environment variable protection
* User-specific data isolation

---

## Roadmap

* Additional workflow triggers
* More AI providers
* Scheduled workflows
* Webhook nodes
* Team workspaces
* Workflow templates
* Marketplace integrations
* Advanced analytics

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

## Inspiration

Orchify is heavily inspired by workflow automation platforms such as:

* n8n
* Zapier
* Make (formerly Integromat)

while leveraging a modern Next.js and TypeScript ecosystem.

---

## 👨‍💻 Author

Built with ❤️ by the Abhijit Deshmane.
