import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { CustomNode, NodeType, PersistedState, type QueryBuilderState } from "./types";
import { NODE_ENTRY, NODE_EXIT } from "@/components/query-builder/nodes/generic-node.types";

const DROP_NODE_OFFSET_X = 200;
const DROP_NODE_OFFSET_Y = 50;

const useStore = create<QueryBuilderState>((set, get) => ({
  readOnly: false,
  nodes: [],
  edges: [],
  centerX: 0,
  centerY: 0,
  changeCounter: 0,
  updateCenter: (centerX, centerY) => {
    set({ centerX, centerY });
  },
  setReadOnly: (value) => {
    set({ readOnly: value });
  },
  onNodesChange: (changes) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  onEdgesChange: (changes) => {
    if (!get().readOnly) {
      set((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  onConnect: (connection) => {
    if (!get().readOnly) {
      set((state) => ({
        edges: addEdge(connection, state.edges),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      changeCounter: state.changeCounter + 1,
    }));
  },
  addNodeAt: (node, position) => {
    const newNode = {
      ...node,
      id: uuidv4(),
      position: position ?? { x: get().centerX - DROP_NODE_OFFSET_X, y: get().centerY - DROP_NODE_OFFSET_Y },
    } as unknown as CustomNode;
    get().addNode(newNode);
  },
  updateNodeArgValue: (nodeId, argName, value) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId) {
            if (node.type === NodeType.CallNode || node.type === NodeType.EmitLogNode) {
              const updatedValues = {
                ...node.data.values,
                [argName]: value,
              };
              switch (node.type) {
                case NodeType.CallNode:
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      values: updatedValues,
                    },
                  };
                case NodeType.EmitLogNode:
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      values: updatedValues,
                    },
                  };
              }
            }
          }
          return node;
        }),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  updateCallNodeComponentAddress: (nodeId, value) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId && node.type === NodeType.CallNode) {
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
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  getNodeById: (nodeId) => {
    return get().nodes.find((node) => node.id === nodeId);
  },
  isValidConnection: (connection) => {
    if (
      !connection.source ||
      !connection.target ||
      !connection.sourceHandle ||
      !connection.targetHandle ||
      connection.source === connection.target
    ) {
      return false;
    }
    const source = get().getNodeById(connection.source);
    if (!source) {
      return false;
    }
    const target = get().getNodeById(connection.target);
    if (!target) {
      return false;
    }

    // It is possible to connect entry with exit, but only once
    if (connection.sourceHandle === NODE_EXIT && connection.targetHandle === NODE_ENTRY) {
      return (
        !get().edges.some((edge) => edge.source === connection.source) &&
        !get().edges.some((edge) => edge.target === connection.target)
      );
    }

    if (source.type !== NodeType.CallNode || target.type !== NodeType.CallNode) {
      return false;
    }

    const targetArgument = target.data.fn.arguments.find((arg) => arg.name === connection.targetHandle);
    if (!targetArgument) {
      return false;
    }

    const alreadyConnected = get().edges.some(
      (edge) => edge.target === connection.target && edge.targetHandle === connection.targetHandle,
    );
    return !alreadyConnected && JSON.stringify(source.data.fn.output) === JSON.stringify(targetArgument.arg_type);
  },
  removeNode: (nodeId) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  saveStateToString: () => {
    const state = get();
    const stateObject = {
      nodes: state.nodes,
      edges: state.edges,
    } satisfies PersistedState;
    return JSON.stringify(stateObject, undefined, 2);
  },
  loadStateFromString: (state) => {
    const stateObject = JSON.parse(state) as PersistedState;
    set({ ...stateObject });
  },
}));

export default useStore;
