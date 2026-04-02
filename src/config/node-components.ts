import { InitialNode } from "@/components/inital-node";
import { NodeType } from "@prisma/client";
import type { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents;