import { ReactFlow, Background, Controls, MarkerType, useViewport, ReactFlowProvider, Viewport } from "@xyflow/react";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { QueryBuilderState } from "@/store/types";
import { useCallback, useEffect, useRef, useState } from "react";
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
  updateCenter: state.updateCenter,
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

function Flow({ theme, readOnly = false }: QueryBuilderProps) {
  const { nodes, edges, setReadOnly, onNodesChange, onEdgesChange, onConnect, isValidConnection, updateCenter } =
    useStore(useShallow(selector));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const viewport = useViewport();
  const reactflowRef = useRef<HTMLDivElement>(null);

  const updateCenterCoordinates = useCallback(
    (viewport: Viewport) => {
      if (!reactflowRef.current) return;

      const { width, height } = dimensions;

      const centerX = (width / 2 - viewport.x) / viewport.zoom;
      const centerY = (height / 2 - viewport.y) / viewport.zoom;

      updateCenter(centerX, centerY);
    },
    [dimensions, updateCenter],
  );

  const onMove = useCallback(
    (_event: unknown, viewport: Viewport) => {
      updateCenterCoordinates(viewport);
    },
    [updateCenterCoordinates],
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    setReadOnly(readOnly);
  }, [setReadOnly, readOnly]);

  useEffect(() => {
    const updateDimensions = () => {
      if (reactflowRef.current) {
        setDimensions({
          width: reactflowRef.current.clientWidth,
          height: reactflowRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  useEffect(() => {
    updateCenterCoordinates(viewport);
  }, [viewport, updateCenterCoordinates]);

  return (
    <ReactFlowProvider>
      <ReactFlow
        ref={reactflowRef}
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
        onMove={onMove}
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
    </ReactFlowProvider>
  );
}

function QueryBuilder({ theme, readOnly = false }: QueryBuilderProps) {
  return (
    <ReactFlowProvider>
      <Flow theme={theme} readOnly={readOnly} />
    </ReactFlowProvider>
  );
}

export default QueryBuilder;
