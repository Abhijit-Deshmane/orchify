import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";
import { workflowsRouter } from "@/features/workflows/server/routers";

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
});

export type AppRouter = typeof appRouter;
