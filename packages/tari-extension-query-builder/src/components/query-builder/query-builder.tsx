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
import { CALL_NODE_DRAG_DROP_TYPE, GeneratedCodeType, TransactionProps } from "tari-extension-common";
import useStore from "../../store/store";
import { useShallow } from "zustand/shallow";
import { GenericNodeType, NodeType, QueryBuilderState } from "@/store/types";
import { useCallback, useEffect, useRef, useState } from "react";
import ButtonEdge from "./edges/button-edge";
import { TariFlowNodeDetails } from "@/types";
import { TemplateReader } from "@/query-builder/template-reader";
import { Toaster } from "@/components/ui/sonner";

import "../../index.css";
import "@xyflow/react/dist/style.css";
import "@/xy-theme.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { CheckCircledIcon, EnterIcon, LayersIcon, PlayIcon, RocketIcon } from "@radix-ui/react-icons";
import GenericNode from "./nodes/generic/generic-node";
import { ExecutionPlanner } from "@/execute/ExecutionPlanner";
import { AmbiguousOrderError } from "@/execute/AmbiguousOrderError";
import { CycleDetectedError } from "@/execute/CycleDetectedError";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Amount, Transaction } from "@tari-project/tarijs-all";
import { MissingDataError } from "@/execute/MissingDataError";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/loading-spinner";
import { BuilderCodegen } from "@/codegen/BuilderCodegen";

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
  getNodeById: state.getNodeById,
});

export interface QueryBuilderProps {
  theme: Theme;
  readOnly?: boolean;
  getTransactionProps?: () => Promise<TransactionProps>;
  executeTransaction?: (transaction: Transaction, dryRun: boolean) => Promise<void>;
  showGeneratedCode?: (code: string, type: GeneratedCodeType) => Promise<void>;
}

const nodeTypes = {
  [NodeType.GenericNode]: GenericNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

function Flow({
  theme,
  readOnly = false,
  getTransactionProps,
  executeTransaction,
  showGeneratedCode,
}: QueryBuilderProps) {
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
    getNodeById,
  } = useStore(useShallow(selector));
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(useViewport());
  const [loading, setLoading] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const reactflowRef = useRef<HTMLDivElement>(null);

  const executeEnabled = !!getTransactionProps && !!executeTransaction;
  const generateCodeEnabled = !!getTransactionProps && !!showGeneratedCode;

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

  const buildTransactionDescriptions = useCallback(
    async (getTransactionProps: () => Promise<TransactionProps>) => {
      const planner = new ExecutionPlanner(nodes, edges);
      try {
        const executionOrder = planner.getExecutionOrder();
        const { accountAddress, fee } = await getTransactionProps();
        const descriptions = planner.buildTransactionDescription(executionOrder, accountAddress, new Amount(fee));
        return { planner, descriptions };
      } catch (e) {
        let errorMessage = "Failed to determine execution order";
        if (e instanceof AmbiguousOrderError) {
          const getNodeName = (id: string) => {
            const node = getNodeById(id);
            if (!node) {
              return id;
            }
            if (node.data.type === GenericNodeType.StartNode) {
              return "Start node";
            }
            return node.data.title ?? id;
          };
          const nodeA = getNodeName(e.nodeA);
          const nodeB = getNodeName(e.nodeB);
          if (nodeA && nodeB) {
            errorMessage = `Ambiguous order between "${nodeA}" and "${nodeB}" operations. Please, add explicit connections.`;
          }
        } else if (e instanceof CycleDetectedError) {
          errorMessage = "Cycle detected! Make sure to eliminate it.";
        } else if (e instanceof MissingDataError) {
          const node = e.nodes[0];
          errorMessage =
            e.nodes.length > 1 ? `Missing data in node "${node}" and other nodes."` : `Missing data in node "${node}"`;
        } else if (e instanceof Error) {
          errorMessage = e.message;
        } else {
          console.log(e);
        }
        throw new Error(errorMessage);
      }
    },
    [nodes, edges, getNodeById],
  );

  const handleExecute = useCallback(
    async (dryRun: boolean) => {
      if (!getTransactionProps || !executeTransaction) {
        return;
      }

      setLoading(true);
      try {
        const { planner, descriptions } = await buildTransactionDescriptions(getTransactionProps);
        const transaction = planner.buildTransaction(descriptions);
        await executeTransaction(transaction, dryRun);
        toast.success("Transaction executed");
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
          setIsErrorDialogOpen(true);
        }
      }
      setLoading(false);
    },
    [getTransactionProps, executeTransaction, buildTransactionDescriptions],
  );

  const handleGenerateCode = useCallback(
    async (typescript: boolean) => {
      if (!getTransactionProps || !showGeneratedCode) {
        return;
      }

      setLoading(true);
      try {
        const { descriptions } = await buildTransactionDescriptions(getTransactionProps);
        const codegen = new BuilderCodegen(descriptions);
        const code = typescript ? codegen.generateTypescriptCode() : codegen.generateJavascriptCode();
        await showGeneratedCode(code, typescript ? GeneratedCodeType.Typescript : GeneratedCodeType.Javascript);
      } catch (e) {
        if (e instanceof Error) {
          setErrorMessage(e.message);
          setIsErrorDialogOpen(true);
        }
      }
      setLoading(false);
    },
    [getTransactionProps, showGeneratedCode, buildTransactionDescriptions],
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
    <>
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
                <Button variant="outline">
                  {loading ? <LoadingSpinner type="short" className="h-4 w-4 animate-spin" /> : "..."}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  onSelect={() => {
                    handleExecute(false).catch(console.log);
                  }}
                  disabled={!executeEnabled}
                >
                  <PlayIcon /> Execute
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    handleExecute(true).catch(console.log);
                  }}
                  disabled={!executeEnabled}
                >
                  <LayersIcon /> Execute - Dry Run
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger hidden={!generateCodeEnabled}>Generate Code</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        onSelect={() => {
                          handleGenerateCode(true).catch(console.log);
                        }}
                      >
                        TypeScript
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          handleGenerateCode(false).catch(console.log);
                        }}
                      >
                        JavaScript
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Add Instruction</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
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
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </Panel>
          <Background />
          <Controls />
          <MiniMap nodeStrokeWidth={3} />
        </ReactFlow>
      </ReactFlowProvider>
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="border-[var(--foreground)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Execution failed</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Dismiss</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function QueryBuilder({
  theme,
  readOnly = false,
  getTransactionProps,
  executeTransaction,
  showGeneratedCode,
}: QueryBuilderProps) {
  return (
    <ReactFlowProvider>
      <Flow
        theme={theme}
        readOnly={readOnly}
        getTransactionProps={getTransactionProps}
        executeTransaction={executeTransaction}
        showGeneratedCode={showGeneratedCode}
      />
      <Toaster />
    </ReactFlowProvider>
  );
}

export default QueryBuilder;
