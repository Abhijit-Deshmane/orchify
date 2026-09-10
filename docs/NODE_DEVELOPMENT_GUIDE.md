# Orchify Node Development Guide

This guide walks you through building, registering, and testing a new custom node in **Orchify**. Whether you are building an action node (e.g., sending an email via Resend) or a trigger node (e.g., listening to GitHub webhooks), follow this 7-step blueprint.

---

## Architecture of a Node

In Orchify, every node consists of five core layers:
1. **Data Model**: The `NodeType` enum in Prisma.
2. **Real-time Channel**: An Inngest channel defining status event topics.
3. **Execution Logic**: An isolated executor function wrapped in Inngest steps.
4. **Configuration Dialog**: A Shadcn/UI sheet or dialog with Zod validation.
5. **Visual Canvas Component**: A React Flow custom node wired with `useNodeStatus`.

---

## Step 1: Update the Prisma Schema

Open [`prisma/schema.prisma`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/prisma/schema.prisma) and add your new node identifier to the `NodeType` enum:

```prisma
enum NodeType {
  INITIAL
  MANUAL_TRIGGER
  HTTP_REQUEST
  GOOGLE_FORM_TRIGGER
  STRIPE_TRIGGER
  ANTHROPIC
  GEMINI
  OPENAI
  DISCORD
  SLACK
  RESEND_EMAIL // <-- Add your new node here
}
```

Regenerate the Prisma client and push the schema update:

```bash
npx prisma generate
npx prisma db push
```

---

## Step 2: Create the Inngest Real-Time Channel

Create a new channel definition file in `src/inngest/channels/resend-email.ts`:

```typescript
import { channel, topic } from "@inngest/realtime";

export const RESEND_EMAIL_CHANNEL_NAME = "resend-email-execution";

export const resendEmailChannel = channel(RESEND_EMAIL_CHANNEL_NAME)
  .topic("status", topic<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>());
```

---

## Step 3: Implement the Node Executor

Create the execution logic in `src/features/executions/components/resend-email/executor.ts`.

Key responsibilities:
- Publish `loading` status when execution begins.
- Parse template expressions in user inputs using `Handlebars.compile(...)`.
- Execute third-party requests inside an isolated `step.run`.
- Publish `success` or `error` status.
- Return the updated `context` dictionary containing the node's output under its configured `variableName`.

```typescript
import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { resendEmailChannel } from "@/inngest/channels/resend-email";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type ResendEmailData = {
  variableName?: string;
  apiKey?: string;
  to?: string;
  subject?: string;
  body?: string;
};

export const resendEmailExecutor: NodeExecutor<ResendEmailData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // 1. Broadcast loading state to client canvas
  await publish(
    resendEmailChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    const result = await step.run("resend-send-email", async () => {
      // Validate mandatory configuration
      if (!data.variableName) {
        throw new NonRetriableError("Resend node: Variable name is required");
      }
      if (!data.to || !data.subject || !data.body) {
        throw new NonRetriableError("Resend node: To, Subject, and Body are required");
      }

      // Interpolate Handlebars variables from upstream context
      const to = Handlebars.compile(data.to)(context);
      const subject = Handlebars.compile(data.subject)(context);
      const body = Handlebars.compile(data.body)(context);

      // Perform request
      const response = await ky.post("https://api.resend.com/emails", {
        headers: {
          Authorization: `Bearer ${data.apiKey}`,
        },
        json: {
          from: "noreply@orchify.dev",
          to,
          subject,
          html: body,
        },
      }).json<{ id: string }>();

      // Append result into context under variableName
      return {
        ...context,
        [data.variableName]: {
          emailId: response.id,
          recipient: to,
          sentAt: new Date().toISOString(),
        },
      };
    });

    // 2. Broadcast success state
    await publish(
      resendEmailChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return result;
  } catch (error) {
    // 3. Broadcast error state
    await publish(
      resendEmailChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
```

---

## Step 4: Create Real-Time Token Server Action

Create `src/features/executions/components/resend-email/actions.ts` to issue ephemeral subscription tokens for browser clients:

