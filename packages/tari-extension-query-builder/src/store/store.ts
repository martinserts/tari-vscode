import { create } from "zustand";
import { addEdge, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import { CustomNode, NodeType, type QueryBuilderState } from "./types";
import { NODE_ENTRY, NODE_EXIT } from "@/components/query-builder/nodes/generic-node.types";
import { latestVersionHandler, versionHandlers } from "./persistence/handlers";
import { NEW_INPUT_PARAM } from "@/components/query-builder/nodes/input/constants";
import { getNextAvailable } from "@/lib/get-next-available";

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
      const sourceNode = get().getNodeById(connection.source);
      const targetNode = get().getNodeById(connection.target);
      if (!sourceNode || !targetNode) {
        return;
      }
      // Add a new parameter for input node
      if (
        sourceNode.type === NodeType.InputParamsNode &&
        connection.sourceHandle === NEW_INPUT_PARAM &&
        targetNode.type === NodeType.GenericNode
      ) {
        const targetArgument = targetNode.data.inputs?.find((input) => input.name === connection.targetHandle);
        if (!targetArgument) {
          return;
        }
        const existingInputs = sourceNode.data.inputs.map((input) => input.name);
        const newInput = {
          id: uuidv4(),
          type: targetArgument.type,
          name: getNextAvailable(targetArgument.name, (name) => !existingInputs.includes(name)),
        };
        const updatedInputs = [...sourceNode.data.inputs, newInput];
        const updatedNode = {
          ...sourceNode,
          data: {
            ...sourceNode.data,
            inputs: updatedInputs,
          },
        };
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === sourceNode.id && node.type === NodeType.InputParamsNode ? updatedNode : node,
          ),
        }));
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === sourceNode.id && node.type === NodeType.InputParamsNode ? updatedNode : node,
          ),
          edges: addEdge(
            {
              ...connection,
              sourceHandle: newInput.id,
            },
            state.edges,
          ),
          changeCounter: state.changeCounter + 1,
        }));
        return;
      }

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
          if (node.id === nodeId && node.type === NodeType.GenericNode) {
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
    if (!target || target.type !== NodeType.GenericNode) {
      return false;
    }

    const targetAlreadyConnected = get().edges.some(
      (edge) => edge.target === connection.target && edge.targetHandle === connection.targetHandle,
    );

    // It is possible to connect entry with exit, but only once
    if (connection.sourceHandle === NODE_EXIT && connection.targetHandle === NODE_ENTRY) {
      return (
        !get().edges.some(
          (edge) => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle,
        ) && !targetAlreadyConnected
      );
    }

    const targetArgument = target.data.inputs?.find((input) => input.name === connection.targetHandle);

    // Connect new input node parameter
    if (source.type === NodeType.InputParamsNode && connection.targetHandle !== NODE_ENTRY) {
      if (targetAlreadyConnected) {
        return false;
      }
      if (connection.sourceHandle === NEW_INPUT_PARAM) {
        return true;
      } else {
        const sourceArgument = source.data.inputs.find((input) => input.name === connection.sourceHandle);
        return (
          sourceArgument != null &&
          targetArgument != null &&
          JSON.stringify(sourceArgument.type) === JSON.stringify(targetArgument.type)
        );
      }
    }

    if (source.type !== NodeType.GenericNode || !targetArgument) {
      return false;
    }
    return !targetAlreadyConnected && JSON.stringify(source.data.output?.type) === JSON.stringify(targetArgument.type);
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
    const persistedState = latestVersionHandler.save(state);
    return JSON.stringify(persistedState, undefined, 2);
  },
  loadStateFromString: (state) => {
    try {
      const parsedState = JSON.parse(state) as { version?: string } | undefined;
      if (typeof parsedState?.version !== "string") {
        throw new Error("Invalid persisted state: Missing or invalid version.");
      }

      const version = parsedState.version;
      const handler = versionHandlers[version];

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!handler) {
        throw new Error(`No handler found for version: ${version}`);
      }

      const validationResult = handler.load(parsedState);

      if (validationResult.success) {
        if (version === "1.0") {
          set({ nodes: validationResult.data.nodes, edges: validationResult.data.edges });
        } else {
          throw new Error(`Unsupported version: ${version}`);
        }
      } else {
        throw new Error(`Validation failed: ${validationResult.error.toString()}`);
      }
    } catch (error) {
      throw new Error(`Failed to load state: ${String(error)}`);
    }
  },
  isValidInputParamsTitle: (nodeId, title) => {
    if (!title.length || /\s/g.test(title)) {
      return false;
    }
    const titleTaken = get().nodes.some(
      (node) => node.id !== nodeId && node.type === NodeType.InputParamsNode && node.data.title === title,
    );
    return !titleTaken;
  },
  updateInputParamsTitle: (nodeId, title) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId && node.type === NodeType.InputParamsNode) {
            return {
              ...node,
              data: {
                ...node.data,
                title,
              },
            };
          }
          return node;
        }),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  updateInputParamsNode: (nodeId, argName, value) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId && node.type === NodeType.InputParamsNode) {
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
  removeInputParam: (nodeId, paramId) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId && node.type === NodeType.InputParamsNode) {
            const updatedInputs = node.data.inputs.filter((input) => input.id !== paramId);
            const updatedValues = Object.fromEntries(
              Object.entries(node.data.values).filter(([key]) => key !== paramId),
            );
            return {
              ...node,
              data: {
                ...node.data,
                inputs: updatedInputs,
                values: updatedValues,
              },
            };
          }
          return node;
        }),
        edges: state.edges.filter((edge) => edge.source !== nodeId && edge.source !== paramId),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
  isValidInputParamsName: (nodeId, paramId, name) => {
    if (!name.length || /\s/g.test(name)) {
      return false;
    }
    const node = get().getNodeById(nodeId);
    if (!node || node.type !== NodeType.InputParamsNode) {
      return false;
    }

    const isTaken = node.data.inputs.some((input) => input.id !== paramId && input.name === name);
    return !isTaken;
  },
  updateInputParamsName: (nodeId, paramId, newName) => {
    if (!get().readOnly) {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id === nodeId && node.type === NodeType.InputParamsNode) {
            const updatedInputs = node.data.inputs.map((input) =>
              input.id === paramId
                ? {
                    ...input,
                    name: newName,
                  }
                : input,
            );
            return {
              ...node,
              data: {
                ...node.data,
                inputs: updatedInputs,
              },
            };
          }
          return node;
        }),
        changeCounter: state.changeCounter + 1,
      }));
    }
  },
}));

export default useStore;
