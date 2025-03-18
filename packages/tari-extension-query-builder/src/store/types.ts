import { FunctionDef } from "@tari-project/typescript-bindings";
import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  IsValidConnection,
} from "@xyflow/react";
import { SafeParseReturnType } from "zod";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CallNodeData = {
  isMethod: boolean;
  templateName: string;
  templateAddress: string;
  componentAddress?: SafeParseReturnType<unknown, unknown>;
  fn: FunctionDef;
  values?: Record<string, SafeParseReturnType<unknown, unknown>>;
};

export type CallNode = Node<CallNodeData, "callNode">;

export interface QueryBuilderState {
  readOnly: boolean;
  nodes: CallNode[];
  edges: Edge[];
  lastY: number;
  changeCounter: number;
  setReadOnly: (value: boolean) => void;
  onNodesChange: OnNodesChange<CallNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: CallNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: CallNode) => void;
  incrementLastY: () => void;
  addCallNodes: (callNodes: CallNodeData[]) => void;
  updateNodeData: (nodeId: string, newData: Partial<CallNodeData>) => void;
  updateNodeArgValue: (nodeId: string, argName: string, value: SafeParseReturnType<unknown, unknown>) => void;
  updateNodeComponentAddress: (nodeId: string, value: SafeParseReturnType<unknown, unknown>) => void;
  getNodeById: (nodeId: string) => CallNode | undefined;
  getNodeDataById: (nodeId: string) => CallNodeData | undefined;
  isValidConnection: IsValidConnection;
  removeNode: (nodeId: string) => void;
  saveStateToString: () => string;
  loadStateFromString: (state: string) => void;
}

export type PersistedState = Pick<QueryBuilderState, "nodes" | "edges">;