```typescript
"use server";

import { resendEmailChannel } from "@/inngest/channels/resend-email";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, type Realtime } from "@inngest/realtime";

export async function fetchResendEmailRealtimeToken(): Promise<
  Realtime.Token<typeof resendEmailChannel, ["status"]>
> {
  return getSubscriptionToken(inngest, {
    channel: resendEmailChannel(),
    topics: ["status"],
  });
}
```

---

## Step 5: Implement Configuration Modal

Create `src/features/executions/components/resend-email/dialog.tsx`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  variableName: z.string().min(1, "Variable name is required"),
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type ResendFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ResendFormValues) => void;
  defaultValues?: Partial<ResendFormValues>;
}

export const ResendEmailDialog = ({ open, onOpenChange, onSubmit, defaultValues }: Props) => {
  const form = useForm<ResendFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      variableName: defaultValues?.variableName || "resendEmail",
      to: defaultValues?.to || "",
      subject: defaultValues?.subject || "",
      body: defaultValues?.body || "",
    },
  });

  const handleSubmit = (values: ResendFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Resend Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Input {...form.register("variableName")} placeholder="Variable Name (e.g., resendEmail)" />
          <Input {...form.register("to")} placeholder="To: {{user.email}}" />
          <Input {...form.register("subject")} placeholder="Subject" />
          <Textarea {...form.register("body")} placeholder="Message Body (Supports {{context}})" />
          <Button type="submit">Save Configuration</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Step 6: Build the Visual React Flow Node

Create `src/features/executions/components/resend-email/node.tsx`:

```tsx
"use client";

import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { MailIcon } from "lucide-react";
import { BaseExecutionNode } from "../base-execution-node";
import { ResendEmailDialog, type ResendFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchResendEmailRealtimeToken } from "./actions";
import { RESEND_EMAIL_CHANNEL_NAME } from "@/inngest/channels/resend-email";

export const ResendEmailNode = memo((props: NodeProps<Node<ResendFormValues>>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: RESEND_EMAIL_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchResendEmailRealtimeToken,
  });

  const handleSubmit = (values: ResendFormValues) => {
    setNodes((nodes) =>
      nodes.map((n) => (n.id === props.id ? { ...n, data: { ...n.data, ...values } } : n)),
    );
  };

  return (
    <>
      <ResendEmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={MailIcon}
        name="Resend Email"
        status={nodeStatus}
        description={props.data?.to ? `To: ${props.data.to}` : "Not configured"}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

ResendEmailNode.displayName = "ResendEmailNode";
```

---

## Step 7: Registry & System Registration

Finally, plug your new node into the 4 central configuration registries:

### 1. Register Executor in [`executor-registry.ts`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/features/executions/lib/executor-registry.ts)
```typescript
import { resendEmailExecutor } from "../components/resend-email/executor";

export const executorRegistry: Record<NodeType, NodeExecutor<any>> = {
  // ...
  [NodeType.RESEND_EMAIL]: resendEmailExecutor,
};
```

### 2. Register Channel in [`src/inngest/functions.ts`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/inngest/functions.ts)
```typescript
import { resendEmailChannel } from "./channels/resend-email";

export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow", ... },
  { 
    event: "workflows/execute.workflow",
    channels: [
      // ...
      resendEmailChannel(),
    ],
  },
  // ...
);
```

### 3. Register Visual Component in [`src/config/node-components.ts`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/config/node-components.ts)
```typescript
import { ResendEmailNode } from "@/features/executions/components/resend-email/node";

export const nodeComponents = {
  // ...
  [NodeType.RESEND_EMAIL]: ResendEmailNode,
} as const satisfies NodeTypes;
```

### 4. Add to Node Selector Palette in [`src/components/node-selector.tsx`](file:///c:/Users/Abhijit%20Deshmane/Documents/Desktop/Projects/orchify/src/components/node-selector.tsx)
```typescript
const executionNodes: NodeTypeOption[] = [
  // ...
  {
    type: NodeType.RESEND_EMAIL,
    label: "Resend Email",
    description: "Send transactional emails via Resend API",
    icon: MailIcon,
  },
];
```

Your new node is now fully integrated with drag-and-drop authoring, dynamic validation, Handlebars templating, durable Inngest execution, and live streaming canvas telemetry!
