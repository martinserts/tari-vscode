import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { QueryBuilderState } from "@/store/types";
import { useEffect } from "react";
import CallNode from "./nodes/call-node";
import ButtonEdge from "./edges/button-edge";

import "../../index.css";
import "@xyflow/react/dist/style.css";
import "@/xy-theme.css";

export type Theme = "dark" | "light";

const selector = (state: QueryBuilderState) => ({
  nodes: state.nodes,
  edges: state.edges,
  setReadOnly: state.setReadOnly,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  isValidConnection: state.isValidConnection,
});

export interface QueryBuilderProps {
  theme: Theme;
  readOnly?: boolean;
}

const nodeTypes = {
  callNode: CallNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

function QueryBuilder({ theme, readOnly = false }: QueryBuilderProps) {
  const { nodes, edges, setReadOnly, onNodesChange, onEdgesChange, onConnect, isValidConnection } = useStore(
    useShallow(selector),
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    setReadOnly(readOnly);
  }, [setReadOnly, readOnly]);

  return (
    <ReactFlow
      nodesConnectable={!readOnly}
      nodesDraggable={!readOnly}
      nodesFocusable={!readOnly}
      edgesFocusable={!readOnly}
      edgesReconnectable={!readOnly}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      colorMode={theme}
      fitView
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: "buttonEdge",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }}
      isValidConnection={isValidConnection}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

export default QueryBuilder;
