import {
  ReactFlow,
  Background,
  Controls,
  useViewport,
  ReactFlowProvider,
  Viewport,
  Panel,
  MiniMap,
} from "@xyflow/react";
import { CALL_NODE_DRAG_DROP_TYPE } from "tari-extension-common";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { GenericNodeType, NodeType, QueryBuilderState } from "@/store/types";
import { useCallback, useEffect, useRef, useState } from "react";
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
import GenericNode from "./nodes/generic/generic-node";

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
  [NodeType.GenericNode]: GenericNode,
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

        const nodeData = reader.getGenericNode(json.functionName);
        if (nodeData) {
          addNodeAt(nodeData, { x: flowX, y: flowY });
        }
      }
    },
    [addNodeAt, viewport],
  );

  const handleAddStartNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.StartNode,
        hasExitConnection: true,
        icon: "enter",
        largeCaption: "START",
      },
    });
  }, [addNodeAt]);

  const handleAddEmitLogNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.EmitLogNode,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "rocket",
        title: "Emit Log",
        inputs: [
          {
            hasEnterConnection: true,
            name: "log_level",
            label: "Log Level",
            type: "String",
            validValues: ["Error", "Warn", "Info", "Debug"],
          },
          {
            hasEnterConnection: true,
            name: "message",
            label: "Message",
            type: "String",
          },
        ],
      },
    });
  }, [addNodeAt]);

  const handleAddAssertBucketContainsNode = useCallback(() => {
    addNodeAt({
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.AssertBucketContains,
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: "check-circled",
        title: "Assert Bucket Contains",
        inputs: [
          {
            hasEnterConnection: true,
            name: "key",
            label: "Key",
            type: { Vec: "U8" },
          },
          {
            hasEnterConnection: true,
            name: "resource_address",
            label: "Resource Address",
            type: { Other: { name: "ResourceAddress" } },
          },
          {
            hasEnterConnection: true,
            name: "min_amount",
            label: "Minimum Amount",
            type: { Other: { name: "Amount" } },
          },
        ],
      },
    });
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
                <DropdownMenuItem onSelect={handleAddAssertBucketContainsNode}>
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
