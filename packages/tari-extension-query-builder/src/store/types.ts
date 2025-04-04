import { FunctionDef, Type } from "@tari-project/typescript-bindings";
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
  GenericNode = "genericNode",
}

export enum GenericNodeType {
  CallNode = "callNode",
  StartNode = "startNode",
  EmitLogNode = "emitLogNode",
  AssertBucketContains = "assertBucketContains",
}

export interface CallNodeMetadata {
  type: GenericNodeType.CallNode;
  isMethod: boolean;
  templateName: string;
  templateAddress: string;
  fn: FunctionDef;
}

export type GenericNodeMetadata = CallNodeMetadata;
export type GenericNodeIcon = "enter" | "rocket" | "home" | "cube" | "check-circled";
export interface GenericNodeInputType {
  hasEnterConnection: boolean;
  type: Type;
  name: string;
  label?: string;
  validValues?: string[];
}
export interface GenericNodeOutputType {
  type: Type;
  name: string;
  label?: string;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GenericNodeData = {
  type: GenericNodeType;
  values?: Record<string, SafeParseReturnType<unknown, unknown>>;
  metadata?: GenericNodeMetadata;
  hasEnterConnection?: boolean;
  hasExitConnection?: boolean;
  icon?: GenericNodeIcon;
  badge?: string;
  title?: string;
  largeCaption?: string;
  inputs?: GenericNodeInputType[];
  output?: GenericNodeOutputType;
};
export type GenericNode = Node<GenericNodeData, NodeType.GenericNode>;

export type CustomNode = GenericNode;

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
  getNodeById: (nodeId: string) => CustomNode | undefined;
  isValidConnection: IsValidConnection;
  removeNode: (nodeId: string) => void;
  saveStateToString: () => string;
  loadStateFromString: (state: string) => void;
}

export type PersistedState = Pick<QueryBuilderState, "nodes" | "edges">;
