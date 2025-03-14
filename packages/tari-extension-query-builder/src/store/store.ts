import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { CallNode, type QueryBuilderState } from "./types";

const useStore = create<QueryBuilderState>((set, get) => ({
  nodes: [],
  edges: [],
  lastY: 0,
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
  },
  incrementLastY: () => {
    set((state) => ({ lastY: state.lastY + 340 }));
  },
  addCallNodes: (callNodes) => {
    for (const callNode of callNodes) {
      const y = get().lastY;
      get().incrementLastY();
      const newNode: CallNode = {
        id: uuidv4(),
        type: "callNode",
        position: { x: 0, y },
        data: callNode,
      };
      get().addNode(newNode);
    }
  },
  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node)),
    }));
  },
  updateNodeArgValue: (nodeId, argName, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedValues = {
            ...node.data.values,
            [argName]: value,
          };
          return {
            ...node,
            data: {
              ...node.data,
              values: updatedValues,
            },
          };
        }
        return node;
      }),
    }));
  },
  updateNodeComponentAddress: (nodeId, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              componentAddress: value,
            },
          };
        }
        return node;
      }),
    }));
  },
  getNodeById: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },
  getNodeDataById: (nodeId) => {
    const node = get().getNodeById(nodeId);
    return node?.data;
  },
  isValidConnection: (connection) => {
    if (
      !connection.source ||
      !connection.target ||
      !connection.targetHandle ||
      connection.source === connection.target
    ) {
      return false;
    }
    const source = get().getNodeDataById(connection.source);
    if (!source) {
      return false;
    }
    const target = get().getNodeDataById(connection.target);
    if (!target) {
      return false;
    }
    const targetArgument = target.fn.arguments.find((arg) => arg.name === connection.targetHandle);
    if (!targetArgument) {
      return false;
    }

    const alreadyConnected = get().edges.some(
      (edge) => edge.target === connection.target && edge.targetHandle === connection.targetHandle,
    );
    return !alreadyConnected && JSON.stringify(source.fn.output) === JSON.stringify(targetArgument.arg_type);
  },
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
    }));
  },
}));

export default useStore;
