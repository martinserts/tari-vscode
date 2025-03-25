import { FunctionDef } from "@tari-project/typescript-bindings";
import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  IsValidConnection,
  XYPosition,
} from "@xyflow/react";
import { SafeParseReturnType } from "zod";

export enum NodeType {
  CallNode = "callNode",
  StartNode = "startNode",
  EmitLogNode = "emitLogNode",
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CallNodeData = {
  isMethod: boolean;
  templateName: string;
  templateAddress: string;
  componentAddress?: SafeParseReturnType<unknown, unknown>;
  fn: FunctionDef;
  values?: Record<string, SafeParseReturnType<unknown, unknown>>;
};
export type CallNode = Node<CallNodeData, NodeType.CallNode>;

export type StartNodeData = Record<string, unknown>;
export type StartNode = Node<StartNodeData, NodeType.StartNode>;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type EmitLogNodeData = {
  values?: Record<string, SafeParseReturnType<unknown, unknown>>;
};
export type EmitLogNode = Node<EmitLogNodeData, NodeType.EmitLogNode>;

export type CustomNode = CallNode | StartNode | EmitLogNode;

export interface QueryBuilderState {
  readOnly: boolean;
  nodes: CustomNode[];
  edges: Edge[];
  centerX: number;
  centerY: number;
  changeCounter: number;
  updateCenter: (centerX: number, centerY: number) => void;
  setReadOnly: (value: boolean) => void;
  onNodesChange: OnNodesChange<CustomNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: CustomNode) => void;
  addNodeAt: (node: Omit<CustomNode, "id" | "position">, position?: XYPosition) => void;
  updateNodeArgValue: (nodeId: string, argName: string, value: SafeParseReturnType<unknown, unknown>) => void;
  updateCallNodeComponentAddress: (nodeId: string, value: SafeParseReturnType<unknown, unknown>) => void;
  getNodeById: (nodeId: string) => CustomNode | undefined;
  isValidConnection: IsValidConnection;
  removeNode: (nodeId: string) => void;
  saveStateToString: () => string;
  loadStateFromString: (state: string) => void;
}

export type PersistedState = Pick<QueryBuilderState, "nodes" | "edges">;
