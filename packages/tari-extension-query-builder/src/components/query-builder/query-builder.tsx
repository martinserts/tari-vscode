import { ReactFlow, Background, Controls, useViewport, ReactFlowProvider, Viewport, Panel, MiniMap } from "@xyflow/react";
import { CALL_NODE_DRAG_DROP_TYPE } from "tari-extension-common";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { NodeType, QueryBuilderState } from "@/store/types";
import { useCallback, useEffect, useRef, useState } from "react";
import CallNode from "./nodes/call-node";
import ButtonEdge from "./edges/button-edge";
import { TariFlowNodeDetails } from "@/types";
import { TemplateReader } from "@/query-builder/template-reader";

import "../../index.css";
import "@xyflow/react/dist/style.css";
import "@/xy-theme.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { CheckCircledIcon, EnterIcon } from "@radix-ui/react-icons";
import { RocketIcon } from "lucide-react";
import StartNode from "./nodes/start-node";
import EmitLogNode from "./nodes/emit-log-node";

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
  addNodeAt: state.addNodeAt,
});

export interface QueryBuilderProps {
  theme: Theme;
  readOnly?: boolean;
}

const nodeTypes = {
  [NodeType.CallNode]: CallNode,
  [NodeType.StartNode]: StartNode,
  [NodeType.EmitLogNode]: EmitLogNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

function Flow({ theme, readOnly = false }: QueryBuilderProps) {
  const {
    nodes,
    edges,
    setReadOnly,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isValidConnection,
    updateCenter,
    addNodeAt,
  } = useStore(useShallow(selector));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(useViewport());
  const reactflowRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (_event: unknown, viewport: Viewport) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();

      const data = event.dataTransfer.getData(CALL_NODE_DRAG_DROP_TYPE);
      if (data) {
        const json = JSON.parse(data) as TariFlowNodeDetails;
        const reader = new TemplateReader(json.template, json.templateAddress);

        const flowX = (event.clientX - viewport.x) / viewport.zoom;
        const flowY = (event.clientY - viewport.y) / viewport.zoom;

        const [nodeData] = reader.getCallNodes([json.functionName]);
        addNodeAt({ type: NodeType.CallNode, data: nodeData }, { x: flowX, y: flowY });
      }
    },
    [addNodeAt, viewport],
  );

  const handleAddStartNode = useCallback(() => {
    addNodeAt({ type: NodeType.StartNode, data: {} });
  }, [addNodeAt]);

  const handleAddEmitLogNode = useCallback(() => {
    addNodeAt({ type: NodeType.EmitLogNode, data: {} });
  }, [addNodeAt]);

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
    if (!reactflowRef.current) return;

    const { width, height } = dimensions;

    const centerX = (width / 2 - viewport.x) / viewport.zoom;
    const centerY = (height / 2 - viewport.y) / viewport.zoom;

    updateCenter(centerX, centerY);
  }, [dimensions, viewport, updateCenter]);

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
        onDragOver={onDragOver}
        onDrop={onDrop}
        colorMode={theme}
        fitView
        minZoom={0.05}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "buttonEdge",
        }}
        isValidConnection={isValidConnection}
      >
        <Panel position="top-right" style={{ right: "15px" }}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Add Instruction</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={handleAddStartNode}>
                  <EnterIcon /> Start Node
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAddEmitLogNode}>
                  <RocketIcon /> Emit Log
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircledIcon />
                  Assert Bucket Contains
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Panel>
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} />
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
