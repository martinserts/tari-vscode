import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { CallNode, PersistedState, type QueryBuilderState } from "./types";

const useStore = create<QueryBuilderState>((set, get) => ({
  readOnly: false,
  nodes: [],
  edges: [],
  lastY: 0,
  changeCounter: 0,
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
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node)),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  updateNodeArgValue: (nodeId, argName, value) => {
    if (!get().readOnly) {
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
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  updateNodeComponentAddress: (nodeId, value) => {
    if (!get().readOnly) {
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
        changeCounter: state.changeCounter + 1,
      }));
    }
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
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeId),
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
